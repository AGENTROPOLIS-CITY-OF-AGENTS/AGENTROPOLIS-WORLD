/**
 * Headless Chrome smoke for the built page.
 *
 * Serves dist/ on 127.0.0.1 (honoring the Vite base path baked into the
 * built HTML) and drives system Chrome over the DevTools protocol. No
 * Playwright dependency. Fails if the local baseline script is not loaded,
 * if the page requests the remote design-system loop-baseline URL, or if
 * the page reports a console error or uncaught exception.
 *
 * Requires a prior `npm run build`. Set CHROME_PATH to override discovery.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.resolve(root, process.env.DIST_DIR || "dist");
const REMOTE_LOOP = /agentropolis-city-of-agents\.github\.io\/AGENTROPOLIS-DESIGN-SYSTEM\/js\/loop-baseline\.js/i;
const SCRIPT_SRC = /<script\b[^>]*?\bsrc\s*=\s*(['"])(.*?)\1/gis;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".map": "application/json",
};

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/local/bin/google-chrome",
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error("Google Chrome not found. Install it or set CHROME_PATH.");
}

function publishBase(html) {
  const moduleSrc = [...html.matchAll(SCRIPT_SRC)]
    .map((match) => match[2].trim())
    .find((src) => src.includes("/assets/"));
  if (!moduleSrc) return "";
  const matched = moduleSrc.match(/^(.*)\/assets\//);
  return matched?.[1] ?? "";
}

function startStatic(dir, basePath) {
  const prefix = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(url.pathname);
    if (prefix) {
      if (pathname !== prefix && !pathname.startsWith(`${prefix}/`)) {
        res.writeHead(404).end("outside publish base");
        return;
      }
      pathname = pathname.slice(prefix.length) || "/";
    }
    if (pathname.endsWith("/")) pathname += "index.html";
    const rel = pathname.replace(/^\/+/, "");
    const file = path.resolve(dir, rel);
    if (file !== dir && !file.startsWith(dir + path.sep)) {
      res.writeHead(403).end("forbidden");
      return;
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404).end("not found");
        return;
      }
      const type = MIME[path.extname(file)] || "application/octet-stream";
      res.writeHead(200, { "content-type": type, "cache-control": "no-store" });
      res.end(data);
    });
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function launchChrome(binary, args) {
  const chrome = spawn(binary, args, { stdio: ["ignore", "pipe", "pipe"] });
  let buffered = "";
  const port = new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Chrome did not expose DevTools.\n${buffered}`));
    }, 20_000);
    const onData = (chunk) => {
      buffered += chunk.toString();
      const matched = buffered.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//);
      if (matched) {
        clearTimeout(timer);
        resolve(Number(matched[1]));
      }
    };
    chrome.stdout.on("data", onData);
    chrome.stderr.on("data", onData);
    chrome.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Chrome exited (${code}) before DevTools.\n${buffered}`));
    });
  });
  return { chrome, port, output: () => buffered };
}

function connectCdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let next = 0;
  const pending = new Map();
  const listeners = new Set();
  const ready = new Promise((resolve, reject) => {
    ws.addEventListener("open", () => resolve());
    ws.addEventListener("error", () => reject(new Error(`CDP websocket failed for ${wsUrl}`)));
  });
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(`${message.error.message}`));
      else resolve(message.result ?? {});
      return;
    }
    if (message.method) {
      for (const listener of listeners) listener(message);
    }
  });
  return {
    ready,
    on(listener) {
      listeners.add(listener);
    },
    send(method, params = {}, sessionId) {
      const id = ++next;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        const payload = { id, method, params };
        if (sessionId) payload.sessionId = sessionId;
        ws.send(JSON.stringify(payload));
      });
    },
    close() {
      ws.close();
    },
  };
}

function argText(arg) {
  if (!arg) return "";
  if (typeof arg.value === "string") return arg.value;
  if (arg.description) return arg.description;
  return arg.type || "";
}

test("built page loads the local baseline and does not call the remote script", { timeout: 60_000 }, async () => {
  const html = fs.readFileSync(path.join(dist, "index.html"), "utf8");
  const base = publishBase(html);
  const server = await startStatic(dist, base);
  const address = server.address();
  const pageUrl = `http://127.0.0.1:${address.port}${base || ""}/`;
  const userData = await mkdtemp(path.join(os.tmpdir(), "baseline-chrome-"));
  const binary = findChrome();
  const chromeArgs = [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-dev-shm-usage",
    "--disable-background-networking",
    "--disable-sync",
    "--remote-debugging-port=0",
    `--user-data-dir=${userData}`,
    "about:blank",
  ];
  let launched = launchChrome(binary, chromeArgs);
  let debugPort;
  try {
    debugPort = await launched.port;
  } catch (error) {
    launched.chrome.kill("SIGKILL");
    launched = launchChrome(binary, ["--no-sandbox", "--disable-setuid-sandbox", ...chromeArgs]);
    debugPort = await launched.port;
    if (!debugPort) throw error;
  }

  const requests = new Map();
  const consoleErrors = [];
  let cdp;
  try {
    const version = await fetch(`http://127.0.0.1:${debugPort}/json/version`).then((res) => res.json());
    cdp = connectCdp(version.webSocketDebuggerUrl);
    await cdp.ready;
    const created = await cdp.send("Target.createTarget", { url: "about:blank" });
    const attached = await cdp.send("Target.attachToTarget", { targetId: created.targetId, flatten: true });
    const sessionId = attached.sessionId;
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Network.enable", {}, sessionId);
    await cdp.send("Runtime.enable", {}, sessionId);
    await cdp.send("Log.enable", {}, sessionId);

    const loaded = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`timed out loading ${pageUrl}`)), 25_000);
      cdp.on((message) => {
        if (message.sessionId !== sessionId) return;
        if (message.method === "Network.requestWillBeSent") {
          const record = requests.get(message.params.requestId) ?? { urls: [], status: null, failed: null };
          record.urls.push(message.params.request.url);
          requests.set(message.params.requestId, record);
        } else if (message.method === "Network.responseReceived") {
          const record = requests.get(message.params.requestId) ?? { urls: [], status: null, failed: null };
          const finalUrl = message.params.response.url;
          if (!record.urls.includes(finalUrl)) record.urls.push(finalUrl);
          record.status = message.params.response.status;
          requests.set(message.params.requestId, record);
        } else if (message.method === "Network.loadingFailed") {
          const record = requests.get(message.params.requestId) ?? { urls: [], status: null, failed: null };
          record.failed = message.params.errorText || "loading failed";
          requests.set(message.params.requestId, record);
        } else if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
          consoleErrors.push(message.params.args.map(argText).join(" "));
        } else if (message.method === "Runtime.exceptionThrown") {
          const details = message.params.exceptionDetails;
          consoleErrors.push(details.exception?.description || details.text);
        } else if (message.method === "Log.entryAdded" && message.params.entry.level === "error") {
          const entry = message.params.entry;
          if (entry.url && REMOTE_LOOP.test(entry.url)) consoleErrors.push(entry.text);
          else if (!/Failed to load resource/i.test(entry.text)) consoleErrors.push(entry.text);
        } else if (message.method === "Page.loadEventFired") {
          clearTimeout(timer);
          resolve();
        }
      });
    });

    await cdp.send("Page.navigate", { url: pageUrl }, sessionId);
    await loaded;
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const evaluated = await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const host = document.getElementById('agentropolis-loop-baseline');
        const button = host?.shadowRoot?.getElementById('agt-loop-trigger');
        return {
          flag: globalThis.__AGENTROPOLIS_LOOP_BASELINE__ === true,
          version: globalThis.__AGENTROPOLIS_LOOP_BASELINE_VERSION__ ?? null,
          hasHost: !!host,
          button: button?.textContent ?? null,
        };
      })()`,
      returnByValue: true,
    }, sessionId);

    const seen = [...requests.values()];
    const urlsOf = (record) => record.urls ?? [];
    // Logged for reviewers. The pre-existing drei night environment fetches an HDR
    // from raw.githack.com; this gate fails only the removed loop-baseline script.
    const offOrigin = seen.flatMap(urlsOf).filter((url) => {
      try {
        return new URL(url).hostname !== "127.0.0.1";
      } catch {
        return true;
      }
    });
    const local = seen.filter((record) => urlsOf(record).some((url) => {
      try {
        const parsed = new URL(url);
        return parsed.hostname === "127.0.0.1" && parsed.pathname.endsWith("/agentropolis-loop-baseline.js");
      } catch {
        return false;
      }
    }));
    const remote = seen.filter((record) => urlsOf(record).some((url) => REMOTE_LOOP.test(url) || /github\.io/i.test(url)));
    const state = evaluated.result?.value;

    console.log(JSON.stringify({
      pageUrl,
      browser: version.Browser,
      localBaseline: local,
      offOrigin,
      remoteBaselineRequests: remote.flatMap(urlsOf),
      state,
      consoleErrors,
    }, null, 2));

    assert.equal(remote.length, 0, `remote loop-baseline or github.io requests: ${remote.flatMap(urlsOf).join(", ")}`);
    assert.equal(local.length, 1, `expected one local baseline request, saw ${JSON.stringify(local)}`);
    assert.equal(local[0].status, 200);
    assert.equal(local[0].failed, null);
    assert.deepEqual(state, {
      flag: true,
      version: "1.0.0",
      hasHost: true,
      button: "QRAG BASELINE",
    });
    assert.deepEqual(consoleErrors, []);
  } finally {
    try {
      cdp?.close();
    } catch {
      // The socket may already be closed after the page session ends.
    }
    await new Promise((resolve) => {
      if (launched.chrome.exitCode !== null || launched.chrome.signalCode !== null) {
        resolve();
        return;
      }
      const timer = setTimeout(resolve, 3000);
      launched.chrome.once("exit", () => {
        clearTimeout(timer);
        resolve();
      });
      launched.chrome.kill("SIGKILL");
    });
    await new Promise((resolve) => server.close(resolve));
    await rm(userData, { recursive: true, force: true });
  }
});

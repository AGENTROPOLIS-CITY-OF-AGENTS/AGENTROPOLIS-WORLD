/**
 * No-network regression gate for the vendored QRAG loop baseline.
 *
 * Fails when any HTML file references a remote script, when the known
 * cross-repo loop-baseline URL reappears anywhere in the tree, or when a
 * vendored copy's git blob SHA-1 or SHA-256 drifts from the pinned bytes.
 *
 * Set REQUIRE_DIST=1 after `npm run build` to also require dist/index.html
 * to reference a local file whose bytes match the pin, and to require the
 * pinned Subresource Integrity attribute on that script tag. Optional
 * DIST_DIR overrides the build output directory (default: dist).
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Git blob of the fleet-vendored baseline. */
const PINNED_BLOB_SHA = "15254b442f33e009f4c78a1c19568e75ea2121b2";
/** SHA-256 of those same bytes. */
const PINNED_SHA256 = "df28604ae9462594df48aa6fa05d9a77a3ca02e2f74c29aa3ba264da6e4d7224";
/** SHA-384 SRI of those same bytes. Same-origin Chrome enforces this without crossorigin. */
const PINNED_INTEGRITY = "sha384-YXPNohgGheUM32mm6qMBBKuRXhwU5Wkrwu9dgTmQBJRRIY0TdgcgxoEtvhxgTaqY";

const VENDORED = [
  "agentropolis-loop-baseline.js",
  "public/agentropolis-loop-baseline.js",
];

const SKIP_DIRS = new Set(["node_modules", "dist", ".git", "coverage"]);
const BANNED_REMOTE_SCRIPT = ["AGENTROPOLIS-DESIGN-SYSTEM", "js", "loop-baseline.js"].join("/");
const SCRIPT_SRC = /<script\b[^>]*?\bsrc\s*=\s*(['"])(.*?)\1/gis;

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

function sriSha384(buf) {
  return `sha384-${createHash("sha384").update(buf).digest("base64")}`;
}

function attrValue(tag, name) {
  const matched = tag.match(new RegExp(`\\b${name}\\s*=\\s*(['"])(.*?)\\1`, "i"));
  return matched ? matched[2] : null;
}

function baselineTag(html) {
  const tags = [...html.matchAll(/<script\b[^>]*>/gis)]
    .map((match) => match[0])
    .filter((tag) => attrValue(tag, "src")?.includes("agentropolis-loop-baseline.js"));
  assert.equal(tags.length, 1);
  return tags[0];
}

function gitBlobSha(buf) {
  return createHash("sha1").update(`blob ${buf.length}\0`).update(buf).digest("hex");
}

function walk(dir, predicate, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), predicate, acc);
      continue;
    }
    const full = path.join(dir, entry.name);
    if (predicate(full, entry.name)) acc.push(full);
  }
  return acc;
}

function isRemoteSrc(src) {
  const value = src.trim();
  return /^(?:https?:)?\/\//i.test(value) || /^[a-z][a-z0-9+.-]*:/i.test(value);
}

test("vendored baseline copies match the pinned blob and SHA-256", () => {
  for (const rel of VENDORED) {
    const buf = fs.readFileSync(path.join(root, rel));
    assert.equal(gitBlobSha(buf), PINNED_BLOB_SHA, `${rel} git blob`);
    assert.equal(sha256(buf), PINNED_SHA256, `${rel} sha256`);
  }
});

test("no tracked file references the remote loop-baseline script", () => {
  const files = walk(root, (_full, name) => !name.startsWith("."));
  const hits = [];
  for (const file of files) {
    let text;
    try {
      text = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    if (text.includes("\0")) continue;
    if (text.includes(BANNED_REMOTE_SCRIPT)) hits.push(path.relative(root, file));
  }
  assert.deepEqual(hits, []);
});

test("no HTML script src is remote", () => {
  const htmlFiles = walk(root, (_full, name) => name.endsWith(".html"));
  assert.ok(htmlFiles.length > 0, "expected at least one HTML file");
  const problems = [];
  for (const file of htmlFiles) {
    const text = fs.readFileSync(file, "utf8");
    const rel = path.relative(root, file);
    if (/github\.io/i.test(text) && /loop-baseline/i.test(text)) {
      problems.push(`${rel}: HTML mentions github.io and loop-baseline`);
    }
    for (const match of text.matchAll(SCRIPT_SRC)) {
      const src = match[2].trim();
      if (isRemoteSrc(src)) problems.push(`${rel}: remote script src ${src}`);
      if (/loop-baseline/i.test(src) && isRemoteSrc(src)) {
        problems.push(`${rel}: remote loop-baseline script ${src}`);
      }
    }
  }
  assert.deepEqual(problems, []);
});

test("source index references the local baseline", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const tag = baselineTag(html);
  assert.equal(attrValue(tag, "src"), "./agentropolis-loop-baseline.js");
  assert.match(tag, /\bdefer\b/);
  assert.equal(attrValue(tag, "integrity"), PINNED_INTEGRITY);
  const buf = fs.readFileSync(path.join(root, "agentropolis-loop-baseline.js"));
  assert.equal(sriSha384(buf), PINNED_INTEGRITY);
});

test("build output serves the pinned baseline at the HTML path", (t) => {
  if (process.env.REQUIRE_DIST !== "1") {
    t.skip("REQUIRE_DIST is not set");
    return;
  }
  const dist = path.resolve(root, process.env.DIST_DIR || "dist");
  const htmlPath = path.join(dist, "index.html");
  const html = fs.readFileSync(htmlPath, "utf8");
  const tag = baselineTag(html);
  assert.equal(
    attrValue(tag, "integrity"),
    PINNED_INTEGRITY,
    "integrity attribute must survive into dist/index.html",
  );
  assert.equal(html.includes(BANNED_REMOTE_SCRIPT), false);
  const srcs = [...html.matchAll(SCRIPT_SRC)].map((match) => match[2].trim());
  for (const src of srcs) {
    assert.equal(isRemoteSrc(src), false, `built script src ${src}`);
  }
  const baselineSrcs = srcs.filter((src) => /loop-baseline/i.test(src));
  assert.deepEqual(baselineSrcs, ["./agentropolis-loop-baseline.js"]);
  const resolved = new URL(baselineSrcs[0], "https://publish.local/index.html");
  const rel = decodeURIComponent(resolved.pathname).replace(/^\/+/, "");
  const file = path.resolve(dist, rel);
  assert.equal(file.startsWith(dist + path.sep), true, file);
  const buf = fs.readFileSync(file);
  assert.equal(gitBlobSha(buf), PINNED_BLOB_SHA);
  assert.equal(sha256(buf), PINNED_SHA256);
  assert.equal(sriSha384(buf), PINNED_INTEGRITY);
});

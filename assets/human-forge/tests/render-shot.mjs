// Optional. puppeteer-core is not a dependency of AGENTROPOLIS-WORLD.
// Headless Chrome render of the opt-in actor stage (vite preview must be running).
// Captures screenshots + console errors. Actor motion in these shots is SIMULATED.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const evidenceDir = path.join(repoRoot, 'assets/human-forge/evidence');
const BASE = process.env.HF_URL ?? 'http://localhost:4173/';
const shots = [
  ['hero-neutral', '?actor=1&view=hero&expr=neutral&test'],
  ['face-neutral', '?actor=1&view=face&expr=neutral&test'],
  ['face-jawOpen', '?actor=1&view=face&expr=jawOpen&test'],
  ['face-smile', '?actor=1&view=face&expr=smile&test'],
  ['face-blink', '?actor=1&view=face&expr=blink&test'],
  ['face-browsUp', '?actor=1&view=face&expr=browsUp&test'],
  ['hero-skinning-pose-test', '?actor=1&view=hero&expr=smile&pose=test&test'],
  ['lods-side-by-side', '?actor=1&view=lods&expr=neutral&test'],
];
const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new',
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--window-size=1280,800'] });
const report = { base: BASE, userAgent: await browser.userAgent(), shots: {} };
for (const [name, qs] of shots) {
  const page = await browser.newPage(); await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  const errors = []; page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); }); page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(BASE + qs, { waitUntil: 'networkidle0', timeout: 120000 });
  await page.waitForFunction(() => window.__HF_REPORT && Object.keys(window.__HF_REPORT).some((k) => k.endsWith('MorphCount')), { timeout: 120000 }).catch(() => errors.push('timeout waiting for morph report'));
  await new Promise((r) => setTimeout(r, 2500));
  const file = path.join(evidenceDir, 'screenshots', `${name}.png`); await page.screenshot({ path: file });
  const hf = await page.evaluate(() => { const r = { ...(window.__HF_REPORT ?? {}) }; for (const k of Object.keys(r)) if (k.endsWith('Morphs')) r[k] = r[k].length; return r; });
  const gl = await page.evaluate(() => { const c = document.querySelector('canvas'); const g = c?.getContext('webgl2'); const d = g?.getExtension('WEBGL_debug_renderer_info'); return g ? { renderer: d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER), maxVertexUniforms: g.getParameter(g.MAX_VERTEX_UNIFORM_VECTORS), maxTextureSize: g.getParameter(g.MAX_TEXTURE_SIZE) } : null; });
  report.shots[name] = { file, query: qs, hfReport: hf, webgl: gl, consoleErrors: errors };
  console.log(name, JSON.stringify(report.shots[name]));
  await page.close();
}
await browser.close();
fs.writeFileSync(path.join(evidenceDir, 'render-report.json'), JSON.stringify(report, null, 2));

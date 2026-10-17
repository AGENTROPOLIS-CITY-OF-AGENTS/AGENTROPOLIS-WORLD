// Identity / rig / facial contract checks for the HUMAN FORGE actor (no rendering).
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const modelPath = (lod) => path.join(repoRoot, 'public/models', `hf-actor-lod${lod}.glb`);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const results = []; const ok = (name, fn) => { try { fn(); results.push(['PASS', name]); } catch (e) { results.push(['FAIL', name, e.message]); } };
const docs = {}; for (const l of [0, 1, 2]) docs[l] = await io.read(modelPath(l));
const jointNames = (d) => d.getRoot().listSkins()[0].listJoints().map((j) => j.getName());
const REQUIRED_FACE = ['JawDrop', 'LeftUpperLidClosed', 'RightUpperLidClosed', 'LeftBrowDown', 'RightBrowDown', 'MouthLeftPullUp', 'MouthRightPullUp', 'LipsKiss'];
for (const l of [0, 1, 2]) {
  const d = docs[l]; const root = d.getRoot();
  ok(`LOD${l}: exactly one skin`, () => assert.equal(root.listSkins().length, 1));
  ok(`LOD${l}: 163-joint MakeHuman skeleton`, () => assert.equal(jointNames(d).length, 163));
  ok(`LOD${l}: key joints present`, () => ['root', 'head', 'jaw', 'eye.L', 'eye.R', 'wrist.L', 'foot.R'].forEach((j) => assert.ok(jointNames(d).includes(j), j)));
  ok(`LOD${l}: actor identity extras stable`, () => {
    const n = root.listNodes().find((x) => x.getName() === 'HF_Actor'); assert.ok(n);
    assert.equal(n.getExtras().actorId, 'hf-actor-0001'); assert.ok(n.getExtras().labels.includes('SIMULATED-ACTOR'));
  });
  ok(`LOD${l}: height 1.5-2.0 m, feet at y~0`, () => {
    const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
    for (const pr of root.listMeshes()[0].listPrimitives()) { const a = pr.getAttribute('POSITION'), lo = a.getMin([]), hi = a.getMax([]); for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], lo[k]); mx[k] = Math.max(mx[k], hi[k]); } }
    assert.ok(mx[1] > 1.5 && mx[1] < 2.0, `height ${mx[1]}`); assert.ok(Math.abs(mn[1]) < 0.02, `floor ${mn[1]}`);
  });
}
ok('LOD0/1/2 share identical joint order (identity-stable rig across LODs)', () => { assert.deepEqual(jointNames(docs[0]), jointNames(docs[1])); assert.deepEqual(jointNames(docs[0]), jointNames(docs[2])); });
for (const l of [0, 1]) {
  const mesh = docs[l].getRoot().listMeshes()[0];
  ok(`LOD${l}: 59 facial morph targets with names`, () => { assert.equal(mesh.getExtras().targetNames.length, 59); assert.equal(mesh.listPrimitives()[0].listTargets().length, 59); });
  ok(`LOD${l}: required facial shapes present`, () => REQUIRED_FACE.forEach((n) => assert.ok(mesh.getExtras().targetNames.includes(n), n)));
  ok(`LOD${l}: JawDrop moves verts 5-40 mm, body untouched`, () => {
    const idx = mesh.getExtras().targetNames.indexOf('JawDrop');
    const prim = mesh.listPrimitives().find((p) => p.getMaterial().getName() === 'HF_Skin_Neutral');
    const t = prim.listTargets()[idx].getAttribute('POSITION'); const pos = prim.getAttribute('POSITION');
    let maxD = 0, lowMoved = 0; const v = [0, 0, 0], q = [0, 0, 0];
    for (let i = 0; i < t.getCount(); i++) { t.getElement(i, v); const m = Math.hypot(...v); if (m > maxD) maxD = m; if (m > 1e-4) { pos.getElement(i, q); if (q[1] < 1.3) lowMoved++; } }
    assert.ok(maxD > 0.005 && maxD < 0.04, `max ${maxD}`); assert.equal(lowMoved, 0, 'verts below 1.3 m moved');
  });
}
ok('LOD2: no morphs (crowd tier)', () => assert.equal(docs[2].getRoot().listMeshes()[0].listPrimitives()[0].listTargets().length, 0));
const lines = results.map((r) => r.join(' | '));
const evidenceFile = path.join(repoRoot, 'assets/human-forge/evidence/glb-contract-test.txt');
fs.mkdirSync(path.dirname(evidenceFile), { recursive: true });
fs.writeFileSync(evidenceFile, lines.join('\n') + '\n');
console.log(lines.join('\n')); const fails = results.filter((r) => r[0] === 'FAIL').length;
console.log(`\n${results.length - fails}/${results.length} passed`); process.exit(fails ? 1 : 0);

// HUMAN FORGE LOD generator (original code). Copyright © 2026 NEURO / AGENTROPOLIS. All rights reserved.
// No open-source license. No license to reproduce, modify, redistribute, sublicense, or commercially exploit this file unless expressly authorized in writing.
// Input: build/hf-actor-raw.glb
// Optional regenerator. Not a runtime dependency of AGENTROPOLIS-WORLD.
// Requires @gltf-transform/functions and meshoptimizer, which are not installed by this repo.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, sparse, weld, simplify, dedup } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../..');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const RAW = path.join(here, '../build/hf-actor-raw.glb');
const out = {};

function stats(doc) {
  let v = 0, t = 0, morphs = 0;
  for (const mesh of doc.getRoot().listMeshes()) for (const p of mesh.listPrimitives()) {
    t += (p.getIndices()?.getCount() ?? 0) / 3; morphs = Math.max(morphs, p.listTargets().length);
  }
  const pos = new Set(); for (const mesh of doc.getRoot().listMeshes()) for (const p of mesh.listPrimitives()) pos.add(p.getAttribute('POSITION'));
  for (const a of pos) v += a.getCount();
  return { vertices: v, triangles: t, morphTargets: morphs };
}
function dropMorphs(doc) {
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const p of mesh.listPrimitives()) for (const tg of p.listTargets()) { p.removeTarget(tg); }
    mesh.setWeights([]); mesh.setExtras({ ...mesh.getExtras(), targetNames: undefined });
  }
}
async function build(name, ratio, keepMorphs) {
  const doc = await io.read(RAW);
  if (!keepMorphs) dropMorphs(doc);
  if (ratio < 1) {
    await doc.transform(weld(), simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.01, lockBorder: false }));
  }
  await doc.transform(dedup(), prune({ keepAttributes: true }), sparse({ ratio: 1 / 3 }));
  const file = path.join(repoRoot, 'public/models', `${name}.glb`);
  await io.write(file, doc);
  out[name] = { file, bytes: fs.statSync(file).size, ratio, ...stats(doc) };
}
await MeshoptSimplifier.ready;
await build('hf-actor-lod0', 1.0, true);   // hero: full mesh, 59 facial blendshapes
await build('hf-actor-lod1', 0.4, true);   // mid
await build('hf-actor-lod2', 0.12, false); // crowd/background, no face shapes
fs.writeFileSync(path.join(here, '../evidence/lod-report.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));

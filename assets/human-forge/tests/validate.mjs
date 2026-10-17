// Optional. gltf-validator is not a dependency of AGENTROPOLIS-WORLD.
// Runs Khronos glTF-Validator on every shipped LOD and writes evidence/gltf-validator.json
import validator from 'gltf-validator';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const files = ['hf-actor-lod0', 'hf-actor-lod1', 'hf-actor-lod2'].map((n) => path.join(repoRoot, 'public/models', `${n}.glb`));
const summary = {}; let failed = false;
for (const f of files) {
  const r = await validator.validateBytes(new Uint8Array(fs.readFileSync(f)), { maxIssues: 50 });
  summary[f] = { validatorVersion: r.validatorVersion, errors: r.issues.numErrors, warnings: r.issues.numWarnings,
    infos: r.issues.numInfos, hints: r.issues.numHints, messages: r.issues.messages.slice(0, 20).map((m) => `${m.severity}:${m.code} ${m.pointer ?? ''} ${m.message}`) };
  if (r.issues.numErrors > 0) failed = true;
}
fs.writeFileSync(path.join(repoRoot, 'assets/human-forge/evidence/gltf-validator.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
process.exit(failed ? 1 : 0);

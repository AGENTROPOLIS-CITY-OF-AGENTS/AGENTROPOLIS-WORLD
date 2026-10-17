# HUMAN FORGE · hf-actor-0001 in AGENTROPOLIS-WORLD

This folder is the GROK-02 human-actor prototype, landed beside the city. The original standalone report is kept below. Two sentences in it were corrected on review: original pipeline, component, and docs code is all rights reserved, and the Khronos validator counts match `evidence/gltf-validator.json`. Paths in that report are the standalone layout. In this repository they map as follows.

| Standalone path | This repo |
| --- | --- |
| `public/models/hf-actor-lod{0,1,2}.glb` | `public/models/hf-actor-lod{0,1,2}.glb` |
| `src/components/actors/HumanActor.tsx`, `arkitMap.ts` | `src/components/actors/` (same components, plus an opt-in stage) |
| `assets/source/*` | `assets/human-forge/source/*` |
| `LICENSES/*` | `assets/human-forge/LICENSES/*` |
| `pipeline/*` | `assets/human-forge/pipeline/*` |
| `tests/*` | `assets/human-forge/tests/*` |
| `evidence/*` | `assets/human-forge/evidence/*` |
| `src/App.tsx` standalone demo | Dropped. The world panel opens the same stage, or use `?actor=1`. |

## Open the stage

The city view stays the default.

- In the world panel, choose **Human actor prototype**.
- Or open `?actor=1`. The standalone query names still work: `view=hero|face|lods`, `expr=<preset>`, `pose=test`.

**Actor motion on that stage is SIMULATED.** Procedural blink, expression presets, and bone-pose offsets do not represent real agent execution. The figure is not placed in the skyline and is not a city resident.

## License boundary

MakeHuman inputs in `LICENSES/PROVENANCE.md` are CC0 1.0. Original pipeline, component, and docs code in this folder follows the repository notice: this work intentionally contains **no open-source license**. Copyright © 2026 NEURO / AGENTROPOLIS. All rights reserved. It is publicly viewable for demonstration, research, and interoperability purposes. No license to reproduce, modify, redistribute, sublicense, or commercially exploit that original work is granted unless expressly authorized in writing. No MakeHuman AGPL program code is included.

## Checks from this repo

```bash
npm install
npm run test:glb
npm run build
```

`test:glb` is the rig, identity, and facial contract (23 checks). It needs `@gltf-transform/core` and `@gltf-transform/extensions`, which are devDependencies because Node has no glTF reader and the GLBs use sparse morph accessors.

Landing check in this repository on 2026-10-17:

- `npm run test:glb`: **23/23 PASS**
- `npm run build` (`tsc -b && vite build`): **exit 0**. The actor stage is a separate chunk and stays out of the city bundle until the prototype is opened.
- Browser: the default city has no actor. Opening the prototype shows the figure and a SIMULATED banner. Smile, jawOpen, the pose test, face, and lods all changed the stage. Returning to the city restored the skyline. `?actor=1&view=face&expr=blink&test` opened the closed-eye close-up directly. At 390px wide the eyes and mouth stay visible; expression buttons sit behind an Expressions control.
- Not re-run here: Khronos glTF-Validator and the headless Chrome contact sheet. Those packages are not installed. The prototype-box logs and screenshots remain in `evidence/`.

Regenerating GLBs needs Python numpy plus `@gltf-transform/functions` and `meshoptimizer`, which are **not** installed. `tests/validate.mjs` needs `gltf-validator`. `tests/render-shot.mjs` needs `puppeteer-core` and Chrome. Those files stay as the original pipeline.

## Review

Draft only. Do not merge until **GROK-10 ASSURANCE** reviews it.

---

# M002-02 · GROK-02 HUMAN FORGE · Prototype realistic human actor (R3F)

**Status: PASS (prototype scope) · repo PR: BLOCKED / not opened (see §7)** · 2026-10-17 00:15 PT
VERITY / AEGIS: **not live**. No checks are claimed from them. All checks below were run locally on the box.
Actor motion here is **SIMULATED**. It never proves that an agent executed anything.

## 1. What was built
| Deliverable (role config) | Result |
|---|---|
| Actor prototype, identity-stable rig, GLB loadable in R3F | `public/models/hf-actor-lod0.glb`: 15,066 verts, 27,676 tris, 1.67 m tall, **163-joint skeleton** (MakeHuman default rig), 5 PBR materials (obsidian suit, neutral skin, eyes with procedural iris/pupil, teeth, mouth). The stable identity sits in the GLB node extras: `actorId: hf-actor-0001`, `identity: synthetic-generic`, label `SIMULATED-ACTOR` |
| LODs | LOD0 hero 1.9 MB (59 face shapes) · LOD1 mid 0.75 MB, 11.2k tris (59 face shapes) · LOD2 crowd 0.2 MB, 3.6k tris (no face shapes). All three use the **same joint order**, so clips and identity carry across LODs. `HumanActor` switches LOD with drei `<Detailed>` at 0 / 7 / 20 m |
| Facial rig test | **59 morph targets** baked from the CC0 MakeHuman face pose units (brows, lids, eye look, cheeks, nose, jaw, lips, mouth corners, tongue). `src/components/actors/arkitMap.ts` maps **49 of the ARKit-52 names** onto them; mouthClose and mouthPress L/R are still missing |
| R3F component | `src/components/actors/HumanActor.tsx`. Props: `lod`, `expression` (HF morph weights), `arkit` (ARKit weights), `bonePose` (additive joint offsets), `blink` (procedural, turns off under prefers-reduced-motion). Uses `SkeletonUtils.clone` so crowd instances never share a skeleton |
| Demo page | `index.html` + `src/App.tsx`. Obsidian staging, NEURO tokens (cyan only marks the active preset; red only on the SIMULATED tag), neutral key light, procedural IBL (no downloaded HDRI). Query params: `view=hero\|face\|lods`, `expr=<preset>`, `pose=test`, `test` |
| Pipeline | `pipeline/build_actor.py` (OBJ + skeleton + weights + BVH → skinned GLB with baked morphs, numpy only) · `pipeline/make_lods.mjs` (gltf-transform + meshoptimizer: weld/simplify/sparse) |

Stack match: `package.json` mirrors **AGENTROPOLIS-WORLD @ 886cf9f** (React 19, three ^0.179.1, R3F ^9.3, drei ^10.7.6, Vite 7, TS 5.9). I checked this read-only through the GitHub connector. Installed: three 0.179.1, R3F 9.8.2, drei 10.7.9.

## 2. How to run
```bash
cd /workspace/agentropolis/m002/grok-02
npm install
npm run build:actor        # optional: regenerates the GLBs from assets/source (python3 + numpy)
npm run validate           # Khronos glTF-Validator on all 3 LODs
npm run test:glb           # rig, identity and facial contract tests (23 checks)
npm run dev                # open http://localhost:5173/?view=face&expr=smile
npm run build && npm run preview & npm run shot   # headless Chrome screenshots -> evidence/screenshots
```
To integrate into AGENTROPOLIS-WORLD: copy `src/components/actors/*` and `public/models/hf-actor-lod*.glb`, then render `<HumanActor position={[x,0,z]} />` inside the existing `<Canvas>`. Model URLs respect `import.meta.env.BASE_URL` so GitHub Pages sub-path deploys work. **Note for GROK-03:** GLTFLoader strips dots from node names (`upperarm01.R` becomes `upperarm01R`). Animation clips must target the stripped names; `bonePose` accepts either form.

## 3. Asset provenance (full table: `LICENSES/PROVENANCE.md`)
| Asset | Source | Author | License | Retrieved |
|---|---|---|---|---|
| Base mesh hm08 `base.obj` | github.com/makehumancommunity/makehuman @ a8bc2d5 `makehuman/data/3dobjs/` | Data Collection AB, J. Palmius, J. Hauquier | CC0 1.0 | 2026-10-16 |
| Skeleton `default.mhskel` | same repo, `makehuman/data/rigs/` | MakeHuman team | CC0 | 2026-10-16 |
| Weights `default_weights.mhw` | same repo, `makehuman/data/rigs/` | Data Collection AB et al. | CC0 | 2026-10-16 |
| Face pose units `face-poseunits.bvh/.json` | same repo, `makehuman/data/poseunits/` | Data Collection AB et al. | CC0 | 2026-10-16 |
| Pipeline, component, materials, LODs, tests | original (GROK-02) | NEURO / AGENTROPOLIS | All rights reserved. No open-source license. | — |
No purchases. No accounts. No real-person likeness or scans. No MakeHuman AGPL code is shipped. No Mixamo, RPM or MetaHuman content. SHA-256 hashes are in `evidence/sha256.txt`.

## 4. Verification evidence (everything here was actually run)
| Check | Result | Evidence |
|---|---|---|
| GLB build | exit 0 | `evidence/build-actor.log`, `evidence/lod-report.json` |
| Khronos glTF-Validator 2.0.0-dev.3.10 | **0 errors** on all 3 LODs. 1 warning each: `NODE_SKINNED_MESH_NON_ROOT` (skinned mesh node is not root; parent transforms will not affect a skinned mesh; harmless in three.js). 5 infos each: `UNUSED_OBJECT` on unused `TEXCOORD_0` (UVs kept for future skin textures). | `evidence/gltf-validator.json`, `validate.log` |
| Contract tests | **23/23 PASS**: 1 skin, 163 joints, key joints, actor identity extras, height and floor, identical joint order across LODs, 59 named morphs on LOD0/1, JawDrop moves face verts 5–40 mm and nothing below 1.3 m | `evidence/glb-contract-test.txt`, `contract.log` |
| TypeScript + Vite production build | `tsc --noEmit` clean, vite build exit 0 (1.26 MB JS chunk warning) | `evidence/tsc-vite-build.log` |
| Headless WebGL render (Chrome + SwiftShader, three r179) | 8 shots. In each, the R3F app reported 59 morphs loaded. Page console errors: none, except one 404 on the first page load only, probably favicon.ico (not confirmed) | `evidence/render-report.json`, `evidence/screenshots/*.png` |
| Facial rig visual | neutral / jawOpen / smile / blink / browsUp show visibly different faces | `evidence/screenshots/facial-rig-contact-sheet.png` |
| Skinning visual | right arm raised, elbow bent and head tilted through `bonePose`; the mesh deforms with the bones | `evidence/screenshots/hero-skinning-pose-test.png` |
| LOD visual | LOD0 / LOD1 / LOD2 side by side | `evidence/screenshots/lods-side-by-side.png` |
Not run: real-GPU FPS benchmarks, mobile devices, integration inside the AGENTROPOLIS-WORLD repo build.

## 5. Known gaps vs visual standards v0.2 (honest)
- **Below the hero photoreal bar.** There are no 2K skin textures and no SSS, hair, eyebrows, eyelashes or clothing mesh, so it reads as a bald mannequin in a bodysuit. The next step is CC0 texture and hair authoring, or a CC0 MakeHuman system-asset skin with provenance.
- The skin/suit collar line is a per-face split, so it looks jagged at close range.
- Only one identity, and no body or ethnicity variation yet. MakeHuman CC0 targets could produce varied identities.
- No locomotion clips. That is GROK-03's work; the rig is ready for clip retargeting.
- Morph data is uncompressed float (sparse accessors). Meshopt/Draco and KTX2 are not applied yet, pending a GROK-08 decision.

## 6. RFP / cost-benefit
I did not write down a pre-task estimate. The "estimate" column below is my planning estimate reconstructed at report time, so treat it as indicative only.
| Item | Estimate | Actual |
|---|---|---|
| Tool calls | ~35–45 | ~60 (incl. debugging a bone-name sanitisation issue and a stale cached screenshot read) |
| Wall time | 60–90 min | ~25 min (23:53 → ~00:16 PT) |
| Tokens | ~150–250k in / ~25k out | similar order (not metered here) |
| Model / GPU / render cost | $0 extra GPU; CPU SwiftShader | $0 GPU; no paid services |
| Spend on assets | $0 | **$0** |
| Quality gain | capsule/box placeholder → rigged human with face shapes and LODs | achieved, at mannequin fidelity |
| Risk | license (low, CC0 verified in-file), fidelity (high vs photoreal bar), perf (medium: 163 joints + 59 morphs per hero) | same |
| Expected rework | textures, hair, wardrobe, identity variants: ~1–2 dev-wk; perf compression: ~1 day | — |

## 7. Repo / PR status
I opened no PR and pushed nothing. The `code-changes` skill says repo work must go through a Cursor cloud agent, and this executor has no CloudAgent tool. The GLBs are binary, and the GitHub MCP `push_files` call only takes text. To land this: the parent or HERMES should launch a cloud agent on `AGENTROPOLIS-CITY-OF-AGENTS/AGENTROPOLIS-WORLD`, attach this folder, and target a new branch `feat/cinematic-human-actor-v0` as a draft PR. No merge until GROK-10 ASSURANCE reviews it.

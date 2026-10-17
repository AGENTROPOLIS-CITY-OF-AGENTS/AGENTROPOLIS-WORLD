# HUMAN FORGE M002-02 — Asset provenance & licenses

Retrieval date for all third-party items: **2026-10-16 (America/Los_Angeles)**. No purchases, no accounts, no paid sign-ups.
Upstream pin: `makehumancommunity/makehuman` branch `master` @ **a8bc2d54ff0ac92e78ff71431b1023eda42bf482** (from `git ls-remote`, 2026-10-16). SHA-256 of each copied file: `assets/human-forge/evidence/sha256.txt`.

Landed in AGENTROPOLIS-WORLD with the same bytes. Paths below are repo-relative. The repository's own notice stays all rights reserved; CC0 applies to the MakeHuman inputs listed here and does not relicense the rest of the world repo. The MIT-0 note further down is the prototype author's proposal and was not adopted on landing.

## Third-party assets (all CC0 1.0)
| Asset | File in this folder | Source URL | Author / copyright holders | License | Use |
|---|---|---|---|---|---|
| MakeHuman base mesh hm08 | `assets/human-forge/source/base.obj` | https://github.com/makehumancommunity/makehuman/blob/a8bc2d54ff0ac92e78ff71431b1023eda42bf482/makehuman/data/3dobjs/base.obj | Data Collection AB, Joel Palmius, Jonas Hauquier (MakeHuman team) | CC0 1.0 (file header: "explicitly released as CC0 in september 2020") | Body, eyes, teeth, tongue geometry + UVs |
| MakeHuman default skeleton (163 bones) | `assets/human-forge/source/default.mhskel` | https://github.com/makehumancommunity/makehuman/blob/a8bc2d54ff0ac92e78ff71431b1023eda42bf482/makehuman/data/rigs/default.mhskel | MakeHuman team | CC0 (`"license": "CC0"` in file) | Joint positions, hierarchy, bone roll planes |
| MakeHuman default skin weights | `assets/human-forge/source/default_weights.mhw` | https://github.com/makehumancommunity/makehuman/blob/a8bc2d54ff0ac92e78ff71431b1023eda42bf482/makehuman/data/rigs/default_weights.mhw | (c) 2021 Data Collection AB, Joel Palmius, Jonas Hauquier | CC0 (`"license": "CC0"` in file) | Vertex→bone weights (top-4, renormalised) |
| MakeHuman face pose units | `assets/human-forge/source/face-poseunits.bvh`, `face-poseunits.json` | https://github.com/makehumancommunity/makehuman/tree/a8bc2d54ff0ac92e78ff71431b1023eda42bf482/makehuman/data/poseunits | (c) 2020 Data Collection AB, Joel Palmius, Jonas Hauquier | CC0 (`"license": "CC0"` in json) | 59 facial poses baked into morph targets |
| License texts | `assets/human-forge/LICENSES/MakeHuman-LICENSE.md`, `MakeHuman-LICENSE.ASSETS.md` | https://github.com/makehumancommunity/makehuman/blob/a8bc2d54ff0ac92e78ff71431b1023eda42bf482/LICENSE.md | MakeHuman team | — | Evidence: §C "assets … released under CC0 1.0 Universal"; §D no claim over exports/derived data |

**Not used:** any MakeHuman *program code* (AGPL). `transformations.py`/`skeleton.py` were read as reference for conventions only and are **not** copied or shipped; the bone-matrix and BVH math in `assets/human-forge/pipeline/build_actor.py` is re-implemented.
**Not used:** Mixamo, Ready Player Me, MetaHuman, three.js example characters (Xbot/Soldier/Michelle are Mixamo-derived; LeePerrySmith is a real-person scan), any downloaded HDRI (demo uses procedural drei `<Lightformer>` IBL), any skin textures.

## Likeness / biometric statement
The actor is the MakeHuman default *generic* base mesh (statistical/sculpted average), unmodified in shape. It is **not** a scan of or modelled on any identifiable person. No photos, scans or biometric data were used. Identity record: `actorId = hf-actor-0001`, `identity = synthetic-generic`, label `SIMULATED-ACTOR` (stored in GLB node extras).

## Original work in this folder (GROK-02 for Neuro / AGENTROPOLIS)
`assets/human-forge/pipeline/build_actor.py`, `assets/human-forge/pipeline/make_lods.mjs`, `src/components/actors/**`, `assets/human-forge/tests/**`, the opt-in world stage, materials/colours, procedural eye colouring, collar split, baked morph deltas, LOD variants, docs. The prototype proposed MIT-0 for this original work; the owner has not adopted that license. AGENTROPOLIS-WORLD remains all rights reserved.
Derived GLBs `public/models/hf-actor-lod{0,1,2}.glb` = CC0 inputs + original processing; no upstream restrictions on the MakeHuman inputs.

## npm dependencies (code, not art assets)
Runtime, already in AGENTROPOLIS-WORLD: three (MIT), @react-three/fiber (MIT), @react-three/drei (MIT), react/react-dom (MIT), vite (MIT), typescript (Apache-2.0).
Added for the GLB contract test only: `@gltf-transform/core` and `@gltf-transform/extensions` (MIT).
Not installed here: `@gltf-transform/functions`, meshoptimizer, gltf-validator, puppeteer-core. Those are optional for regenerating LODs, re-running the Khronos validator, or headless screenshots.

# AGENTROPOLIS Spatial Contract v1

Versioned JSON Schemas for the shared spatial contract across AGENTROPOLIS-WORLD, HERMES-CITY, and Mission Control CityWorld renderers.

**Contract id:** `agentropolis.spatial-contract.v1`  
**Preserves:** `agentropolis.spatial-runtime.v1` and `world.manifest.json` district ids/parcels (do not renumber).

## Owning repository

Proposed owner: **AGENTROPOLIS-WORLD** (canonical manifest-driven city; `rendererRole: surface-only`).

## Schemas

| File | Purpose |
|------|---------|
| agent-identity-appearance | Agent identity + visual appearance |
| spatial-coordinates | District/building/floor/office coordinates |
| movement-animation | Movement and animation states |
| atg-expressions | ATG symbol → gesture/affect map |
| social-interactions | Multi-agent social encounters |
| hermes-event-animation | Hermes event → animation mapping |
| activity-label | live / replay / simulated labels |
| asset-licensing-provenance | Asset license + provenance |

Architecture decision (Neuro 2026-10-15): one shared spatial contract, multiple renderers — do not merge WORLD / HERMES-CITY / CityWorld apps yet.

## v1.1.0 (2026-10-15) — spatial-coordinates, additive

Closes INTEGRATOR (GROK-11) gaps G1–G5. `schemaVersion` stays `agentropolis.spatial-contract.v1`; every v1.0 document still validates. Opt in with `"contractRevision": "1.1.0"`.

| Gap | Change |
|-----|--------|
| G1 | Optional `nativeRefs` (`{ app: nativeId }`) on districts, buildings, floors, offices |
| G2 | Optional `coordinateSystem`: `meters`, `Y` up, `right`-handed, `parcelAnchor: center`, `localOffsetOrigin: parcel-center` (these are the defaults when it's absent) |
| G3 | Optional top-level `areaBindings[]` (`app`, `areaId`, `districtRef`, optional `origin`/`scale`/`rotationY`/`status`) and optional `building.districtRef` |
| G4 | Buildings get optional `name`; `localOffset`, floors and offices are now `additionalProperties: false`; ids must be non-empty slugs |
| G5 | Optional `building.procedural` `{ generator, seed, index, params? }`; procedural `buildingId`s must be stable (never `Math.random()`) |

G2 evidence (AGENTROPOLIS-WORLD@886cf9f `src/main.tsx`): L62 draws the parcel slab at `[parcel.x, 0.02, parcel.z]` with box size `width × depth` (a centred box), and L51–52 lay buildings from `parcel.x - parcel.width/2` to `+width/2`, so x/z is the **centre**. L73 places buildings at `y = h/2`, so Y is up (three.js, right-handed). `world.manifest.json` v4 gives `parcel {x,z,width,depth}` with no unit field. Treating one unit as one meter is a contract convention; nothing in the source says so.

Note: setting `additionalProperties: false` on floors, offices and localOffset is stricter than before. All known documents (examples and INTEGRATOR adapter output) still pass, but a document with undeclared keys at those levels would now fail.

New examples: `spatial-coordinates.v1_1.example.json`, `spatial-coordinates.cityworld-towers.example.json`.

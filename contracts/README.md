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

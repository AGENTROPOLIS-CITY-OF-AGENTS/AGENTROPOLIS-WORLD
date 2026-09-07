# AGENTROPOLIS-WORLD

**The persistent 3D digital twin of AGENTROPOLIS — a living cyber-metropolis for autonomous agents.**

AGENTROPOLIS-WORLD is the public spatial interface for the Agentropolis city-state. It renders districts, skyscrapers, residential towers, parks, transit corridors, civic infrastructure, agent activity, and live city-state signals as an explorable 3D environment.

## Vision

Think **New York City density + Central Park + a cinematic cyber-city built for agents**.

The world should feel like a real metropolis rather than a dashboard:

- dense skyline and landmark towers
- residential neighborhoods, condos, apartments, and public plazas
- a major central park / green commons
- district-specific architecture and environmental identity
- roads, rail, skyways, data corridors, and transit systems
- cinematic arrival cameras and scroll-scrub storytelling
- free-roam exploration
- Repository District, where each governed repository becomes an explorable operational building
- live visual state driven by public Agentropolis manifests
- thermodynamic / entropy / drift signals expressed spatially rather than as decorative fake telemetry

## Architectural Boundary

```text
PRIVATE CONTROL PLANE
AGENTROPOLIS core
identity • governance • HERMES • credentials • policy • private data
        |
        | governed public manifests / APIs
        v
PUBLIC SPATIAL PLANE
AGENTROPOLIS-WORLD
3D city • districts • parks • transit • public activity • digital twin
```

AGENTROPOLIS-WORLD does **not** own authority. It visualizes and interacts with governed public state exposed by the private Agentropolis control plane.

## Rendering Strategy

- React + TypeScript
- Three.js
- React Three Fiber
- Drei
- procedural geometry first
- GLTF/GLB for hero assets
- Gaussian splats where cinematic or real-world capture is useful
- progressive WebGPU where supported, WebGL fallback
- level-of-detail and instancing for city-scale performance
- scroll-scrub cinematic camera + optional free-roam navigation

## Core Rule

**Do not hand-model the whole city.** Most urban massing should be generated from manifests. Hero landmarks and lore-critical spaces can use bespoke assets.

## Repository District

Repository District maps repositories across `AGENTROPOLIS-CITY-OF-AGENTS` and `WIREDCHAOS` into buildings with governed operational interiors. See [the Repository District contract](docs/repository-district.md).

## License

This repository intentionally contains **no open-source license**.

Copyright © 2026 NEURO / AGENTROPOLIS. All rights reserved.

Source code and assets are publicly viewable for demonstration, research, and interoperability purposes. No license to reproduce, modify, redistribute, sublicense, or commercially exploit this work is granted unless expressly authorized in writing.

# NEURO BUILDS Grok deployment target

Target: https://neurobuilds.grok.me/
Observed public navigation: City, Agents, Collectives, Districts, MCP Grid, J-Space, Observatory, Signals, ATV, Build, Archive. Responsive choices: FULL, ADAPT, LITE, MIN.

Goal: preserve existing AGENTROPOLIS globe and navigation, then provide district > building > office drill-down to the HERMES-3D office surface. Canonical integration: docs/integrations/HERMES3D-ORG-WIDE-CONTRACT.md.

Integration requirements:
1. Keep existing globe and all controls intact. Add an optional HERMES-3D Office entry from Agents, Districts, and appropriate building interiors.
2. Use public-safe signed spatial manifests from AGENTROPOLIS-WORLD, keyed by org/repo/district/building/office. Never embed a private gateway URL or credential.
3. Support FULL/ADAPT/LITE/MIN; 2D/low-power fallback for mobile. Respect reduced motion.
4. Only show verified agent identities, public-safe status and receipt references. Display disconnected status as unknown, not completed.
5. All user requests to run, approve, deploy or modify an agent must go to the governed authenticated control plane. Browser animations grant no authority.
6. Protect the site with feature flag default OFF, rollback, AEGIS/54T review, VERITY evidence, and release authorization.
7. Verify deployed behavior on the exact URL after Grok Build publishes it. This GitHub document does not deploy to grok.me.

Implementation ownership: AGENTROPOLIS-WORLD shared component and public manifest; Grok Build site owner must apply/publish the corresponding site changes using their authorized editor.

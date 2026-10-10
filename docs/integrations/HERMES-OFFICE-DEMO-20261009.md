# Hermes Office Projection | NKTYO 2090

Status: PROTOTYPE, DEMO-ONLY, DEFAULT OFF
Owner: AGENTROPOLIS-WORLD
Related: WORLD PR #9; HERMES-CITY PR #74; HERMES-CITY PR #71.

## Boundary

This extends the existing AGENTROPOLIS-WORLD rendering surface. It does NOT replace the globe, city manifest, district grid, HERMES-CITY or the AGENTROPOLIS control plane.

There are NO Higgsfield materials, assets, tool dependencies, provider integrations, or runtime imports in this implementation.

The original AGENTROPOLIS brand controls the look: obsidian #05070A, cyan #19E6E6, red #FF2A2A, restrained lime. NKTYO 2090 is the authorized world designation, not Neo Tokyo.

## Demo usage

Run `npm install` and `npm run dev`, then visit `/?office=demo`.
Without that query, existing WORLD behavior remains unchanged.
Choose HERMES CITY from the district menu to return to the office. Select DEMO agents, scrub the finite six-step fictional sequence, and return to the city.
The demo shows *synthetic* roles HERMES, GROKBOT, VERITY, AEGIS for visualization exercises only. No identity, assignment, receipt, or policy claim is factual.

## Production transition requirements

A separate, later implementation must:

1. Use authenticated HERMES -> AGENT-MCP -> AEGIS/54T -> governed projection service; client is read-only.
2. Ingest normalized, approved events with signed provenance, schema validation, deduplication, TTL, tenant boundaries, non-PII metadata and zero browser credentials.
3. Prove identity, mandate, policy-state and receipt before showing real execution as VERIFIED. Unavailable or stale runtime means UNKNOWN; never quietly fall back to synthetic events.
4. Keep PUBLIC CITY read-only; OPERATOR CITY stays behind scoped authorization.
5. Support explicit operator opt-in, accessible 2D fallback, FULL/ADAPTIVE/LITE/MINIMUM rendering and rollback.
6. Require independent VERITY/54T review and validated CI before enabling live mode or production rollout.

## QA

- `npm run build` must complete.
- Inspect default `/` and opt-in `/?office=demo` on mobile/desktop.
- Confirm source contains no Higgsfield imports/assets or privileged gateway calls.
- Confirm simulated receipts remain unverified and feature is OFF without query.
- Confirm no production state changes occur through 3D selection or replay.
- Confirm PR gates pass before considering owner-approved deployment.

Never claim the draft or build creates a LIVE Hermes connection.

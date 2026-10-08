# Organization-wide HERMES-3D integration contract

Status: DESIGN / FEATURE OFF. Owner: AGENTROPOLIS-WORLD spatial plane. Scope: AGENTROPOLIS-CITY-OF-AGENTS and wiredchaos organizations. No production connection or secret provisioning is authorized by this document.

## Source
Candidate: https://github.com/iamlukethedev/Hermes3D . Upstream README describes an unofficial MIT-licensed 3D/2D office with Hermes WebSocket gateway adapter, custom HTTP provider, and demo gateway. Audit and pin upstream SHA before code reuse. Do not confuse upstream Hermes3D with AGENTROPOLIS's HERMES-CITY.

## Organization-wide architecture
- AGENTROPOLIS-WORLD: canonical World/Region/District/Block/Building/Floor/Office/SurfaceTool 3D navigation and repository building directory.
- HERMES-3D: reusable office visualization module at Office/SurfaceTool depth; do not replace WORLD's city renderer.
- HERMES fleet: authoritative job/run/agent state from governed internal runtime, never browser-generated.
- AGENTROPOLIS-BUZZ: signed collaboration events; ALOOK optional transport only.
- AGENTROPOLIS-ATG and identity/credential/skill registries: verify agent identity, reputation and permissions.
- AEGIS and AGENTROPOLIS-54T: approve policy, scopes, isolation, threat model, and security checks.
- VERITY: independently verify receipts and release readiness.
- HERMES-CITY: public-safe read-only projection only. Never expose private fleet topology or keys.

## Universal repository mapping
Each opted-in repository has a stable canonical repo ID, owner organization, visibility classification, district and building address, allowed projection level, permitted event topics, and read-only default. Private repositories never appear in public manifests by default. A repository is not considered onboarded merely because this document exists.

## Proposed event contract (not implemented)
{
  "schema": "agentropolis.spatial.office.v1",
  "organization": "owner-login",
  "repository": "owner/repository",
  "office_id": "world/region/district/block/building/floor/office",
  "agent_id": "credentialed-agent-id",
  "event_type": "presence|run_started|run_completed|approval_pending|receipt",
  "state": "unknown|pending|running|completed|failed",
  "occurred_at": "ISO-8601",
  "source_receipt_id": "signed-receipt-reference",
  "classification": "public|internal|restricted"
}
Reject missing verified identities, invalid signatures, unauthorized tenant scopes, stale/replayed event IDs, or schema mismatch. Render unknown as unknown, not success.

## Control path
A click in a 3D office is an intent, not authorization. Browser -> authenticated intent -> identity/mandate check -> AEGIS policy and 54T risk tier -> HERMES dispatch -> signed receipt -> spatial update. No direct privileged browser-to-Hermes gateway. No autonomous approval, merge, deploy, wallet, or credential actions.

## Rollout
P0: source audit, immutable SHA, SBOM, dependency license and security review.
P1: mock-only WORLD office component with 2D fallback, disabled by default.
P2: BUZZ/HERMES signed read-only event adapter and repository address mapping.
P3: per-organization private staging canary; confirm no cross-tenant or public data leakage.
P4: independent VERITY and 54T review with CI receipts, rollback and kill switch.
P5: operator-approved production rollout by explicit per-repository opt-in. Never mass deploy without review.

## Acceptance criteria
- Both organizations discoverable by manifest, with opt-in only and correct privacy.
- Existing city navigation continues to work, and every office is reachable from a repository building.
- No 3D click bypasses human approval, branch protection, or execution envelope.
- Forged, stale, replayed, cross-tenant and malicious event payloads fail closed.
- Gateway secrets never reach the client, telemetry, collaboration events or public manifests.
- Disconnected fleet state is visibly unknown; demo state clearly labeled.
- Accessible 2D and keyboard fallback; performance budgets on mobile.
- CI, audit receipts, review and explicit deploy approval required.

## Workstream placement
AGENTROPOLIS-WORLD owns spatial shell and manifest; AGENTROPOLIS-BUZZ owns collaboration bridge; HERMES runtime owns fleet adapters; AGENTROPOLIS-54T owns security acceptance; HERMES-CITY consumes only public-safe projection. This document is an org-wide specification, not proof of implemented integrations.

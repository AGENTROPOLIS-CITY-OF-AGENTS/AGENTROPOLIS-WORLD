# Life Plane Projection Boundary

AGENTROPOLIS-WORLD renders governed projections from the Life Plane. It does not own canonical runtime truth.

## Required behavior

WORLD may:

- render district health and activity
- render agent presence
- visualize tasks, transit, events, entropy, drift, and receipts
- animate projected state
- interpolate movement and transitions
- cache public-safe projections
- compress representations for performance
- expose interactions that request governed actions

WORLD may not:

- create authoritative identities
- create or enlarge mandates
- turn visible presence into permission
- mint receipts or audit outcomes without the responsible system
- mutate canonical balances or permissions
- treat client-side state as proof of execution

## Projection flow

```text
canonical Life Plane state
  -> visibility/policy filter
  -> WorldStateProjection
  -> WORLD client
  -> spatial rendering / animation / interaction
```

Any action initiated from WORLD must return through Mission Control / governed capability routing and must not be considered successful until a receipt or explicit denial is returned.

## Pages/public deployment

GitHub Pages may host a public WORLD shell or static demo. Public Pages deployments must use public-safe fixture data or bounded public projections only. No production secret, private event stream, internal credential, unrestricted tool endpoint, or write authority belongs in a Pages artifact.

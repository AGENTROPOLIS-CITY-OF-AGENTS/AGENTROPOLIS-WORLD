# BLOCKBANGERS CityDrive

BLOCKBANGERS CityDrive is a citywide mobility client for AGENTROPOLIS-WORLD.

It is not confined to the Gaming District. The Gaming District is the home of BLOCKBANGERS-specific gameplay, but the vehicle can traverse the wider public city wherever AGENTROPOLIS-WORLD exposes a routable district.

## Ownership boundary

```text
AGENTROPOLIS Intelligence Grid
        |
        v
AGENTROPOLIS-WORLD
canonical public physical districts + topology
        |
        v
BLOCKBANGERS CITYDRIVE
vehicle embodiment + driving + camera + HUD + minimap + waypoint UX
        |
        +--> district arrival event
        +--> optional district deep-link
        +--> optional BLOCKBANGERS gameplay overlays
```

AGENTROPOLIS-WORLD remains the source of truth for the public physical city. BLOCKBANGERS does not fork or replace the world ontology.

## Access rule

Ordinary city navigation must not be gated by:

- game reputation
- token balance
- collectible or NFT ownership
- mission progression
- district ownership

Gameplay may unlock missions, cosmetics, vehicles, rewards, challenges, races, bounties, and other optional layers. It may not remove ordinary city access.

## Arrival event

A CityDrive host may emit a bounded arrival event:

```json
{
  "type": "agentropolis:district-enter",
  "districtId": "gaming",
  "name": "Gaming District",
  "href": "/play",
  "source": "blockbangers-citydrive"
}
```

The event is navigation intent, not authority to mutate district state.

## Integration points

- Main Street / Navigator can offer CityDrive for `Take me there` journeys.
- ATLAS may supply route intelligence, distance, nearby and map layers.
- PARALLAX may verify scene mutations, arrival state and spatial receipts.
- Holofoil may style cars, signage, collectibles and road surfaces without owning route authority.
- Creator / Construction supplies approved GLB vehicles, characters, props and landmarks.
- Gaming District owns BLOCKBANGERS-specific missions, races and rewards.
- EXL3 / local inference may assist low-risk NPC dialogue, radio, hints and narrative, but does not determine routing authority.

## First implementation

The HOOD-TERPS integration carries a versioned `agentropolis.citydrive.v1` snapshot derived from `public/world.manifest.json`. This avoids making the first playable client depend on a cross-origin service at runtime while preserving the upstream source reference and manifest version.

The longer-term target is a generated public navigation manifest derived from canonical world state so CityDrive consumers do not maintain hand-copied topology.

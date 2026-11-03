# Verdant Reach v0.8.4 — settlement architecture and town-life report

## Implemented
- Free-city houses use raised stone plinths, separate lower and overhanging upper storeys, visible timber posts and rails, framed windows, trade-front awnings, gabled roofs and chimneys.
- Ordinary settlement houses use gabled roofs, visible framing, upper-floor details and chimneys rather than a single box with a pyramid roof.
- Free-city markets contain 12 varied stalls with counters, fabric awnings, posts, signs, displayed goods and barrels.
- Villages, market towns and ports receive additional stalls, while residents move between homes, workplaces, the shore and market.
- Galleon sternworks use narrower stepped tiers and open galleries; headsail cloth coordinates now follow their stays.
- Ruined castle walls receive terrain-following parapets and crenellations; gatehouses and keeps gain stronger tower and corner details.

## Population and simulation
- Free cities generate 32 visible residents; ports 16; market towns 12; villages 8.
- Residents retain deterministic identities and schedule-based routines.
- Older saved rosters are topped up without re-creating residents who migrated to another settlement.
- NPCs have simple arm and leg swing while walking.

## Performance and limitations
Resident counts are intentionally much lower than simulated population totals. Settlements continue to stream with the active region. Repeated market and city architecture uses instanced meshes; NPC actors are created only for nearby settlements. This remains a procedural reconstruction, not scanned architecture or a fully simulated crowd. A visual balance/performance pass should still be completed on lower-end devices.

# Verdant Reach v0.8.4 — Upgrade Report

## Focus
This release responds to the first in-browser review of v0.8.3. It improves the galleon silhouette and gives settlements more visible everyday life, while beginning the planned architecture and castle-remodelling pass.

## Ship refinements
- Corrects the rotated local-axis sign used by triangular headsails so the cloth runs from the bowsprit stay back to the foremast instead of extending off the bow.
- Replaces the galleon's broad stacked stern blocks with a stepped, narrowing aftercastle, smaller gallery wings and open balustrade details.
- Balances galleon standing rigging and square-sail spread to reduce visual clutter.
- Retains the 14-vessel procedural catalogue, component hierarchy and saved sail controls.

## Settlement life
- Raises visible resident rosters to 32 in free cities, 16 in ports, 12 in market towns and 8 in villages.
- Tops up legacy saves deterministically while avoiding duplicate NPC identities after migration.
- Adds articulated arm and leg motion to walking residents.
- Adds varied market stalls, awnings, counters, goods, signs and barrels to towns and ports; free-city markets gain 12 stalls.

## Buildings and castles
- Reworks ordinary and city houses around plinths, separate floors, projecting upper levels, timber posts/rails, framed windows, shutters, gabled roofs and chimneys.
- Gives inns and workshops visible street-facing trade fronts.
- Adds castle parapets, crenellations, gatehouse flanking towers and stronger keep corners.

## Compatibility and verification
- Creates a separate v0.8.4 snapshot; v0.8.3 remains unchanged.
- Keeps the local static launcher unchanged.
- Updates browser module cache keys and save metadata to 0.8.4.
- Adds regression tests for resident counts, migration-safe save top-up, market life, galleon sail geometry and castle detailing.
- The v0.8.4 CI workflow runs automated tests and a production build; results must be checked before release.

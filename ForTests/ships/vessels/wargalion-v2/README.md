# Wargalion V2 — silhouette and structure refinement

Wargalion V2 is a parallel reconstruction. The existing Wargalion V1 folder is preserved.

## Reference basis

The San Martín / São Martinho reproduced plan set is the principal visual comparison for the hull elevation, forebody, afterbody, end sections and stepped aft works:

https://www.shipmodell.com/index_files/0PLAN1B.html

The reproduced sheet is a secondary modelling plan, not a surviving shipyard draught. The hull station ordinates remain reconstruction estimates and have not been digitized from a calibrated copy. Other late-16th-century galleon drawings are comparative material only; they are not treated as San Martín's own lines.

The working length and beam (39.0 × 11.7 m) follow the model report in the Spanish Navy's Revista General de Marina (July 2007). Revista de Historia Naval (Supplement 16, 2012) records two estimated San Martín dimension sets; the Casado Soto estimate is 35.24 m length, 10.51 m beam and 5.60 m moulded depth. Scaling that depth by 39.0 / 35.24 produces the 6.20 m working moulded depth. This is a proportional estimate, not a separately documented measurement.

## Geometry changes in this pass

- The hull profile has a stronger rising keel and a more pronounced sheer toward both ends.
- The midbody retains a full, rounded section; the upper sides draw farther inward toward a narrower deck edge.
- The forecastle and quarterdeck are more visibly raised and are narrower than the main deck.
- A separate open beakhead platform projects forward beyond the stem. No bowsprit pole or rigging is generated in this stage.
- Aftercastle walls taper across their height and rake inward along the fore-aft axis.
- Roofs now share their edge calculations with the wall tops. The exaggerated lid-like overhang has been removed.
- Side windows, end walls and galleries use the same tier geometry so they remain aligned as the tiers narrow.

## Geometry authority

architecture/hull-surface.js is the sole hull-form authority. Hull skins, wale bands, stem, keel, decks and cabin station geometry sample this evaluator. It uses shape-preserving PCHIP interpolation; this is C1-continuous at knots, not a measured CAD surface or an archival offsets table.

generators/cabins/aftercastle-geometry.js is the shared source for tier station taper, wall top coordinates and roof-edge alignment. The assembly coordinator still only positions and coordinates independent component generators.

## Scope and remaining limits

The current stage contains hull, decks, beakhead, forecastle bulwarks, aftcastle, windows and galleries. Masts, sails, bowsprit pole, rigging, rudder and helm details remain deferred.

The aftcastle is a visual reconstruction hypothesis. Review clean side, bow, stern and top views before accepting the proportions as final.

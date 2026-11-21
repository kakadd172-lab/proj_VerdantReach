# Wargalion V2 — proportion correction

Wargalion V2 is a parallel reconstruction. The existing Wargalion V1 folder is preserved.

## Proportion basis

The working length and beam (39.0 × 11.7 m) follow the model report in the Spanish Navy's *Revista General de Marina* (July 2007). The Spanish Navy's *Revista de Historia Naval* (Supplement 16, 2012) records two estimated dimension sets for the San Martín; the Casado Soto estimate is 35.24 m length, 10.51 m beam and 5.60 m moulded depth. Scaling that depth by the ratio 39.0 / 35.24 produces a 6.20 m working moulded depth for the retained 39.0 m model scale. This is a proportional estimate, not a separately documented measurement.

The 2012 source also lists Augusto Salgado's different estimate (27 m keel length, 11.15 m beam and 4.0 m depth to the first deck). The differences are preserved rather than blended. The 2007 model report and the 2012 estimates are not a calibrated lines plan.

## Current geometry

- Midship keel-to-main-deck depth is 6.20 m at the 39.0 m working scale, replacing the previous 7.54 m geometry.
- Length-to-beam ratio remains approximately 3.33, close to the Casado Soto estimate (35.24 / 10.51 ≈ 3.35).
- The broadest part of each principal hull section is aligned with its estimated waterline height.
- Upper sides draw inward toward the bulwarks, rather than carrying maximum beam high up the topsides.
- The forebody and afterbody remain smoothly faired from one shared surface; the flat stern transom is retained.
- The hull skins, keel, wale bands, decks, forecastle bulwark, aftcastle and galleries remain separate editable assemblies.

## Geometry authority

`architecture/hull-surface.js` is the sole hull-form authority. Hull skins, wale bands, stem, keel, decks and cabin station geometry sample this evaluator. It uses shape-preserving PCHIP interpolation; it is C1-continuous at knots, not a measured CAD surface or an archival offsets table.

## Visual and historical limits

The Shipmodell San Martín 1580 reproduction provides the named-ship side, end and sectional views. The current station offsets are still reconstruction estimates and have not been digitized from a calibrated copy of that sheet. Pinterest and generic Elizabethan galleon drawings are comparison material only; they are not treated as San Martín's own plans.

The aftcastle remains a visual reconstruction hypothesis. Review side, bow, stern and top views before treating the current proportions as accepted.

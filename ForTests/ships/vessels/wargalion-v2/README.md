# Wargalion V2 — hull and cabin stage

Wargalion V2 is a clean, parallel reconstruction folder. The existing
`wargalion/` implementation is intentionally preserved.

## Current scope

- One shared, shape-preserving parametric hull surface.
- Derived station, waterline and buttock curves from that exact same surface.
- Separate editable hull skins, keel, stem, sternpost/transom and deck assemblies.
- Separate aftcastle tiers, side walls, end walls, gabled roofs, windows and quarter galleries.
- No masts, sails, standing rigging, running rigging, rudder, guns or decorative deck fittings in this stage.

## Coordinate system

X is athwartships (port negative, starboard positive), Y is vertical, and Z is longitudinal (bow negative, stern positive). The origin is the keel at midships. Dimensions are specified in metres and converted to editor world units by the shared vessel definition helper.

## Geometry authority

`architecture/hull-surface.js` owns the hull equations. Every hull mesh and every cabin station reads from it. Do not add a second smoothing implementation to a component generator. If the design changes, alter the source station data or the authoritative surface function, then rerun the geometry tests.

The surface uses Fritsch-Carlson/PCHIP cubic Hermite interpolation. It is shape-preserving and C1-continuous at interpolation knots; it is not a measured CAD surface and should not be described as curvature-continuous or archival. Inspect the resulting side, plan and body views visually as well as running numerical checks.

## Historical uncertainty

The 39.0 × 11.7 m working scale follows the 2007 Spanish naval-periodical account. A secondary publication reports 35.3 × 10.5 m and a different construction date. Keep this discrepancy in the evidence register; do not silently combine the values or claim the working station offsets are measured.

The three-dimensional shape is a plausible reconstruction study guided by the reproduced San Martín plan and general Iberian/Portuguese shipbuilding research. It is not a verified replica. Rig plan and more detailed construction decisions remain deferred.

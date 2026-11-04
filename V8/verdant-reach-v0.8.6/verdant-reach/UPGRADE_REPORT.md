# Verdant Reach v0.8.5 — upgrade report

## Changes

- Created the isolated v0.8.5 project snapshot from the v0.8.4 populated-settlements branch.
- Replaced the earlier ship geometry generator with a new station-based loft pipeline: 96 longitudinal stations and 40 hull-section points.
- Added the standalone `ship-hull-parameterization.js` module and connected it to the existing ship structures and Three.js model builder.
- Implemented original piecewise cubic Bézier forebody/aftbody taper, bounded midship cross-section breadth, separate bow/stern keel rocker, and explicit bow/transom end caps.
- Kept the catalogue's stated maximum beam as the upper bound of the generated moulded breadth.
- Added geometry checks for parameter endpoints, monotonic longitudinal taper, finite cross-sections, keel rocker, port/starboard symmetry, end-cap triangles and exact hull/deck sheer alignment.
- Added independent structural profiles for 16 vessel families.
- Rebuilt curved, multi-tier stern structures with separate window and gallery components.
- Added vessel-specific square, gaff, lateen, snow-trysail and battened-lug junk rig arrangements.
- Added editable component groups for hull, deck, keel, frames, strakes, mast sections, sails, spars, rigging, sternwork, rudder, helm, anchors and rails.
- Corrected earlier hull, sail orientation, junk hull, rudder, mast pivot and sail hierarchy problems.
- Corrected the first-rate dimensional anchor to HMS Victory's 186 ft (56.73 m) gun-deck length, keeping overall length distinct.
- Preserved Creative Shipyard component transforms, detach/relink, visibility, sailing controls, save-state restoration and legacy vessel aliases.
- Documented external procedural-hull research. No code from the GPL-3.0 reference repository or the MIT research repository was copied. No external runtime dependency was added.
- Updated the v0.8.5 validation workflow to Node 24-compatible GitHub Actions action releases.

## Validation

- Latest branch code/test commit: `13d1581b9fd61f4fbf775c36faffbbef06ffbaad`
- Latest full code validation run: [#41649403870](https://github.com/kakadd172-lab/proj_VerdantReach/actions/runs/41649403870)
- Tests: **113/113 passed**
- Production build: **passed**
- Non-blocking bundle-size warning: the primary minified JavaScript chunk is about 916.5 kB.

## Remaining acceptance work

A manual visual review is still required for all 16 hull and rig silhouettes. The models are original procedural reconstructions with evidence-labelled dimensions; they are not complete blueprint-accurate CAD reconstructions. The reference game's complete ship roster has not been independently verified.

No merge into the previous branch and no GitHub Pages publication have been performed.

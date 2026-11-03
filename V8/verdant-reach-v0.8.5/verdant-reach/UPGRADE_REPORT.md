# Verdant Reach v0.8.5 — upgrade report

## Changes

- Created the isolated v0.8.5 project snapshot from the v0.8.4 populated-settlements branch.
- Replaced the earlier ship geometry generator with a new station-based loft pipeline: 96 longitudinal stations and 40 hull-section points.
- Added independent structural profiles for 16 vessel families.
- Rebuilt curved, multi-tier stern structures with separate window and gallery components.
- Added vessel-specific square, gaff, lateen, snow-trysail and battened-lug junk rig arrangements.
- Added editable component groups for the hull, deck, keel, frames, strakes, mast sections, sails, spars, rigging, sternwork, rudder, helm, anchors and rails.
- Corrected hull deck-edge continuity, fore-and-aft sail orientation, junk hull treatment, rudder pivot placement, mast pivots, sail pivots and mast-to-sail hierarchy.
- Corrected the first-rate dimensional anchor to HMS Victory's 186 ft (56.73 m) gun-deck length, keeping overall length distinct.
- Preserved Creative Shipyard component transforms, detach/relink, visibility, sailing controls, save-state restoration and legacy vessel aliases.
- Added geometry and hierarchy regression coverage.
- Updated the v0.8.5 validation workflow to Node 24-compatible GitHub Actions action releases.

## Validation

- Latest validated commit: `b9747aceaee3f4c8c602ae1e6c3fe5d9aefdadc8`
- GitHub Actions: [run #41645795257](https://github.com/kakadd172-lab/proj_VerdantReach/actions/runs/41645795257)
- Tests: **107/107 passed**
- Production build: **passed**
- Non-blocking bundle-size warning: the primary minified JavaScript chunk is about 916.5 kB.

## Remaining acceptance work

A manual visual review is still required for all 16 hull and rig silhouettes. The models are original procedural reconstructions with evidence-labelled dimensions; they are not complete blueprint-accurate CAD reconstructions. The reference game's complete ship roster has not been independently verified.

No merge into the previous branch and no GitHub Pages publication have been performed.

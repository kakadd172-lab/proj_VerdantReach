# Verdant Reach v0.8.5 — source audit

## Scope reviewed

This audit covers the isolated v0.8.5 snapshot under `V8/verdant-reach-v0.8.5/verdant-reach`. The v0.8.4 folder remains unchanged.

The ship-design catalogue, ship geometry builder and ship-specific structural profile module have been replaced. The rest of the game is carried forward from the v0.8.4 project snapshot to preserve the existing world and editor systems.

## Ship-system architecture reviewed

- The hull generator uses 96 longitudinal stations and 40 points per cross-section.
- Each of the 16 vessel families has its own structural blueprint for beam station, forebody/aftbody taper, bottom form, bilge fullness, flare, tumblehome, sheer, frame count and rigging layout.
- The hull and deck are separate surfaces. The hull section reaches both port and starboard deck edges and closes across the upper sheer line.
- Keel, stem structure, transverse frames, hull strakes, deck seams, stern tiers, window frames, gallery rails, bow structure, rails, rudder, helm, anchors, masts, sails, yards, spars and rigging are named, editable groups.
- Stern tiers are individual curved loft structures rather than one shared solid block.
- Mast groups pivot at their mast steps. Square, gaff, lateen and junk sail groups are parented to their corresponding mast pivots. The rudder rotates around its stern stock.
- Shroud-pair counts and ratline counts are read from each ship's structural blueprint.
- Chinese junk geometry uses a separate battened-lug rig and avoids the generic European stem-post/figurehead treatment.
- Creative Shipyard visibility, detach/relink, six-axis local transforms, sail deployment, sail trim, rudder angle, mast lean and ship-state restoration remain available.
- Legacy `sailing-ship` and `large-ship` records continue to map to the sloop and galleon designs.

## Historical evidence and accuracy limits

The catalogue labels measured references separately from reconstruction estimates. The first-rate dimensional anchor uses HMS Victory's 186 ft (56.73 m) gun-deck length and 52 ft (15.79 m) breadth; the larger overall length is treated separately. Draft, freeboard, rig heights and detailed hull offsets remain estimates.

The Chinese junk dimensions are game reconstruction values, not measurements of a vessel in the reference game. Its broad hull and battened-lug rig are informed by museum model references.

The public reference-game material does not provide a complete technical roster or full lines plans for every vessel. The catalogue therefore does not claim one-to-one coverage of every named in-game vessel. Procedural hulls remain historical reconstructions, not exact CAD models or shipwright scantling plans.

## Automated validation

<badge color="success">Passed</badge>

- GitHub Actions run: [#41645795257](https://github.com/kakadd172-lab/proj_VerdantReach/actions/runs/41645795257)
- Validated commit: `b9747aceaee3f4c8c602ae1e6c3fe5d9aefdadc8`
- Node test suite: **107 passed, 0 failed**
- Vite production build: **passed**
- The workflow uses current Node 24-compatible GitHub Actions releases.

The production build emits a non-blocking warning that the main JavaScript chunk exceeds 500 kB after minification (about 916.5 kB). Code splitting is a later performance improvement, not a build failure.

## Remaining release gate

Automated tests and production compilation are green, but a manual visual review has not been performed. Before calling the vessel art release-complete, inspect every class from bow, stern, port, starboard and deck-level views at character scale, including mast/sail spacing, stern tiers, hull-water clearance and component deformation. Automated geometry tests cannot prove that all 16 silhouettes are historically exact or visually polished.

This branch has not been merged into the v0.8.4 branch and has not been published to GitHub Pages.

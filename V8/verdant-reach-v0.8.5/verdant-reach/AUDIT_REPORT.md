# Verdant Reach v0.8.5 — source audit

## Scope reviewed

This audit covers the isolated v0.8.5 snapshot under `V8/verdant-reach-v0.8.5/verdant-reach`. The v0.8.4 folder remains unchanged.

The ship-design catalogue, ship geometry builder and ship-specific structural profile module have been replaced. The rest of the game is carried forward from the v0.8.4 project snapshot to preserve the existing world and editor systems.

## Ship-system architecture

- A 96-station hull loft and 40-point hull cross-section are used by the new procedural geometry builder.
- Each ship family has a separate structural profile defining beam station, forebody/aftbody taper, section fullness, floor shape, sheer and frame count.
- The deck, hull shell, keel, stem, strakes, deck seams, frames, stern tiers, bow structure, rails, rudder, helm, anchors, mast sections, sails and rigging are separate named groups.
- Stern tiers use a curved loft and have separate window and gallery groups.
- The Chinese junk has a separate battened-lug rig path instead of being treated as a square- or gaff-rigged ship.
- The Creative Shipyard-facing transform, visibility, hierarchy and sail-control API remains available.

## Historical evidence

The catalogue labels dimensions as historical anchors or reconstruction estimates. HMS Victory provides the first-rate dimensional reference. The Chinese junk uses museum model evidence for its broad hull and battened-lug rig, while its displayed dimensions remain game reconstruction estimates.

The published reference-game material does not provide a complete technical roster or full lines plans for every ship. The catalogue therefore does not claim one-to-one coverage of every in-game named vessel.

## Validation status

Automated test and production-build results are recorded after the v0.8.5 GitHub Actions validation workflow completes. A manual graphical review of all 16 models from multiple views remains a separate acceptance step.

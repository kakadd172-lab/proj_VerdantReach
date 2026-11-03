# Verdant Reach v0.8.5 — modular sailing fleet

Verdant Reach v0.8.5 begins a complete replacement of the ship-design and ship-generation pipeline. The release is based on the v0.8.4 project snapshot, preserving its world, settlement, editor, transport and save systems while rebuilding the vessel catalogue and component geometry.

## Run locally

```bash
npm install
npm run dev
```

Run the automated checks with `npm test` and create a production build with `npm run build`.

## v0.8.5 ship-system rebuild

- Replaces the earlier ship geometry builder with a new station-loft hull pipeline, 96 longitudinal stations and 40 points around each hull section.
- Keeps real-world length, beam, draft and freeboard in metres. The game conversion remains 1 metre = 4/3 world units.
- Gives each catalogue family its own longitudinal hull profile, cross-section, frame count, sheer and mast arrangement.
- Builds the hull, deck, deck seams, keel, stem, each transverse frame, strakes, stern structure, bow structure, rails, rudder, helm, anchors, mast sections, sails, yards, battens and rigging as separately addressable groups.
- Uses curved loft geometry for stern tiers, with separate tier groups, window framing and gallery rails rather than one solid cabin block.
- Gives mast groups, square/fore-and-aft sails and the rudder their own attachment-point pivots, so steering, sail trim and mast lean rotate around the actual component base.
- Generates the number of shroud pairs and ratlines from each vessel's structural blueprint; the Chinese junk uses a separate unstayed battened-lug rig and does not receive a generic European stem-post or bow ornament.
- Keeps square, gaff, lateen, brigantine and snow arrangements, and adds a distinct battened-lug Chinese junk rig with minimal standing rigging.
- Retains Creative Shipyard visibility, detach/relink, local transforms, rudder angle, sail trim, mast lean, sail deployment and save-state restoration.
- Keeps the legacy `sailing-ship` and `large-ship` save aliases compatible.

## Fleet catalogue

The catalogue contains 16 original vessel families: sloop, schooner, brigantine, brig, snow, cutter, frigate, barque, caravel, carrack, galleon, fluyt, xebec, Chinese sea junk, first-rate ship of the line and pinnace.

The Chinese junk is a historically informed original model. Public release notes for the reference game mention a Chinese Junk named “Executor”; the Verdant Reach model is not a recreation of that game's mesh. The first-rate uses HMS Victory as a dimensional reference: its hull length is anchored to the 186 ft (56.73 m) gun-deck length, while the 227 ft (68.88 m) overall length is treated separately as a whole-vessel check.

The public Home Net Games page describes unlockable ships but does not provide a complete model roster or a dimensional catalogue. For that reason, this release does not claim that the 16 families are a verified one-to-one list of every in-game vessel. It is a new original fleet foundation with room to add further named variants when reliable references are available.

## Reference and accuracy policy

The Pirate: Plague of the Dead is used as a broad visual reference for the scale, silhouette variety, weathering, sail presentation and overall maritime atmosphere. All Verdant Reach meshes, hull geometry, component layouts and rigs are original procedural constructions.

A published dimension is used only where a museum, collection or historical record supports it. Unrecorded offsets, secondary dimensions, sail-plan details and rig heights are identified as reconstruction estimates. A vessel class is not treated as one universal design: proportions changed by builder, period, region and use.

See [SHIP_RESEARCH.md](SHIP_RESEARCH.md) for the design notes and references.

## Known limitations

- Procedural reconstructions are not naval-architectural CAD models or exact reproductions of surviving lines plans.
- The 16-family catalogue is not a verified complete inventory of every ship variant in the reference game.
- Some secondary fittings, deck furniture and decorative details remain simplified.
- The rig controls are animation-ready component controls, not a complete aerodynamic or hydrodynamic solver.
- Source-level tests and a successful production build do not replace a manual visual review of every ship from bow, stern, port, starboard and deck level.

## Compatibility

This version is stored under its own `V8/verdant-reach-v0.8.5/verdant-reach` directory. The v0.8.4 directory and its source files remain unchanged. Save state keeps the existing Creative ship transform and hierarchy format, with missing values defaulting safely.

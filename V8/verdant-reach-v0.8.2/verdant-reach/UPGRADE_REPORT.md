# Verdant Reach v0.8.1 — Upgrade Report

## Summary

Version 0.8.1 is a focused shipyard reliability and release-engineering follow-up to v0.8.0. It retains the current ship catalogue, historical research, world generation and save structure.

## v0.8.1 follow-up changes

- Preserve the selected vessel, component and mast across Creative panel redraws.
- Restore saved component position and rotation values to the editor in metres and degrees, together with the saved rudder, sail-trim and mast-lean controls.
- Add session copy/paste for the six local transform values. Pasting stages values; the existing Apply action commits them to the ship record.
- Snap translation values to 0.1 m before converting them to world units.
- Show selected-vessel length, beam, draft, principal mast count, era and rig within the shipyard.
- Restore detached-part hierarchy before applying saved local component offsets.
- Add release cache-busting and a CI workflow for regression tests, production build and a downloadable source archive.


Version 0.8.0 replaces the earlier generic ship models with an original, historically informed, component-based Atlantic/Caribbean Age-of-Sail fleet. It upgrades the existing v0.7.0 audited project in place. It does not create a new game or reset existing saves.

## Implemented

### 14 vessel families

Caribbean merchant sloop, West Indies schooner, brigantine, brig, snow, cutter, frigate, barque, caravel, carrack/nao, galleon, fluyt, xebec and ship’s pinnace. These span several centuries and multiple maritime regions. The catalogue explicitly distinguishes documented vessel dimensions from class-based estimates. It is a representative fleet, not an exhaustive list of all maritime types.

### Proportional modelling

- Shared real-world conversion: 1 m = 4/3 world units; character reference height 1.8 m = 2.4 world units.
- High-resolution parametric hull loft: 56 longitudinal stations × 24 cross-section segments.
- Vessel-specific hull fullness, entrance, stern shape, tumblehome, sheer, bow/stern rise, keel depth and deck camber.
- Separately generated cambered decks, strakes, keel, bow/stern assemblies, railings and deck fittings.
- Vessel-specific mast positions and heights, plus class-appropriate square, gaff, lateen, brigantine and trysail sail plans.

### Linked component hierarchy

- Hull shell, planking/strakes, deck, keel, sternworks/gallery, bowworks, bowsprit, rudder, helm/wheel, anchors/chains and port/starboard railings are separate named groups.
- Each mast, lower mast, topmast, mast step/platform, sail, sail cloth, yard, boom, gaff/lateen yard, sheet, stay, shroud, ratline and brace is independently addressable where used by that design. Selected larger hulls have separately addressable decorative closed gunport shutters; these are non-functional exterior details.
- Creative mode supports unlink/relink while preserving world transforms, visibility toggling, local translation/rotation, reset, rudder angle, sail trim and mast lean.
- Ship component state is saved with each Creative vessel; duplicated vessels receive deep-copied component data.
- Undo/redo operates within the active editing session and is not persisted as an undo journal after reload.

### Shipyard and reference UI

Creative ship cards display vessel dimensions, era, rig, source/reconstruction note and direct source links. The component editor includes local position and rotation controls using metres and degrees. The part/mast selectors update when the selected ship changes.

### Integration and compatibility

- Historical ships are used by the Creative summon system, player boarding/transport and maritime cargo-voyage rendering.
- Legacy `sailing-ship` records map to sloop; legacy `large-ship` records map to galleon.
- Existing world seeds, terrain generation, player progression, Creative/Survival mode, settlements, Wayfarer’s Circuit and IndexedDB save structure remain intact.
- Missing ship-state properties default safely for older saves.

## Historical accuracy notes

Sources and individual evidence notes are in `SHIP_RESEARCH.md`. Some example dimension anchors include the Reader’s Point Jamaican merchant sloop hull, HMS Berbice schooner record, Mercurio brigantine reconstruction, La Renommée frigate model, Endeavour barque, the German Historical Museum caravel/carrack/galleon/fluyt models, and the Channel Islands Maritime Museum xebec description. The model meshes are original proportional reconstructions—not traced CAD lines plans.

*Pirates: Plague of the Dead* is used only as a broad Caribbean Age-of-Sail atmosphere reference. No game assets, meshes or extracted models are copied.

## Verification

- Automated tests: **86/86 passed** in the final run (`npm test`).
- JavaScript syntax checks and relative-import checks are required across the whole source/test tree.
- HTML parser and duplicate-ID checks are required.
- Static HTTP smoke checks should verify the entry page and key ship modules.
- ZIP integrity should be checked after packaging.
- **Production build and full visual browser playthrough are not verified in this environment** if Vite/Three packages cannot be installed and WebGL cannot initialize. Do not interpret source tests as proof that all ship meshes were visually inspected in-browser.

## Not fully implemented

- Dimensions are historical anchors where sourced, but complete hull lines, displacement, centre of buoyancy, metacentric stability and framing plans are not simulated.
- Sails flutter and respond to trim/wind visually; this is not a CFD sail solver.
- Rigging is a stylized proportional rope network, not a full tackle/block-and-tackle simulation with tension.
- No ship artillery, projectile system or naval combat is part of v0.8.0; closed hull-port details are decorative only.
- The fleet is representative, not exhaustive; more region-/period-specific forms can be added in future releases.

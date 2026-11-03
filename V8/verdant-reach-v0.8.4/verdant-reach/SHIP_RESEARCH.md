# Verdant Reach v0.8.4 — Caribbean Age-of-Sail ship research

## v0.8.4 visual correction notes

The first browser review found a headsail coordinate-direction error on the bowsprit stays and an overly bulky galleon aftercastle. The new version reverses the local-X offset used by the rotated triangular headsail mesh, so its forward and aft corners remain on the stay endpoints. The galleon stern is represented by narrowing stepped tiers with open gallery details rather than broad stacked blocks. Its rope count and yard spread have also been moderated for a cleaner silhouette. The model remains a procedural interpretation, not a traced surviving lines plan.

## Existing fleet research catalogue

## Scope and historical method

This update replaces the earlier low-detail generic ship forms with a parametric, component-based fleet of original Three.js models. The catalogue covers 14 representative Atlantic, Caribbean, Mediterranean and North Sea vessel families across the 15th–19th centuries. It is intentionally not described as “every ship type ever built”: vessel names overlap across countries and centuries, and the rig and hull details changed substantially over time.

The Home Net Games title *Pirates: Plague of the Dead* is a broad atmosphere and gameplay reference only. These meshes, geometry and rigs are original Verdant Reach constructions; no game assets or extracted models are used.

### Scale

- World scale: **1 metre = 4/3 world units**.
- Player reference height: **1.8 m**, represented as **2.4 world units**.
- Vessel length, beam, draft and freeboard are expressed in metres in the catalogue and converted consistently for rendering and deck height.
- A ship’s actual displacement, stability curve, framing plan and rig engineering are not simulated. The geometry is a proportionally informed game reconstruction, not a naval-architectural CAD model.

## Fleet catalogue

| Vessel family | Reference period | Hull (L × B) | Draft | Principal masts | Evidence basis |
|---|---|---:|---:|---:|---|
| Caribbean merchant sloop | Late 17th–18th century Caribbean | 17.22 × 4.34 m | 1.90 m | 1 | Reconstruction / representative estimate |
| West Indies schooner | Late 18th century | 22.17 × 6.30 m | 2.25 m | 2 | Measured / museum model |
| Brigantine | 18th–early 19th century | 30.00 × 8.50 m | 3.15 m | 2 | Reconstruction / representative estimate |
| Full-rigged brig | Late 18th–early 19th century | 33.70 × 9.75 m | 3.70 m | 2 | Reconstruction / representative estimate |
| Snow brig | 18th century | 28.50 × 7.80 m | 3.00 m | 2 (+ auxiliary trysail mast) | Reconstruction / representative estimate |
| Caribbean cutter | 18th century coastal service | 16.80 × 5.10 m | 2.00 m | 1 | Reconstruction / representative estimate |
| 18th-century frigate | 18th century | 31.00 × 6.90 m | 3.50 m | 3 | Measured / museum model |
| Atlantic barque | Late 18th century onward | 29.80 × 8.90 m | 3.50 m | 3 | Reconstruction / representative estimate |
| Atlantic caravel redonda | 15th–16th century | 20.50 × 7.00 m | 2.40 m | 3 | Measured / museum model |
| Iberian carrack / nao | 15th–16th century | 32.30 × 10.50 m | 4.00 m | 3 | Measured / museum model |
| Iberian merchant galleon | 16th–17th century | 30.50 × 10.00 m | 4.10 m | 3 | Measured / museum model |
| Dutch fluyt merchantman | 17th century Atlantic trade | 30.70 × 7.20 m | 2.50 m | 2 | Measured / museum model |
| Mediterranean xebec | 17th–18th century; uncommon Atlantic visitor | 27.00 × 6.20 m | 2.15 m | 3 | Reconstruction / representative estimate |
| Ship’s pinnace | 16th–18th century tender | 9.20 × 2.65 m | 0.72 m | 1 | Reconstruction / representative estimate |

### Design notes and references

#### Caribbean merchant sloop (`sloop`)

**Hull character:** Fine entry, moderately full working body, low quarter, shallow-to-moderate draft.

**Rig:** Single gaff mainsail with headsails; local rigs varied by island and decade.

**Reference assessment:** Reader’s Point, Jamaica: surviving hull length 17.22 m and maximum beam 4.34 m; original rig is not preserved, so the single-mast sail plan is a regional reconstruction.

**Sources:**
- [Texas A&M — Reader’s Point Jamaican merchant sloop](https://oaktrust.library.tamu.edu/items/bfbc382b-2aea-4705-bf65-67e97ec2b87b)
- [Cambridge — Caribbean sloops in Atlantic material culture](https://www.cambridge.org/core/books/an-archaeology-of-the-english-atlantic-world-1600-1700/atlantic-material-culture-boats-ships-and-navigation/6936CAA998793EDC9005054893D500F5)

#### West Indies schooner (`schooner`)

**Hull character:** Long working hull, fine bow, modest counter stern and low deckhouse.

**Rig:** Two fore-and-aft gaff masts with staysails; a fast, manageable trading rig.

**Reference assessment:** Smithsonian HMS Berbice record: typical late-18th-century schooner 72 ft 9 in × 20 ft 8 in (22.17 × 6.30 m).

**Sources:**
- [Smithsonian — Schooner HMS Berbice](https://collections.si.edu/search/detail/edanmdm%3Anmah_844171?print=yes)

#### Brigantine (`brigantine`)

**Hull character:** Balanced single-deck hull with rounded bilges, compact counter and modest quarterdeck.

**Rig:** Square foremast; mainmast with fore-and-aft sail and a square topsail.

**Reference assessment:** Mercurio reconstruction (laid down 1805): approximately 30 m × 8.5 m; the museum describes a two-masted rig with square sails and a large trapezoidal sail.

**Sources:**
- [Museo nazionale di archeologia del mare — Mercurio reconstruction](https://museocaorle.cultura.gov.it/en/oggetti/reconstruction-of-mercury/)

#### Full-rigged brig (`brig`)

**Hull character:** Deep working hull, rounded floor, transom counter and raised quarterdeck.

**Rig:** Two square-rigged masts, with staysails and a spanker aft.

**Reference assessment:** Representative size envelope informed by documented early-19th-century brigs; USS Niagara dimensions are 33.7 m LBP × 9.8 m beam.

**Sources:**
- [Tall Ship Guide — USS Niagara brig dimensions](https://classic-sailing.com/wp-content/uploads/2021/03/Tall-Ship-Guide-Online-Version-22-03-2021.pdf)

#### Snow brig (`snow`)

**Hull character:** Compact two-masted working hull with a rounded bow and low counter stern.

**Rig:** Square fore and main; a separate trysail mast sits immediately abaft the mainmast.

**Reference assessment:** Dimensions are a representative game reconstruction; the defining snow-mast and trysail arrangement follows the Society for Nautical Research description.

**Sources:**
- [Society for Nautical Research — The Snow](https://snr.org.uk/snow/)

#### Caribbean cutter (`cutter`)

**Hull character:** Fine entry, full forefoot, low freeboard, compact counter stern.

**Rig:** Single tall gaff mast with a large headsail spread from a long bowsprit.

**Reference assessment:** Representative cutter reconstruction; dimensions and mast height are game-design estimates for a period coastal vessel.

**Sources:**
- [Royal Museums Greenwich — historical cutter collection records](https://www.rmg.co.uk/collections/objects/search/main)

#### 18th-century frigate (`frigate`)

**Hull character:** Long fine hull, low quarterdeck, pronounced tumblehome and restrained stern gallery.

**Rig:** Three full-rigged masts; low continuous upper profile rather than tall end-castles.

**Reference assessment:** La Renommée (1744) model dimensions: 31.0 m × 6.9 m; three-masted full-rigged arrangement follows the German Historical Museum summary.

**Sources:**
- [Deutsches Historisches Museum — Frigate](https://www.dhm.de/mediathek/en/web/ship-types/milestones-in-the-history-of-european-shipbuilding/12-frigate/)

#### Atlantic barque (`barque`)

**Hull character:** Long cargo hull, full midbody, low working deck and rounded counter.

**Rig:** At least three masts; fore and main square, mizzen fore-and-aft.

**Reference assessment:** Endeavour (1768) reference dimensions: 29.8 m × 8.9 m. This reconstruction uses the defining three-mast barque sail division.

**Sources:**
- [Deutsches Historisches Museum — Barque / Endeavour](https://www.dhm.de/mediathek/en/web/full/ship-types/milestones-in-the-history-of-european-shipbuilding/15-barque/)

#### Atlantic caravel redonda (`caravel`)

**Hull character:** Rounded carvel-built hull, deep bow flare, modest freeboard and narrow transom.

**Rig:** Three masts: square foremast with lateen sails aft; lateen-only variants also existed.

**Reference assessment:** Caravel c. 1450 model at the German Historical Museum: 20.5 m × 7.0 m. The museum describes two- or three-mast variants with square fore and lateen aft sails.

**Sources:**
- [Deutsches Historisches Museum — Caravel](https://www.dhm.de/mediathek/en/ship-types/milestones-in-the-history-of-european-shipbuilding/05-caravel/)
- [The Mariners’ Museum — Caravel](https://exploration.marinersmuseum.org/watercraft/caravel/)

#### Iberian carrack / nao (`carrack`)

**Hull character:** Broad, deep bulbous hull, narrow upper works, high forecastle and tall aftercastle.

**Rig:** Three masts: square fore and main; lateen mizzen.

**Reference assessment:** Carrack c. 1480 model at the German Historical Museum: 32.3 m × 10.5 m; the Mariners’ Museum describes the wide, deep cargo hull and mixed square/lateen three-mast rig.

**Sources:**
- [Deutsches Historisches Museum — Carrack](https://www.dhm.de/mediathek/en/ship-types/milestones-in-the-history-of-european-shipbuilding/07-carrack/)
- [The Mariners’ Museum — Carrack / Nao](https://exploration.marinersmuseum.org/watercraft/carrack-nao/)

#### Iberian merchant galleon (`galleon`)

**Hull character:** Elongated ocean hull, lowered forecastle, pronounced beakhead and stepped sterncastle.

**Rig:** Three masts: square fore and main, lateen mizzen, bowsprit and spritsail.

**Reference assessment:** Santa Maria del Pilar (c. 1535) reference: 30.5 m × 10 m. San Salvador replica measurements provide a second three-mast early-galleon comparison.

**Sources:**
- [Deutsches Historisches Museum — Galleon](https://www.dhm.de/mediathek/en/ship-types/milestones-in-the-history-of-european-shipbuilding/08-galleon/)
- [The Mariners’ Museum — Galleon development and rig](https://exploration.marinersmuseum.org/watercraft/galleon/)
- [Maritime Museum of San Diego — San Salvador dimensions and sail plan](https://sdmaritime.org/visit/the-ships/san-salvador/)

#### Dutch fluyt merchantman (`fluyt`)

**Hull character:** Bulbous capacious lower hull, pinched-in upper deck, round stern and no high forecastle.

**Rig:** Two masts: a square-rigged mainmast and a lateen mizzen, with a spritsail; rig details varied by period.

**Reference assessment:** Zeehaen (1639) model: 30.7 m × 7.2 m; the German Historical Museum notes a long, shallow-draft, bulbous hull narrowing toward the deck.

**Sources:**
- [Deutsches Historisches Museum — Fluyt](https://www.dhm.de/mediathek/en/ship-types/milestones-in-the-history-of-european-shipbuilding/09-fluyt/)
- [The Mariners’ Museum — Fluit cargo vessel](https://exploration.marinersmuseum.org/watercraft/fluit/)

#### Mediterranean xebec (`xebec`)

**Hull character:** Very slender shallow-water hull, overhanging beak, low freeboard and projecting stern platform.

**Rig:** Three long lateen yards; low profile and optional banks of oars.

**Reference assessment:** Dimensions are a game-design estimate. The Channel Islands Maritime Museum documents the narrow hull, projecting head and stern platform, and usual three-lateen-mast family.

**Sources:**
- [Channel Islands Maritime Museum — L’Indiscret xebec](https://maritime-museum.org/north-gallery/lindiscret-xebec/)

#### Ship’s pinnace (`pinnace`)

**Hull character:** Open double-ended tender hull with fine ends, shallow draft and narrow beam.

**Rig:** Open tender with rowing benches and a small removable lateen sail.

**Reference assessment:** Dimensions are a game-design reconstruction for a generic ship’s pinnace; local pinnaces varied considerably.

**Sources:**
- [Royal Museums Greenwich — maritime collection records and boat types](https://www.rmg.co.uk/collections/objects/search/main)

## How to read the evidence

- **Measured reference** means the cited museum, archaeological or documented vessel provides the dimension or model used as the proportional anchor. It does not mean every detail of the 3D model is measured.
- **Reconstruction estimate** means the class, rig or structural characteristics are supported by the cited source, but one or more of the displayed dimensions or detailed rig proportions are a Verdant Reach design estimate.
- A class label never defines one universal hull. For example, a Caribbean sloop could vary significantly with island, owner, purpose and decade.
- A fluyt is included as a North-European Atlantic trade visitor, and the xebec as a Mediterranean vessel that is not typical of Caribbean fleets. Both widen the historical range, but their inclusion is not a claim that they were common Caribbean ship types.
- The caravel and carrack/nao represent earlier Atlantic seafaring roots. The frigate, brig, schooner and cutter represent later 18th-century forms. This is a broad historical catalogue, not a single-period fleet.

## Model construction

- Hulls use a 56-station longitudinal loft with 24 cross-section segments and class-specific entry, fullness, stern, tumblehome, sheer, bow rise and draft controls.
- Decks use a separate cambered surface with plank detailing; keel, strakes, rudder, helm, anchors, bowworks, sternworks and railings are separate named part groups.
- Mast lower sections, topmasts, steps, platforms, yards, booms, gaffs, lateen yards, sails, cloth, sheets, stays, shrouds, ratlines and braces use separate linked groups where the vessel rig calls for them.
- Selected larger period vessels have separately editable closed exterior gunport-shutter details. These are static exterior fittings only; no weapon or firing mechanism is modelled.
- The component tree is hierarchical. Parts can be unlinked while preserving their world transform, relinked, hidden, moved, rotated and reset in Creative mode.
- Component transforms, hidden state, unlink state, sail trim, mast lean and rudder angle are stored in the Creative ship record. Undo/redo applies during the active editor session; it is not intended as a persistent undo journal across page reloads.
- Sail flutter and steering controls animate selected articulated components. This is a visual/gameplay approximation, not a full aerodynamic sail solver or rigging tension simulation.

## Not yet modelled

Verdant Reach v0.8.0 does not implement ship artillery, cannon mechanisms, naval combat, realistic damage, crew manning, tackle simulation, complete sail reefing, or hydrodynamic stability. The visual catalogue focuses on hulls, deckworks, rigging, sailing controls and part-level editing. Some decorative ship details are stylized, and the 3D models are not blueprint-accurate reconstructions.

## Further work

Potential future additions include more regional types (ketch, barkentine, pink, shallop, longboat, packet, bomb vessel, East Indiaman), dated regional variants, richer deck plans, crew stations, and reference-quality model validation against full surviving lines plans where those are available.


## v0.8.3 structural blueprint method

Each catalogue vessel now has its own entry in `ship-structures.js`. These are not one universal skeleton scaled to fit every hull. A blueprint records a vessel-specific maximum-beam station, forebody and aftbody taper, bow/stern end shape, bottom flatness, bilge fullness, flare, tumblehome, sheer character, frame count and rigging proportions. The geometry functions are shared, but the inputs and resulting structural layout differ by vessel.

The hull loft now samples 72 longitudinal stations and 28 points around each cross-section. The cross-section function shapes bottom flatness, bilge fullness, topside flare and tumblehome. Named transverse frame groups and a keelson are separate editable parts; hiding the outer hull exposes the internal frame arrangement for inspection. These frames are visual structural elements, not a full scantling or shipwright construction plan.

Sail groups expose a per-mast deployment state: full, reefed or furled. The cloth groups scale smoothly between those states, and the state is stored in Creative ship saves. This is an animation-ready visual approximation; it does not simulate canvas tension, reefing lines, blocks, or aerodynamic forces.

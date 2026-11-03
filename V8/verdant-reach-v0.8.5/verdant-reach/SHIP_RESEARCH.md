# Verdant Reach v0.8.5 — ship design research

## Scope

This document records the reference basis for the original v0.8.5 procedural fleet. The design target is a varied sailing collection with recognisable period hull lines, vessel-specific proportions and independently editable anatomy.

The Pirate: Plague of the Dead is a broad visual reference. Its developer page describes unlockable unique ships, but does not publish a complete ship roster or technical drawing set. Public App Store version notes mention the premium Chinese Junk “Executor”; that establishes a Chinese junk family as a relevant reference, not the exact shape or dimensions of that game model. Verdant Reach creates its own hulls, sails, rigs and component arrangements.

## Scale

- All catalogue dimensions are expressed in metres.
- Rendering conversion is 1 metre = 4/3 world units.
- The player reference height remains 1.8 m / 2.4 world units.
- Published dimensions and reconstruction estimates are labelled separately in each design record.

## Catalogue overview

| Family | Hull length | Beam | Draft | Rig family | Evidence basis |
|---|---:|---:|---:|---|---|
| Caribbean merchant sloop | 17.22 m | 4.34 m | 1.90 m | Gaff | Archaeological dimensions; rig reconstruction |
| West Indies schooner | 22.17 m | 6.30 m | 2.25 m | Two gaff masts | Museum record |
| Brigantine | 30.00 m | 8.50 m | 3.15 m | Square / gaff | Reconstruction informed by museum vessel |
| Full-rigged brig | 33.70 m | 9.75 m | 3.70 m | Two square masts | Representative documented class envelope |
| Snow brig | 28.50 m | 7.80 m | 3.00 m | Square with auxiliary trysail | Representative dimensions; rig history reference |
| Caribbean cutter | 16.80 m | 5.10 m | 2.00 m | Gaff and headsails | Representative reconstruction |
| 18th-century frigate | 31.00 m | 6.90 m | 3.50 m | Three square masts | Museum model |
| Atlantic barque | 29.80 m | 8.90 m | 3.50 m | Square fore and main; fore-and-aft mizzen | Museum model |
| Atlantic caravel redonda | 20.50 m | 7.00 m | 2.40 m | Square and lateen | Museum model |
| Iberian carrack / nao | 32.30 m | 10.50 m | 4.00 m | Square and lateen | Museum model |
| Iberian merchant galleon | 30.50 m | 10.00 m | 4.10 m | Square and lateen | Museum model |
| Dutch fluyt merchantman | 30.70 m | 7.20 m | 2.50 m | Square and lateen | Museum model |
| Mediterranean xebec | 27.00 m | 6.20 m | 2.15 m | Three lateen masts | Representative reconstruction |
| Chinese ocean junk | 34.00 m | 8.80 m | 2.45 m | Three battened lug sails | Game-scale estimate; museum model informs form and rig |
| First-rate ship of the line | 68.88 m | 15.79 m | 5.90 m | Three square masts | HMS Victory length/beam reference; draft estimate |
| Ship's pinnace | 9.20 m | 2.65 m | 0.72 m | Small lateen sail / oars | Representative reconstruction |

## Additional v0.8.5 families

### Chinese ocean junk

The design uses a broad and relatively flat-bottomed hull, pronounced rocker toward both ends, raised bow and stern, an overhanging weather deck, and a large central rudder silhouette. The rig uses heavy masts and broad battened lug sails, with independently named battens and sheet groups. This is a generic historical reconstruction, not a copy of the “Executor” model.

Reference notes:
- Royal Museums Greenwich records a three-masted Chinese pole junk model with set rectangular sails: [collection record](https://www.rmg.co.uk/collections/objects/rmgc-object-68643).
- The Channel Islands Maritime Museum describes characteristic flat-bottomed, rockered junk hulls, deck overhangs, heavy masts and balanced rudders: [Chinese Junk](https://maritime-museum.org/north-gallery/chinese-junk/).
- The public App Store history records a premium Chinese Junk named “Executor” in an update to The Pirate: Plague of the Dead: [App Store version history](https://apps.apple.com/in/app/the-pirate-plague-of-the-dead/id1242811938).

The 34.0 × 8.8 m dimensions in Verdant Reach are reconstruction values and are not asserted to be the dimensions of Executor.

### First-rate ship of the line

The first-rate model uses HMS Victory as an individual dimensional anchor, not as a universal blueprint for every ship in the class. The length and maximum beam are taken from published reference records; draft, freeboard, mast heights and detailed hull offsets remain game reconstruction estimates.

Reference notes:
- National Historic Ships records HMS Victory's construction, three masts and overall length: [HMS Victory](https://www.nationalhistoricships.org.uk/register/499/hms-victory).
- The published 51 ft 10 in beam is cross-checked against the corresponding metric value: [Guinness World Records](https://www.guinnessworldrecords.com/world-records/62817-widest-sailing-ship-in-service).

## Existing catalogue sources

- Sloop — [Texas A&M, Reader's Point Jamaican merchant sloop](https://oaktrust.library.tamu.edu/items/bfbc382b-2aea-4705-bf65-67e97ec2b87b).
- Schooner — [Smithsonian, HMS Berbice](https://collections.si.edu/search/detail/edanmdm%3Anmah_844171?print=yes).
- Brigantine — [Museo nazionale di archeologia del mare, Mercurio reconstruction](https://museocaorle.cultura.gov.it/en/oggetti/reconstruction-of-mercury/).
- Brig — [Tall Ship Guide, USS Niagara dimensions](https://classic-sailing.com/wp-content/uploads/2021/03/Tall-Ship-Guide-Online-Version-22-03-2021.pdf).
- Snow — [Society for Nautical Research, The Snow](https://snr.org.uk/snow/).
- Cutter — [Royal Museums Greenwich collection search](https://www.rmg.co.uk/collections/objects/search/main).
- Frigate — [Deutsches Historisches Museum, Frigate](https://www.dhm.de/mediathek/en/web/ship-types/milestones-in-the-history-of-european-shipbuilding/12-frigate/).
- Barque — [Deutsches Historisches Museum, Barque / Endeavour](https://www.dhm.de/mediathek/en/web/full/ship-types/milestones-in-the-history-of-european-shipbuilding/15-barque/).
- Caravel — [Deutsches Historisches Museum, Caravel](https://www.dhm.de/mediathek/en/ship-types/milestones-in-the-history-of-european-shipbuilding/05-caravel/) and [The Mariners' Museum](https://exploration.marinersmuseum.org/watercraft/caravel/).
- Carrack — [Deutsches Historisches Museum, Carrack](https://www.dhm.de/mediathek/en/ship-types/milestones-in-the-history-of-european-shipbuilding/07-carrack/) and [The Mariners' Museum](https://exploration.marinersmuseum.org/watercraft/carrack-nao/).
- Galleon — [Deutsches Historisches Museum, Galleon](https://www.dhm.de/mediathek/en/ship-types/milestones-in-the-history-of-european-shipbuilding/08-galleon/) and [The Mariners' Museum](https://exploration.marinersmuseum.org/watercraft/galleon/).
- Fluyt — [Deutsches Historisches Museum, Fluyt](https://www.dhm.de/mediathek/en/ship-types/milestones-in-the-history-of-european-shipbuilding/09-fluyt/) and [The Mariners' Museum](https://exploration.marinersmuseum.org/watercraft/fluit/).
- Xebec — [Channel Islands Maritime Museum, L'Indiscret](https://maritime-museum.org/north-gallery/lindiscret-xebec/).
- Pinnace — [Royal Museums Greenwich collection search](https://www.rmg.co.uk/collections/objects/search/main).

## v0.8.5 construction method

- Hull shell: 96 longitudinal stations and 40 cross-section points, with class-specific beam taper, floor flatness, bilge fullness, flare, tumblehome, sheer and end rise.
- Deck: a separate cambered loft, with independent deck-seam groups.
- Structure: an independent transverse frame group per station, a keel group and a shaped stem/stern post.
- Stern: each raised tier is its own curved loft group; transom and side windows, gallery rails and posts are separate groups.
- Sail rigs: square yards, gaff spars, lateen yards and Chinese junk battens are independently addressable.
- Controls: linked/unlinked hierarchy, visibility, six-axis component transforms, sail trim, deployment and mast lean are saved with the vessel.

These are animation-ready and editor-friendly game models. They are not complete shipwright plans, structural scantlings or physically simulated sailing vessels.

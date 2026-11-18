# Wargalion V2 — hull and castle refinement

Wargalion V2 is a parallel reconstruction. The existing Wargalion V1 folder is preserved.

## Current stage

- Shared PCHIP hull surface; the lower shell now meets the keel datum.
- Stronger sheer and separate forward and aft rake, with a tapered run toward the stern.
- Independently editable port/starboard hull skins and longitudinal wale bands.
- Raised forecastle platform with separate low timber bulwarks.
- Three narrowing aftercastle levels, with inward-tapered timber side walls, separate vertical framing, string courses, side and aft-facing windows, deck-like upper surfaces, and projecting stern galleries.
- No masts, sails, standing rigging, running rigging, rudder, or deck armament at this stage.

## Geometry authority

`architecture/hull-surface.js` is the sole hull-form authority. Hull skins, wale bands, stem, keel, decks and cabin station geometry must sample this evaluator rather than invent separate hull curves.

The surface uses shape-preserving PCHIP cubic Hermite interpolation. It is C1-continuous at the interpolation knots; it is not a measured CAD surface or an archival offsets table.

## Research and uncertainty

The Shipmodell San Martín 1580 reproduced sheet provides a named-ship comparison with side, stern/bow and section views. Pinterest galleon plan images were also checked for comparative side profiles, deck outlines and frame sections. These general Pinterest examples are not claimed to depict San Martín and are not used as measured offsets.

The Spanish naval-periodical account reports approximately 39 × 11.7 m for the modelled San Martín, while another secondary source gives different figures. The working dimensions and all station offsets remain explicitly provisional until a traceable, calibrated plan is available.

The revised aftercastle is a visual reconstruction hypothesis, not a verified copy of a single ship's architectural plan. Inspect side, bow, stern and top camera views before treating the proportions as accepted.

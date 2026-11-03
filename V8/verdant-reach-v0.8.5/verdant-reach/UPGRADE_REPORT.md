# Verdant Reach v0.8.5 — upgrade report

## Changes

- Created a separate v0.8.5 snapshot directory from the v0.8.4 populated-settlements branch.
- Replaced the ship builder and vessel geometry pipeline with a new high-resolution, station-based hull generator.
- Added independent structural profiles for 16 catalogue families.
- Added a dedicated Chinese junk rig with separated sails, battens, yards and sheet groups.
- Added a first-rate hull reference based on HMS Victory's published overall dimensions.
- Rebuilt stern structures as curved, separately editable tiers with window and gallery components.
- Preserved Creative ship state, hierarchy operations, transform controls, sail controls and old save aliases.
- Added a validation-only GitHub Actions workflow. It runs tests and a production build without publishing to GitHub Pages.

## Validation

The v0.8.5 automated tests and production build are pending GitHub Actions execution. No manual visual acceptance is claimed in this report.

## Accuracy note

The new models are original procedural reconstructions. Published dimensions are retained where supported; unrecorded dimensions and geometry details are estimates. The current 16-family catalogue is not verified as a complete inventory of every reference-game ship.

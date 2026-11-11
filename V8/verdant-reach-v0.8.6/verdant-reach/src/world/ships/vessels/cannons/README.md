# Shared ship cannons

This directory is the fleet-wide home for reusable cannon models.

## Current state

No cannon model is implemented here yet. The ship-specific cannon barrels and carriage assemblies have been removed from the vessel generators. The vessel-specific gunport openings and their framing remain part of each hull/deck fitting layout.

## Planned module boundary

The next cannon implementation should be built here once and reused by every vessel. Keep model concerns separate:

- **Cannon model:** barrel, muzzle, breech, cascabel, trunnions and fittings.
- **Carriage:** cheeks, axle, wheels, bed, quoin/elevation support and rope fittings.
- **Mounting interface:** a stable local origin, barrel direction, elevation pivot and mounting dimensions.
- **Vessel placement:** each ship may later define its own cannon positions, sizes and deck/battery levels, but must import the shared model rather than generate duplicate cannon geometry.

The shared model must remain an independent editable component when attached to a ship. Do not put vessel-specific geometry back into `generators/deck-equipment/fittings-generator.js`.

## Coordinate convention

Follow the parent vessel's coordinates: forward `-Z`, aft `+Z`, port `-X`, starboard `+X`, up `+Y`. A cannon's public mounting origin and barrel-forward axis should be documented explicitly when the model is implemented.

Keep this directory free of vessel hull, gunport or ship-specific placement code.

# Shared cannon generator

This is the fleet-wide, non-functional visual cannon asset. It is not a simulation of a working weapon.

## Blueprint interpretation

The supplied sheet contains three barrel size profiles (36-, 18- and 9-pounder) and multiple carriage orthographic views. The generator offers those three selectable exterior profiles from one reusable module. Visible shapes and proportions are reconstructed from the drawings. Unshown carriage dimensions are visual estimates.

## Part-by-part folders

- `profiles/`: selectable exterior size profiles.
- `barrel/body/`: solid turned barrel silhouette.
- `barrel/muzzle/`: solid sealed face and outer moulding; no bore.
- `barrel/reinforcement-rings/`: separate decorative bands.
- `barrel/trunnions/`: separate port and starboard exterior studs.
- `barrel/cascabel/`: decorative breech finial.
- `carriage/cheeks/`: shaped port and starboard wooden cheeks.
- `carriage/bed/`: fixed bed and saddle.
- `carriage/transoms/`: fore and aft cross timbers.
- `carriage/axles/`: static display axles.
- `carriage/wheels/`: four separate detailed wheel components.
- `carriage/hardware/`: visible decorative strapping and fasteners.
- `assembly/`: combines the part generators in a stable order.

Every top-level assembly part is a registered editor component and supports the shared ship-editor transform, hide, detach/relink and reset API.

## Coordinates

Forward / muzzle: `-Z`; aft / breech: `+Z`; port: `-X`; starboard: `+X`; up: `+Y`. The origin is at the centre of the carriage footprint at ground level.

## Use

`createCannonModel('18-pounder')` creates the default display model. Supported IDs are `36-pounder`, `18-pounder` and `9-pounder`.

Cannon placement on individual vessels is intentionally separate from this shared asset. That fleet-wide placement pass can import this generator later.

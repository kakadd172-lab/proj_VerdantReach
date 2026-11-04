# Modular ship system

## Layout

```text
ships/
├── index.js                 # Runtime generator registry / createShip()
├── vessels/
│   ├── index.js              # Specification registry
│   ├── freeze.js             # Deep-freeze helper
│   ├── sloop.js
│   ├── schooner.js
│   ├── brigantine.js
│   ├── brig.js
│   ├── snow.js
│   ├── cutter.js
│   ├── frigate.js
│   ├── barque.js
│   ├── caravel.js
│   ├── carrack.js
│   ├── galleon.js
│   ├── fluyt.js
│   ├── xebec.js
│   ├── junk.js
│   ├── first-rate.js
│   └── pinnace.js
└── core/
    ├── ship-designs.js
    ├── ship-structures.js
    ├── ship-hull-parameterization.js
    └── ship-model-builder.js
```

Each `vessels/<id>.js` file owns the design data, structural profile and its own generator entry point. The shared builder supplies the reusable Three.js geometry and component API.

## Runtime

- Existing game code may continue importing from `src/world/ship-designs.js`, `ship-structures.js`, `ship-hull-parameterization.js` and `ship-models.js`.
- New code should use `createShip(type)` from `src/world/ships/index.js` when creating a vessel through its dedicated generator.
- `createShip('galleon')` and `createShip('ship-galleon')` are both accepted.
- The registry throws a descriptive error for an unregistered vessel rather than silently creating a generic ship.

## Add a vessel

1. Add one new vessel module in `vessels/`.
2. Export a frozen specification with `id`, `design`, `structure`, and `generate(createShipModel)`.
3. Register it in `vessels/index.js`.
4. Add a test that checks its parts, rig, and unique generator output.

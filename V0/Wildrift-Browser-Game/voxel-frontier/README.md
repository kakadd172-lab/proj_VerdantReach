# Wildrift — A Living Voxel World

A playable, Minecraft-inspired first-person voxel sandbox that runs in a modern desktop browser.

## Quick start (Windows)

1. Extract `voxel-frontier.zip` to a normal folder.
2. Double-click **`start.bat`**.
3. Your browser opens at `http://127.0.0.1:8000`.
4. Enter a seed and choose **ENTER WORLD**.

Keep the small server window open while you play. Close that window to stop the local server.

### Do I need to install anything?

- **No Node.js, npm, build tools, or game engine are needed.**
- A local run needs **Python 3** so the browser can load the game's JavaScript modules. Many systems already have it. If `start.bat` says Python was not found, install Python 3 from <https://www.python.org/downloads/> and enable **Add Python to PATH** during setup.
- The Three.js renderer is loaded from jsDelivr, so the first launch needs an internet connection.
- Alternatively, the folder can be deployed to any static HTTPS host (for example, GitHub Pages); then you do not need Python on the playing device.

## Controls

| Input | Action |
|---|---|
| WASD | Move |
| Mouse | Look around |
| Space | Jump |
| Shift | Sprint |
| Left click | Mine the targeted block |
| Right click | Place the selected block |
| 1–9 | Select hotbar slot |
| E | Open / close inventory |
| Escape | Pause / resume |

Click the 3D world once if the browser does not capture the mouse immediately after entering.

## Included systems

- **Chunked world:** 16×16 horizontal chunks, streamed around the player and unloaded outside the active range.
- **Background generation:** module web workers generate chunks; a main-thread fallback is included for browsers that do not support workers.
- **Deterministic terrain:** seeded global-coordinate noise, domain warping, multi-octave FBM, height fields, climate fields, erosion/ridge signals, river channels, lake basins, and cave carving.
- **Biomes:** plains, forests, dense forests, jungle, desert, savanna, snowy forest, snowy mountains, swamps, beaches, oceans, flower fields, and highlands.
- **Environment:** trees, snow trees, cacti, mushrooms, flowers, shrubs, stone clusters, fallen logs, surface water, cave pools, a sky shader, fog, lighting, and a day/night cycle.
- **Voxel rendering:** one combined mesh per chunk, exposed-face culling, separate water geometry, and automatic geometry disposal when chunks unload.
- **Gameplay:** first-person movement, jumping, sprinting, gravity, voxel collision, raycast mining/placement, and an inventory-backed hotbar.
- **Persistence:** IndexedDB saves the seed, player position/look, selected slot, inventory, settings, and changed blocks. The game autosaves periodically and also saves on pause/visibility change.

## Project layout

```text
voxel-frontier/
├── index.html
├── style.css
├── start.bat
├── start.sh
├── THIRD_PARTY_NOTICES.md
├── TEST-REPORT.txt
└── src/
    ├── main.js
    ├── player/
    │   ├── controller.js
    │   ├── interactions.js
    │   └── raycast.js
    ├── systems/
    │   ├── environment.js
    │   ├── lighting.js
    │   ├── renderer.js
    │   └── storage.js
    ├── ui/
    │   └── interface.js
    └── world/
        ├── biomes.js
        ├── blocks.js
        ├── chunk-worker.js
        ├── chunk.js
        ├── generator.js
        ├── noise.js
        ├── terrain.js
        └── world.js
```

## Notes on this first playable build

This is a compact sandbox implementation rather than a feature-for-feature Minecraft clone. World height is bounded to 80 blocks while the horizontal world is unbounded in practice. Rivers and lakes are deterministic terrain-and-water features, not a fluid simulation. Chunk meshes use combined exposed faces (not full greedy-quad merging). The game is designed to be extended: block IDs, generation rules, biomes, and the chunk pipeline are separated into modules.

## Optional generator check (maintainers)

With Node.js installed, run `node tests/generator-smoke.mjs` from this folder. This checks deterministic chunk output, seed variation, and biome coverage. Node.js is **not** required to play.

## Troubleshooting

- A blank page usually means the CDN could not be reached; check the internet connection and reload.
- Do not open `index.html` by double-clicking it. Use `start.bat` / `start.sh` or a static web host so JavaScript modules and workers load correctly.
- If the local port is busy, close another process using port 8000 or change `8000` in the start script and visit the matching localhost address.
- Saves are local to the browser profile and origin. Clearing site data or switching browsers removes access to those local saves.

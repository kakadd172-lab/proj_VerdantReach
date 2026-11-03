# Verdant Reach — Early Explorer Build

An original, non-voxel, browser-based fantasy exploration RPG prototype built with Three.js. The current build establishes the playable world-generation and exploration foundation: deterministic terrain, streaming chunks, a free-orbit isometric camera, gathering, waystone discovery, a small quest progression loop, and persistent saves.

## Run locally

Requirements: Node.js 20.19+ (or 22.12+) and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

**No npm setup:** on Windows, double-click `run-static.bat`, then open `http://localhost:8000`. This static-server option loads Three.js r187 from jsDelivr, so it requires an internet connection.

To create a production build:

```bash
npm run build
npm run preview
```

## Controls

| Input | Action |
|---|---|
| `W A S D` / arrow keys | Move relative to the camera |
| `Shift` | Run while stamina remains |
| Mouse drag | Rotate camera through 360° |
| Mouse wheel | Zoom |
| `E` | Gather nearby moonleaf or attune to a nearby waystone |
| `F` | Send a resonance pulse to a discovered-nearby waystone |
| `I` / `Tab` | Inventory |
| `J` | Journey journal |
| `M` | World chart |
| `Esc` | Pause or close a panel |

## Architecture

- `src/world/noise.js` — seeded gradient Perlin noise, fBm, ridged fBm, domain warping.
- `src/world/terrain.js` — global continuous terrain and climate sampler; the generation version is stored with saves.
- `src/world/chunk.js` — continuous terrain meshes, matching edge samples, finite-difference normals, instanced vegetation and rocks, water, collectibles, and waystones.
- `src/world/world-manager.js` — deterministic chunk coordinates, distance-prioritized streaming queue, unloading, floating-origin rebasing for large coordinates, and nearby interactions.
- `src/entities/player.js` — camera-relative movement, terrain following, and a stylized 3D traveller.
- `src/systems/rpg.js` — character progression, inventory, quest threads, and waystone discovery.
- `src/systems/persistence.js` — IndexedDB saves with localStorage fallback.
- `src/ui/interface.js` — main menu, HUD, inventory, journal, world chart, pause screen, and notifications.

## Current scope

This is the first playable vertical slice, not the complete final RPG described in the project brief. It has real deterministic chunk streaming and a small working progression loop, but does not yet include the later-stage systems: river-network hydrology, full climate/season simulation, settlements and roads, boats/carts, autonomous NPC schedules, creature AI, dungeons, crafting/trading, combat, or a damage/health gameplay loop. The health values are retained in the character-save schema for later RPG expansion, but no inactive health bar is shown in this build. Those should be implemented as separate systems while preserving the world-generation contracts already established here.

The current world uses a deterministic regional climate approximation and continuous continent-to-local height layers. It is effectively unbounded in coordinates, but it is not yet a fully simulated planet with physically simulated plate tectonics or erosion.

# Experimental ship redesign candidate

This folder is isolated from the actual game. The main v0.8.5 app does not import these files.

## Contents
- Four candidate ship modules: designs, hull parameterization, structure profiles and model generation.
- `index.html` and `preview.js`: a standalone interactive Three.js viewer for all 16 ship types.
- `tests/ship-redesign.test.js`: candidate geometry and integration checks.

## Run locally (Node.js 22+)
```powershell
cd D:\Projects\VerdantReach\ForTests
npm install
npm test
npm run build
npm run dev
```
Open the local Vite address (normally `http://127.0.0.1:5174/`). Select ships, drag to orbit, scroll to zoom and reset the camera to reframe.

Do not integrate these files into the game until candidate tests pass and all vessels have been visually reviewed.

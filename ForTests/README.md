# Experimental ship redesign / Ship Design Studio

This folder is isolated from the actual game. The main v0.8.5 app does not import these files.

## Contents
- Candidate modules for ship designs, hull parameterization, structure profiles and model generation.
- A standalone Three.js Ship Design Studio for all 16 vessel types.
- Component selection by list or by clicking the model.
- Move / Rotate / Scale gizmos, numeric transforms, hull and structure parameter controls.
- Undo / redo, component reset, local save to `design-overrides.json`, and JSON export.
- `tests/ship-redesign.test.js`: geometry and integration checks.

## Run locally (Node.js 22+)

```powershell
cd D:\Projects\VerdantReach\ForTests
npm install
npm test
npm run build
npm run dev
```

Open the local Vite address (normally `http://127.0.0.1:5174/`).

## Editing workflow

1. Select a vessel.
2. Select a component from the list or click it in the 3D viewport.
3. Choose Move, Rotate or Scale and manipulate the gizmo.
4. Adjust numeric component transforms or design parameters in the right panel.
5. Use Undo / Redo to review changes.
6. Press **Save to ForTests** to write `design-overrides.json` through the local Vite development server, or **Export JSON** to save a backup.

The current studio release edits whole registered components and parametric dimensions/profile values. Hull surface control-point sculpting is a planned next stage. Do not integrate these experimental files into the main game until visually reviewed.

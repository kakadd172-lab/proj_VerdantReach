# Experimental ship redesign / Ship Design Studio

This folder is isolated from the actual game. The main v0.8.5 app does not import these files.

## Studio features
- All 16 candidate vessel designs.
- Component selection from the list or by clicking the 3D model.
- Move, Rotate and Scale gizmos, with numeric transform fields.
- Local / World transform space and optional translation, rotation and scale snapping.
- Search components, hide / show, isolate, show all, detach and relink components.
- Reset one component, reset all components, or restore the selected vessel to its catalogue design.
- One document-wide Undo / Redo history across component edits, parameter edits and vessel switches.
- Frame selected component, fit ship, and Top / Side / Bow / Stern camera presets.
- Wireframe, grid and shadow display toggles for visual inspection.
- Editable hull dimensions and parametric structure controls.
- Save to local `design-overrides.json` through the Vite dev server or export a JSON backup.
- Geometry tests and a Playwright Chromium smoke test for the interactive editor.

## Run locally (Node.js 22+)

```powershell
cd D:\Projects\VerdantReach\ForTests
npm install
npm test
npm run build
npm run smoke
npm run dev
```

Open `http://127.0.0.1:5174/`.

## Editing workflow

1. Select a vessel and choose a component from the list or click it in the viewport.
2. Use W / E / R for Move / Rotate / Scale; use F to frame the selected component.
3. Adjust numeric transforms or parametric hull / structure values.
4. Use Ctrl+Z / Ctrl+Y for document-wide Undo / Redo. The history follows edits across vessel switches.
5. Use Reset component, Reset all components, or Reset vessel design as appropriate.
6. Save to write `design-overrides.json`, or export a JSON backup.

This release edits whole registered components and parametric design values. Direct hull surface control-point sculpting remains a planned next stage. Do not integrate these experimental files into the main game until visually reviewed.

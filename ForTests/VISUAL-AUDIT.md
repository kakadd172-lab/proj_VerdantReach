# Ship visual audit

Run `npm run visual-audit` to start the Vite editor in headless Chromium and capture all 16 registered ships. The output is written to `visual-audit/` as PNG screenshots plus `report.json`.

The v0.8.8 GitHub Actions workflow also runs module verification, unit/integration tests, production build, browser smoke tests, and this render pass. The uploaded artifact is named `verdantreach-v088-ship-renders`.

The audit is a geometry-review aid, not a substitute for checking historically accurate vessel references or inspecting the models interactively.

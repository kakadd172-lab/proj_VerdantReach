import { defineConfig } from 'vite';

// GitHub Pages serves this project beneath /proj_VerdantReach/.
// run-static.bat serves the unbundled source locally and is unaffected.
export default defineConfig({
  base: '/proj_VerdantReach/',
});

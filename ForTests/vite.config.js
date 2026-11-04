import { defineConfig } from 'vite';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const allowedShips = new Set([
  'sloop','schooner','brigantine','brig','snow','cutter','frigate','barque',
  'caravel','carrack','galleon','fluyt','xebec','junk','first-rate','pinnace'
]);

function shipEditorSavePlugin() {
  return {
    name: 'verdant-reach-ship-editor-save',
    configureServer(server) {
      server.middlewares.use('/__ship-editor/save', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }
        try {
          let body = '';
          for await (const chunk of req) {
            body += chunk;
            if (body.length > 1024 * 1024) throw new Error('Save payload exceeds 1 MB');
          }
          const payload = JSON.parse(body || '{}');
          if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Invalid design configuration');
          const clean = {};
          for (const [shipId, config] of Object.entries(payload)) {
            if (!allowedShips.has(shipId) || !config || typeof config !== 'object' || Array.isArray(config)) {
              throw new Error('Invalid vessel configuration: ' + shipId);
            }
            const transforms = config.componentTransforms || {};
            if (typeof transforms !== 'object' || Array.isArray(transforms)) throw new Error('Invalid component transforms');
            for (const [partName, transform] of Object.entries(transforms)) {
              if (!/^[a-z0-9-]+$/i.test(partName) || !transform || typeof transform !== 'object') throw new Error('Invalid component transform');
              for (const key of ['x','y','z','rx','ry','rz','sx','sy','sz']) {
                if (transform[key] !== undefined && !Number.isFinite(transform[key])) throw new Error('Invalid transform value');
              }
            }
            clean[shipId] = config;
          }
          const destination = path.join(server.config.root, 'design-overrides.json');
          await fs.writeFile(destination, JSON.stringify(clean, null, 2) + '\n', 'utf8');
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ saved: true, ships: Object.keys(clean).length }));
        } catch (error) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: error.message }));
        }
      });
    }
  };
}

export default defineConfig({
  base: './',
  // Share exactly one Three.js instance between the preview, controls and models.
  resolve: { dedupe: ['three'] },
  optimizeDeps: { include: ['three'], force: true },
  plugins: [shipEditorSavePlugin()],
  server: { host: '127.0.0.1', port: 5174, strictPort: true }
});

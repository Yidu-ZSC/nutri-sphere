import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Connect, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const SEED_FILE = 'data/seed_triples_v0.3_aligned.json';

function isSeedRequest(url: string | undefined): boolean {
  if (!url) return false;
  const pathname = url.split('?')[0] ?? '';
  return pathname === `/${SEED_FILE}` || pathname.endsWith(`/${SEED_FILE}`);
}

/** Serve and publish the repo seed file without copying it into `public/`. */
function nutriSeedPlugin(): Plugin {
  const seedPath = path.resolve(SEED_FILE);
  const attach = (middlewares: Connect.Server) => {
    middlewares.use((req, res, next) => {
      if (!isSeedRequest(req.url)) {
        next();
        return;
      }
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      fs.createReadStream(seedPath).pipe(res);
    });
  };

  return {
    name: 'nutri-seed-data',
    configureServer(server) {
      attach(server.middlewares);
    },
    configurePreviewServer(server) {
      attach(server.middlewares);
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: SEED_FILE,
        source: fs.readFileSync(seedPath),
      });
      this.emitFile({
        type: 'asset',
        fileName: '.nojekyll',
        source: '',
      });
    },
  };
}

export default defineConfig({
  // Relative base so GitHub Pages project sites and local previews share one build.
  base: './',
  plugins: [react(), nutriSeedPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
});

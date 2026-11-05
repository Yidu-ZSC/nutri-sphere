import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Connect, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const SEED_FILE = 'data/seed_triples_v0.3_aligned.json';
const SOURCES_FILE = 'data/sources.json';
const ADMIN_BOOKS_FILE = 'data/admin_books.json';

function isDataRequest(url: string | undefined, fileName: string): boolean {
  if (!url) return false;
  const pathname = url.split('?')[0] ?? '';
  return pathname === `/${fileName}` || pathname.endsWith(`/${fileName}`);
}

/** Serve and publish seed + sources JSON without copying into `public/`. */
function nutriSeedPlugin(): Plugin {
  const seedPath = path.resolve(SEED_FILE);
  const sourcesPath = path.resolve(SOURCES_FILE);
  const adminBooksPath = path.resolve(ADMIN_BOOKS_FILE);
  const attach = (middlewares: Connect.Server) => {
    middlewares.use((req, res, next) => {
      let filePath: string | null = null;
      if (isDataRequest(req.url, SEED_FILE)) filePath = seedPath;
      else if (isDataRequest(req.url, SOURCES_FILE)) filePath = sourcesPath;
      else if (isDataRequest(req.url, ADMIN_BOOKS_FILE)) filePath = adminBooksPath;
      if (!filePath) {
        next();
        return;
      }
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      fs.createReadStream(filePath).pipe(res);
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
        fileName: SOURCES_FILE,
        source: fs.readFileSync(sourcesPath),
      });
      this.emitFile({
        type: 'asset',
        fileName: ADMIN_BOOKS_FILE,
        source: fs.readFileSync(adminBooksPath),
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

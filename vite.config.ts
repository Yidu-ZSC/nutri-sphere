import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, type Connect, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const SEED_FILE = 'data/seed_triples_v0.3_aligned.json';
const SOURCES_FILE = 'data/sources.json';
const ADMIN_BOOKS_FILE = 'data/admin_books.json';
const WEREAD_DIR = 'data/weread';
const CANDIDATES_DIR = 'data/candidates';

function isDataRequest(url: string | undefined, fileName: string): boolean {
  if (!url) return false;
  const pathname = url.split('?')[0] ?? '';
  return pathname === `/${fileName}` || pathname.endsWith(`/${fileName}`);
}

function listWereadJsonFiles(): string[] {
  const abs = path.resolve(WEREAD_DIR);
  if (!fs.existsSync(abs)) return [];
  return fs
    .readdirSync(abs)
    .filter((name) => name.endsWith('.json'))
    .map((name) => path.join(WEREAD_DIR, name));
}

function listCandidateFiles(dir: string = CANDIDATES_DIR, acc: string[] = []): string[] {
  const abs = path.resolve(dir);
  if (!fs.existsSync(abs)) return acc;
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) listCandidateFiles(rel, acc);
    else if (entry.isFile()) acc.push(rel);
  }
  return acc;
}

/** Serve and publish seed + sources + admin + weread JSON without copying into `public/`. */
function nutriSeedPlugin(): Plugin {
  const seedPath = path.resolve(SEED_FILE);
  const sourcesPath = path.resolve(SOURCES_FILE);
  const adminBooksPath = path.resolve(ADMIN_BOOKS_FILE);
  const wereadAbs = path.resolve(WEREAD_DIR);
  const candidatesAbs = path.resolve(CANDIDATES_DIR);
  const attach = (middlewares: Connect.Server) => {
    middlewares.use((req, res, next) => {
      let filePath: string | null = null;
      if (isDataRequest(req.url, SEED_FILE)) filePath = seedPath;
      else if (isDataRequest(req.url, SOURCES_FILE)) filePath = sourcesPath;
      else if (isDataRequest(req.url, ADMIN_BOOKS_FILE)) filePath = adminBooksPath;
      else if (req.url) {
        const pathname = (req.url.split('?')[0] ?? '').replace(/^\//, '');
        if (pathname.startsWith(`${WEREAD_DIR}/`) && pathname.endsWith('.json')) {
          const candidate = path.resolve(pathname);
          if (candidate.startsWith(wereadAbs + path.sep) && fs.existsSync(candidate)) {
            filePath = candidate;
          }
        } else if (pathname === `${CANDIDATES_DIR}/index.json` || pathname.startsWith(`${CANDIDATES_DIR}/`)) {
          const candidate = path.resolve(pathname);
          if (
            (candidate === candidatesAbs || candidate.startsWith(candidatesAbs + path.sep)) &&
            fs.existsSync(candidate) &&
            fs.statSync(candidate).isFile()
          ) {
            filePath = candidate;
          }
        }
      }
      if (!filePath) {
        next();
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const type =
        ext === '.md'
          ? 'text/markdown; charset=utf-8'
          : ext === '.json'
            ? 'application/json; charset=utf-8'
            : 'text/plain; charset=utf-8';
      res.setHeader('Content-Type', type);
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
      for (const rel of listWereadJsonFiles()) {
        this.emitFile({
          type: 'asset',
          fileName: rel,
          source: fs.readFileSync(path.resolve(rel)),
        });
      }
      for (const rel of listCandidateFiles()) {
        this.emitFile({
          type: 'asset',
          fileName: rel,
          source: fs.readFileSync(path.resolve(rel)),
        });
      }
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

// Serves the Flutter web build (build/web) and proxies /api to the Performa-COS FastAPI backend,
// so the app can be previewed in a browser without CORS changes.
//
//   flutter build web
//   node tool/preview_server.mjs            # http://localhost:5175
//
// Env: PORT (default 5175), PERFORMA_BACKEND_URL (default http://127.0.0.1:8000)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'build', 'web');
const port = Number(process.env.PORT || 5175);
const backend = new URL(process.env.PERFORMA_BACKEND_URL || 'http://127.0.0.1:8000');

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.css': 'text/css',
  '.bin': 'application/octet-stream',
  '.frag': 'application/octet-stream',
};

if (!fs.existsSync(path.join(root, 'index.html'))) {
  console.error(`No web build found at ${root}. Run "flutter build web" first.`);
  process.exit(1);
}

http
  .createServer((req, res) => {
    if (req.url.startsWith('/api')) {
      const upstream = http.request(
        {
          hostname: backend.hostname,
          port: backend.port || 80,
          path: req.url,
          method: req.method,
          headers: { ...req.headers, host: backend.host },
        },
        (up) => {
          res.writeHead(up.statusCode || 502, up.headers);
          up.pipe(res);
        }
      );
      upstream.on('error', () => {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ detail: 'Performa-COS backend is not reachable.' }));
      });
      req.pipe(upstream);
      return;
    }

    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    let file = path.normalize(path.join(root, urlPath));
    if (!file.startsWith(root)) {
      res.writeHead(403);
      res.end();
      return;
    }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, () => {
    console.log(`PerformaCOS preview: http://localhost:${port}  (API -> ${backend.origin})`);
  });

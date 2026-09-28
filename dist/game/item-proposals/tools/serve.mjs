// A dependency-free static server rooted at docs/, so pages here can import ../character-proposals
// read-only. ES modules will not load from file://, so every live demo needs this.
//   node docs/item-proposals/tools/serve.mjs [port]   → http://localhost:5179/item-proposals/
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.md': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml' };

export function serve(port = 5179) {
  const server = http.createServer(async (req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p === '/') { res.writeHead(302, { location: '/item-proposals/' }).end(); return; }
    if (p.endsWith('/')) p += 'index.html';
    const file = normalize(join(ROOT, p));
    if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    try {
      if ((await stat(file)).isDirectory()) { res.writeHead(302, { location: p + '/' }).end(); return; }
      res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(await readFile(file));
    } catch { res.writeHead(404).end('not found'); }
  });
  return new Promise(r => server.listen(port, () => r(server)));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const port = Number(process.argv[2] ?? 5179);
  await serve(port);
  console.log(`item-proposals → http://localhost:${port}/item-proposals/`);
}

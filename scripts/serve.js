// Local preview of dist/tools at http://localhost:PORT/tools/… with the same
// clean-URL and redirect rules as deploy/nginx.conf.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, normalize } from 'node:path';

const root = join(import.meta.dirname, '..', 'dist', 'tools');
const port = Number(process.env.PORT || 4173);
const MIME = {
  html: 'text/html; charset=utf-8', css: 'text/css', js: 'text/javascript', svg: 'image/svg+xml',
  png: 'image/png', woff2: 'font/woff2', xml: 'application/xml', txt: 'text/plain',
};

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const path = normalize(decodeURIComponent(url.pathname));
  if (!path.startsWith('/tools')) { res.writeHead(404).end(); return; }
  if (path === '/tools') { res.writeHead(301, { Location: '/tools/' }).end(); return; }
  const clean = path.match(/^\/tools\/([a-z0-9-]+)\/$/);
  if (clean) { res.writeHead(301, { Location: `/tools/${clean[1]}` }).end(); return; }

  const candidates = [path, `${path}.html`, `${path}/index.html`].map((p) => join(root, p.replace(/^\/tools\//, '')));
  for (const file of candidates) {
    try {
      const body = await readFile(file);
      const ext = file.split('.').pop();
      res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' }).end(body);
      return;
    } catch { /* next */ }
  }
  try {
    const body = await readFile(join(root, '404.html'));
    res.writeHead(404, { 'Content-Type': MIME.html }).end(body);
  } catch { res.writeHead(404).end(); }
}).listen(port, () => console.log(`http://localhost:${port}/tools/`));

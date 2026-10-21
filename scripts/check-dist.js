// Post-build sanity checks so a broken build never reaches the image.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TOOLS } from '../src/site.js';

const dist = join(import.meta.dirname, '..', 'dist', 'tools');
const fail = (msg) => { console.error(`check-dist: ${msg}`); process.exit(1); };

if (!existsSync(join(dist, 'index.html'))) fail('hub page missing');
for (const t of TOOLS) {
  const file = join(dist, `${t.slug}.html`);
  if (!existsSync(file)) fail(`${file} missing`);
  const html = readFileSync(file, 'utf8');
  for (const needle of ['<h1>', 'application/ld+json', 'canonical', `${t.slug}`]) {
    if (!html.includes(needle)) fail(`${t.slug}.html missing ${needle}`);
  }
  // Module script must resolve to an existing file.
  const m = html.match(/src="(\/tools\/assets\/[^"]+\.js)"/);
  if (!m) fail(`${t.slug}.html has no module script`);
  const assetPath = join(dist, m[1].replace(/^\/tools\//, ''));
  if (!existsSync(assetPath)) fail(`script ${m[1]} not on disk`);
}
const sitemap = readFileSync(join(dist, 'sitemap.xml'), 'utf8');
if (!sitemap.includes('/tools/vat')) fail('sitemap missing tool URLs');

// The committed dist/ must be a build of the current sources.
const manifest = readFileSync(join(dist, 'asset-manifest.txt'), 'utf8').trim();
const html = readFileSync(join(dist, 'index.html'), 'utf8');
const linkedAssets = html.match(/\/tools\/assets\/([0-9a-f]{10})\//);
if (!linkedAssets) fail('hub page links no hashed assets');
if (linkedAssets[1] !== manifest) fail(`dist out of sync: manifest ${manifest} vs linked ${linkedAssets[1]}`);
if (!existsSync(join(dist, 'assets', manifest))) fail(`asset dir ${manifest} missing`);
console.log(`check-dist: ok (assets ${manifest})`);

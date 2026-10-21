// Static build: src/ → dist/tools/. No dependencies, no bundler.
//
// Every asset (CSS, JS modules, font, images) is copied under one
// content-hashed directory, /tools/assets/<hash>/, so it can be cached forever
// while relative ES-module imports keep working. HTML is never cached long.

import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderPage, toolLd, faqLd } from '../src/layout.js';
import { ORIGIN, BASE, TOOLS, toolUrl } from '../src/site.js';
import { pageHead, faqSection, ctaSection, relatedSection } from '../src/pages/parts.js';
import { hubPage, notFoundPage } from '../src/pages/hub.js';
import { gregorianToJdn, jdnToJalali } from '../src/lib/jalali.js';
import { faDigits } from '../src/lib/digits.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const out = join(dist, 'tools');

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const assetSources = [['src/static', ''], ['src/client', 'client'], ['src/lib', 'lib']];
const hash = createHash('sha256');
for (const [src] of assetSources) {
  for (const file of walk(join(root, src)).sort()) {
    hash.update(relative(root, file));
    hash.update(readFileSync(file));
  }
}
const assetHash = hash.digest('hex').slice(0, 10);
const assetBase = `${BASE}assets/${assetHash}/`;
const asset = (p) => assetBase + p;

// assetHash is a content hash of every source file that lands in dist, so it
// doubles as a manifest: scripts/check-dist.js verifies a committed dist/ is
// in sync with src/ by rebuilding its hash from dist/asset-manifest.txt.


// Build date: SOURCE_DATE_EPOCH (set from the commit in CI) keeps builds reproducible.
const buildDate = process.env.SOURCE_DATE_EPOCH ? new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000) : new Date();
const isoDate = buildDate.toISOString().slice(0, 10);
const { jy } = jdnToJalali(gregorianToJdn(buildDate.getUTCFullYear(), buildDate.getUTCMonth() + 1, buildDate.getUTCDate()));
const ctx = { asset, year: faDigits(jy) };

rmSync(dist, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const [src, dest] of assetSources) {
  cpSync(join(root, src), join(out, 'assets', assetHash, dest), { recursive: true });
}

const write = (file, html) => {
  mkdirSync(dirname(join(out, file)), { recursive: true });
  writeFileSync(join(out, file), html);
};

const pages = await Promise.all(TOOLS.map((t) => import(`../src/pages/${t.slug}.js`).then((m) => m.default)));

for (const page of pages) {
  const meta = TOOLS.find((t) => t.slug === page.slug);
  const path = toolUrl(page.slug);
  const body = [
    pageHead(page),
    page.tool,
    page.content,
    faqSection(page.faq),
    ctaSection(page.cta),
    relatedSection(page.related, page.articles),
  ].join('\n');
  write(`${page.slug}.html`, renderPage({
    path,
    title: page.title,
    description: page.description,
    active: page.slug,
    crumbs: [['ابزارهای فروش', BASE], [(meta ?? page).name ?? page.slug, null]],
    body,
    noindex: !meta,
    script: page.script,
    ld: [toolLd({ name: page.h1, description: page.description, url: path, logo: asset('img/moshtariat-icon.png') }), faqLd(page.faq)],
  }, ctx));
}

write('index.html', renderPage(hubPage(), ctx));
write('404.html', renderPage(notFoundPage(), ctx));

const urls = [BASE, ...TOOLS.map((t) => toolUrl(t.slug))];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${ORIGIN}${u}</loc><lastmod>${isoDate}</lastmod></url>`).join('\n')}
</urlset>
`);

writeFileSync(join(out, 'asset-manifest.txt'), `${assetHash}\n`);
console.log(`built ${pages.length + 2} pages, assets ${assetBase}`);

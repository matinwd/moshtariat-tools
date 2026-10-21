// HTML shell for every page: head/SEO, header, footer, structured data.

import { ORIGIN, BASE, SITE_NAME, APP_TRIAL, APP_LOGIN, TOOLS, GROUPS, icon, esc, toolUrl } from './site.js';

const ORG = {
  '@type': 'Organization',
  name: 'سی ار ام مشتریات',
  alternateName: ['مشتریات', 'Moshtariat CRM'],
  url: ORIGIN,
  logo: `${ORIGIN}${BASE}assets/img/moshtariat-icon.png`,
};

function jsonLd(blocks) {
  return blocks
    .map((b) => `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', ...b }).replace(/</g, '\\u003c')}</script>`)
    .join('\n');
}

export function breadcrumbLd(crumbs) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map(([name, href], i) => ({
      '@type': 'ListItem', position: i + 1, name, ...(href ? { item: ORIGIN + href } : {}),
    })),
  };
}

export function toolLd({ name, description, url, logo }) {
  return {
    '@type': 'WebApplication',
    name,
    description,
    url: ORIGIN + url,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    inLanguage: 'fa-IR',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'IRR' },
    publisher: logo ? { ...ORG, logo: ORIGIN + logo } : ORG,
  };
}

export function faqLd(faq) {
  return {
    '@type': 'FAQPage',
    mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: stripTags(a) } })),
  };
}

const stripTags = (html) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

function header(active, asset) {
  const nav = [
    ['tools', 'ابزارهای فروش', BASE],
    ['product', 'نرم‌افزار CRM', '/product'],
    ['features', 'امکانات', '/features'],
    ['pricing', 'تعرفه', '/pricing'],
    ['blog', 'وبلاگ', '/blog'],
  ];
  const sub = TOOLS.map((t) => `<a href="${toolUrl(t.slug)}"${t.slug === active ? ' aria-current="page"' : ''}>${esc(t.name)}</a>`).join('');
  return `<a class="skip" href="#main">پرش به محتوا</a>
<header class="hdr">
  <div class="wrap hdr-in">
    <a class="brand" href="/"><img src="${asset('img/moshtariat-mark.svg')}" alt="" width="44" height="23">${SITE_NAME}<small>ابزارهای فروش</small></a>
    <nav class="nav" aria-label="ناوبری اصلی">
      ${nav.map(([k, l, h]) => `<a href="${h}"${(k === 'tools' && active) ? ' aria-current="page"' : ''}>${l}</a>`).join('')}
    </nav>
    <div class="hdr-act">
      <a class="btn btn-ghost btn-sm" href="${APP_LOGIN}" rel="nofollow">ورود</a>
      <a class="btn btn-primary btn-sm" href="${APP_TRIAL}" rel="nofollow" data-track="trial-header">استفاده رایگان از CRM</a>
    </div>
  </div>
  <nav class="subnav wrap" aria-label="ابزارها"><a href="${BASE}"${active === 'hub' ? ' aria-current="page"' : ''}>همهٔ ابزارها</a>${sub}</nav>
</header>`;
}

function footer(asset, year) {
  const byGroup = GROUPS.map(([g]) => TOOLS.filter((t) => t.group === g));
  return `<footer class="ftr">
  <div class="wrap">
    <div class="ftr-grid">
      <div>
        <a class="brand" href="/"><img src="${asset('img/moshtariat-mark-white.svg')}" alt="" width="44" height="23">${SITE_NAME}</a>
        <p>ابزارهای رایگان مشتریات برای حساب‌وکتاب‌های روزمرهٔ فروش. همهٔ محاسبه‌ها در مرورگر خودتان انجام می‌شود و عددی به سرور ما ارسال نمی‌شود.</p>
        <p style="margin-top:10px">مشتریات نرم‌افزار CRM فارسی برای پیگیری مشتری، پایپ‌لاین فروش و تقسیم لید بین کارشناس‌هاست. <a href="/product">آشنایی با مشتریات</a></p>
      </div>
      <div>
        <h2>ابزارها</h2>
        <ul>${byGroup.flat().map((t) => `<li><a href="${toolUrl(t.slug)}">${esc(t.name)}</a></li>`).join('')}</ul>
      </div>
      <div>
        <h2>مشتریات</h2>
        <ul>
          <li><a href="/what-is-crm">CRM چیست؟</a></li>
          <li><a href="/product">معرفی محصول</a></li>
          <li><a href="/pricing">تعرفه</a></li>
          <li><a href="/demo">دموی بدون ثبت‌نام</a></li>
          <li><a href="/blog">وبلاگ</a></li>
          <li><a href="/contact">تماس با ما</a></li>
        </ul>
      </div>
    </div>
    <div class="ftr-bottom"><span>© ${year} مشتریات. همهٔ حقوق محفوظ است.</span><span>نتیجهٔ ابزارها برای برآورد است؛ برای تصمیم مالی یا مالیاتی رسمی با مشاور خود تطبیق دهید.</span></div>
  </div>
</footer>
<div class="toast" role="status" aria-live="polite"></div>`;
}

/**
 * @param {object} p
 * @param {string} p.path        canonical path, e.g. /tools/vat
 * @param {string} p.title       full <title>
 * @param {string} p.description meta description
 * @param {string} p.active      tool slug, 'hub', or ''
 * @param {Array}  p.crumbs      [[label, href|null], ...] starting after «خانه»
 * @param {string} p.body        main content HTML
 * @param {Array}  [p.ld]        extra JSON-LD blocks
 * @param {string} [p.script]    client module path relative to assets
 * @param {boolean} [p.noindex]
 */
export function renderPage(p, { asset, year }) {
  const crumbs = [['خانه', '/'], ...p.crumbs];
  const canonical = ORIGIN + p.path;
  const ld = [...(p.crumbs.length ? [breadcrumbLd(crumbs)] : []), ...(p.ld ?? [])];
  const crumbHtml = p.crumbs.length
    ? `<nav class="crumbs" aria-label="مسیر">${crumbs.map(([l, h], i) => (h && i < crumbs.length - 1 ? `<a href="${h}">${esc(l)}</a>` : `<span aria-current="page">${esc(l)}</span>`)).join('<span aria-hidden="true">/</span>')}</nav>`
    : '';
  return `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}">
<meta name="robots" content="${p.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}">
${p.noindex ? '' : `<link rel="canonical" href="${canonical}">`}
<meta name="theme-color" content="#4F46E5">
<link rel="icon" href="${asset('img/moshtariat-icon.png')}">
<link rel="apple-touch-icon" href="${asset('img/apple-touch-icon-180.png')}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="مشتریات">
<meta property="og:locale" content="fa_IR">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ORIGIN}${asset('img/moshtariat-icon.png')}">
<meta name="twitter:card" content="summary">
<link rel="preload" href="${asset('fonts/Vazirmatn.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${asset('tools.css')}">
<script src="${asset('clarity.js')}" defer></script>
${p.script ? `<script type="module" src="${asset(p.script)}"></script>` : ''}
${jsonLd(ld)}
</head>
<body>
${header(p.active, asset)}
<main id="main" class="wrap">
${crumbHtml}
${p.body}
</main>
${footer(asset, year)}
</body>
</html>
`;
}

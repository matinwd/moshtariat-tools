// Build-time HTML fragments shared by tool pages.

import { APP_TRIAL, TOOLS, ARTICLES, icon, esc, toolUrl, toolBySlug } from '../site.js';

export { icon, esc };

/** A labelled input. `unit` may be a literal string or 'money' for the تومان/ریال label. */
export function field({ id, label, value = '', unit, hint, placeholder = '', type = 'num', words = false, attrs = '', inputmode, cls: extraCls = '' }) {
  const unitHtml = unit === 'money' ? '<span class="unit" data-unit>تومان</span>' : unit ? `<span class="unit">${unit}</span>` : '';
  inputmode ??= type === 'num' ? 'decimal' : type === 'date' ? 'numeric' : 'text';
  const cls = `${type === 'num' ? 'num' : type === 'date' ? 'date' : ''} ${extraCls}`.trim();
  return `<div class="field">
  <label for="${id}">${label}</label>
  <div class="inp"><input id="${id}" name="${id}" class="${cls}" inputmode="${inputmode}" autocomplete="off" value="${esc(value)}" placeholder="${esc(placeholder)}" ${attrs}>${unitHtml}</div>
  ${words ? '<div class="words" aria-live="polite"></div>' : ''}${hint ? `<div class="hint">${hint}</div>` : ''}
</div>`;
}

export function seg(name, options, current, extraClass = '') {
  return `<div class="seg ${extraClass}" role="group" data-seg="${name}">${options
    .map(([v, l]) => `<button type="button" data-value="${v}" aria-pressed="${v === current}">${l}</button>`)
    .join('')}</div>`;
}

export const unitSwitch = `<div class="seg seg-sm" role="group" aria-label="واحد پول" data-unit-switch><button type="button" data-value="toman" aria-pressed="true">تومان</button><button type="button" data-value="rial" aria-pressed="false">ریال</button></div>`;

export function shareBar({ print = false } = {}) {
  return `<div class="share no-print">
  <button type="button" class="btn btn-soft btn-sm" data-action="copy-link">${icon('link')}لینک این محاسبه</button>
  <button type="button" class="btn btn-ghost btn-sm" data-action="copy-result">${icon('copy')}کپی نتیجه</button>
  <button type="button" class="btn btn-ghost btn-sm" data-action="whatsapp">${icon('whatsapp')}واتساپ</button>
  ${print ? `<button type="button" class="btn btn-ghost btn-sm" data-action="print">${icon('print')}چاپ / PDF</button>` : ''}
</div>`;
}

export const privacyNote = `<p class="privacy">${icon('shield')}<span>محاسبه کاملاً در مرورگر شما انجام می‌شود؛ هیچ عددی برای ما ارسال یا ذخیره نمی‌شود. لینک اشتراک‌گذاری فقط همین عددها را در خود دارد.</span></p>`;

export function pageHead({ h1, lede }) {
  return `<header class="page-head">
  <h1>${h1}</h1>
  <p class="lede">${lede}</p>
</header>`;
}

export function faqSection(faq) {
  return `<section class="section prose faq" aria-labelledby="faq-h">
  <h2 id="faq-h">پرسش‌های رایج</h2>
  ${faq.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('\n  ')}
</section>`;
}

/** The CRM pitch. Claims must stay inside what the product really ships. */
export function ctaSection({ title, text }) {
  return `<section class="section">
  <div class="cta">
    <div><h2>${title}</h2><p>${text}</p></div>
    <div class="btn-row"><a class="btn btn-primary btn-lg" href="${APP_TRIAL}" rel="nofollow" data-track="trial-cta">استفادهٔ رایگان از مشتریات</a><a class="btn btn-ghost btn-lg" href="/demo">دیدن دمو</a></div>
  </div>
</section>`;
}

export function relatedSection(slugs, articleKeys = []) {
  const tools = slugs.map(toolBySlug).filter(Boolean);
  const articles = articleKeys.map((k) => ARTICLES[k]).filter(Boolean);
  return `<section class="section" aria-labelledby="rel-h">
  <h2 id="rel-h" class="group-title">ابزارها و مطالب مرتبط</h2>
  <div class="related">
    ${tools.map((t) => `<a href="${toolUrl(t.slug)}">${esc(t.name)}${icon('arrow')}</a>`).join('\n    ')}
    ${articles.map(([t, h]) => `<a href="${h}">${esc(t)}${icon('arrow')}</a>`).join('\n    ')}
  </div>
</section>`;
}

export function toolCard(t) {
  return `<a class="tcard" href="${toolUrl(t.slug)}"><span class="ico">${icon(t.icon)}</span><h3>${esc(t.name)}</h3><p>${esc(t.blurb)}</p><span class="go">باز کردن ابزار ←</span></a>`;
}

export { TOOLS };

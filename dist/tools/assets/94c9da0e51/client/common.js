// Browser helpers shared by every tool page.

import { parseNumber, groupLatin, toLatinDigits } from '../lib/digits.js';
import { toPersianWords } from '../lib/words.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ---------------------------------------------------------------- analytics

export function track(name) {
  try { window.clarity?.('event', name); } catch { /* analytics must never break a tool */ }
}

// ---------------------------------------------------------------- unit (تومان / ریال)

const UNIT_KEY = 'mt-tools-unit';
const UNITS = { toman: 'تومان', rial: 'ریال' };

export function unitLabel() {
  return UNITS[localStorage.getItem(UNIT_KEY)] ?? UNITS.toman;
}

/** Wires every `.seg[data-unit-switch]` and keeps `[data-unit]` labels in sync. */
export function initUnitSwitch(onChange) {
  const apply = () => {
    const key = localStorage.getItem(UNIT_KEY) ?? 'toman';
    $$('[data-unit]').forEach((el) => { el.textContent = UNITS[key]; });
    $$('[data-unit-switch] button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === key)));
  };
  $$('[data-unit-switch] button').forEach((b) => b.addEventListener('click', () => {
    localStorage.setItem(UNIT_KEY, b.dataset.value);
    apply();
    onChange?.();
  }));
  apply();
}

// ---------------------------------------------------------------- inputs

/**
 * Live thousands grouping that keeps the caret where the visitor is typing,
 * and accepts Persian digits from a Persian keyboard.
 */
export function formatNumberInput(input) {
  const raw = input.value;
  const caret = input.selectionStart ?? raw.length;
  const significantBefore = toLatinDigits(raw.slice(0, caret)).replace(/[^\d.-]/g, '').length;
  const formatted = groupLatin(raw);
  if (formatted === raw) return;
  input.value = formatted;
  let pos = 0;
  for (let seen = 0; pos < formatted.length && seen < significantBefore; pos += 1) {
    if (/[\d.-]/.test(formatted[pos])) seen += 1;
  }
  if (document.activeElement === input) input.setSelectionRange(pos, pos);
}

export function readNumber(input) {
  return parseNumber(input?.value ?? '');
}

/** Shows «یک میلیون و ... تومان» under a money input. */
export function updateWords(input) {
  const target = input.closest('.field')?.querySelector('.words');
  if (!target) return;
  const n = readNumber(input);
  target.textContent = Number.isFinite(n) && n >= 1000 ? `${toPersianWords(n)} ${unitLabel()}` : '';
}

/**
 * Binds every `input.num` inside `root`: grouping, words hint, and a
 * debounced recompute. Delegated, so rows added later are covered too.
 */
export function bindInputs(root, recompute) {
  root.addEventListener('input', (e) => {
    const t = e.target;
    if (t.matches('input.num')) {
      formatNumberInput(t);
      updateWords(t);
    }
    recompute();
  });
  root.addEventListener('change', () => recompute());
  $$('input.num', root).forEach((i) => { i.value = groupLatin(i.value); updateWords(i); });
}

export function setValue(input, value) {
  if (!input) return;
  input.value = value === undefined || value === null || Number.isNaN(value) ? '' : (input.matches('.num') ? groupLatin(String(value)) : String(value));
  if (input.matches('.num')) updateWords(input);
}

export function markInvalid(input, invalid) {
  input?.closest('.inp')?.classList.toggle('invalid', Boolean(invalid));
}

/** Segmented control: returns getter; calls onChange(value). */
export function segmented(el, onChange) {
  const buttons = $$('button', el);
  const set = (value, silent) => {
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === value)));
    if (!silent) onChange?.(value);
  };
  buttons.forEach((b) => b.addEventListener('click', () => set(b.dataset.value)));
  return {
    get: () => buttons.find((b) => b.getAttribute('aria-pressed') === 'true')?.dataset.value ?? buttons[0].dataset.value,
    set,
  };
}

// ---------------------------------------------------------------- shareable state

function encode(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decode(str) {
  const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
}

/**
 * The calculation lives in the URL fragment (#s=…): shareable, survives a
 * reload, and — being a fragment — never reaches the server or creates a
 * duplicate URL for search engines.
 */
export function loadState() {
  const m = location.hash.match(/[#&]s=([A-Za-z0-9_-]+)/);
  if (!m) return null;
  try { return decode(m[1]); } catch { return null; }
}

let saveTimer;
export function saveState(obj) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    history.replaceState(null, '', `${location.pathname}#s=${encode(obj)}`);
  }, 250);
}

// ---------------------------------------------------------------- share actions

export function toast(message) {
  const el = $('.toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2200);
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = Object.assign(document.createElement('textarea'), { value: text });
    document.body.append(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}

/**
 * Wires `[data-action]` buttons inside `root`.
 * getText() returns the plain-text result used for copy and WhatsApp.
 */
export function wireShare(root, { getText, slug, beforePrint }) {
  root.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    track(`${slug}:${action}`);
    if (action === 'copy-link') {
      await flushState();
      if (navigator.share && matchMedia('(pointer:coarse)').matches) {
        try { await navigator.share({ title: document.title, url: location.href }); return; } catch { /* fall through to copy */ }
      }
      await copyText(location.href);
      toast('لینک این محاسبه کپی شد');
    } else if (action === 'copy-result') {
      const text = getText();
      if (!text) return toast('اول عددها را وارد کنید');
      await copyText(text);
      toast('نتیجه کپی شد');
    } else if (action === 'whatsapp') {
      await flushState();
      const text = getText();
      if (!text) return toast('اول عددها را وارد کنید');
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n\n${location.href}`)}`, '_blank', 'noopener');
    } else if (action === 'print') {
      beforePrint?.();
      window.print();
    }
  });
}

function flushState() {
  return new Promise((resolve) => setTimeout(resolve, 300));
}

export function debounce(fn, ms = 60) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

export function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

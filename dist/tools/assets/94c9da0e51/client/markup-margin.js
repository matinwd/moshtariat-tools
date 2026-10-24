import {
  $, $$, bindInputs, readNumber, setValue, segmented, initUnitSwitch, unitLabel, loadState, saveState, wireShare, debounce, el,
} from './common.js';
import { computeMarkup } from '../lib/pricing.js';
import { fa, faPercent, groupLatin } from '../lib/digits.js';

const tool = $('#tool');
const out = $('#out');
const costsEl = $('#costs');
const f = { cost: $('#cost'), markup: $('#markup'), margin: $('#margin'), price: $('#price') };
let last = null;

const mode = segmented($('[data-seg="mode"]'), () => { show(); render(); });

function show() {
  const m = mode.get();
  $$('[data-show]', tool).forEach((x) => { x.hidden = x.dataset.show !== m; });
}

function addCost(title = '', amount = '') {
  const row = el(`<div class="row">
    <div class="field"><label>هزینه</label><div class="inp"><input class="title" autocomplete="off" placeholder="مثلاً بسته‌بندی"></div></div>
    <div class="field"><label>مبلغ برای هر واحد</label><div class="inp"><input class="num amount" inputmode="decimal" autocomplete="off"></div></div>
    <button type="button" class="btn btn-icon remove" aria-label="حذف"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
  </div>`);
  $('.title', row).value = title;
  $('.amount', row).value = groupLatin(String(amount));
  costsEl.append(row);
  return row;
}

function readCosts() {
  return $$('.row', costsEl).map((r) => [$('.title', r).value, $('.amount', r).value]);
}

function syncCostFromLines() {
  const lines = $$('.row .amount', costsEl).map(readNumber).filter(Number.isFinite);
  if (lines.length) setValue(f.cost, lines.reduce((s, x) => s + x, 0));
}

function render() {
  const m = mode.get();
  saveState({ m, c: f.cost.value, mu: f.markup.value, mg: f.margin.value, p: f.price.value, l: readCosts() });
  const r = computeMarkup({ mode: m, cost: readNumber(f.cost), markup: readNumber(f.markup), margin: readNumber(f.margin), price: readNumber(f.price) });
  last = r;
  if (!r) {
    out.innerHTML = `<p class="empty">${m === 'margin' && readNumber(f.margin) >= 100 ? 'حاشیه سود باید کمتر از ۱۰۰٪ باشد.' : 'قیمت تمام‌شده و درصد را وارد کنید.'}</p>`;
    return;
  }
  const u = unitLabel();
  const loss = r.profit < 0;
  out.innerHTML = `
  <div class="result-main">
    <div class="label">${m === 'price' ? (loss ? 'زیان هر واحد' : 'سود هر واحد') : 'قیمت فروش پیشنهادی'}</div>
    <div class="value">${fa(Math.round(m === 'price' ? Math.abs(r.profit) : r.price))} <small>${u}</small></div>
    <div class="sub">${loss ? 'قیمت فروش از قیمت تمام‌شده کمتر است.' : `سود روی هزینه ${faPercent(r.markup, 1)} · حاشیه سود ${faPercent(r.margin, 1)}`}</div>
  </div>
  <dl class="kv">
    <div><dt>قیمت تمام‌شده</dt><dd>${fa(r.cost)} ${u}</dd></div>
    <div><dt>قیمت فروش</dt><dd>${fa(Math.round(r.price))} ${u}</dd></div>
    <div><dt>سود هر واحد</dt><dd class="${loss ? 'neg' : 'pos'}">${fa(Math.round(r.profit))} ${u}</dd></div>
    <div><dt>درصد سود روی هزینه (مارک‌آپ)</dt><dd>${faPercent(r.markup, 2)}</dd></div>
    <div><dt>حاشیه سود از فروش (مارجین)</dt><dd>${faPercent(r.margin, 2)}</dd></div>
  </dl>
  ${!loss && r.margin > 0 ? `<p class="tiny" style="margin-top:10px">با این قیمت، بیشترین تخفیفی که بدون زیان می‌شود داد ${faPercent(r.margin, 1)} است.</p>` : ''}`;
}

function resultText() {
  if (!last) return '';
  const u = unitLabel();
  return `قیمت تمام‌شده ${fa(last.cost)} ${u} — قیمت فروش ${fa(Math.round(last.price))} ${u} — سود ${fa(Math.round(last.profit))} ${u} (مارک‌آپ ${faPercent(last.markup, 1)}، حاشیه ${faPercent(last.margin, 1)})`;
}

const s = loadState();
if (s) {
  mode.set(s.m ?? 'markup', true);
  setValue(f.cost, s.c); setValue(f.markup, s.mu); setValue(f.margin, s.mg); setValue(f.price, s.p);
  (s.l ?? []).forEach(([t, a]) => addCost(t, a));
  if (s.l?.length) $('#breakdown').open = true;
} else {
  setValue(f.cost, 800_000); setValue(f.markup, 25); setValue(f.margin, 20); setValue(f.price, 1_000_000);
}
if (!$$('.row', costsEl).length) {
  [['خرید یا مواد اولیه', ''], ['بسته‌بندی و حمل', ''], ['سهم هزینه‌های ثابت', '']].forEach(([t, a]) => addCost(t, a));
}
show();

$('#add-cost').addEventListener('click', () => { $('.title', addCost()).focus(); });
costsEl.addEventListener('click', (e) => {
  const b = e.target.closest('.remove');
  if (!b) return;
  b.closest('.row').remove();
  syncCostFromLines();
  render();
});
costsEl.addEventListener('input', (e) => { if (e.target.matches('.amount')) syncCostFromLines(); });

bindInputs(tool, debounce(render));
initUnitSwitch(render);
wireShare(tool, { getText: resultText, slug: 'markup-margin' });
render();

import {
  $, $$, bindInputs, readNumber, setValue, segmented, initUnitSwitch, unitLabel, loadState, saveState, wireShare, debounce, markInvalid,
} from './common.js';
import { computeDiscount, chainDiscounts } from '../lib/pricing.js';
import { fa, faPercent, parseNumber, toLatinDigits } from '../lib/digits.js';

const tool = $('#tool');
const out = $('#out');
const inputs = { price: $('#price'), percent: $('#percent'), final: $('#final') };
let last = null;

/** «10+5» → effective 14.5; a single number passes through. */
function readPercent() {
  const raw = toLatinDigits(inputs.percent.value).trim();
  if (!raw) return { value: NaN, parts: [] };
  const parts = raw.split(/[+،,]/).map((s) => parseNumber(s)).filter((n) => !Number.isNaN(n));
  const value = parts.length > 1 ? chainDiscounts(parts) : parts[0];
  return { value: value ?? NaN, parts };
}

const mode = segmented($('[data-seg="mode"]'), () => { showFields(); render(); });

function showFields() {
  const m = mode.get();
  $$('[data-show]', tool).forEach((el) => { el.hidden = !el.dataset.show.split(' ').includes(m); });
}

function render() {
  const m = mode.get();
  const pct = readPercent();
  const price = readNumber(inputs.price);
  const final = readNumber(inputs.final);
  markInvalid(inputs.percent, inputs.percent.value.trim() && !Number.isFinite(pct.value));
  saveState({ m, p: inputs.price.value, d: inputs.percent.value, f: inputs.final.value });
  const r = computeDiscount({ mode: m, price, percent: pct.value, final });
  last = r && { ...r, parts: pct.parts };
  if (!r) {
    out.innerHTML = `<p class="empty">${m === 'percent' && final > price ? 'قیمت بعد از تخفیف از قیمت اصلی بیشتر است.' : 'عددها را وارد کنید.'}</p>`;
    return;
  }
  const u = unitLabel();
  const main = {
    final: ['قیمت بعد از تخفیف', `${fa(r.final)} <small>${u}</small>`],
    percent: ['درصد تخفیف', faPercent(r.percent, 2)],
    original: ['قیمت قبل از تخفیف', `${fa(r.price)} <small>${u}</small>`],
  }[m];
  out.innerHTML = `
  <div class="result-main"><div class="label">${main[0]}</div><div class="value">${main[1]}</div>
    <div class="sub">مبلغ تخفیف: ${fa(r.saving)} ${u}</div></div>
  <dl class="kv">
    <div><dt>قیمت اصلی</dt><dd>${fa(r.price)} ${u}</dd></div>
    <div><dt>درصد تخفیف${pct.parts.length > 1 && m !== 'percent' ? ` (${pct.parts.map((x) => fa(x, 2)).join(' + ')})` : ''}</dt><dd>${faPercent(r.percent, 2)}</dd></div>
    <div><dt>مبلغ تخفیف</dt><dd class="neg">${fa(r.saving)} ${u}</dd></div>
    <div><dt>قیمت نهایی</dt><dd>${fa(r.final)} ${u}</dd></div>
  </dl>`;
}

function resultText() {
  if (!last) return '';
  const u = unitLabel();
  return `قیمت اصلی ${fa(last.price)} ${u} — تخفیف ${faPercent(last.percent, 2)} (${fa(last.saving)} ${u}) — قیمت نهایی ${fa(last.final)} ${u}`;
}

const s = loadState();
if (s) {
  mode.set(s.m ?? 'final', true);
  setValue(inputs.price, s.p);
  inputs.percent.value = s.d ?? '';
  setValue(inputs.final, s.f);
} else {
  setValue(inputs.price, 2_400_000);
  inputs.percent.value = '15';
  setValue(inputs.final, 2_000_000);
}
showFields();
bindInputs(tool, debounce(render));
initUnitSwitch(render);
wireShare(tool, { getText: resultText, slug: 'discount' });
render();

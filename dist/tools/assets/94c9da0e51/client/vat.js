import {
  $, bindInputs, readNumber, setValue, segmented, initUnitSwitch, unitLabel, loadState, saveState, wireShare, debounce,
} from './common.js';
import { computeVat } from '../lib/pricing.js';
import { fa } from '../lib/digits.js';
import { toPersianWords } from '../lib/words.js';

const tool = $('#tool');
const out = $('#out');
const amount = $('#amount');
const rate = $('#rate');
const modeHint = $('[data-mode-hint]');
let last = null;

const mode = segmented($('[data-seg="mode"]'), render);

function render() {
  const m = mode.get();
  modeHint.textContent = m === 'add' ? 'قیمت بدون مالیات را وارد کنید.' : 'مبلغ نهایی که مالیات داخل آن است را وارد کنید.';
  saveState({ m, a: amount.value, r: rate.value });
  const r = computeVat({ mode: m, amount: readNumber(amount), rate: readNumber(rate) });
  last = r;
  if (!r) {
    out.innerHTML = '<p class="empty">مبلغ را وارد کنید.</p>';
    return;
  }
  const u = unitLabel();
  const [label, value] = m === 'add' ? ['مبلغ نهایی با ارزش افزوده', r.gross] : ['قیمت بدون ارزش افزوده', r.net];
  out.innerHTML = `
  <div class="result-main"><div class="label">${label}</div><div class="value">${fa(Math.round(value))} <small>${u}</small></div>
    <div class="sub">${toPersianWords(Math.round(value))} ${u}</div></div>
  <dl class="kv">
    <div><dt>قیمت بدون مالیات</dt><dd>${fa(r.net, 0)} ${u}</dd></div>
    <div><dt>مالیات و عوارض (${fa(r.rate, 2)}٪)</dt><dd>${fa(r.tax, 0)} ${u}</dd></div>
    <div><dt>مبلغ نهایی</dt><dd>${fa(r.gross, 0)} ${u}</dd></div>
  </dl>`;
}

function resultText() {
  if (!last) return '';
  const u = unitLabel();
  return `قیمت بدون مالیات: ${fa(last.net)} ${u}\nارزش افزوده (${fa(last.rate, 2)}٪): ${fa(last.tax)} ${u}\nمبلغ نهایی: ${fa(last.gross)} ${u}`;
}

const s = loadState();
if (s) {
  mode.set(s.m ?? 'add', true);
  setValue(amount, s.a);
  setValue(rate, s.r);
} else {
  setValue(amount, 3_500_000);
}
bindInputs(tool, debounce(render));
initUnitSwitch(render);
wireShare(tool, { getText: resultText, slug: 'vat' });
render();

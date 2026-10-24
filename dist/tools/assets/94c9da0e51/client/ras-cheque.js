import {
  $, $$, bindInputs, readNumber, setValue, markInvalid, initUnitSwitch, unitLabel,
  loadState, saveState, wireShare, el, debounce,
} from './common.js';
import { computeRas } from '../lib/cheque.js';
import { parseJalali, todayJdn, formatJalaliInput, formatJalali, formatJalaliLong, weekdayName, addJalaliMonths } from '../lib/jalali.js';
import { fa, faPercent } from '../lib/digits.js';

const tool = $('#tool');
const rowsEl = $('#rows');
const out = $('#out');
const refInput = $('#ref');
let last = null;

function rowHtml(i) {
  return `<div class="row">
  <span class="idx">چک ${fa(i)}</span>
  <div class="field"><label>مبلغ (<span data-unit>${unitLabel()}</span>)</label><div class="inp"><input class="num amount" inputmode="decimal" autocomplete="off" aria-label="مبلغ چک ${fa(i)}"></div></div>
  <div class="field"><label>تاریخ سررسید</label><div class="inp"><input class="date due" inputmode="numeric" autocomplete="off" placeholder="1405/09/01" aria-label="تاریخ سررسید چک ${fa(i)}"></div></div>
  <button type="button" class="btn btn-icon remove" aria-label="حذف چک ${fa(i)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13M9 7V4h6v3"/></svg></button>
</div>`;
}

function renumber() {
  $$('.row', rowsEl).forEach((r, i) => { $('.idx', r).textContent = `چک ${fa(i + 1)}`; });
}

function addRow(amount, dateText) {
  const row = el(rowHtml($$('.row', rowsEl).length + 1));
  rowsEl.append(row);
  setValue($('.amount', row), amount);
  $('.due', row).value = dateText ?? '';
  return row;
}

function readRows() {
  return $$('.row', rowsEl).map((r) => {
    const amountInput = $('.amount', r);
    const dueInput = $('.due', r);
    const amount = readNumber(amountInput);
    const jdn = parseJalali(dueInput.value);
    markInvalid(dueInput, dueInput.value.trim() !== '' && !Number.isFinite(jdn));
    markInvalid(amountInput, amountInput.value.trim() !== '' && !(amount > 0));
    return { amount, jdn, amountText: amountInput.value, dueText: dueInput.value };
  });
}

function render() {
  const refJdn = parseJalali(refInput.value);
  markInvalid(refInput, refInput.value.trim() !== '' && !Number.isFinite(refJdn));
  const rows = readRows();
  saveState({ ref: refInput.value, c: rows.map((r) => [r.amountText, r.dueText]) });

  const r = computeRas(rows, Number.isFinite(refJdn) ? refJdn : todayJdn());
  last = r;
  if (!r) {
    out.innerHTML = '<p class="empty">مبلغ و تاریخ حداقل یک چک را وارد کنید.</p>';
    return;
  }
  const unit = unitLabel();
  const d = r.daysFromReference;
  const rel = d === 0 ? 'همان روزِ تاریخ مبنا' : d > 0 ? `${fa(d)} روز بعد از تاریخ مبنا` : `${fa(-d)} روز قبل از تاریخ مبنا`;
  out.innerHTML = `
  <div class="result-main">
    <div class="label">تاریخ رأس چک‌ها</div>
    <div class="value">${formatJalaliLong(r.rasJdn)}</div>
    <div class="sub">${weekdayName(r.rasJdn)} · ${rel} · حدود ${fa(d / 30, 1)} ماه</div>
  </div>
  <dl class="kv">
    <div><dt>جمع مبلغ ${fa(r.count)} چک</dt><dd>${fa(r.total)} ${unit}</dd></div>
    <div><dt>زودترین سررسید</dt><dd>${formatJalali(r.firstJdn)}</dd></div>
    <div><dt>دیرترین سررسید</dt><dd>${formatJalali(r.lastJdn)}</dd></div>
    <div><dt>میانگین دقیق (قبل از گرد کردن)</dt><dd>${fa(r.exactOffset, 2)} روز</dd></div>
  </dl>
  <div class="tbl-wrap" style="margin-top:12px"><table class="tbl">
    <thead><tr><th>سررسید</th><th>مبلغ</th><th>روز</th><th>سهم</th></tr></thead>
    <tbody>${r.rows.map((x) => `<tr><td>${formatJalali(x.jdn)}</td><td class="n">${fa(x.amount)}</td><td class="n">${fa(x.days)}</td><td><div class="bar" title="${faPercent(x.share, 1)}"><i style="width:${x.share.toFixed(1)}%"></i></div></td></tr>`).join('')}</tbody>
  </table></div>`;
}

function resultText() {
  if (!last) return '';
  const unit = unitLabel();
  return [
    `رأس ${fa(last.count)} چک به جمع ${fa(last.total)} ${unit}: ${formatJalaliLong(last.rasJdn)} (${fa(last.daysFromReference)} روز از تاریخ مبنا)`,
    ...last.rows.map((x) => `• ${formatJalali(x.jdn)} — ${fa(x.amount)} ${unit}`),
  ].join('\n');
}

const recompute = debounce(render);

function init() {
  const state = loadState();
  const today = todayJdn();
  refInput.value = state?.ref ?? formatJalaliInput(today);
  if (state?.c?.length) {
    state.c.forEach(([a, d]) => addRow(a, d));
  } else {
    [[10_000_000, 1], [20_000_000, 2], [30_000_000, 3]].forEach(([a, m]) => addRow(a, formatJalaliInput(addJalaliMonths(today, m))));
  }

  $('#add').addEventListener('click', () => {
    const rows = readRows();
    const prev = rows.at(-1);
    const nextDate = prev && Number.isFinite(prev.jdn) ? formatJalaliInput(addJalaliMonths(prev.jdn, 1)) : '';
    const row = addRow(prev?.amount > 0 ? prev.amount : '', nextDate);
    $('.amount', row).focus();
    render();
  });
  $('#clear').addEventListener('click', () => {
    rowsEl.innerHTML = '';
    addRow('', '');
    $('.amount', rowsEl).focus();
    render();
  });
  rowsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.remove');
    if (!btn) return;
    btn.closest('.row').remove();
    if (!$$('.row', rowsEl).length) addRow('', '');
    renumber();
    render();
  });

  bindInputs(tool, recompute);
  initUnitSwitch(render);
  wireShare(tool, { getText: resultText, slug: 'ras-cheque' });
  render();
}

init();

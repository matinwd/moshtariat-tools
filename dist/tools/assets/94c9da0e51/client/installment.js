import {
  $, bindInputs, readNumber, setValue, segmented, initUnitSwitch, unitLabel, loadState, saveState, wireShare, debounce, markInvalid,
} from './common.js';
import { computeInstallments } from '../lib/installment.js';
import { parseJalali, todayJdn, addJalaliMonths, formatJalaliInput, formatJalali } from '../lib/jalali.js';
import { fa, faPercent } from '../lib/digits.js';

const tool = $('#tool');
const out = $('#out');
const scheduleCard = $('#schedule-card');
const schedule = $('#schedule');
const f = {
  price: $('#price'), down: $('#down'), months: $('#months'), rate: $('#rate'),
  rateUnit: $('#rateUnit'), first: $('#first'), roundTo: $('#roundTo'),
};
let last = null;

const method = segmented($('[data-seg="method"]'), render);

function render() {
  const firstJdn = parseJalali(f.first.value);
  markInvalid(f.first, f.first.value.trim() && !Number.isFinite(firstJdn));
  saveState({
    p: f.price.value, d: f.down.value, n: f.months.value, r: f.rate.value,
    ru: f.rateUnit.value, fi: f.first.value, ro: f.roundTo.value, m: method.get(),
  });
  const price = readNumber(f.price);
  const down = readNumber(f.down);
  const r = computeInstallments({
    price, down: Number.isFinite(down) ? down : 0, months: readNumber(f.months), rate: readNumber(f.rate) || 0,
    rateUnit: f.rateUnit.value, method: method.get(), roundTo: Number(f.roundTo.value), firstJdn,
  });
  last = r;
  scheduleCard.hidden = !r;
  if (!r) {
    out.innerHTML = `<p class="empty">${down >= price ? 'پیش‌پرداخت باید از قیمت کل کمتر باشد.' : 'قیمت کل و تعداد قسط را وارد کنید.'}</p>`;
    return;
  }
  const u = unitLabel();
  const differentLast = Math.round(r.lastInstallment) !== Math.round(r.installment);
  out.innerHTML = `
  <div class="result-main"><div class="label">مبلغ هر قسط</div>
    <div class="value">${fa(Math.round(r.installment))} <small>${u}</small></div>
    <div class="sub">${fa(r.months)} قسط${differentLast ? ` · قسط آخر ${fa(Math.round(r.lastInstallment))} ${u}` : ''}</div></div>
  <dl class="kv">
    <div><dt>مبلغ اقساطی (بعد از پیش‌پرداخت)</dt><dd>${fa(r.principal)} ${u}</dd></div>
    <div><dt>سود کل</dt><dd class="pos">${fa(Math.round(r.totalProfit))} ${u}</dd></div>
    <div><dt>جمع اقساط</dt><dd>${fa(Math.round(r.totalInstallments))} ${u}</dd></div>
    <div><dt>جمع پرداختی خریدار (با پیش‌پرداخت)</dt><dd>${fa(Math.round(r.totalPaid))} ${u}</dd></div>
    <div><dt>سود کل نسبت به مبلغ اقساطی</dt><dd>${faPercent(r.profitOfPrincipalPercent, 1)}</dd></div>
    <div><dt>نرخ ماهانهٔ استفاده‌شده</dt><dd>${faPercent(r.monthlyRatePercent, 3)}</dd></div>
  </dl>`;
  const amort = method.get() === 'amortized';
  schedule.innerHTML = `<div class="tbl-wrap"><table class="tbl">
    <thead><tr><th>قسط</th><th>سررسید</th><th>مبلغ قسط</th>${amort ? '<th>سود</th><th>اصل</th>' : ''}<th>مانده</th></tr></thead>
    <tbody>${r.rows.map((x) => `<tr><td>${fa(x.n)}</td><td>${Number.isFinite(x.jdn) ? formatJalali(x.jdn) : '—'}</td><td class="n">${fa(Math.round(x.amount))}</td>${amort ? `<td class="n">${fa(Math.round(x.interest))}</td><td class="n">${fa(Math.round(x.principal))}</td>` : ''}<td class="n">${fa(Math.round(x.remaining))}</td></tr>`).join('')}</tbody>
    <tfoot><tr><td colspan="2">جمع</td><td class="n">${fa(Math.round(r.rows.reduce((s, x) => s + x.amount, 0)))}</td>${amort ? `<td class="n">${fa(Math.round(r.totalProfit))}</td><td class="n">${fa(r.principal)}</td>` : ''}<td></td></tr></tfoot>
  </table></div>`;
}

function resultText() {
  if (!last) return '';
  const u = unitLabel();
  return [
    `فروش اقساطی: ${fa(last.months)} قسط ${fa(Math.round(last.installment))} ${u}`,
    `پیش‌پرداخت ${fa(last.down)} ${u} · سود کل ${fa(Math.round(last.totalProfit))} ${u} · جمع پرداختی ${fa(Math.round(last.totalPaid))} ${u}`,
    ...last.rows.filter((x) => Number.isFinite(x.jdn)).map((x) => `• ${formatJalali(x.jdn)}: ${fa(Math.round(x.amount))} ${u}`),
  ].join('\n');
}

const s = loadState();
if (s) {
  setValue(f.price, s.p); setValue(f.down, s.d); setValue(f.months, s.n); setValue(f.rate, s.r);
  f.rateUnit.value = s.ru ?? 'monthly'; f.first.value = s.fi ?? ''; f.roundTo.value = s.ro ?? '0';
  method.set(s.m ?? 'flat', true);
} else {
  setValue(f.price, 100_000_000); setValue(f.down, 30_000_000); setValue(f.months, 10); setValue(f.rate, 3);
  f.first.value = formatJalaliInput(addJalaliMonths(todayJdn(), 1));
  f.roundTo.value = '10000';
}
bindInputs(tool, debounce(render));
initUnitSwitch(render);
wireShare(tool, { getText: resultText, slug: 'installment' });
render();

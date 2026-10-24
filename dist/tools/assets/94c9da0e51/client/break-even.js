import {
  $, bindInputs, readNumber, setValue, initUnitSwitch, unitLabel, loadState, saveState, wireShare, debounce,
} from './common.js';
import { computeBreakEven } from '../lib/pricing.js';
import { fa, faPercent } from '../lib/digits.js';

const tool = $('#tool');
const out = $('#out');
const f = { fixed: $('#fixed'), price: $('#price'), variable: $('#variable'), target: $('#target') };
let last = null;

/** Revenue vs total cost, 0 → 2× break-even units. */
function chart(r, fixed, price, variable) {
  const W = 340; const H = 190; const P = { l: 8, r: 8, t: 10, b: 22 };
  const maxU = Math.max(r.units * 2, 2);
  const maxY = Math.max(maxU * price, fixed + maxU * variable);
  const x = (u) => W - P.r - (u / maxU) * (W - P.l - P.r); // RTL: zero on the right
  const y = (v) => H - P.b - (v / maxY) * (H - P.t - P.b);
  const bx = x(r.exactUnits); const by = y(fixed + r.exactUnits * variable);
  return `<svg class="chart" direction="ltr" viewBox="0 0 ${W} ${H}" role="img" aria-label="نمودار درآمد و هزینه">
    <line x1="${P.l}" y1="${H - P.b}" x2="${W - P.r}" y2="${H - P.b}" stroke="#DBE3EF"/>
    <polygon points="${x(0)},${y(0)} ${bx},${by} ${x(0)},${y(fixed)}" fill="#FEE2E2" opacity=".7"/>
    <polygon points="${bx},${by} ${x(maxU)},${y(maxU * price)} ${x(maxU)},${y(fixed + maxU * variable)}" fill="#DCFCE7" opacity=".8"/>
    <line x1="${x(0)}" y1="${y(fixed)}" x2="${x(maxU)}" y2="${y(fixed + maxU * variable)}" stroke="#DC2626" stroke-width="2"/>
    <line x1="${x(0)}" y1="${y(0)}" x2="${x(maxU)}" y2="${y(maxU * price)}" stroke="#4F46E5" stroke-width="2.4"/>
    <line x1="${bx}" y1="${by}" x2="${bx}" y2="${H - P.b}" stroke="#0F172A" stroke-dasharray="3 3"/>
    <circle cx="${bx}" cy="${by}" r="4.5" fill="#0F172A"/>
    <text x="${bx}" y="${H - 6}" text-anchor="middle">${fa(r.units)} واحد</text>
    <text x="${x(0)}" y="${H - 6}" text-anchor="end">۰</text>
    <text x="${x(maxU)}" y="${H - 6}" text-anchor="start">${fa(maxU)}</text>
  </svg>
  <div class="legend"><span><i style="background:#4F46E5"></i>درآمد</span><span><i style="background:#DC2626"></i>هزینهٔ کل</span><span><i style="background:#FCA5A5"></i>زیان</span><span><i style="background:#86EFAC"></i>سود</span></div>`;
}

function render() {
  const v = Object.fromEntries(Object.entries(f).map(([k, i]) => [k, readNumber(i)]));
  saveState(Object.fromEntries(Object.entries(f).map(([k, i]) => [k, i.value])));
  const r = computeBreakEven({ fixed: v.fixed, price: v.price, variable: Number.isFinite(v.variable) ? v.variable : 0, target: Number.isFinite(v.target) ? v.target : 0 });
  last = r;
  if (!r) {
    out.innerHTML = '<p class="empty">هزینهٔ ثابت و قیمت فروش را وارد کنید.</p>';
    return;
  }
  if (r.error) {
    out.innerHTML = '<p class="alert">قیمت فروش باید از هزینهٔ متغیر هر واحد بیشتر باشد؛ با این عددها هر فروش زیان را بیشتر می‌کند و نقطهٔ سر به سری وجود ندارد.</p>';
    return;
  }
  const u = unitLabel();
  const hasTarget = v.target > 0;
  out.innerHTML = `
  <div class="result-main"><div class="label">حداقل فروش ماهانه برای ضرر نکردن</div>
    <div class="value">${fa(r.units)} <small>واحد</small></div>
    <div class="sub">معادل ${fa(r.revenue)} ${u} فروش · حدود ${fa(r.units / 26, 1)} واحد در هر روز کاری</div></div>
  <dl class="kv">
    <div><dt>حاشیهٔ مشارکت هر واحد</dt><dd>${fa(r.contribution)} ${u}</dd></div>
    <div><dt>نسبت حاشیهٔ مشارکت</dt><dd>${faPercent(r.contributionRatio, 1)}</dd></div>
    ${hasTarget ? `<div><dt>فروش لازم برای سود هدف</dt><dd class="pos">${fa(r.targetUnits)} واحد · ${fa(r.targetRevenue)} ${u}</dd></div>` : ''}
  </dl>
  ${chart(r, v.fixed, v.price, Number.isFinite(v.variable) ? v.variable : 0)}`;
}

function resultText() {
  if (!last || last.error) return '';
  const u = unitLabel();
  return `نقطه سر به سر: ${fa(last.units)} واحد در ماه (${fa(last.revenue)} ${u})${readNumber(f.target) > 0 ? `\nبرای سود هدف: ${fa(last.targetUnits)} واحد (${fa(last.targetRevenue)} ${u})` : ''}`;
}

const s = loadState();
if (s) Object.entries(f).forEach(([k, i]) => setValue(i, s[k]));
else { setValue(f.fixed, 60_000_000); setValue(f.price, 450_000); setValue(f.variable, 300_000); setValue(f.target, 15_000_000); }
bindInputs(tool, debounce(render));
initUnitSwitch(render);
wireShare(tool, { getText: resultText, slug: 'break-even' });
render();

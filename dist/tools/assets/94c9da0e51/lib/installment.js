// فروش اقساطی — installment schedules for a sale on credit.
//
// Two methods, because the market uses both and they give different numbers:
//   flat       سود ساده: profit is charged on the full principal for the whole
//              term (the usual shop/bazaar quote, "ماهی ۳ درصد").
//   amortized  اقساط مساوی با سود روی مانده: each month's profit is charged on
//              the balance still owed (how bank facilities are computed).
// The rate may be given monthly or yearly; both methods accept either.

import { addJalaliMonths } from './jalali.js';

export function monthlyRate(rate, unit) {
  return unit === 'yearly' ? rate / 12 / 100 : rate / 100;
}

/** Rounds every installment but the last up to `step`; the last absorbs the rest. */
function applyRounding(amount, count, total, step) {
  if (!step || step <= 0 || count < 2) return null;
  const regular = Math.ceil(amount / step) * step;
  const last = total - regular * (count - 1);
  return last > 0 ? { regular, last } : null;
}

/**
 * @param {object} o
 * @param {number} o.price        total sale price
 * @param {number} o.down         down payment (پیش‌پرداخت)
 * @param {number} o.months       number of installments
 * @param {number} o.rate         profit rate in percent
 * @param {'monthly'|'yearly'} o.rateUnit
 * @param {'flat'|'amortized'} o.method
 * @param {number} [o.roundTo]    round installments up to this step (e.g. 10000)
 * @param {number} [o.firstJdn]   due date of the first installment
 */
export function computeInstallments(o) {
  const price = Number(o.price);
  const down = Number(o.down) || 0;
  const months = Math.trunc(Number(o.months));
  const rate = Number(o.rate) || 0;
  if (!(price > 0) || down < 0 || down >= price || !(months >= 1) || months > 600 || rate < 0) return null;

  const principal = price - down;
  const i = monthlyRate(rate, o.rateUnit);
  let installment;
  let totalProfit;

  if (o.method === 'amortized') {
    installment = i === 0 ? principal / months : (principal * i) / (1 - (1 + i) ** -months);
    totalProfit = installment * months - principal;
  } else {
    totalProfit = principal * i * months;
    installment = (principal + totalProfit) / months;
  }

  const totalInstallments = principal + totalProfit;
  const rounded = applyRounding(installment, months, Math.round(totalInstallments), o.roundTo);
  const scheduleTotal = rounded ? Math.round(totalInstallments) : totalInstallments;

  const rows = [];
  let balance = principal;
  let paid = 0;
  for (let k = 1; k <= months; k += 1) {
    let amount = installment;
    if (rounded) amount = k === months ? rounded.last : rounded.regular;
    let interest;
    let principalPart;
    if (o.method === 'amortized') {
      interest = balance * i;
      principalPart = k === months ? balance : amount - interest;
    } else {
      interest = totalProfit / months;
      principalPart = principal / months;
    }
    balance = Math.max(0, balance - principalPart);
    paid += amount;
    rows.push({
      n: k,
      jdn: Number.isFinite(o.firstJdn) ? addJalaliMonths(o.firstJdn, k - 1) : NaN,
      amount,
      interest,
      principal: principalPart,
      remaining: Math.max(0, scheduleTotal - paid),
    });
  }

  return {
    principal,
    down,
    months,
    monthlyRatePercent: i * 100,
    installment: rounded ? rounded.regular : installment,
    lastInstallment: rounded ? rounded.last : installment,
    totalProfit,
    totalInstallments,
    totalPaid: down + totalInstallments,
    profitOfPrincipalPercent: (totalProfit / principal) * 100,
    rows,
  };
}

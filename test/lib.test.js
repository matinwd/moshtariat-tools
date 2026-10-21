import test from 'node:test';
import assert from 'node:assert/strict';

import { parseNumber, fa, groupLatin, toLatinDigits, round } from '../src/lib/digits.js';
import {
  jalaliToJdn, jdnToJalali, gregorianToJdn, jdnToGregorian, isLeapJalaliYear, parseJalali,
  formatJalali, formatJalaliLong, addJalaliMonths, todayJdn, weekdayName, jalaliMonthLength,
} from '../src/lib/jalali.js';
import { toPersianWords } from '../src/lib/words.js';
import { computeRas } from '../src/lib/cheque.js';
import { computeInstallments } from '../src/lib/installment.js';
import {
  computeDiscount, chainDiscounts, computeVat, computeMarkup, markupToMargin, marginToMarkup, computeBreakEven,
} from '../src/lib/pricing.js';
import { computeInvoice } from '../src/lib/invoice.js';

const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

test('digits: parse any digit script and separator', () => {
  assert.equal(parseNumber('۱٬۲۵۰٬۰۰۰'), 1250000);
  assert.equal(parseNumber('١,٢٥٠'), 1250);
  assert.equal(parseNumber('12,500.5'), 12500.5);
  assert.equal(parseNumber('۱۲٫۵'), 12.5);
  assert.equal(parseNumber(' -3 '), -3);
  assert.ok(Number.isNaN(parseNumber('')));
  assert.ok(Number.isNaN(parseNumber('12a')));
  assert.equal(toLatinDigits('۱۴۰۵/۰۷/۲۹'), '1405/07/29');
});

test('digits: format', () => {
  assert.equal(fa(1250000), '۱٬۲۵۰٬۰۰۰');
  assert.equal(fa(12.345, 2), '۱۲٫۳۵');
  assert.equal(fa(NaN), '—');
  assert.equal(groupLatin('1250000.5'), '1,250,000.5');
  assert.equal(groupLatin('۰۰۱۲۳۴'), '1,234');
  assert.equal(round(1.005, 2), 1.01);
});

test('jalali: known anchors', () => {
  const nowruz1403 = gregorianToJdn(2024, 3, 20);
  assert.deepEqual(jdnToJalali(nowruz1403), { jy: 1403, jm: 1, jd: 1 });
  assert.equal(jalaliToJdn(1404, 1, 1), gregorianToJdn(2025, 3, 21));
  assert.equal(jalaliToJdn(1405, 1, 1), gregorianToJdn(2026, 3, 21));
  assert.equal(jalaliToJdn(1405, 7, 29), gregorianToJdn(2026, 10, 21));
  assert.deepEqual(jdnToGregorian(gregorianToJdn(2026, 10, 21)), { gy: 2026, gm: 10, gd: 21 });
  assert.equal(isLeapJalaliYear(1403), true);
  assert.equal(isLeapJalaliYear(1404), false);
  assert.equal(isLeapJalaliYear(1399), true);
  assert.equal(jalaliMonthLength(1404, 12), 29);
  assert.equal(weekdayName(gregorianToJdn(2024, 3, 20)), 'چهارشنبه');
});

test('jalali: round-trip every day for 30 years', () => {
  const start = jalaliToJdn(1390, 1, 1);
  const end = jalaliToJdn(1420, 1, 1);
  for (let d = start; d < end; d += 1) {
    const { jy, jm, jd } = jdnToJalali(d);
    assert.equal(jalaliToJdn(jy, jm, jd), d);
  }
});

test('jalali: parse and format', () => {
  assert.equal(parseJalali('۱۴۰۵/۷/۲۹'), jalaliToJdn(1405, 7, 29));
  assert.equal(parseJalali('1405-07-29'), jalaliToJdn(1405, 7, 29));
  assert.ok(Number.isNaN(parseJalali('1404/12/30')));
  assert.ok(Number.isNaN(parseJalali('1405/13/01')));
  assert.ok(Number.isNaN(parseJalali('hello')));
  assert.equal(formatJalali(jalaliToJdn(1405, 7, 9)), '۱۴۰۵/۰۷/۰۹');
  assert.equal(formatJalaliLong(jalaliToJdn(1405, 7, 29)), '۲۹ مهر ۱۴۰۵');
});

test('jalali: add months clamps to month length', () => {
  assert.equal(addJalaliMonths(jalaliToJdn(1405, 6, 31), 1), jalaliToJdn(1405, 7, 30));
  assert.equal(addJalaliMonths(jalaliToJdn(1404, 11, 30), 1), jalaliToJdn(1404, 12, 29));
  assert.equal(addJalaliMonths(jalaliToJdn(1405, 10, 15), 3), jalaliToJdn(1406, 1, 15));
  assert.equal(addJalaliMonths(jalaliToJdn(1405, 1, 15), -2), jalaliToJdn(1404, 11, 15));
});

test('jalali: today uses Tehran time', () => {
  // 21:00 UTC on 2026-10-21 is already 22 October in Tehran (UTC+3:30).
  assert.equal(todayJdn(new Date('2026-10-21T21:00:00Z')), gregorianToJdn(2026, 10, 22));
});

test('words', () => {
  assert.equal(toPersianWords(0), 'صفر');
  assert.equal(toPersianWords(15), 'پانزده');
  assert.equal(toPersianWords(101), 'صد و یک');
  assert.equal(toPersianWords(1250000), 'یک میلیون و دویست و پنجاه هزار');
  assert.equal(toPersianWords(2_000_000_005), 'دو میلیارد و پنج');
  assert.equal(toPersianWords(-40), 'منفی چهل');
});

test('cheque ras: weighted average date', () => {
  const ref = jalaliToJdn(1405, 7, 1);
  const r = computeRas([
    { amount: 10_000_000, jdn: ref + 30 },
    { amount: 20_000_000, jdn: ref + 60 },
    { amount: 30_000_000, jdn: ref + 90 },
  ], ref);
  // (10×30 + 20×60 + 30×90) / 60 = 70
  assert.equal(r.daysFromReference, 70);
  assert.equal(r.rasJdn, ref + 70);
  assert.equal(r.total, 60_000_000);
  close(r.rows[2].share, 50);
});

test('cheque ras: equal amounts = midpoint, rounding, invalid rows', () => {
  const ref = 2461000;
  const r = computeRas([{ amount: 5, jdn: ref + 10 }, { amount: 5, jdn: ref + 21 }, { amount: NaN, jdn: ref }], ref);
  assert.equal(r.count, 2);
  assert.equal(r.rasJdn, ref + 16); // 15.5 rounds up
  assert.equal(computeRas([], ref), null);
  // The reference date does not move the ras date.
  assert.equal(computeRas([{ amount: 5, jdn: ref + 10 }, { amount: 5, jdn: ref + 21 }], ref - 400).rasJdn, ref + 16);
});

test('installment: flat monthly rate', () => {
  const r = computeInstallments({ price: 100_000_000, down: 40_000_000, months: 6, rate: 3, rateUnit: 'monthly', method: 'flat' });
  assert.equal(r.principal, 60_000_000);
  close(r.totalProfit, 10_800_000);
  close(r.installment, 11_800_000);
  close(r.totalPaid, 110_800_000);
  close(r.rows.at(-1).remaining, 0);
});

test('installment: amortized yearly rate matches annuity formula', () => {
  const r = computeInstallments({ price: 120_000_000, down: 0, months: 12, rate: 24, rateUnit: 'yearly', method: 'amortized' });
  const i = 0.02;
  close(r.installment, (120_000_000 * i) / (1 - (1 + i) ** -12), 1e-4);
  close(r.rows.at(-1).remaining, 0, 1e-3);
  close(r.rows.reduce((s, x) => s + x.principal, 0), 120_000_000, 1e-3);
  assert.ok(r.totalProfit < 120_000_000 * i * 12, 'amortized profit is below flat profit');
});

test('installment: zero rate, rounding, dates, invalid input', () => {
  const first = jalaliToJdn(1405, 6, 31);
  const r = computeInstallments({ price: 1_000_000, months: 3, rate: 0, method: 'amortized', roundTo: 10_000, firstJdn: first });
  assert.equal(r.installment, 340_000);
  assert.equal(r.lastInstallment, 320_000);
  assert.equal(r.rows.reduce((s, x) => s + x.amount, 0), 1_000_000);
  assert.equal(r.rows[1].jdn, jalaliToJdn(1405, 7, 30));
  assert.equal(r.rows.at(-1).remaining, 0);
  assert.equal(computeInstallments({ price: 100, down: 100, months: 2 }), null);
  assert.equal(computeInstallments({ price: 100, months: 0 }), null);
});

test('discount', () => {
  assert.deepEqual(computeDiscount({ mode: 'final', price: 2_000_000, percent: 15 }), { price: 2_000_000, percent: 15, final: 1_700_000, saving: 300_000 });
  close(computeDiscount({ mode: 'percent', price: 2_000_000, final: 1_700_000 }).percent, 15);
  close(computeDiscount({ mode: 'original', final: 1_700_000, percent: 15 }).price, 2_000_000);
  assert.equal(computeDiscount({ mode: 'percent', price: 100, final: 120 }), null);
  assert.equal(computeDiscount({ mode: 'original', final: 100, percent: 100 }), null);
  close(chainDiscounts([10, 5]), 14.5);
});

test('vat', () => {
  assert.deepEqual(computeVat({ mode: 'add', amount: 1_000_000, rate: 10 }), { net: 1_000_000, tax: 100_000, gross: 1_100_000, rate: 10 });
  const x = computeVat({ mode: 'extract', amount: 1_100_000, rate: 10 });
  close(x.net, 1_000_000);
  close(x.tax, 100_000);
  assert.equal(computeVat({ mode: 'add', amount: -1, rate: 10 }), null);
});

test('markup and margin', () => {
  const a = computeMarkup({ mode: 'markup', cost: 800_000, markup: 25 });
  close(a.price, 1_000_000);
  close(a.margin, 20);
  const b = computeMarkup({ mode: 'margin', cost: 800_000, margin: 20 });
  close(b.price, 1_000_000);
  close(b.markup, 25);
  const c = computeMarkup({ mode: 'price', cost: 800_000, price: 600_000 });
  close(c.profit, -200_000);
  close(markupToMargin(100), 50);
  close(marginToMarkup(50), 100);
  assert.equal(computeMarkup({ mode: 'margin', cost: 1, margin: 100 }), null);
});

test('break-even', () => {
  const r = computeBreakEven({ fixed: 50_000_000, price: 250_000, variable: 150_000, target: 10_000_000 });
  assert.equal(r.units, 500);
  assert.equal(r.revenue, 125_000_000);
  close(r.contributionRatio, 40);
  assert.equal(r.targetUnits, 600);
  assert.equal(computeBreakEven({ fixed: 1, price: 10, variable: 3 }).units, 1);
  assert.equal(computeBreakEven({ fixed: 1, price: 10, variable: 10 }).error, 'no-contribution');
});

test('invoice totals', () => {
  const r = computeInvoice({
    items: [{ title: 'الف', qty: 2, price: 500_000, discount: 10 }, { title: 'ب', qty: 1, price: 200_000 }, { title: '', qty: 0, price: 5 }],
    vatEnabled: true, vatRate: 10, shipping: 50_000, extraDiscount: 100_000,
  });
  assert.equal(r.rows.length, 2);
  assert.equal(r.gross, 1_200_000);
  assert.equal(r.discount, 200_000);
  assert.equal(r.taxable, 1_000_000);
  assert.equal(r.vat, 100_000);
  assert.equal(r.total, 1_150_000);
});

// Jalali (Solar Hijri) calendar arithmetic.
//
// Dates are carried around as Julian Day Numbers (an integer day count), so
// "days between two cheques" is a subtraction and "add one month" is the only
// operation that needs calendar knowledge. The conversion is the published
// jalaali-js algorithm (Borkowski's break table), reimplemented here so the
// project has no runtime dependency.

import { toLatinDigits, faDigits } from './digits.js';

const BREAKS = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];

const div = (a, b) => ~~(a / b);
const mod = (a, b) => a - ~~(a / b) * b;

function jalCal(jy, withoutLeap) {
  const gy = jy + 621;
  let leapJ = -14;
  let jp = BREAKS[0];
  let jump = 0;
  if (jy < jp || jy >= BREAKS[BREAKS.length - 1]) throw new RangeError('Invalid Jalali year ' + jy);
  for (let i = 1; i < BREAKS.length; i += 1) {
    const jm = BREAKS[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  let n = jy - jp;
  leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (withoutLeap) return { gy, march };
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { leap, gy, march };
}

export function gregorianToJdn(gy, gm, gd) {
  let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

export function jdnToGregorian(jdn) {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

export function jalaliToJdn(jy, jm, jd) {
  const r = jalCal(jy, true);
  return gregorianToJdn(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

export function jdnToJalali(jdn) {
  const { gy } = jdnToGregorian(jdn);
  let jy = gy - 621;
  const r = jalCal(jy, false);
  let k = jdn - gregorianToJdn(gy, 3, r.march);
  if (k >= 0) {
    if (k <= 185) return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 };
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }
  return { jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 };
}

export function isLeapJalaliYear(jy) {
  return jalCal(jy, false).leap === 0;
}

export function jalaliMonthLength(jy, jm) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isLeapJalaliYear(jy) ? 30 : 29;
}

export const MONTH_NAMES = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

/**
 * Parses "1405/07/29", "۱۴۰۵/۷/۲۹" or "1405-7-29". Returns a JDN, or NaN when
 * the text is not a real Jalali date (29 Esfand of a non-leap year included).
 */
export function parseJalali(text) {
  const m = toLatinDigits(text).trim().match(/^(\d{4})\s*[/\-.]\s*(\d{1,2})\s*[/\-.]\s*(\d{1,2})$/);
  if (!m) return NaN;
  const [jy, jm, jd] = m.slice(1).map(Number);
  if (jy < 1300 || jy > 1500 || jm < 1 || jm > 12 || jd < 1 || jd > jalaliMonthLength(jy, jm)) return NaN;
  return jalaliToJdn(jy, jm, jd);
}

const pad = (n) => String(n).padStart(2, '0');

/** Latin "1405/07/29" — the form-value representation. */
export function formatJalaliInput(jdn) {
  const { jy, jm, jd } = jdnToJalali(jdn);
  return `${jy}/${pad(jm)}/${pad(jd)}`;
}

/** Persian "۱۴۰۵/۰۷/۲۹". */
export function formatJalali(jdn) {
  return faDigits(formatJalaliInput(jdn));
}

/** Persian "۲۹ مهر ۱۴۰۵". */
export function formatJalaliLong(jdn) {
  const { jy, jm, jd } = jdnToJalali(jdn);
  return `${faDigits(jd)} ${MONTH_NAMES[jm - 1]} ${faDigits(jy)}`;
}

const WEEKDAYS = ['دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه', 'یکشنبه'];
/** Weekday name; JDN 0 was a Monday. */
export function weekdayName(jdn) {
  return WEEKDAYS[mod(mod(jdn, 7) + 7, 7)];
}

/** Same day-of-month `months` later, clamped to the target month's length. */
export function addJalaliMonths(jdn, months) {
  const { jy, jm, jd } = jdnToJalali(jdn);
  const idx = jy * 12 + (jm - 1) + months;
  const ny = Math.floor(idx / 12);
  const nm = idx - ny * 12 + 1;
  return jalaliToJdn(ny, nm, Math.min(jd, jalaliMonthLength(ny, nm)));
}

/** Today's JDN in Tehran, whatever the visitor's device timezone is. */
export function todayJdn(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  return gregorianToJdn(get('year'), get('month'), get('day'));
}

// Number parsing and formatting shared by every tool, in the browser and in Node.
//
// Visitors type amounts with Persian, Arabic-Indic or Latin digits and with any
// of the thousands separators an Iranian keyboard or a pasted bank SMS produces.
// Results are shown with Persian digits, per the brand book; form values stay
// Latin so the caret math in the live formatter is predictable.

const DIGIT_MAP = {
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
};

export function toLatinDigits(value) {
  return String(value ?? '').replace(/[۰-۹٠-٩]/g, (d) => DIGIT_MAP[d]);
}

/** Parses a user-typed number. Returns NaN for empty or malformed input. */
export function parseNumber(value) {
  const s = toLatinDigits(value)
    .trim()
    .replace(/[٫]/g, '.')
    .replace(/[,،٬\s_']/g, '')
    .replace(/^[−–]/, '-');
  if (s === '' || !/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
  return Number(s);
}

const faFormatters = new Map();
function faFormatter(decimals) {
  if (!faFormatters.has(decimals)) {
    faFormatters.set(decimals, new Intl.NumberFormat('fa-IR', { maximumFractionDigits: decimals }));
  }
  return faFormatters.get(decimals);
}

/** Persian digits with the Persian thousands separator, e.g. ۱٬۲۵۰٬۰۰۰. */
export function fa(n, decimals = 0) {
  if (!Number.isFinite(n)) return '—';
  return faFormatter(decimals).format(Object.is(n, -0) ? 0 : n);
}

/** Percentage for display: ۱۲٫۵٪ */
export function faPercent(n, decimals = 2) {
  if (!Number.isFinite(n)) return '—';
  return fa(n, decimals) + '٪';
}

/** Persian digits for a plain string such as a date or an invoice number. */
export function faDigits(value) {
  return String(value).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
}

/** Latin digits with comma grouping for form inputs: 1,250,000.5 */
export function groupLatin(value) {
  const s = toLatinDigits(value).replace(/[٫]/g, '.').replace(/[^\d.-]/g, '');
  const neg = s.startsWith('-');
  const [int = '', ...rest] = s.replace(/-/g, '').split('.');
  const grouped = int.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (neg ? '-' : '') + grouped + (rest.length ? '.' + rest.join('') : '');
}

/** Rounds half away from zero to `decimals` places without binary drift. */
export function round(n, decimals = 0) {
  if (!Number.isFinite(n)) return n;
  const shifted = Math.round(Number(`${Math.abs(n)}e${decimals}`));
  return Math.sign(n) * Number(`${shifted}e-${decimals}`);
}

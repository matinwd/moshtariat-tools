// Integer amounts in Persian words, as written on invoices and cheques:
// 1_250_000 → «یک میلیون و دویست و پنجاه هزار».

const ONES = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
const TEENS = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
const TENS = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
const HUNDREDS = ['', 'صد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
const SCALES = ['', 'هزار', 'میلیون', 'میلیارد', 'هزار میلیارد', 'هزار هزار میلیارد'];

function underThousand(n) {
  const parts = [];
  const h = Math.floor(n / 100);
  const rest = n % 100;
  if (h) parts.push(HUNDREDS[h]);
  if (rest >= 10 && rest < 20) parts.push(TEENS[rest - 10]);
  else {
    const t = Math.floor(rest / 10);
    const o = rest % 10;
    if (t) parts.push(TENS[t]);
    if (o) parts.push(ONES[o]);
  }
  return parts.join(' و ');
}

export const MAX_WORDS = 999_999_999_999_999;

export function toPersianWords(value) {
  let n = Math.trunc(Number(value));
  if (!Number.isFinite(n) || Math.abs(n) > MAX_WORDS) return '';
  if (n === 0) return 'صفر';
  const negative = n < 0;
  n = Math.abs(n);
  const groups = [];
  for (let scale = 0; n > 0; scale += 1, n = Math.floor(n / 1000)) {
    const g = n % 1000;
    if (g) groups.unshift(SCALES[scale] ? `${underThousand(g)} ${SCALES[scale]}` : underThousand(g));
  }
  return (negative ? 'منفی ' : '') + groups.join(' و ');
}

// Site-wide constants and the tool registry. The registry is the single source
// for the hub page, the header menu, "related tools", and the sitemap.

export const ORIGIN = 'https://moshtariat.ir';
export const BASE = '/tools/';
export const SITE_NAME = 'مشتریات';

// Product entry points. Same URLs the main site uses (landing/inc/layout.php):
// parameterised because URL rewriting is off in the CRM, and nofollow because
// they lead to a signup flow, not to indexable content.
export const APP_ORIGIN = 'https://app.moshtariat.ir';
export const APP_TRIAL = `${APP_ORIGIN}/?controller=TrialSignupController&action=start&plugin=Subscription`;
export const APP_LOGIN = `${APP_ORIGIN}/?controller=LoginV2Controller&action=request&plugin=OtpLogin`;

/** Groups follow the three audiences the tools were designed for. */
export const GROUPS = [
  ['seller', 'برای کارشناس فروش'],
  ['manager', 'برای مدیر فروش و صاحب کسب‌وکار'],
];

export const TOOLS = [
  { slug: 'ras-cheque', group: 'seller', icon: 'cheque', name: 'محاسبه رأس چک', blurb: 'میانگین وزنی سررسید چند چک با تاریخ شمسی؛ تعداد روز تا رأس و سهم هر چک.' },
  { slug: 'proforma-invoice', group: 'seller', icon: 'invoice', name: 'پیش‌فاکتور آنلاین', blurb: 'پیش‌فاکتور با تخفیف ردیفی، ارزش افزوده و مبلغ به حروف؛ خروجی PDF و ارسال در واتساپ.' },
  { slug: 'installment', group: 'seller', icon: 'calendar', name: 'محاسبه فروش اقساطی', blurb: 'مبلغ هر قسط، سود کل و جدول اقساط با تاریخ شمسی؛ به روش سود ساده یا مانده‌ای.' },
  { slug: 'discount', group: 'seller', icon: 'percent', name: 'محاسبه درصد تخفیف', blurb: 'قیمت بعد از تخفیف، درصد تخفیف یا قیمت اولیه؛ هر دو عدد را بدهید، سومی را بگیرید.' },
  { slug: 'vat', group: 'seller', icon: 'receipt', name: 'محاسبه ارزش افزوده', blurb: 'اضافه کردن مالیات بر ارزش افزوده به قیمت یا جدا کردن آن از مبلغ نهایی.' },
  { slug: 'markup-margin', group: 'manager', icon: 'tag', name: 'قیمت تمام‌شده و درصد سود', blurb: 'قیمت فروش از روی قیمت تمام‌شده؛ تفاوت سود روی هزینه (مارک‌آپ) و حاشیه سود.' },
  { slug: 'break-even', group: 'manager', icon: 'chart', name: 'محاسبه نقطه سر به سر', blurb: 'چند واحد باید بفروشید تا هزینه‌ها پوشش داده شود و به سود هدف برسید.' },
];

export const toolUrl = (slug) => `${BASE}${slug}`;
export const toolBySlug = (slug) => TOOLS.find((t) => t.slug === slug);

/** Articles on the main site that are worth linking from a tool page. */
export const ARTICLES = {
  pricing: ['قیمت نرم‌افزار CRM و هزینهٔ کل مالکیت', '/post-crm-pricing-and-tco-guide'],
  objections: ['پاسخ به اعتراض «گرونه» در فروش', '/post-handling-price-objections'],
  kpis: ['شاخص‌های کلیدی عملکرد فروش', '/post-sales-kpis-and-metrics'],
  clv: ['ارزش طول عمر مشتری (CLV)', '/post-customer-lifetime-value-clv'],
  excel: ['قالب اکسل اطلاعات مشتری', '/post-excel-customer-template-guide'],
  followup: ['نرم‌افزار پیگیری مشتری', '/post-customer-follow-up-software'],
};

const ICONS = {
  check: '<path d="m20 6-11 11L4 12"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  copy: '<rect width="13" height="13" x="9" y="9" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  print: '<path d="M6 9V2h12v7"/><rect width="20" height="9" x="2" y="9" rx="2"/><path d="M6 14h12v8H6z"/>',
  whatsapp: '<path d="M21 12a9 9 0 0 1-13.3 7.9L3 21l1.2-4.6A9 9 0 1 1 21 12z"/><path d="M8.5 9.5c0 4 3 6.5 6 6.5.8 0 1.5-.7 1.2-1.4l-.6-1.2-1.6.5-1.9-2 .6-1.5-1.1-.7c-.7-.4-1.6.1-1.6 1z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  arrow: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
  chart: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-6"/>',
  calendar: '<rect width="18" height="16" x="3" y="5" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/>',
  percent: '<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
  receipt: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  cheque: '<rect width="20" height="12" x="2" y="6" rx="2"/><path d="M6 14h5M15 11h3M6 10h3"/>',
  invoice: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h6"/><path d="M8 13h8M8 17h5"/>',
  tools: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
};

export function icon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] ?? ICONS.check}</svg>`;
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

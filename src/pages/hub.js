import { BASE, ORIGIN, GROUPS, TOOLS, toolUrl } from '../site.js';
import { toolCard, ctaSection, faqSection, icon } from './parts.js';
import { faqLd } from '../layout.js';

const faq = [
  ['این ابزارها واقعاً رایگان‌اند؟', 'بله. برای استفاده نه ثبت‌نام لازم است نه شماره موبایل. همهٔ محاسبه‌ها در مرورگر خودتان انجام می‌شود.'],
  ['عددهایی که وارد می‌کنم کجا ذخیره می‌شود؟', 'هیچ‌جا روی سرور ما. عددها فقط داخل آدرس همان صفحه نگه داشته می‌شوند تا اگر صفحه را تازه کردید یا لینکش را برای کسی فرستادید، محاسبه از دست نرود.'],
  ['نتیجه را چطور برای مشتری یا همکار بفرستم؟', 'زیر هر نتیجه دکمه‌های «لینک این محاسبه»، «کپی نتیجه» و «واتساپ» هست. پیش‌فاکتور را هم می‌توانید چاپ کنید یا به‌صورت PDF ذخیره کنید.'],
  ['ارقام فارسی را می‌پذیرد؟', 'بله. عددها را با کیبورد فارسی یا انگلیسی بنویسید؛ جداکنندهٔ هزارگان خودکار گذاشته می‌شود و زیر مبلغ‌های بزرگ، عدد به حروف هم نمایش داده می‌شود.'],
];

export function hubPage() {
  const groups = GROUPS.map(([g, title]) => `<h2 class="group-title">${title}</h2>
<div class="grid-tools">${TOOLS.filter((t) => t.group === g).map(toolCard).join('')}</div>`).join('\n');

  const body = `<header class="page-head">
  <h1>ابزارهای رایگان محاسبات فروش</h1>
  <p class="lede">رأس چک، پیش‌فاکتور، اقساط، تخفیف، ارزش افزوده، قیمت تمام‌شده و نقطهٔ سر به سر؛ حساب‌وکتاب‌هایی که هر روز در فروش تکرار می‌شوند، با یک صفحه و بدون اکسل.</p>
  <div class="badges"><span class="badge">${icon('check')}بدون ثبت‌نام</span><span class="badge">${icon('check')}تاریخ شمسی</span><span class="badge">${icon('check')}اطلاعات از مرورگر شما خارج نمی‌شود</span></div>
</header>
${groups}
${faqSection(faq)}
${ctaSection({ title: 'حساب‌وکتاب درست شد؛ پیگیری مشتری چطور؟', text: 'مشتریات CRM فارسی است: لیدها را از دایرکت، فرم و فایل جمع می‌کند، بین کارشناس‌ها تقسیم می‌کند و نشان می‌دهد هر معامله کجای مسیر فروش است.' })}`;

  return {
    path: BASE,
    title: 'ابزارهای رایگان محاسبات فروش | رأس چک، پیش‌فاکتور، اقساط و تخفیف — مشتریات',
    description: 'مجموعه ماشین‌حساب‌های رایگان فروش: محاسبه رأس چک، ساخت پیش‌فاکتور، محاسبه اقساط، درصد تخفیف، ارزش افزوده، قیمت تمام‌شده و نقطه سر به سر. بدون ثبت‌نام و با تاریخ شمسی.',
    active: 'hub',
    crumbs: [['ابزارهای فروش', null]],
    body,
    ld: [
      {
        '@type': 'CollectionPage',
        name: 'ابزارهای رایگان محاسبات فروش',
        url: ORIGIN + BASE,
        inLanguage: 'fa-IR',
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: TOOLS.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, url: ORIGIN + toolUrl(t.slug) })),
        },
      },
      faqLd(faq),
    ],
  };
}

export function notFoundPage() {
  return {
    path: `${BASE}404`,
    title: 'صفحه پیدا نشد — ابزارهای فروش مشتریات',
    description: 'این صفحه وجود ندارد.',
    active: '',
    crumbs: [],
    noindex: true,
    body: `<header class="page-head"><h1>این صفحه پیدا نشد</h1><p class="lede">شاید آدرس اشتباه تایپ شده یا ابزار جابه‌جا شده است. یکی از ابزارهای زیر را باز کنید:</p></header>
<div class="grid-tools">${TOOLS.map(toolCard).join('')}</div>`,
  };
}

import { computeDiscount, chainDiscounts } from '../lib/pricing.js';
import { fa, faPercent } from '../lib/digits.js';
import { field, seg, unitSwitch, shareBar, privacyNote } from './parts.js';

const ex = computeDiscount({ mode: 'final', price: 2_400_000, percent: 15 });
const exP = computeDiscount({ mode: 'percent', price: 2_400_000, final: 2_000_000 });
const exO = computeDiscount({ mode: 'original', final: 1_700_000, percent: 15 });
const chain = chainDiscounts([10, 5]);

export default {
  slug: 'discount',
  title: 'محاسبه درصد تخفیف و قیمت بعد از تخفیف آنلاین — مشتریات',
  description: 'ماشین‌حساب تخفیف: قیمت بعد از تخفیف، درصد تخفیف از روی دو قیمت، یا قیمت قبل از تخفیف را در یک کلیک حساب کنید. همراه با تخفیف پلکانی (چند تخفیف پشت سر هم).',
  h1: 'محاسبه درصد تخفیف',
  lede: 'یکی از سه حالت را انتخاب کنید و دو عدد را بدهید؛ عدد سوم و مبلغ صرفه‌جویی همان لحظه نمایش داده می‌شود.',
  script: 'client/discount.js',
  tool: `<div class="tool" id="tool">
  <section class="card" aria-labelledby="in-h">
    <div class="card-head"><h2 id="in-h">چه چیزی را می‌خواهید؟</h2>${unitSwitch}</div>
    ${seg('mode', [['final', 'قیمت بعد از تخفیف'], ['percent', 'درصد تخفیف'], ['original', 'قیمت قبل از تخفیف']], 'final')}
    <div class="fields">
      <div data-show="final percent">${field({ id: 'price', label: 'قیمت اصلی (قبل از تخفیف)', unit: 'money', words: true })}</div>
      <div data-show="final original">${field({ id: 'percent', label: 'درصد تخفیف', unit: '٪', hint: 'برای تخفیف پلکانی چند درصد را با + جدا کنید؛ مثل 10+5', type: 'text', inputmode: 'text', cls: 'ltr' })}</div>
      <div data-show="percent original">${field({ id: 'final', label: 'قیمت بعد از تخفیف', unit: 'money', words: true })}</div>
    </div>
    ${privacyNote}
  </section>
  <section class="card result tool-result" aria-live="polite">
    <div id="out"><p class="empty">عددها را وارد کنید.</p></div>
    ${shareBar()}
  </section>
</div>`,
  content: `<section class="section prose" aria-labelledby="how-h">
  <h2 id="how-h">فرمول محاسبه تخفیف</h2>
  <div class="formula">قیمت بعد از تخفیف = قیمت اصلی × (۱ − درصد تخفیف ÷ ۱۰۰)</div>
  <div class="formula">درصد تخفیف = (قیمت اصلی − قیمت بعد از تخفیف) ÷ قیمت اصلی × ۱۰۰</div>
  <div class="formula">قیمت قبل از تخفیف = قیمت بعد از تخفیف ÷ (۱ − درصد تخفیف ÷ ۱۰۰)</div>
  <div class="example">
    <strong>مثال‌ها:</strong>
    ${fa(15)}٪ تخفیف روی ${fa(2_400_000)} تومان یعنی ${fa(ex.saving)} تومان کمتر و قیمت نهایی ${fa(ex.final)} تومان.
    اگر همین کالا را ${fa(2_000_000)} تومان بفروشید، ${faPercent(exP.percent, 2)} تخفیف داده‌اید.
    و اگر بعد از ${fa(15)}٪ تخفیف قیمت ${fa(1_700_000)} تومان شده، قیمت اصلی ${fa(exO.price)} تومان بوده است.
  </div>
  <h3>تخفیف پلکانی جمع نمی‌شود</h3>
  <p>${fa(10)}٪ تخفیف و بعد ${fa(5)}٪ تخفیف دیگر، برابر ${fa(15)}٪ نیست؛ تخفیف دوم روی قیمتِ تخفیف‌خورده اعمال می‌شود و مجموع واقعی ${faPercent(chain, 1)} است. در خانهٔ درصد بنویسید <span class="lat">10+5</span> تا ابزار همین را حساب کند.</p>
  <h3>تخفیف دادن یا برنگرداندن مشتری؟</h3>
  <p>هر درصد تخفیف مستقیم از سود کم می‌شود، نه از قیمت. اگر حاشیهٔ سودتان ${fa(20)}٪ باشد، ${fa(10)}٪ تخفیف نصف سود آن فروش را می‌برد. پیش از تخفیف دادن، با <a href="/tools/markup-margin">محاسبهٔ حاشیه سود</a> ببینید چقدر جا دارید.</p>
</section>`,
  faq: [
    ['درصد تخفیف را چطور حساب کنم؟', 'تفاوت قیمت اصلی و قیمت بعد از تخفیف را بر قیمت اصلی تقسیم و در ۱۰۰ ضرب کنید. مثلاً از ۲٬۴۰۰٬۰۰۰ به ۲٬۰۰۰٬۰۰۰ تومان یعنی ۴۰۰٬۰۰۰ ÷ ۲٬۴۰۰٬۰۰۰ × ۱۰۰ ≈ ۱۶٫۶۷٪.'],
    ['قیمت بعد از تخفیف چطور حساب می‌شود؟', 'قیمت اصلی را در (۱۰۰ منهای درصد تخفیف) ضرب و بر ۱۰۰ تقسیم کنید. ۱۵٪ تخفیف روی ۲٬۴۰۰٬۰۰۰ تومان می‌شود ۲٬۰۴۰٬۰۰۰ تومان.'],
    ['از روی قیمت تخفیف‌خورده، قیمت اولیه را چطور پیدا کنم؟', 'قیمت بعد از تخفیف را بر (۱ − درصد ÷ ۱۰۰) تقسیم کنید. اشتباه رایج این است که همان درصد را دوباره به قیمت اضافه کنند که عدد کمتری از قیمت واقعی می‌دهد.'],
    ['دو تخفیف پشت سر هم چند درصد می‌شود؟', 'ضریب‌ها در هم ضرب می‌شوند: (۱ − ۰٫۱) × (۱ − ۰٫۰۵) = ۰٫۸۵۵؛ یعنی مجموعاً ۱۴٫۵٪، نه ۱۵٪. در این ابزار درصدها را با + بنویسید.'],
  ],
  related: ['markup-margin', 'vat', 'proforma-invoice'],
  articles: ['objections', 'pricing'],
  cta: {
    title: 'تخفیف را برای بستن معامله می‌دهید؛ معامله را کجا دنبال می‌کنید؟',
    text: 'در مشتریات هر لید مسئول مشخص دارد، مرحلهٔ معامله روی برد پایپ‌لاین معلوم است و دلیل از دست رفتن فروش ثبت می‌شود.',
  },
};

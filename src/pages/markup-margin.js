import { computeMarkup, markupToMargin, marginToMarkup } from '../lib/pricing.js';
import { fa, faPercent } from '../lib/digits.js';
import { field, seg, unitSwitch, shareBar, privacyNote, icon } from './parts.js';

const a = computeMarkup({ mode: 'markup', cost: 800_000, markup: 25 });
const b = computeMarkup({ mode: 'margin', cost: 800_000, margin: 25 });
const pairs = [10, 20, 25, 30, 40, 50, 100].map((m) => [m, markupToMargin(m)]);

export default {
  slug: 'markup-margin',
  title: 'محاسبه قیمت تمام‌شده، قیمت فروش و درصد سود (مارک‌آپ و حاشیه سود) — مشتریات',
  description: 'ماشین‌حساب قیمت‌گذاری: قیمت تمام‌شده را از جمع هزینه‌ها بسازید و قیمت فروش را با درصد سود روی هزینه (مارک‌آپ) یا حاشیه سود حساب کنید. تبدیل مارک‌آپ و مارجین به هم.',
  h1: 'محاسبه قیمت فروش و درصد سود',
  lede: 'قیمت تمام‌شده را بدهید (یا از جمع هزینه‌ها بسازید) و قیمت فروش، سود، درصد سود روی هزینه و حاشیه سود را کنار هم ببینید.',
  script: 'client/markup-margin.js',
  tool: `<div class="tool" id="tool">
  <section class="card" aria-labelledby="in-h">
    <div class="card-head"><h2 id="in-h">قیمت تمام‌شده</h2>${unitSwitch}</div>
    <div class="fields">
      ${field({ id: 'cost', label: 'قیمت تمام‌شدهٔ هر واحد', unit: 'money', words: true })}
    </div>
    <details class="no-print" id="breakdown" style="margin-top:10px">
      <summary class="btn btn-soft btn-sm" style="list-style:none">${icon('plus')}ساختن قیمت تمام‌شده از جزء هزینه‌ها</summary>
      <div class="rows" id="costs" style="margin-top:10px"></div>
      <div class="btn-row add-row"><button type="button" class="btn btn-ghost btn-sm" id="add-cost">${icon('plus')}افزودن هزینه</button></div>
      <p class="tiny" style="margin-top:6px">وقتی جزء هزینه‌ها را وارد کنید، جمع آن‌ها خودکار در «قیمت تمام‌شده» می‌نشیند.</p>
    </details>
    <h2 style="font-size:17px;margin:20px 0 10px">قیمت فروش را از روی چه حساب کنیم؟</h2>
    ${seg('mode', [['markup', 'درصد سود روی هزینه'], ['margin', 'حاشیه سود از فروش'], ['price', 'قیمت فروش را دارم']], 'markup')}
    <div class="fields">
      <div data-show="markup">${field({ id: 'markup', label: 'درصد سود روی قیمت تمام‌شده (مارک‌آپ)', unit: '٪' })}</div>
      <div data-show="margin">${field({ id: 'margin', label: 'حاشیه سود از قیمت فروش (مارجین)', unit: '٪' })}</div>
      <div data-show="price">${field({ id: 'price', label: 'قیمت فروش', unit: 'money', words: true })}</div>
    </div>
    ${privacyNote}
  </section>
  <section class="card result tool-result" aria-live="polite">
    <div id="out"><p class="empty">قیمت تمام‌شده را وارد کنید.</p></div>
    ${shareBar()}
  </section>
</div>`,
  content: `<section class="section prose" aria-labelledby="how-h">
  <h2 id="how-h">مارک‌آپ و حاشیه سود یکی نیستند</h2>
  <p>«۲۵ درصد سود» دو معنی رایج دارد و قیمت‌ها را متفاوت می‌کند:</p>
  <ul>
    <li><strong>درصد سود روی هزینه (مارک‌آپ):</strong> سود نسبت به قیمت تمام‌شده. قیمت فروش = قیمت تمام‌شده × (۱ + مارک‌آپ ÷ ۱۰۰).</li>
    <li><strong>حاشیه سود (مارجین):</strong> سود نسبت به قیمت فروش. قیمت فروش = قیمت تمام‌شده ÷ (۱ − حاشیه ÷ ۱۰۰).</li>
  </ul>
  <div class="example">
    <strong>مثال:</strong> کالایی با قیمت تمام‌شدهٔ ${fa(800_000)} تومان.
    با ${fa(25)}٪ مارک‌آپ، قیمت فروش ${fa(a.price)} تومان می‌شود و حاشیه سودش ${faPercent(a.margin, 0)} است.
    اما با ${fa(25)}٪ حاشیه سود، قیمت فروش ${fa(b.price)} تومان است و مارک‌آپش ${faPercent(b.markup, 2)}.
  </div>
  <h3>جدول تبدیل مارک‌آپ به حاشیه سود</h3>
  <div class="tbl-wrap"><table class="tbl" style="min-width:0">
    <thead><tr><th>درصد سود روی هزینه (مارک‌آپ)</th><th>حاشیه سود از فروش</th></tr></thead>
    <tbody>${pairs.map(([m, g]) => `<tr><td>${faPercent(m, 0)}</td><td>${faPercent(g, 1)}</td></tr>`).join('')}</tbody>
  </table></div>
  <div class="formula">حاشیه = مارک‌آپ ÷ (۱۰۰ + مارک‌آپ) × ۱۰۰ &nbsp;·&nbsp; مارک‌آپ = حاشیه ÷ (۱۰۰ − حاشیه) × ۱۰۰</div>
  <h3>قیمت تمام‌شده چه چیزهایی را شامل می‌شود؟</h3>
  <p>هر هزینه‌ای که برای رساندن یک واحد کالا یا خدمت به دست مشتری می‌پردازید: خرید یا مواد اولیه، دستمزد مستقیم، بسته‌بندی، حمل، کارمزد درگاه یا پورسانت فروش، و سهم هر واحد از هزینه‌های ثابت مثل اجاره. اگر سهم هزینه‌های ثابت را نمی‌دانید، <a href="/tools/break-even">نقطهٔ سر به سر</a> را حساب کنید.</p>
</section>`,
  faq: [
    ['قیمت فروش را از روی قیمت تمام‌شده چطور حساب کنم؟', 'اگر درصد سود را روی هزینه می‌گیرید، قیمت تمام‌شده را در (۱ + درصد ÷ ۱۰۰) ضرب کنید. اگر می‌خواهید درصدی از قیمت فروش سود باشد، قیمت تمام‌شده را بر (۱ − درصد ÷ ۱۰۰) تقسیم کنید.'],
    ['فرق مارک‌آپ و مارجین چیست؟', `مارک‌آپ سود را با قیمت تمام‌شده مقایسه می‌کند و مارجین با قیمت فروش. ${fa(25)}٪ مارک‌آپ برابر ${fa(20)}٪ حاشیه سود است و ${fa(100)}٪ مارک‌آپ برابر ${fa(50)}٪ حاشیه.`],
    ['حاشیه سود ۲۰ درصد یعنی چند درصد سود روی هزینه؟', `حاشیه ${fa(20)}٪ یعنی مارک‌آپ ${faPercent(marginToMarkup(20), 0)}: کالای ${fa(800_000)} تومانی باید ${fa(1_000_000)} تومان فروخته شود.`],
    ['چرا حاشیه سود نمی‌تواند ۱۰۰ درصد باشد؟', 'چون حاشیهٔ ۱۰۰٪ یعنی همهٔ قیمت فروش سود است و قیمت تمام‌شده صفر. مارک‌آپ سقف ندارد، اما حاشیه همیشه کمتر از ۱۰۰٪ است.'],
  ],
  related: ['break-even', 'discount', 'vat'],
  articles: ['objections', 'clv'],
  cta: {
    title: 'قیمت را درست گذاشتید؛ حالا بدانید فروش کجا گیر می‌کند',
    text: 'داشبورد مشتریات نشان می‌دهد معامله‌ها در کدام مرحله می‌مانند، کدام لیدها عقب افتاده‌اند و هر کارشناس چه کرده است.',
  },
};

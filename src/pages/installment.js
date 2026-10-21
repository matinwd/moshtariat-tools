import { computeInstallments } from '../lib/installment.js';
import { fa, faPercent } from '../lib/digits.js';
import { field, seg, unitSwitch, shareBar, privacyNote } from './parts.js';

const base = { price: 100_000_000, down: 30_000_000, months: 10 };
const flat = computeInstallments({ ...base, rate: 3, rateUnit: 'monthly', method: 'flat' });
const amort = computeInstallments({ ...base, rate: 3, rateUnit: 'monthly', method: 'amortized' });

export default {
  slug: 'installment',
  title: 'محاسبه فروش اقساطی و سود اقساط آنلاین با جدول شمسی — مشتریات',
  description: 'ماشین‌حساب فروش اقساطی: با قیمت، پیش‌پرداخت، تعداد قسط و درصد سود، مبلغ هر قسط، سود کل و جدول اقساط با تاریخ شمسی را ببینید. روش سود ساده یا مانده‌ای (بانکی).',
  h1: 'محاسبه فروش اقساطی',
  lede: 'قیمت، پیش‌پرداخت، تعداد قسط و درصد سود را بدهید؛ مبلغ هر قسط، سود کل و جدول اقساط با تاریخ سررسید شمسی آماده می‌شود.',
  script: 'client/installment.js',
  tool: `<div class="tool" id="tool">
  <section class="card" aria-labelledby="in-h">
    <div class="card-head"><h2 id="in-h">شرایط فروش</h2>${unitSwitch}</div>
    <div class="fields">
      <div class="fields two">
        ${field({ id: 'price', label: 'قیمت کل', unit: 'money', words: true })}
        ${field({ id: 'down', label: 'پیش‌پرداخت', unit: 'money', words: true })}
      </div>
      <div class="fields two">
        ${field({ id: 'months', label: 'تعداد قسط', unit: 'ماه' })}
        <div class="field">
          <label for="rate">درصد سود</label>
          <div class="inp"><input id="rate" class="num" inputmode="decimal" autocomplete="off"><select id="rateUnit" aria-label="دورهٔ نرخ سود" style="flex:none;background:var(--surface);border-inline-start:1px solid var(--border);font-size:14px"><option value="monthly">٪ ماهانه</option><option value="yearly">٪ سالانه</option></select></div>
        </div>
      </div>
      <div>
        <label style="font-size:14px;font-weight:700;color:var(--navy)">روش محاسبهٔ سود</label>
        ${seg('method', [['flat', 'سود ساده (روی کل مبلغ)'], ['amortized', 'مانده‌ای / بانکی']], 'flat')}
      </div>
      <div class="fields two">
        ${field({ id: 'first', label: 'سررسید قسط اول', type: 'date', placeholder: '1405/09/01' })}
        <div class="field">
          <label for="roundTo">گرد کردن مبلغ قسط</label>
          <div class="inp"><select id="roundTo"><option value="0">بدون گرد کردن</option><option value="1000">به هزار</option><option value="10000">به ده هزار</option><option value="100000">به صد هزار</option><option value="1000000">به میلیون</option></select></div>
          <div class="hint">قسط‌ها به بالا گرد می‌شوند و قسط آخر باقی‌مانده را می‌گیرد.</div>
        </div>
      </div>
    </div>
    ${privacyNote}
  </section>
  <section class="card result tool-result" aria-live="polite">
    <div id="out"><p class="empty">عددها را وارد کنید.</p></div>
    ${shareBar({ print: true })}
  </section>
</div>
<section class="card" style="margin-top:18px" id="schedule-card" hidden aria-labelledby="sch-h">
  <div class="card-head"><h2 id="sch-h">جدول اقساط</h2></div>
  <div id="schedule"></div>
</section>`,
  content: `<section class="section prose" aria-labelledby="how-h">
  <h2 id="how-h">سود فروش اقساطی چطور حساب می‌شود؟</h2>
  <p>اول پیش‌پرداخت از قیمت کم می‌شود؛ سود فقط به باقی‌مانده (اصل مبلغ اقساطی) تعلق می‌گیرد. بعد یکی از دو روش رایج:</p>
  <h3>۱. سود ساده (روی کل مبلغ)</h3>
  <p>رایج در فروش اقساطی مغازه‌ها و فروشگاه‌ها: سود هر ماه روی <em>کل</em> اصل مبلغ حساب می‌شود، حتی وقتی بخشی از آن پرداخت شده.</p>
  <div class="formula">سود کل = اصل مبلغ × نرخ ماهانه × تعداد ماه &nbsp;·&nbsp; قسط = (اصل + سود کل) ÷ تعداد ماه</div>
  <h3>۲. مانده‌ای (اقساط مساوی، روش بانکی)</h3>
  <p>سود هر ماه فقط روی مبلغی حساب می‌شود که هنوز پرداخت نشده؛ برای همین با همان نرخ، سود کمتری از روش ساده درمی‌آید.</p>
  <div class="formula">قسط = اصل × i ÷ (۱ − (۱ + i)<sup>−n</sup>)؛ i نرخ ماهانه و n تعداد قسط</div>
  <div class="example">
    <strong>مثال:</strong> کالای ${fa(base.price)} تومانی، ${fa(base.down)} تومان پیش‌پرداخت و ${fa(base.months)} قسط با سود ${fa(3)}٪ ماهانه.
    به روش ساده، سود کل ${fa(flat.totalProfit)} و هر قسط ${fa(flat.installment)} تومان است.
    به روش مانده‌ای، سود کل ${fa(Math.round(amort.totalProfit))} و هر قسط ${fa(Math.round(amort.installment))} تومان.
    یعنی «${fa(3)}٪ ماهانه» در دو روش ${fa(Math.round(flat.totalProfit - amort.totalProfit))} تومان تفاوت سود دارد؛ در قرارداد روشن بنویسید کدام منظور است.
  </div>
  <h3>چک‌های اقساط</h3>
  <p>اگر اقساط را چک می‌گیرید، تاریخ‌ها و مبالغ جدول را در <a href="/tools/ras-cheque">محاسبهٔ رأس چک</a> وارد کنید تا میانگین سررسید را ببینید.</p>
</section>`,
  faq: [
    ['فرمول محاسبه سود فروش اقساطی چیست؟', 'در روش سود ساده، اصل مبلغ (قیمت منهای پیش‌پرداخت) را در نرخ ماهانه و تعداد ماه ضرب کنید. در روش مانده‌ای، قسط مساوی با فرمول اقساط بانکی حساب می‌شود و سود هر ماه روی ماندهٔ بدهی است.'],
    ['سود ماهانه ۳ درصد یعنی سالانه چند درصد؟', 'در روش سود ساده، ۳٪ ماهانه برابر ۳۶٪ سالانه است. این ابزار نرخ ماهانه یا سالانه را می‌پذیرد و برای تبدیل، نرخ سالانه را بر ۱۲ تقسیم می‌کند.'],
    ['روش سود ساده بهتر است یا مانده‌ای؟', 'برای فروشنده روش ساده سود بیشتری دارد و برای خریدار روش مانده‌ای ارزان‌تر است. مهم این است که روش و نرخ در قرارداد شفاف نوشته شود تا اختلافی پیش نیاید.'],
    ['پیش‌پرداخت چه اثری دارد؟', 'سود فقط به مبلغ باقی‌مانده بعد از پیش‌پرداخت تعلق می‌گیرد؛ هر چه پیش‌پرداخت بیشتر باشد، سود کل و مبلغ هر قسط کمتر می‌شود.'],
    ['تاریخ اقساط چطور تعیین می‌شود؟', 'قسط اول همان تاریخی است که وارد می‌کنید و قسط‌های بعدی همان روز در ماه‌های بعد شمسی‌اند. اگر روز در ماهی وجود نداشته باشد (مثل ۳۱ مهر)، آخرین روز همان ماه در نظر گرفته می‌شود.'],
  ],
  related: ['ras-cheque', 'proforma-invoice', 'markup-margin'],
  articles: ['followup', 'objections'],
  cta: {
    title: 'فروش اقساطی یعنی مشتری‌ای که باید ماه‌ها پیگیری شود',
    text: 'در مشتریات برای هر مشتری وظیفهٔ پیگیری با یادآوری خودکار بسازید و تاریخچهٔ تماس‌ها و یادداشت‌ها را یک‌جا ببینید.',
  },
};

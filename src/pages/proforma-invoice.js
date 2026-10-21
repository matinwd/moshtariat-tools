import { computeInvoice } from '../lib/invoice.js';
import { fa } from '../lib/digits.js';
import { toPersianWords } from '../lib/words.js';
import { field, unitSwitch, shareBar, icon } from './parts.js';

const ex = computeInvoice({
  items: [{ qty: 3, price: 1_200_000, discount: 10 }, { qty: 1, price: 850_000 }],
  vatEnabled: true, vatRate: 10,
});

const text = (id, label, placeholder = '', extra = '') => field({ id, label, type: 'text', placeholder, attrs: extra });

export default {
  slug: 'proforma-invoice',
  title: 'ساخت پیش‌فاکتور آنلاین رایگان | پیش‌فاکتور PDF با ارزش افزوده — مشتریات',
  description: 'پیش‌فاکتورساز آنلاین رایگان: اقلام، تخفیف، ارزش افزوده و هزینهٔ ارسال را وارد کنید و پیش‌فاکتور فارسی با مبلغ به حروف را چاپ، PDF یا در واتساپ ارسال کنید. بدون ثبت‌نام.',
  h1: 'ساخت پیش‌فاکتور آنلاین',
  lede: 'مشخصات فروشنده و خریدار و اقلام را وارد کنید؛ پیش‌فاکتور با جمع، تخفیف، ارزش افزوده و مبلغ به حروف کنار فرم ساخته می‌شود و با یک کلیک چاپ یا ارسال می‌شود.',
  script: 'client/proforma-invoice.js',
  tool: `<div class="tool" id="tool">
  <section class="card no-print" aria-labelledby="in-h">
    <div class="card-head"><h2 id="in-h">اطلاعات پیش‌فاکتور</h2>${unitSwitch}</div>
    <div class="fields">
      <div class="fields two">
        ${text('seller', 'نام فروشنده / فروشگاه', 'مثلاً بازرگانی نمونه')}
        ${text('sellerPhone', 'تلفن فروشنده', '021...', 'dir="ltr" inputmode="tel"')}
      </div>
      ${text('sellerAddress', 'نشانی فروشنده (اختیاری)')}
      <div class="fields two">
        ${text('buyer', 'نام خریدار')}
        ${text('buyerPhone', 'تلفن خریدار', '0912...', 'dir="ltr" inputmode="tel"')}
      </div>
      <div class="fields two">
        ${text('number', 'شمارهٔ پیش‌فاکتور', '', 'dir="ltr"')}
        ${field({ id: 'date', label: 'تاریخ', type: 'date', placeholder: '1405/08/01' })}
      </div>
      ${field({ id: 'validity', label: 'اعتبار', unit: 'روز', hint: 'خالی بگذارید تا در پیش‌فاکتور نیاید.' })}
    </div>

    <h2 style="font-size:17px;margin:22px 0 10px">اقلام</h2>
    <div class="rows" id="items"></div>
    <div class="btn-row add-row"><button type="button" class="btn btn-soft btn-sm" id="add-item">${icon('plus')}افزودن ردیف</button></div>

    <h2 style="font-size:17px;margin:22px 0 10px">جمع و مالیات</h2>
    <div class="fields">
      <div class="fields two">
        ${field({ id: 'extraDiscount', label: 'تخفیف کلی (مبلغ)', unit: 'money' })}
        ${field({ id: 'shipping', label: 'هزینهٔ ارسال', unit: 'money' })}
      </div>
      <div class="fields two" style="align-items:end">
        <label class="check"><input type="checkbox" id="vatEnabled"> مالیات بر ارزش افزوده اضافه شود</label>
        ${field({ id: 'vatRate', label: 'نرخ ارزش افزوده', unit: '٪', value: '10' })}
      </div>
      <div class="field"><label for="notes">توضیحات و شرایط</label><div class="inp"><textarea id="notes" rows="3" placeholder="مثلاً: تحویل ۳ روز کاری پس از واریز. پرداخت: کارت به کارت یا چک."></textarea></div></div>
    </div>
    <p class="privacy">${icon('shield')}<span>اطلاعات فقط در مرورگر شما می‌ماند. مشخصات فروشنده برای پیش‌فاکتورهای بعدی روی همین دستگاه به خاطر سپرده می‌شود. لینک اشتراک‌گذاری، کل پیش‌فاکتور را در خود دارد؛ آن را فقط برای خریدار بفرستید.</span></p>
  </section>
  <section class="tool-result" aria-live="polite" aria-label="پیش‌نمایش پیش‌فاکتور">
    <div id="doc" class="inv"></div>
    <div class="card no-print" style="margin-top:12px;padding:6px 14px"><div class="share no-print" style="margin:0;padding:12px 0;border:0">
      <button type="button" class="btn btn-primary btn-sm" data-action="print">${icon('print')}چاپ / PDF</button>
      <button type="button" class="btn btn-ghost btn-sm" data-action="whatsapp">${icon('whatsapp')}ارسال در واتساپ</button>
      <button type="button" class="btn btn-ghost btn-sm" data-action="copy-link">${icon('link')}لینک پیش‌فاکتور</button>
      <button type="button" class="btn btn-ghost btn-sm" data-action="copy-result">${icon('copy')}کپی خلاصه</button>
    </div></div>
  </section>
</div>`,
  content: `<section class="section prose" aria-labelledby="how-h">
  <h2 id="how-h">پیش‌فاکتور چیست و چه چیزهایی باید داشته باشد؟</h2>
  <p>پیش‌فاکتور (پروفرما) پیشنهاد قیمت مکتوب فروشنده است، پیش از قطعی شدن خرید. خریدار با آن قیمت را تأیید، بودجه را هماهنگ یا مبلغ را واریز می‌کند. یک پیش‌فاکتور خوب این‌ها را دارد:</p>
  <ul>
    <li>نام و تلفن فروشنده و خریدار، شماره و تاریخ پیش‌فاکتور</li>
    <li>شرح دقیق هر قلم، تعداد، قیمت واحد و تخفیف</li>
    <li>جمع، مالیات بر ارزش افزوده، هزینهٔ ارسال و مبلغ نهایی به عدد و حروف</li>
    <li>مدت اعتبار قیمت و شرایط پرداخت و تحویل</li>
  </ul>
  <div class="example">
    <strong>مثال:</strong> ${fa(3)} عدد کالای ${fa(1_200_000)} تومانی با ${fa(10)}٪ تخفیف و یک قلم ${fa(850_000)} تومانی:
    جمع بعد از تخفیف ${fa(ex.taxable)} تومان، ارزش افزودهٔ ${fa(10)}٪ ${fa(ex.vat)} تومان و مبلغ نهایی <strong>${fa(ex.total)} تومان</strong>
    (${toPersianWords(ex.total)} تومان).
  </div>
  <h3>پیش‌فاکتور با فاکتور رسمی فرق دارد</h3>
  <p>پیش‌فاکتور سند پیشنهاد قیمت است و جای صورت‌حساب رسمی را نمی‌گیرد. اگر مشمول سامانهٔ مؤدیان هستید، صورت‌حساب الکترونیکی فروش قطعی را باید از همان سامانه صادر کنید. برای مبلغ مالیات، <a href="/tools/vat">محاسبهٔ ارزش افزوده</a> را ببینید.</p>
  <h3>چطور PDF بگیرم؟</h3>
  <p>روی «چاپ / PDF» بزنید و در پنجرهٔ چاپ، مقصد را «Save as PDF» یا «ذخیره به‌صورت PDF» انتخاب کنید. فقط خود پیش‌فاکتور در اندازهٔ A4 چاپ می‌شود.</p>
</section>`,
  faq: [
    ['پیش‌فاکتور آنلاین رایگان است؟', 'بله. بدون ثبت‌نام و بدون محدودیت تعداد، پیش‌فاکتور بسازید، چاپ کنید یا PDF بگیرید.'],
    ['چطور پیش‌فاکتور را برای مشتری بفرستم؟', 'دکمهٔ «واتساپ» خلاصهٔ مبلغ و لینک پیش‌فاکتور را در واتساپ باز می‌کند؛ مشتری با باز کردن لینک همان پیش‌فاکتور را می‌بیند. می‌توانید PDF هم بگیرید و فایل را بفرستید.'],
    ['اطلاعات پیش‌فاکتور کجا ذخیره می‌شود؟', 'روی سرور ما ذخیره نمی‌شود. مشخصات فروشنده در حافظهٔ همین مرورگر می‌ماند تا هر بار تکرارش نکنید و بقیهٔ اطلاعات فقط داخل آدرس همان صفحه است.'],
    ['ارزش افزوده چطور در پیش‌فاکتور حساب می‌شود؟', 'نرخ ارزش افزوده روی جمع اقلام بعد از کسر تخفیف‌ها اعمال می‌شود. هزینهٔ ارسال بعد از مالیات اضافه می‌شود. نرخ پیش‌فرض ۱۰٪ است و قابل تغییر است.'],
    ['می‌توانم لوگو اضافه کنم؟', 'در این نسخه نه. نام فروشگاه در سربرگ پیش‌فاکتور درشت نمایش داده می‌شود.'],
  ],
  related: ['vat', 'discount', 'installment'],
  articles: ['followup', 'excel'],
  cta: {
    title: 'پیش‌فاکتور فرستادید؛ پیگیری‌اش با کیست؟',
    text: 'بیشتر پیش‌فاکتورها بی‌جواب می‌مانند چون کسی دوباره زنگ نمی‌زند. در مشتریات هر معامله مسئول و وظیفهٔ پیگیری با یادآوری خودکار دارد.',
  },
};

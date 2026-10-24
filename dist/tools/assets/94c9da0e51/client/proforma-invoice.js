import {
  $, $$, bindInputs, readNumber, setValue, initUnitSwitch, unitLabel, loadState, saveState, wireShare, debounce, el, escapeHtml as h,
} from './common.js';
import { computeInvoice } from '../lib/invoice.js';
import { parseJalali, todayJdn, formatJalaliInput, formatJalali } from '../lib/jalali.js';
import { fa, parseNumber, groupLatin } from '../lib/digits.js';
import { toPersianWords } from '../lib/words.js';

const SELLER_KEY = 'mt-tools-invoice-seller';
const tool = $('#tool');
const doc = $('#doc');
const itemsEl = $('#items');
const TEXT = ['seller', 'sellerPhone', 'sellerAddress', 'buyer', 'buyerPhone', 'number', 'date', 'notes'];
const NUM = ['validity', 'extraDiscount', 'shipping', 'vatRate'];
const f = Object.fromEntries([...TEXT, ...NUM, 'vatEnabled'].map((id) => [id, $(`#${id}`)]));
let last = null;

function addItem(it = {}) {
  const row = el(`<div class="row">
    <span class="idx"></span>
    <div class="item-row">
      <div class="field field-title"><label>شرح کالا یا خدمت</label><div class="inp"><input class="title" autocomplete="off"></div></div>
      <div class="field"><label>تعداد</label><div class="inp"><input class="num qty" inputmode="decimal" autocomplete="off"></div></div>
      <div class="field"><label>قیمت واحد</label><div class="inp"><input class="num price" inputmode="decimal" autocomplete="off"></div></div>
      <div class="field"><label>تخفیف ٪</label><div class="inp"><input class="num discount" inputmode="decimal" autocomplete="off" placeholder="0"></div></div>
      <button type="button" class="btn btn-icon remove" aria-label="حذف ردیف"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
    </div>
  </div>`);
  $('.title', row).value = it.t ?? '';
  $('.qty', row).value = groupLatin(String(it.q ?? '1'));
  $('.price', row).value = groupLatin(String(it.p ?? ''));
  $('.discount', row).value = it.d ? groupLatin(String(it.d)) : '';
  itemsEl.append(row);
  renumber();
  return row;
}

function renumber() {
  $$('.row', itemsEl).forEach((r, i) => { $('.idx', r).textContent = `ردیف ${fa(i + 1)}`; });
}

function readItems() {
  return $$('.row', itemsEl).map((r) => ({
    t: $('.title', r).value, q: $('.qty', r).value, p: $('.price', r).value, d: $('.discount', r).value,
  }));
}

function snapshot() {
  const s = Object.fromEntries([...TEXT, ...NUM].map((k) => [k, f[k].value]));
  s.vatEnabled = f.vatEnabled.checked;
  s.items = readItems();
  return s;
}

function render() {
  const s = snapshot();
  saveState(s);
  localStorage.setItem(SELLER_KEY, JSON.stringify({ seller: s.seller, sellerPhone: s.sellerPhone, sellerAddress: s.sellerAddress }));

  const r = computeInvoice({
    items: s.items.map((it) => ({ title: it.t, qty: parseNumber(it.q), price: parseNumber(it.p), discount: parseNumber(it.d) })),
    vatEnabled: s.vatEnabled,
    vatRate: readNumber(f.vatRate),
    shipping: readNumber(f.shipping),
    extraDiscount: readNumber(f.extraDiscount),
  });
  last = r;
  const u = unitLabel();
  const dateJdn = parseJalali(s.date);
  const validity = readNumber(f.validity);
  const anyRowDiscount = r.rows.some((x) => x.discountPercent > 0);

  doc.innerHTML = `
  <div class="inv-head">
    <div>
      <div class="inv-title">پیش‌فاکتور</div>
      <div style="font-weight:800;font-size:16px">${h(s.seller) || '<span class="muted">نام فروشنده</span>'}</div>
      ${s.sellerAddress ? `<div class="tiny">${h(s.sellerAddress)}</div>` : ''}
      ${s.sellerPhone ? `<div class="tiny">تلفن: <span class="lat">${h(s.sellerPhone)}</span></div>` : ''}
    </div>
    <div class="inv-meta">
      ${s.number ? `<div><span class="muted">شماره:</span><b class="lat">${h(s.number)}</b></div>` : ''}
      ${Number.isFinite(dateJdn) ? `<div><span class="muted">تاریخ:</span><b>${formatJalali(dateJdn)}</b></div>` : ''}
      ${Number.isFinite(dateJdn) && validity > 0 ? `<div><span class="muted">معتبر تا:</span><b>${formatJalali(dateJdn + Math.trunc(validity))}</b></div>` : ''}
    </div>
  </div>
  <div class="inv-parties">
    <div class="inv-party"><b>خریدار</b>${h(s.buyer) || '—'}${s.buyerPhone ? `<br><span class="lat">${h(s.buyerPhone)}</span>` : ''}</div>
    <div class="inv-party"><b>واحد مبالغ</b>${u}</div>
  </div>
  <div class="tbl-wrap"><table class="tbl">
    <thead><tr><th>ردیف</th><th>شرح</th><th>تعداد</th><th>قیمت واحد</th>${anyRowDiscount ? '<th>تخفیف</th>' : ''}<th>مبلغ</th></tr></thead>
    <tbody>${r.rows.length ? r.rows.map((x, i) => `<tr><td>${fa(i + 1)}</td><td>${h(x.title) || '—'}</td><td class="n">${fa(x.qty, 2)}</td><td class="n">${fa(x.price)}</td>${anyRowDiscount ? `<td class="n">${x.discountPercent ? `${fa(x.discountPercent, 2)}٪` : '—'}</td>` : ''}<td class="n">${fa(x.net)}</td></tr>`).join('') : `<tr><td colspan="6" class="muted" style="text-align:center">ردیفی وارد نشده است</td></tr>`}</tbody>
  </table></div>
  <dl class="kv inv-totals">
    <div><dt>جمع کل</dt><dd>${fa(r.gross)}</dd></div>
    ${r.discount ? `<div><dt>تخفیف</dt><dd class="neg">${fa(r.discount)}</dd></div>` : ''}
    ${r.vatRate ? `<div><dt>ارزش افزوده (${fa(r.vatRate, 2)}٪)</dt><dd>${fa(r.vat)}</dd></div>` : ''}
    ${r.shipping ? `<div><dt>هزینهٔ ارسال</dt><dd>${fa(r.shipping)}</dd></div>` : ''}
    <div style="font-size:16px"><dt style="color:var(--navy);font-weight:800">مبلغ قابل پرداخت</dt><dd style="color:var(--indigo-dark);font-size:17px">${fa(r.total)} ${u}</dd></div>
  </dl>
  ${r.total > 0 ? `<div class="inv-words">مبلغ به حروف: <b>${toPersianWords(Math.round(r.total))} ${u}</b></div>` : ''}
  ${s.notes ? `<div class="inv-notes">${h(s.notes)}</div>` : ''}
  <div class="inv-sign"><div>مهر و امضای فروشنده</div><div>تأیید خریدار</div></div>
  <div class="inv-foot">ساخته‌شده با پیش‌فاکتورساز رایگان مشتریات · moshtariat.ir/tools</div>`;
}

function resultText() {
  if (!last || !last.rows.length) return '';
  const u = unitLabel();
  const s = snapshot();
  return `پیش‌فاکتور${s.number ? ` شمارهٔ ${s.number}` : ''}${s.seller ? ` از ${s.seller}` : ''}${s.buyer ? ` برای ${s.buyer}` : ''}\nمبلغ قابل پرداخت: ${fa(last.total)} ${u}\nمشاهدهٔ پیش‌فاکتور:`;
}

function init() {
  const s = loadState();
  const today = todayJdn();
  if (s) {
    [...TEXT, ...NUM].forEach((k) => { if (f[k].matches('.num')) setValue(f[k], s[k]); else f[k].value = s[k] ?? ''; });
    f.vatEnabled.checked = Boolean(s.vatEnabled);
    (s.items?.length ? s.items : [{}]).forEach(addItem);
  } else {
    let seller = {};
    try { seller = JSON.parse(localStorage.getItem(SELLER_KEY) ?? '{}'); } catch { /* ignore */ }
    f.seller.value = seller.seller ?? '';
    f.sellerPhone.value = seller.sellerPhone ?? '';
    f.sellerAddress.value = seller.sellerAddress ?? '';
    f.date.value = formatJalaliInput(today);
    f.number.value = `${formatJalaliInput(today).replace(/\//g, '')}-1`;
    setValue(f.validity, 7);
    addItem({ t: 'نمونه: کالای شماره ۱', q: 3, p: 1_200_000, d: 10 });
    addItem({ t: 'نمونه: خدمات نصب', q: 1, p: 850_000 });
  }

  $('#add-item').addEventListener('click', () => { $('.title', addItem()).focus(); render(); });
  itemsEl.addEventListener('click', (e) => {
    const b = e.target.closest('.remove');
    if (!b) return;
    b.closest('.row').remove();
    if (!$$('.row', itemsEl).length) addItem();
    renumber();
    render();
  });

  bindInputs(tool, debounce(render, 80));
  initUnitSwitch(render);
  wireShare(tool, { getText: resultText, slug: 'proforma-invoice' });
  render();
}

init();

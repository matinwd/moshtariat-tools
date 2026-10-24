// پیش‌فاکتور totals. Row discount is a percentage of the row; VAT applies to
// the discounted subtotal; shipping is added after tax and is not taxed.

export function computeInvoice({ items = [], vatEnabled = false, vatRate = 0, shipping = 0, extraDiscount = 0 }) {
  const rows = items
    .map((it) => {
      const qty = Number(it.qty);
      const unitPrice = Number(it.price);
      const disc = Math.min(100, Math.max(0, Number(it.discount) || 0));
      if (!(qty > 0) || !(unitPrice >= 0)) return null;
      const gross = qty * unitPrice;
      const discount = (gross * disc) / 100;
      return { ...it, qty, price: unitPrice, discountPercent: disc, gross, discount, net: gross - discount };
    })
    .filter(Boolean);

  const gross = rows.reduce((s, r) => s + r.gross, 0);
  const rowDiscounts = rows.reduce((s, r) => s + r.discount, 0);
  const afterRows = gross - rowDiscounts;
  const extra = Math.min(afterRows, Math.max(0, Number(extraDiscount) || 0));
  const taxable = afterRows - extra;
  const rate = vatEnabled ? Math.max(0, Number(vatRate) || 0) : 0;
  const vat = Math.round((taxable * rate) / 100);
  const ship = Math.max(0, Number(shipping) || 0);

  return {
    rows,
    gross,
    discount: rowDiscounts + extra,
    taxable,
    vatRate: rate,
    vat,
    shipping: ship,
    total: taxable + vat + ship,
  };
}

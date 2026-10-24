// Discount, VAT, markup/margin and break-even arithmetic.
// Every function returns null when the inputs cannot describe a real price, so
// the UI shows "—" instead of Infinity or a negative price.

const pos = (n) => Number.isFinite(n) && n > 0;
const nonNeg = (n) => Number.isFinite(n) && n >= 0;

// ---------------------------------------------------------------- discount

/** mode: 'final' (price+percent), 'percent' (price+final), 'original' (final+percent) */
export function computeDiscount({ mode, price, percent, final }) {
  let p = price;
  let d = percent;
  let f = final;
  if (mode === 'percent') {
    if (!pos(p) || !nonNeg(f) || f > p) return null;
    d = (1 - f / p) * 100;
  } else if (mode === 'original') {
    if (!nonNeg(f) || !nonNeg(d) || d >= 100) return null;
    p = f / (1 - d / 100);
  } else {
    if (!nonNeg(p) || !nonNeg(d) || d > 100) return null;
    f = p * (1 - d / 100);
  }
  return { price: p, percent: d, final: f, saving: p - f };
}

/** Successive discounts (10% then 5%) collapse to one effective percentage. */
export function chainDiscounts(percents) {
  const list = percents.filter((x) => Number.isFinite(x));
  if (!list.length || list.some((x) => x < 0 || x > 100)) return null;
  return (1 - list.reduce((m, x) => m * (1 - x / 100), 1)) * 100;
}

// ---------------------------------------------------------------- VAT

/** mode 'add': amount is before tax. mode 'extract': amount already includes tax. */
export function computeVat({ mode, amount, rate }) {
  if (!nonNeg(amount) || !nonNeg(rate) || rate > 100) return null;
  if (mode === 'extract') {
    const net = amount / (1 + rate / 100);
    return { net, tax: amount - net, gross: amount, rate };
  }
  const tax = (amount * rate) / 100;
  return { net: amount, tax, gross: amount + tax, rate };
}

// ---------------------------------------------------------------- markup / margin

export const markupToMargin = (markup) => (markup / (100 + markup)) * 100;
export const marginToMarkup = (margin) => (margin < 100 ? (margin / (100 - margin)) * 100 : NaN);

/** mode: 'price' (cost+price), 'markup' (cost+markup%), 'margin' (cost+margin%) */
export function computeMarkup({ mode, cost, price, markup, margin }) {
  if (!pos(cost)) return null;
  let p = price;
  if (mode === 'markup') {
    if (!Number.isFinite(markup) || markup <= -100) return null;
    p = cost * (1 + markup / 100);
  } else if (mode === 'margin') {
    if (!Number.isFinite(margin) || margin >= 100) return null;
    p = cost / (1 - margin / 100);
  } else if (!pos(p)) return null;
  const profit = p - cost;
  return { cost, price: p, profit, markup: (profit / cost) * 100, margin: (profit / p) * 100 };
}

// ---------------------------------------------------------------- break-even

/**
 * @param {number} fixed       fixed costs for the period (rent, salaries, …)
 * @param {number} price       selling price per unit
 * @param {number} variable    variable cost per unit
 * @param {number} [target]    desired profit for the period
 */
export function computeBreakEven({ fixed, price, variable, target = 0 }) {
  if (!nonNeg(fixed) || !pos(price) || !nonNeg(variable) || !nonNeg(target)) return null;
  const contribution = price - variable;
  if (contribution <= 0) return { error: 'no-contribution', contribution };
  const exactUnits = fixed / contribution;
  const units = Math.ceil(exactUnits - 1e-9);
  const targetUnits = Math.ceil((fixed + target) / contribution - 1e-9);
  return {
    contribution,
    contributionRatio: (contribution / price) * 100,
    exactUnits,
    units,
    revenue: units * price,
    exactRevenue: fixed / (contribution / price),
    targetUnits,
    targetRevenue: targetUnits * price,
  };
}

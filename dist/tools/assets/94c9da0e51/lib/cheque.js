// رأس‌گیری چک — the amount-weighted average due date of a set of cheques.
//
// Each cheque pulls the average towards its own date in proportion to its
// amount: ras = Σ(amountᵢ × dateᵢ) / Σ amountᵢ. Dates are JDNs, so the result
// does not depend on the reference date; the reference ("today", or the day of
// the sale) only matters for the "how many days from now" figure.

export function computeRas(cheques, referenceJdn) {
  const valid = cheques.filter((c) => Number.isFinite(c.amount) && c.amount > 0 && Number.isFinite(c.jdn));
  const total = valid.reduce((s, c) => s + c.amount, 0);
  if (!valid.length || total <= 0) return null;

  // Weighted average of day offsets rather than of raw JDNs: the offsets are
  // small, so the products stay far inside the exactly-representable range.
  const base = Number.isFinite(referenceJdn) ? referenceJdn : valid[0].jdn;
  const weightedOffset = valid.reduce((s, c) => s + c.amount * (c.jdn - base), 0) / total;
  const rasJdn = base + Math.round(weightedOffset);

  const dates = valid.map((c) => c.jdn);
  return {
    count: valid.length,
    total,
    rasJdn,
    exactOffset: weightedOffset,
    daysFromReference: rasJdn - base,
    firstJdn: Math.min(...dates),
    lastJdn: Math.max(...dates),
    rows: valid.map((c) => ({ ...c, share: (c.amount / total) * 100, days: c.jdn - base })),
  };
}

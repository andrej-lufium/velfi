export type CashFlow = { date: Date; amount: number };

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  // Use UTC to avoid DST issues
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return (utcB - utcA) / msPerDay;
}

// XNPV: sum(amount_i / (1+rate)^(days/365))
export function xnpv(rate: number, cashflows: CashFlow[]): number {
  if (rate <= -1) return Number.POSITIVE_INFINITY;

  const flows = [...cashflows].sort((x, y) => x.date.getTime() - y.date.getTime());
  const t0 = flows[0].date;

  return flows.reduce((acc, cf) => {
    const dt = daysBetween(t0, cf.date) / 365;
    return acc + cf.amount / Math.pow(1 + rate, dt);
  }, 0);
}

// Derivative of XNPV w.r.t rate (needed for Newton)
function dxnpv(rate: number, cashflows: CashFlow[]): number {
  if (rate <= -1) return Number.POSITIVE_INFINITY;

  const flows = [...cashflows].sort((x, y) => x.date.getTime() - y.date.getTime());
  const t0 = flows[0].date;

  return flows.reduce((acc, cf) => {
    const t = daysBetween(t0, cf.date) / 365;
    // d/dr [ amount*(1+rate)^(-t) ] = -t*amount*(1+rate)^(-t-1)
    return acc - (t * cf.amount) / Math.pow(1 + rate, t + 1);
  }, 0);
}

export function xirr(
  cashflows: CashFlow[],
  guess = 0.1,
  newtonMaxIter = 50,
  tol = 1e-10
): number {
  if (cashflows.length < 2) throw new Error("Need at least 2 cash flows.");

  const hasPos = cashflows.some(c => c.amount > 0);
  const hasNeg = cashflows.some(c => c.amount < 0);
  if (!hasPos || !hasNeg) {
    throw new Error("XIRR requires at least one positive and one negative cash flow.");
  }

  // --- 1) Newton's method ---
  let r = guess;
  for (let i = 0; i < newtonMaxIter; i++) {
    const f = xnpv(r, cashflows);
    if (Math.abs(f) < tol) return r;

    const df = dxnpv(r, cashflows);
    if (!isFinite(df) || df === 0) break;

    const next = r - f / df;

    // keep it in a sane domain; if it jumps out, stop and fallback
    if (!isFinite(next) || next <= -0.999999999) break;

    if (Math.abs(next - r) < 1e-12) return next;
    r = next;
  }

  // --- 2) Bisection fallback (robust) ---
  // Find a bracket [low, high] where XNPV(low) and XNPV(high) have opposite signs.
  let low = -0.9999;
  let high = 10; // 1000% annualized upper bound (expand if needed)

  let fLow = xnpv(low, cashflows);
  let fHigh = xnpv(high, cashflows);

  // Expand high until sign changes or limit hit
  let expand = 0;
  while (isFinite(fLow) && isFinite(fHigh) && fLow * fHigh > 0 && expand < 50) {
    high *= 2;
    fHigh = xnpv(high, cashflows);
    expand++;
  }

  if (!isFinite(fLow) || !isFinite(fHigh) || fLow * fHigh > 0) {
    throw new Error("Failed to bracket a root for XIRR (try different cash flows or guess).");
  }

  for (let i = 0; i < 200; i++) {
    const mid = (low + high) / 2;
    const fMid = xnpv(mid, cashflows);

    if (Math.abs(fMid) < tol) return mid;

    if (fLow * fMid < 0) {
      high = mid;
      fHigh = fMid;
    } else {
      low = mid;
      fLow = fMid;
    }

    if (Math.abs(high - low) < 1e-12) return (low + high) / 2;
  }

  return (low + high) / 2;
}

// =====================================================================
// Equity domain calculations: vesting, valuation, holding periods.
// =====================================================================

import type { Grant } from "./types";

export function parseDate(iso: string): Date {
  // Treat as midnight UTC to avoid TZ surprises.
  return new Date(iso + (iso.length === 10 ? "T00:00:00Z" : ""));
}

export function monthsBetween(a: Date, b: Date): number {
  return (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
}

export function addMonths(d: Date, m: number): Date {
  const r = new Date(d.getTime());
  r.setUTCMonth(r.getUTCMonth() + m);
  return r;
}

export function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Compute number of vested shares as of a target date using the grant's
 * vesting schedule. RSAs with 83(b) are considered vested at grant date
 * for tax purposes only; vesting (forfeiture risk) still follows schedule.
 */
export function vestedShares(grant: Grant, asOf: Date): number {
  const grantDate = parseDate(grant.grantDate);
  if (asOf < grantDate) return 0;
  if (!grant.vesting) return grant.shares;

  const v = grant.vesting;
  const monthsSince = monthsBetween(grantDate, asOf);
  if (monthsSince < v.cliffMonths) return 0;
  if (monthsSince >= v.totalMonths) return grant.shares;

  const periodMonths = v.cadence === "monthly" ? 1 : 3;
  const monthsAfterCliff = monthsSince - v.cliffMonths;
  const periodsAfterCliff = Math.floor(monthsAfterCliff / periodMonths);
  const totalPeriods = (v.totalMonths - v.cliffMonths) / periodMonths;
  // Cliff shares are vested upon reaching the cliff.
  const cliffFraction = v.cliffMonths / v.totalMonths;
  const cliffShares = Math.round(grant.shares * cliffFraction);
  const remainingShares = grant.shares - cliffShares;
  const perPeriod = remainingShares / Math.max(1, totalPeriods - v.cliffMonths / periodMonths);
  return Math.min(grant.shares, Math.round(cliffShares + perPeriod * periodsAfterCliff));
}

export interface VestEvent {
  date: string;
  grantId: string;
  grantLabel: string;
  type: Grant["type"];
  shares: number;
}

/** Generate forward-looking vest events between today and horizon. */
export function vestEvents(grant: Grant, fromDate: Date, untilDate: Date): VestEvent[] {
  if (!grant.vesting) return [];
  const v = grant.vesting;
  const grantDate = parseDate(grant.grantDate);
  const cliffDate = addMonths(grantDate, v.cliffMonths);
  const periodMonths = v.cadence === "monthly" ? 1 : 3;
  const events: VestEvent[] = [];

  let prevVested = 0;
  // walk in vesting cadence; emit only when vest changes.
  for (let m = 0; m <= v.totalMonths; m += periodMonths) {
    const at = m < v.cliffMonths ? cliffDate : addMonths(grantDate, m);
    const vested = vestedShares(grant, at);
    const delta = vested - prevVested;
    if (delta > 0 && at >= fromDate && at <= untilDate) {
      events.push({
        date: fmtDate(at),
        grantId: grant.id,
        grantLabel: grant.label,
        type: grant.type,
        shares: delta,
      });
    }
    prevVested = vested;
    if (vested >= grant.shares) break;
  }
  return events;
}

/** Total vested shares across all grants as of date. */
export function totalVested(grants: Grant[], asOf: Date): number {
  return grants.reduce((sum, g) => sum + vestedShares(g, asOf), 0);
}

/**
 * Estimated total equity value (vested + unvested) at a given price.
 * Options use intrinsic value (max(0, price - strike)).
 */
export function totalEquityValue(grants: Grant[], price: number, asOf: Date): number {
  let total = 0;
  for (const g of grants) {
    const vested = vestedShares(g, asOf);
    const unvested = g.shares - vested;
    if (g.type === "ISO" || g.type === "NQSO") {
      const intrinsic = Math.max(0, price - g.strikePrice);
      total += (vested + unvested) * intrinsic;
    } else if (g.type === "RSU" || g.type === "RSA") {
      total += (vested + unvested) * price;
    } else if (g.type === "ESPP") {
      total += g.shares * price;
    }
  }
  return total;
}

/** Just the value of vested + immediately exercisable shares. */
export function vestedEquityValue(grants: Grant[], price: number, asOf: Date): number {
  let total = 0;
  for (const g of grants) {
    const vested = vestedShares(g, asOf);
    if (g.type === "ISO" || g.type === "NQSO") {
      total += vested * Math.max(0, price - g.strikePrice);
    } else {
      total += vested * price;
    }
  }
  return total;
}

/** Total bargain element on currently-vested ISOs (used for AMT analysis). */
export function vestedIsoBargainElement(
  grants: Grant[],
  price: number,
  asOf: Date,
): number {
  return grants
    .filter((g) => g.type === "ISO")
    .reduce((sum, g) => sum + vestedShares(g, asOf) * Math.max(0, price - g.strikePrice), 0);
}

/** Useful one-line summary for a grant. */
export function grantSummary(g: Grant): string {
  switch (g.type) {
    case "ISO":
    case "NQSO":
      return `${g.shares.toLocaleString()} ${g.type} @ $${g.strikePrice}`;
    case "RSU":
      return `${g.shares.toLocaleString()} RSUs`;
    case "RSA":
      return `${g.shares.toLocaleString()} RSAs${g.election83b ? " (83(b))" : ""}`;
    case "ESPP":
      return `${g.shares.toLocaleString()} ESPP @ $${g.strikePrice}`;
  }
}

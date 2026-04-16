// =====================================================================
// Tax calculation primitives.
//
// All functions take and return positive USD numbers. Negative values
// (e.g. losses) should be netted by the caller before invocation.
// =====================================================================

import type { FilingStatus } from "../types";
import {
  FEDERAL_2025,
  getStateSchedule,
  type Bracket,
  type FederalSchedule,
} from "./brackets";

/** Walk a progressive bracket schedule. */
export function applyBrackets(income: number, brackets: Bracket[]): number {
  if (income <= 0) return 0;
  let tax = 0;
  let prev = 0;
  for (const b of brackets) {
    const slice = Math.min(income, b.upTo) - prev;
    if (slice > 0) tax += slice * b.rate;
    if (income <= b.upTo) break;
    prev = b.upTo;
  }
  return tax;
}

export interface TaxableSlice {
  /** All income taxed at ordinary rates: wages + ISO disqualifying / NQSO bargain element + STCG. */
  ordinaryIncome: number;
  /** Long-term capital gains + qualified dividends. */
  longTermGains: number;
  /** ISO bargain element on exercise-and-hold (an AMT preference item). */
  amtPreferenceItems: number;
  /** Investment income subject to NIIT (LTCG + qualified div + STCG + interest). */
  niitInvestmentIncome: number;
  /** Itemized deductions (or 0 to use standard). */
  itemizedDeductions: number;
}

export interface TaxResult {
  federalRegular: number;
  federalAmt: number;
  /** = max(regularFedTax + amtAddOn). */
  federalTotal: number;
  niit: number;
  addlMedicare: number;
  stateTax: number;
  /** Sum of all federal + state + NIIT + Medicare. */
  totalTax: number;
  /** Tax / (ordinaryIncome + longTermGains). */
  effectiveRate: number;
  /** True if AMT was the binding regime this year. */
  amtBinding: boolean;
  /** AMT credit generated this year (carryforward seed). */
  amtCreditGenerated: number;
}

function computeAmt(
  amti: number,
  filing: FilingStatus,
  ltcgTaxAlreadyComputed: number,
  ltcg: number,
  fed: FederalSchedule = FEDERAL_2025,
): number {
  // Apply exemption with phaseout. For each $1 above phaseout start,
  // exemption is reduced by $0.25 (until fully eliminated).
  const baseExemption = fed.amtExemption[filing];
  const phaseStart = fed.amtPhaseoutStart[filing];
  const overage = Math.max(0, amti - phaseStart);
  const exemption = Math.max(0, baseExemption - 0.25 * overage);

  // The portion of AMTI taxed at AMT rates excludes LTCG (which keep
  // their preferential rate inside AMT as well).
  const amtTaxableIncome = Math.max(0, amti - exemption - ltcg);

  let tentativeOnOrdinary: number;
  if (amtTaxableIncome <= fed.amtRateBreak) {
    tentativeOnOrdinary = amtTaxableIncome * fed.amtRates.lower;
  } else {
    tentativeOnOrdinary =
      fed.amtRateBreak * fed.amtRates.lower +
      (amtTaxableIncome - fed.amtRateBreak) * fed.amtRates.upper;
  }
  // LTCG portion of AMT keeps the preferential rate already computed above.
  return tentativeOnOrdinary + ltcgTaxAlreadyComputed;
}

export function computeYearTax(
  slice: TaxableSlice,
  filing: FilingStatus,
  stateCode: string,
  fed: FederalSchedule = FEDERAL_2025,
): TaxResult {
  const stdDed = fed.standardDeduction[filing];
  const deductions = Math.max(slice.itemizedDeductions, stdDed);

  const ordinaryAfterDed = Math.max(0, slice.ordinaryIncome - deductions);
  const ltcg = Math.max(0, slice.longTermGains);

  // ----- Regular federal -----
  const ltcgPortion = computeLtcgOnly(ordinaryAfterDed, ltcg, filing, fed);
  const ordPortion = applyBrackets(ordinaryAfterDed, fed.ordinary[filing]);
  const federalRegular = ordPortion + ltcgPortion;

  // ----- AMT -----
  // AMTI ≈ (ordinaryIncome + amtPreferenceItems - AMT-allowed deductions).
  // We allow deductions only for itemized > std (rough: we use the larger
  // of itemized vs std and add back nothing — sufficient for planning).
  const amti = ordinaryAfterDed + slice.amtPreferenceItems + ltcg;
  const tmt = computeAmt(amti, filing, ltcgPortion, ltcg, fed);
  const amtAddOn = Math.max(0, tmt - federalRegular);
  const federalTotal = federalRegular + amtAddOn;
  const amtBinding = amtAddOn > 0;
  // AMT credit is generated only by deferral preferences (ISO bargain element).
  const amtCreditGenerated = amtBinding
    ? Math.min(amtAddOn, slice.amtPreferenceItems * fed.amtRates.lower)
    : 0;

  // ----- NIIT (3.8% on lesser of investment income or excess MAGI) -----
  const magi = slice.ordinaryIncome + ltcg; // simplified
  const excessMagi = Math.max(0, magi - fed.niitThreshold[filing]);
  const niit = fed.niitRate * Math.min(slice.niitInvestmentIncome, excessMagi);

  // ----- Additional Medicare 0.9% on wages above threshold -----
  // We treat ordinary income (less amtPreferenceItems) as wages-ish for sizing.
  const wagesProxy = Math.max(0, slice.ordinaryIncome - slice.amtPreferenceItems);
  const addlMedicare =
    fed.addlMedicareRate *
    Math.max(0, wagesProxy - fed.addlMedicareThreshold[filing]);

  // ----- State -----
  const st = getStateSchedule(stateCode);
  let stateTax = 0;
  if (st.ltcgAsOrdinary) {
    stateTax = (slice.ordinaryIncome + ltcg) * st.topMarginal;
  } else {
    stateTax = slice.ordinaryIncome * st.topMarginal + ltcg * (st.ltcgRate ?? 0);
  }

  const totalTax = federalTotal + niit + addlMedicare + stateTax;
  const grossIncome = slice.ordinaryIncome + ltcg;
  const effectiveRate = grossIncome > 0 ? totalTax / grossIncome : 0;

  return {
    federalRegular,
    federalAmt: amtAddOn,
    federalTotal,
    niit,
    addlMedicare,
    stateTax,
    totalTax,
    effectiveRate,
    amtBinding,
    amtCreditGenerated,
  };
}

function computeLtcgOnly(
  ordinaryAfterDed: number,
  ltcg: number,
  filing: FilingStatus,
  fed: FederalSchedule,
): number {
  const ltcgBrackets = fed.ltcg[filing];
  let remaining = ltcg;
  let cursor = ordinaryAfterDed;
  let tax = 0;
  for (const b of ltcgBrackets) {
    if (remaining <= 0) break;
    const room = Math.max(0, b.upTo - cursor);
    const taxedHere = Math.min(remaining, room);
    if (taxedHere > 0) tax += taxedHere * b.rate;
    cursor += taxedHere;
    remaining -= taxedHere;
  }
  return tax;
}

/**
 * Estimate the maximum ISO bargain element that can be exercised
 * before AMT becomes binding for the year. Useful for "AMT crossover"
 * recommendations.
 */
export function amtCrossoverHeadroom(
  baseSlice: TaxableSlice,
  filing: FilingStatus,
  fed: FederalSchedule = FEDERAL_2025,
): number {
  // Binary search for the highest amtPreferenceItems that keeps amtBinding=false.
  let lo = 0;
  let hi = 5_000_000; // $5M ceiling for search
  for (let i = 0; i < 28; i++) {
    const mid = (lo + hi) / 2;
    const slice = { ...baseSlice, amtPreferenceItems: baseSlice.amtPreferenceItems + mid };
    const r = computeYearTax(slice, filing, "TX", fed); // state-agnostic for AMT
    if (r.amtBinding) hi = mid;
    else lo = mid;
  }
  return Math.max(0, lo);
}

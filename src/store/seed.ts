// =====================================================================
// Sensible default state so the user sees a meaningful dashboard the
// moment they land on the app. Easy to wipe via "Reset to defaults".
// =====================================================================

import type { AppState, Grant } from "../engine/types";
import { rid } from "../utils/format";

function isoDateOffsetYears(years: number): string {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d.toISOString().slice(0, 10);
}

function isoDateOffsetMonths(months: number): string {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

const sampleGrants: Grant[] = [
  {
    id: rid(),
    type: "ISO",
    label: "Hire-grant ISOs",
    grantDate: isoDateOffsetMonths(-30),
    shares: 8000,
    strikePrice: 6.5,
    fmvAtGrant: 6.5,
    expirationDate: isoDateOffsetYears(7),
    vesting: { totalMonths: 48, cliffMonths: 12, cadence: "monthly" },
  },
  {
    id: rid(),
    type: "RSU",
    label: "Annual refresh RSUs",
    grantDate: isoDateOffsetMonths(-6),
    shares: 1800,
    strikePrice: 0,
    fmvAtGrant: 38,
    vesting: { totalMonths: 48, cliffMonths: 12, cadence: "quarterly" },
  },
  {
    id: rid(),
    type: "ESPP",
    label: "ESPP — recent purchase",
    grantDate: isoDateOffsetMonths(-3),
    shares: 240,
    strikePrice: 32.3,
    fmvAtGrant: 38,
    esppDiscount: 0.15,
    esppLookbackFmv: 38,
  },
];

export const SEED_STATE: AppState = {
  profile: {
    filingStatus: "mfj",
    state: "CA",
    age: 36,
    wages: 240_000,
    otherOrdinaryIncome: 4_000,
    qualifiedInvestmentIncome: 6_000,
    itemizedDeductions: 0,
    outsideNetWorth: 480_000,
    monthsOfReserves: 6,
    riskTolerance: 6,
    maxConcentrationPct: 25,
    rankBy: "median",
    reinvestmentRate: 0.04,
  },
  company: {
    ticker: "ACME",
    companyName: "Acme Robotics, Inc.",
    currentPrice: 42,
    expectedAnnualReturn: 0.08,
    annualVolatility: 0.45,
    isPublic: true,
  },
  grants: sampleGrants,
  horizonYears: 5,
  updatedAt: Date.now(),
};

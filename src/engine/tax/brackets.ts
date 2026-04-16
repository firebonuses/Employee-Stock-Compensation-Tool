// =====================================================================
// Federal & state tax constants.
// Brackets here use 2025 published IRS values (Rev. Proc. 2024-40),
// which are the most recently confirmed schedule. Out-year brackets
// are projected by inflation for planning purposes only.
// Users should always verify against the current IRS publications
// before filing.
// =====================================================================

import type { FilingStatus } from "../types";

export interface Bracket {
  /** Income up to (and including) this amount is taxed at `rate`. */
  upTo: number;
  rate: number;
}

export interface FederalSchedule {
  ordinary: Record<FilingStatus, Bracket[]>;
  ltcg: Record<FilingStatus, Bracket[]>;
  standardDeduction: Record<FilingStatus, number>;
  /** AMT exemption amount (2025 values). */
  amtExemption: Record<FilingStatus, number>;
  /** AMT exemption phase-out begins at AMTI exceeding this amount. */
  amtPhaseoutStart: Record<FilingStatus, number>;
  /** AMT 26% / 28% break (single AMTI threshold). */
  amtRateBreak: number;
  /** AMT marginal rates. */
  amtRates: { lower: number; upper: number };
  /** NIIT (Net Investment Income Tax) rate and MAGI thresholds. */
  niitRate: number;
  niitThreshold: Record<FilingStatus, number>;
  /** Additional Medicare Tax (0.9%) on wages above threshold. */
  addlMedicareRate: number;
  addlMedicareThreshold: Record<FilingStatus, number>;
  /** Supplemental withholding for equity comp. Federal mandatory rates. */
  supplementalWithholding: { default: number; over1M: number };
}

export const FEDERAL_2025: FederalSchedule = {
  ordinary: {
    single: [
      { upTo: 11_925, rate: 0.10 },
      { upTo: 48_475, rate: 0.12 },
      { upTo: 103_350, rate: 0.22 },
      { upTo: 197_300, rate: 0.24 },
      { upTo: 250_525, rate: 0.32 },
      { upTo: 626_350, rate: 0.35 },
      { upTo: Infinity, rate: 0.37 },
    ],
    mfj: [
      { upTo: 23_850, rate: 0.10 },
      { upTo: 96_950, rate: 0.12 },
      { upTo: 206_700, rate: 0.22 },
      { upTo: 394_600, rate: 0.24 },
      { upTo: 501_050, rate: 0.32 },
      { upTo: 751_600, rate: 0.35 },
      { upTo: Infinity, rate: 0.37 },
    ],
    mfs: [
      { upTo: 11_925, rate: 0.10 },
      { upTo: 48_475, rate: 0.12 },
      { upTo: 103_350, rate: 0.22 },
      { upTo: 197_300, rate: 0.24 },
      { upTo: 250_525, rate: 0.32 },
      { upTo: 375_800, rate: 0.35 },
      { upTo: Infinity, rate: 0.37 },
    ],
    hoh: [
      { upTo: 17_000, rate: 0.10 },
      { upTo: 64_850, rate: 0.12 },
      { upTo: 103_350, rate: 0.22 },
      { upTo: 197_300, rate: 0.24 },
      { upTo: 250_500, rate: 0.32 },
      { upTo: 626_350, rate: 0.35 },
      { upTo: Infinity, rate: 0.37 },
    ],
  },
  ltcg: {
    single: [
      { upTo: 48_350, rate: 0.0 },
      { upTo: 533_400, rate: 0.15 },
      { upTo: Infinity, rate: 0.20 },
    ],
    mfj: [
      { upTo: 96_700, rate: 0.0 },
      { upTo: 600_050, rate: 0.15 },
      { upTo: Infinity, rate: 0.20 },
    ],
    mfs: [
      { upTo: 48_350, rate: 0.0 },
      { upTo: 300_000, rate: 0.15 },
      { upTo: Infinity, rate: 0.20 },
    ],
    hoh: [
      { upTo: 64_750, rate: 0.0 },
      { upTo: 566_700, rate: 0.15 },
      { upTo: Infinity, rate: 0.20 },
    ],
  },
  standardDeduction: {
    single: 15_000,
    mfj: 30_000,
    mfs: 15_000,
    hoh: 22_500,
  },
  amtExemption: {
    single: 88_100,
    mfj: 137_000,
    mfs: 68_500,
    hoh: 88_100,
  },
  amtPhaseoutStart: {
    single: 626_350,
    mfj: 1_252_700,
    mfs: 626_350,
    hoh: 626_350,
  },
  amtRateBreak: 239_100,
  amtRates: { lower: 0.26, upper: 0.28 },
  niitRate: 0.038,
  niitThreshold: {
    single: 200_000,
    mfj: 250_000,
    mfs: 125_000,
    hoh: 200_000,
  },
  addlMedicareRate: 0.009,
  addlMedicareThreshold: {
    single: 200_000,
    mfj: 250_000,
    mfs: 125_000,
    hoh: 200_000,
  },
  supplementalWithholding: { default: 0.22, over1M: 0.37 },
};

// =====================================================================
// State tax — simplified flat top-marginal rates. The full app would
// load per-state bracket schedules; we start with the 10 states most
// common for equity-comp employees and a default fallback.
// =====================================================================

export interface StateSchedule {
  code: string;
  name: string;
  /** Top marginal rate applied to all ordinary income for simplicity. */
  topMarginal: number;
  /** Whether the state taxes LTCG at the same rate as ordinary (most do). */
  ltcgAsOrdinary: boolean;
  /** Special rate for LTCG, if different. */
  ltcgRate?: number;
  /** State has its own AMT (rare; CA does). */
  hasStateAmt?: boolean;
}

export const STATE_TAXES: StateSchedule[] = [
  { code: "CA", name: "California", topMarginal: 0.133, ltcgAsOrdinary: true, hasStateAmt: true },
  { code: "NY", name: "New York", topMarginal: 0.109, ltcgAsOrdinary: true },
  { code: "MA", name: "Massachusetts", topMarginal: 0.09, ltcgAsOrdinary: true },
  { code: "WA", name: "Washington", topMarginal: 0.0, ltcgAsOrdinary: false, ltcgRate: 0.07 },
  { code: "TX", name: "Texas", topMarginal: 0.0, ltcgAsOrdinary: true },
  { code: "FL", name: "Florida", topMarginal: 0.0, ltcgAsOrdinary: true },
  { code: "CO", name: "Colorado", topMarginal: 0.044, ltcgAsOrdinary: true },
  { code: "IL", name: "Illinois", topMarginal: 0.0495, ltcgAsOrdinary: true },
  { code: "GA", name: "Georgia", topMarginal: 0.0539, ltcgAsOrdinary: true },
  { code: "NJ", name: "New Jersey", topMarginal: 0.1075, ltcgAsOrdinary: true },
  { code: "OR", name: "Oregon", topMarginal: 0.099, ltcgAsOrdinary: true },
  { code: "VA", name: "Virginia", topMarginal: 0.0575, ltcgAsOrdinary: true },
  { code: "NC", name: "North Carolina", topMarginal: 0.0425, ltcgAsOrdinary: true },
  { code: "PA", name: "Pennsylvania", topMarginal: 0.0307, ltcgAsOrdinary: true },
  { code: "TN", name: "Tennessee", topMarginal: 0.0, ltcgAsOrdinary: true },
  { code: "NV", name: "Nevada", topMarginal: 0.0, ltcgAsOrdinary: true },
  { code: "DC", name: "District of Columbia", topMarginal: 0.1075, ltcgAsOrdinary: true },
];

export function getStateSchedule(code: string): StateSchedule {
  return (
    STATE_TAXES.find((s) => s.code === code) ?? {
      code,
      name: code,
      topMarginal: 0.05,
      ltcgAsOrdinary: true,
    }
  );
}

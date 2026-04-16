// =====================================================================
// Domain types for Equity Compass.
// Money is in USD, expressed as plain numbers (not cents) for clarity.
// Dates are ISO yyyy-mm-dd strings.
// =====================================================================

export type FilingStatus = "single" | "mfj" | "mfs" | "hoh";

export type GrantType = "ISO" | "NQSO" | "RSU" | "RSA" | "ESPP";

export interface VestingSchedule {
  /** Total months over which the grant vests, e.g. 48. */
  totalMonths: number;
  /** Months before any vesting, e.g. 12. */
  cliffMonths: number;
  /** "monthly" or "quarterly" cadence after cliff. */
  cadence: "monthly" | "quarterly";
}

export interface Grant {
  id: string;
  type: GrantType;
  label: string;
  grantDate: string; // ISO date
  shares: number;
  /** Strike (options) or purchase price (ESPP). 0 for RSU/RSA. */
  strikePrice: number;
  /** Fair Market Value at grant date. */
  fmvAtGrant: number;
  /** For ISO/NQSO: option expiration. */
  expirationDate?: string;
  vesting?: VestingSchedule;
  /** ESPP discount (0–0.15 typical). */
  esppDiscount?: number;
  /** ESPP lookback offering FMV used for purchase. */
  esppLookbackFmv?: number;
  /** RSA only — was an 83(b) election filed? */
  election83b?: boolean;
  /** Notes (free text). */
  notes?: string;
}

export interface ProfileInputs {
  filingStatus: FilingStatus;
  state: string; // 2-letter state code
  age: number;
  /** Annual W-2 wages excluding equity (you + spouse if MFJ). */
  wages: number;
  /** Other ordinary income (interest, non-qualified dividends, etc.). */
  otherOrdinaryIncome: number;
  /** Qualified dividends + long-term capital gains from non-equity portfolio. */
  qualifiedInvestmentIncome: number;
  /** Itemized deductions; if 0, standard deduction is used. */
  itemizedDeductions: number;
  /** Net worth excluding employer stock. Used for concentration analysis. */
  outsideNetWorth: number;
  /** Cash reserves (months of expenses). */
  monthsOfReserves: number;
  /** Self-rated risk tolerance, 1 (conservative) – 10 (aggressive). */
  riskTolerance: number;
  /** Maximum % of net worth user is willing to hold in employer stock. */
  maxConcentrationPct: number;
  /** Which terminal-wealth metric the recommendation ranks on. */
  rankBy: RankMetric;
  /** Annual rate at which post-sale cash proceeds are assumed to grow
   *  from time-of-sale to the planning horizon. Typical values:
   *  0.00 (mattress), 0.04 (T-bills / HYSA), 0.07 (diversified equities). */
  reinvestmentRate: number;
}

export interface CompanyContext {
  ticker: string;
  companyName: string;
  /** Today's price (or 409A if private). */
  currentPrice: number;
  /** Annualized expected return (drift) for GBM. e.g. 0.08 = 8%/yr. */
  expectedAnnualReturn: number;
  /** Annualized volatility for GBM. e.g. 0.45 = 45%/yr. */
  annualVolatility: number;
  /** True if currently public; affects liquidity and lock-up logic. */
  isPublic: boolean;
}

export interface AppState {
  profile: ProfileInputs;
  company: CompanyContext;
  grants: Grant[];
  /** Planning horizon, in years from today. */
  horizonYears: number;
  /** Last-edited timestamp for persistence display. */
  updatedAt: number;
}

// =====================================================================
// Strategy & evaluation results
// =====================================================================

export type StrategyId =
  | "hold"
  | "sellToCover"
  | "sameDaySale"
  | "systematic"
  | "amtOptimized"
  | "exerciseAndHold";

export interface StrategyMeta {
  id: StrategyId;
  name: string;
  shortName: string;
  description: string;
  bestFor: string;
}

export interface YearlyTaxBreakdown {
  year: number;
  ordinaryIncome: number;
  shortTermGains: number;
  longTermGains: number;
  amtPreferenceItems: number;
  federalRegular: number;
  federalAmt: number;
  federalTotal: number;
  niit: number;
  stateTax: number;
  totalTax: number;
  effectiveRate: number;
}

export type RankMetric = "median" | "mean" | "p10";

export interface StrategyOutcome {
  strategyId: StrategyId;
  /** Median terminal after-tax wealth from employer equity. */
  medianTerminalWealth: number;
  /** Mean terminal after-tax wealth (higher than median under GBM with σ>0). */
  meanTerminalWealth: number;
  /** 10th and 90th percentile wealth (Monte Carlo). */
  p10TerminalWealth: number;
  p90TerminalWealth: number;
  /** Total taxes paid across the horizon, including the wage-tax baseline (deterministic). */
  totalTaxes: number;
  /** Taxes attributable to equity events only — i.e. totalTaxes minus the
   *  counterfactual tax bill the user would pay on wages alone. This is
   *  the number that should be subtracted from equity wealth. */
  equityAttributableTaxes: number;
  /** Peak AMT exposure in any single year. */
  peakAmt: number;
  /** Peak concentration (as % of total net worth). */
  peakConcentrationPct: number;
  /** Year-by-year tax breakdown (deterministic price path). */
  yearly: YearlyTaxBreakdown[];
  /** Probability of meeting user's primary liquidity goal. */
  goalProbability: number;
  /** Concrete actions for the recommended plan. */
  actions: ActionItem[];
}

export interface ActionItem {
  date: string; // ISO yyyy-mm-dd
  grantId?: string;
  action: "exercise" | "sell" | "hold" | "withhold";
  shares: number;
  rationale: string;
  estimatedProceeds?: number;
  estimatedTax?: number;
}

// =====================================================================
// Helpers
// =====================================================================

export const STRATEGY_LIBRARY: StrategyMeta[] = [
  {
    id: "hold",
    name: "Hold Everything",
    shortName: "Hold",
    description: "Baseline. No exercises beyond what's required, no sales.",
    bestFor: "High conviction, can absorb maximum downside.",
  },
  {
    id: "sellToCover",
    name: "Sell-to-Cover at Vest",
    shortName: "Sell-to-Cover",
    description: "Liquidate just enough RSU shares at vest to cover taxes; hold the rest.",
    bestFor: "Want to keep upside but not add cash to taxes.",
  },
  {
    id: "sameDaySale",
    name: "Same-Day Sale",
    shortName: "Same-Day",
    description: "Sell all RSUs at vest, exercise-and-sell options immediately when vested.",
    bestFor: "Maximum diversification, simplest execution.",
  },
  {
    id: "systematic",
    name: "Systematic Diversification",
    shortName: "Systematic 25%/qtr",
    description: "Sell 25% of vested holdings each quarter regardless of price.",
    bestFor: "Disciplined glide path to a target concentration.",
  },
  {
    id: "amtOptimized",
    name: "AMT-Optimized ISO Exercise",
    shortName: "AMT-Optimized",
    description: "Each year, exercise ISOs up to the AMT crossover; hold for LTCG.",
    bestFor: "Public-on-private companies, ISO heavy, multi-year planner.",
  },
  {
    id: "exerciseAndHold",
    name: "Exercise & Hold for LTCG",
    shortName: "Exercise & Hold",
    description: "Exercise vested options as cash allows; hold ≥1 year for LTCG.",
    bestFor: "Believer with cash to deploy and AMT room.",
  },
];

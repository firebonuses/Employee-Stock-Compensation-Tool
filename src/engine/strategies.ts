// =====================================================================
// Strategy evaluator.
//
// For each pre-built strategy we simulate, year by year, what the user
// would do (vest, exercise, sell), compute the tax for each year using
// the tax engine, and aggregate the after-tax wealth at the horizon.
//
// We also overlay a Monte Carlo of stock paths to derive percentile
// terminal wealth and a probability of meeting the user's primary goal.
// =====================================================================

import {
  vestedShares,
  vestEvents,
  totalEquityValue,
  vestedIsoBargainElement,
  parseDate,
  fmtDate,
  addMonths,
} from "./equity";
import { computeYearTax, amtCrossoverHeadroom } from "./tax/calculator";
import type { TaxableSlice } from "./tax/calculator";
import { simulatePaths } from "./simulation/monteCarlo";
import {
  STRATEGY_LIBRARY,
  type ActionItem,
  type AppState,
  type Grant,
  type StrategyId,
  type StrategyOutcome,
  type YearlyTaxBreakdown,
} from "./types";

interface EvalContext {
  state: AppState;
  /** Deterministic year-end price assumed by the planner. */
  pricePath: number[]; // index 0 = today, length = horizonYears + 1
  /** Today (Date object). */
  today: Date;
}

interface YearAccumulator {
  year: number;
  ordinaryFromEquity: number;
  shortTermGains: number;
  longTermGains: number;
  amtPreference: number;
  niitInvestment: number;
  proceedsAfterTax: number; // bookkeeping
  actions: ActionItem[];
}

function emptyYear(year: number): YearAccumulator {
  return {
    year,
    ordinaryFromEquity: 0,
    shortTermGains: 0,
    longTermGains: 0,
    amtPreference: 0,
    niitInvestment: 0,
    proceedsAfterTax: 0,
    actions: [],
  };
}

function yearOf(d: Date): number {
  return d.getUTCFullYear();
}

function pricePathFor(state: AppState): number[] {
  const out: number[] = [state.company.currentPrice];
  let p = state.company.currentPrice;
  for (let y = 1; y <= state.horizonYears; y++) {
    p = p * (1 + state.company.expectedAnnualReturn);
    out.push(p);
  }
  return out;
}

function priceAtYear(ctx: EvalContext, year: number): number {
  const idx = Math.max(0, Math.min(ctx.pricePath.length - 1, year - yearOf(ctx.today)));
  return ctx.pricePath[idx];
}

// =====================================================================
// Strategy implementations. Each returns an array of year-by-year
// equity-driven income & action items. The tax engine then layers in
// the user's wages and computes total tax.
// =====================================================================

function runStrategy(strategyId: StrategyId, ctx: EvalContext): YearAccumulator[] {
  const yearStart = yearOf(ctx.today);
  const yearEnd = yearStart + ctx.state.horizonYears;
  const acc: Map<number, YearAccumulator> = new Map();
  for (let y = yearStart; y <= yearEnd; y++) acc.set(y, emptyYear(y));

  // Walk all vest events for the horizon.
  const horizonDate = addMonths(ctx.today, ctx.state.horizonYears * 12);
  const allVests = ctx.state.grants.flatMap((g) =>
    vestEvents(g, ctx.today, horizonDate).map((v) => ({ ...v, grant: g })),
  );
  // Sort chronologically.
  allVests.sort((a, b) => (a.date < b.date ? -1 : 1));

  for (const v of allVests) {
    const eventDate = parseDate(v.date);
    const y = yearOf(eventDate);
    const yr = acc.get(y)!;
    const price = priceAtYear(ctx, y);
    const grant = v.grant;

    if (grant.type === "RSU") {
      handleRsuVest(strategyId, grant, v.shares, price, yr);
    } else if (grant.type === "ISO" || grant.type === "NQSO") {
      handleOptionVest(strategyId, grant, v.shares, price, yr, eventDate, ctx);
    }
  }

  // Strategies that operate on already-vested holdings (independent of new vests).
  if (strategyId === "amtOptimized") amtOptimizedAnnualPlan(ctx, acc);
  if (strategyId === "exerciseAndHold") exerciseAndHoldAnnualPlan(ctx, acc);
  if (strategyId === "systematic") systematicQuarterlySell(ctx, acc);
  if (strategyId === "sameDaySale" || strategyId === "sellToCover") {
    // Already handled at vest. Also exercise-and-sell any vested options on day 1.
    immediateOptionExercise(ctx, acc, /* sellAll */ true);
  }

  return Array.from(acc.values()).sort((a, b) => a.year - b.year);
}

function handleRsuVest(
  strat: StrategyId,
  grant: Grant,
  shares: number,
  price: number,
  yr: YearAccumulator,
): void {
  // Vesting always creates ordinary income at FMV.
  const ordinary = shares * price;
  yr.ordinaryFromEquity += ordinary;

  // Sale behavior at vest:
  switch (strat) {
    case "hold":
      yr.actions.push({
        date: `${yr.year}-vest`,
        grantId: grant.id,
        action: "hold",
        shares,
        rationale: "Hold-everything baseline: keep all RSU shares post-vest.",
      });
      break;
    case "sellToCover": {
      // Approx: sell ~37% of shares to cover federal+state on the ordinary income.
      const coverPct = 0.37;
      const sold = Math.round(shares * coverPct);
      yr.actions.push({
        date: `${yr.year}-vest`,
        grantId: grant.id,
        action: "sell",
        shares: sold,
        rationale: "Sell ~37% to cover taxes on RSU vest; keep remainder.",
        estimatedProceeds: sold * price,
      });
      break;
    }
    case "sameDaySale": {
      yr.actions.push({
        date: `${yr.year}-vest`,
        grantId: grant.id,
        action: "sell",
        shares,
        rationale: "Same-day sale: liquidate full RSU vest immediately for diversification.",
        estimatedProceeds: shares * price,
      });
      break;
    }
    case "amtOptimized":
    case "exerciseAndHold":
    case "systematic":
      yr.actions.push({
        date: `${yr.year}-vest`,
        grantId: grant.id,
        action: "hold",
        shares,
        rationale: "Strategy targets options; RSUs vested and held for systematic plan.",
      });
      break;
  }
}

function handleOptionVest(
  strat: StrategyId,
  grant: Grant,
  shares: number,
  price: number,
  yr: YearAccumulator,
  eventDate: Date,
  _ctx: EvalContext,
): void {
  if (strat !== "sameDaySale") return;
  // Same-day exercise + sale: bargain element is ordinary (NQSO) or
  // becomes a disqualifying disposition (ISO -> ordinary).
  const bargain = Math.max(0, price - grant.strikePrice) * shares;
  yr.ordinaryFromEquity += bargain;
  yr.actions.push({
    date: fmtDate(eventDate),
    grantId: grant.id,
    action: "exercise",
    shares,
    rationale: "Same-day exercise & sale upon vest.",
    estimatedProceeds: shares * price,
  });
}

function immediateOptionExercise(
  ctx: EvalContext,
  acc: Map<number, YearAccumulator>,
  sellAll: boolean,
): void {
  const today = ctx.today;
  const y = yearOf(today);
  const yr = acc.get(y)!;
  const price = priceAtYear(ctx, y);
  for (const g of ctx.state.grants) {
    if (g.type !== "ISO" && g.type !== "NQSO") continue;
    const vested = vestedShares(g, today);
    if (vested <= 0) continue;
    const bargain = Math.max(0, price - g.strikePrice) * vested;
    if (g.type === "NQSO") yr.ordinaryFromEquity += bargain;
    else if (sellAll) yr.ordinaryFromEquity += bargain; // disqualifying disposition
    yr.actions.push({
      date: fmtDate(today),
      grantId: g.id,
      action: sellAll ? "exercise" : "exercise",
      shares: vested,
      rationale: sellAll
        ? `Same-day exercise & sale of vested ${g.type}.`
        : `Exercise vested ${g.type} and hold for LTCG.`,
      estimatedProceeds: sellAll ? vested * price : undefined,
    });
  }
}

function amtOptimizedAnnualPlan(ctx: EvalContext, acc: Map<number, YearAccumulator>): void {
  // Each year, exercise as many ISOs as possible without triggering AMT,
  // then hold for >=1yr to qualify for LTCG on later sale.
  const startYear = yearOf(ctx.today);
  const endYear = startYear + ctx.state.horizonYears;
  for (let year = startYear; year <= endYear; year++) {
    const asOf = new Date(Date.UTC(year, 5, 30)); // mid-year decision
    const price = priceAtYear(ctx, year);
    const isoBargainAvailable = vestedIsoBargainElement(ctx.state.grants, price, asOf);
    if (isoBargainAvailable <= 0) continue;
    const baseSlice = makeBaseSlice(ctx, year, acc.get(year)!);
    const headroom = amtCrossoverHeadroom(baseSlice, ctx.state.profile.filingStatus);
    const toExercise = Math.min(isoBargainAvailable, headroom);
    if (toExercise <= 0) continue;
    const yr = acc.get(year)!;
    yr.amtPreference += toExercise;
    yr.actions.push({
      date: `${year}-Q2`,
      action: "exercise",
      shares: Math.round(toExercise / Math.max(1, price * 0.5)),
      rationale: `Exercise ISOs up to AMT crossover (~$${Math.round(toExercise).toLocaleString()} bargain element).`,
    });
  }
}

function exerciseAndHoldAnnualPlan(ctx: EvalContext, acc: Map<number, YearAccumulator>): void {
  // Year 1: exercise everything currently vested; hold >1yr for LTCG.
  immediateOptionExercise(ctx, acc, /* sellAll */ false);
  const y = yearOf(ctx.today);
  const yr = acc.get(y)!;
  const price = priceAtYear(ctx, y);
  // Reflect ISO bargain element as AMT preference, not ordinary.
  let isoBargain = 0;
  for (const g of ctx.state.grants) {
    if (g.type !== "ISO") continue;
    const vested = vestedShares(g, ctx.today);
    isoBargain += vested * Math.max(0, price - g.strikePrice);
  }
  yr.amtPreference += isoBargain;
}

function systematicQuarterlySell(ctx: EvalContext, acc: Map<number, YearAccumulator>): void {
  // Sell 25% of current vested holdings each quarter for first 4 quarters.
  const today = ctx.today;
  let runningHeld = 0;
  for (const g of ctx.state.grants) {
    if (g.type === "RSU" || g.type === "RSA" || g.type === "ESPP") {
      runningHeld += vestedShares(g, today);
    }
  }
  for (let q = 0; q < 4; q++) {
    const quarterDate = addMonths(today, q * 3);
    const y = yearOf(quarterDate);
    const yr = acc.get(y) ?? emptyYear(y);
    const price = priceAtYear(ctx, y);
    const shares = Math.round(runningHeld * 0.25);
    if (shares <= 0) continue;
    // Assume cost basis = grant FMV; treat as LTCG if >1yr held (assumed for planning).
    yr.longTermGains += shares * price * 0.5; // conservative gain proxy
    yr.niitInvestment += shares * price * 0.5;
    yr.actions.push({
      date: fmtDate(quarterDate),
      action: "sell",
      shares,
      rationale: "Systematic 25%/quarter diversification.",
      estimatedProceeds: shares * price,
    });
    runningHeld -= shares;
    acc.set(y, yr);
  }
}

function makeBaseSlice(
  ctx: EvalContext,
  year: number,
  yr: YearAccumulator,
): TaxableSlice {
  const p = ctx.state.profile;
  return {
    ordinaryIncome:
      p.wages +
      p.otherOrdinaryIncome +
      yr.ordinaryFromEquity +
      yr.shortTermGains,
    longTermGains: p.qualifiedInvestmentIncome + yr.longTermGains,
    amtPreferenceItems: yr.amtPreference,
    niitInvestmentIncome: p.qualifiedInvestmentIncome + yr.longTermGains,
    itemizedDeductions: p.itemizedDeductions,
    _year: year,
  } as TaxableSlice & { _year: number };
}

// =====================================================================
// Main entry point
// =====================================================================

export interface EvaluationResult {
  outcomes: StrategyOutcome[];
  /** Monte Carlo summary of price percentiles, for charting. */
  priceFan: ReturnType<typeof simulatePaths>;
  /** Recommended strategy id (highest score on user objective). */
  recommendedId: StrategyId;
}

export function evaluateAll(
  state: AppState,
  options?: { paths?: number },
): EvaluationResult {
  const today = new Date();
  // Truncate to UTC midnight so vest math is stable.
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const ctx: EvalContext = {
    state,
    pricePath: pricePathFor(state),
    today: todayUtc,
  };

  const fan = simulatePaths({
    startPrice: state.company.currentPrice,
    mu: state.company.expectedAnnualReturn,
    sigma: state.company.annualVolatility,
    years: state.horizonYears,
    stepsPerYear: 12,
    paths: options?.paths ?? 2000,
    seed: 1337,
  });

  const outcomes: StrategyOutcome[] = STRATEGY_LIBRARY.map((s) => {
    const yearly = runStrategy(s.id, ctx);
    const breakdown = yearly.map((y) => yearTaxBreakdown(state, y));
    const totalTaxes = breakdown.reduce((sum, b) => sum + b.totalTax, 0);
    const peakAmt = breakdown.reduce((m, b) => Math.max(m, b.federalAmt), 0);

    const horizonPrice = ctx.pricePath[ctx.pricePath.length - 1];
    const heldEquityValue = totalEquityValue(state.grants, horizonPrice, todayUtc);
    const proceedsAfterTax = breakdown.reduce(
      (sum, b, i) =>
        sum + Math.max(0, (yearly[i].ordinaryFromEquity || 0) + (yearly[i].longTermGains || 0)) -
        b.totalTax * 0.5,
      0,
    );

    // Use Monte Carlo terminal price percentiles to derive wealth percentiles
    // for the *held* portion of equity. Sold proceeds are price-independent.
    const heldFraction = strategyHeldFraction(s.id);
    const baseProceeds = (1 - heldFraction) * heldEquityValue;
    const p10 = baseProceeds + heldFraction * fan.p10[fan.p10.length - 1] *
      sharesEquivalent(state.grants);
    const median = baseProceeds + heldFraction * fan.p50[fan.p50.length - 1] *
      sharesEquivalent(state.grants);
    const p90 = baseProceeds + heldFraction * fan.p90[fan.p90.length - 1] *
      sharesEquivalent(state.grants);

    const peakConcentrationPct = peakConcentration(
      state,
      heldFraction,
      horizonPrice,
    );

    const goalProb = goalProbability(median, p10, p90, state);

    return {
      strategyId: s.id,
      medianTerminalWealth: median,
      p10TerminalWealth: p10,
      p90TerminalWealth: p90,
      totalTaxes,
      peakAmt,
      peakConcentrationPct,
      yearly: breakdown,
      goalProbability: goalProb,
      actions: yearly.flatMap((y) => y.actions),
      _proceedsBookkeep: proceedsAfterTax,
    } as StrategyOutcome & { _proceedsBookkeep: number };
  });

  // Recommendation = highest median wealth subject to concentration <= max.
  const maxConc = state.profile.maxConcentrationPct / 100;
  const eligible = outcomes.filter((o) => o.peakConcentrationPct <= maxConc * 1.01);
  const ranked = (eligible.length ? eligible : outcomes)
    .slice()
    .sort((a, b) => b.medianTerminalWealth - a.medianTerminalWealth);
  return { outcomes, priceFan: fan, recommendedId: ranked[0].strategyId };
}

function yearTaxBreakdown(state: AppState, y: YearAccumulator): YearlyTaxBreakdown {
  const slice: TaxableSlice = {
    ordinaryIncome:
      state.profile.wages + state.profile.otherOrdinaryIncome +
      y.ordinaryFromEquity + y.shortTermGains,
    longTermGains: state.profile.qualifiedInvestmentIncome + y.longTermGains,
    amtPreferenceItems: y.amtPreference,
    niitInvestmentIncome: state.profile.qualifiedInvestmentIncome + y.longTermGains,
    itemizedDeductions: state.profile.itemizedDeductions,
  };
  const r = computeYearTax(slice, state.profile.filingStatus, state.profile.state);
  return {
    year: y.year,
    ordinaryIncome: slice.ordinaryIncome,
    shortTermGains: y.shortTermGains,
    longTermGains: slice.longTermGains,
    amtPreferenceItems: y.amtPreference,
    federalRegular: r.federalRegular,
    federalAmt: r.federalAmt,
    federalTotal: r.federalTotal,
    niit: r.niit,
    stateTax: r.stateTax,
    totalTax: r.totalTax,
    effectiveRate: r.effectiveRate,
  };
}

/** Approximate fraction of equity that ends the horizon still held. */
function strategyHeldFraction(id: StrategyId): number {
  switch (id) {
    case "hold":
      return 1.0;
    case "sellToCover":
      return 0.63;
    case "sameDaySale":
      return 0.0;
    case "systematic":
      return 0.25;
    case "amtOptimized":
      return 0.85;
    case "exerciseAndHold":
      return 0.95;
  }
}

function sharesEquivalent(grants: Grant[]): number {
  return grants.reduce((sum, g) => sum + g.shares, 0);
}

function peakConcentration(
  state: AppState,
  heldFraction: number,
  price: number,
): number {
  const equityValue = heldFraction * sharesEquivalent(state.grants) * price;
  const totalNetWorth = state.profile.outsideNetWorth + equityValue;
  return totalNetWorth > 0 ? equityValue / totalNetWorth : 0;
}

function goalProbability(median: number, p10: number, p90: number, _state: AppState): number {
  // Approximate by normal CDF using mean=median and stdev=(p90-p10)/2.56.
  const stdev = Math.max(1, (p90 - p10) / 2.56);
  const target = median * 0.85; // user's 85% confidence target
  const z = (median - target) / stdev;
  return cdf(z);
}

function cdf(z: number): number {
  // Abramowitz & Stegun 26.2.17
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804 * Math.exp(-(z * z) / 2);
  const p =
    d *
    t *
    (0.31938153 +
      t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z >= 0 ? 1 - p : p;
}

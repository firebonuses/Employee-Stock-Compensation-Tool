// =====================================================================
// Monte Carlo simulation of stock price paths.
//
// Geometric Brownian Motion (Black-Scholes world):
//     S_{t+dt} = S_t * exp((mu - 0.5 sigma^2) dt + sigma sqrt(dt) Z)
// where Z ~ N(0, 1).
//
// We use a deterministic Mulberry32 PRNG seeded from the inputs so that
// every render produces identical results — important for trust.
// =====================================================================

export interface PathConfig {
  startPrice: number;
  /** Annualized expected return (drift). 0.08 = 8%/yr. */
  mu: number;
  /** Annualized volatility. 0.45 = 45%/yr. */
  sigma: number;
  /** Years to project. */
  years: number;
  /** Steps per year (12 = monthly is plenty for planning). */
  stepsPerYear: number;
  /** Number of paths to simulate. 1000–5000 gives smooth percentiles. */
  paths: number;
  /** Deterministic seed. */
  seed?: number;
}

export interface PathResult {
  /** Times in years from t=0. Length = stepsPerYear*years + 1. */
  t: number[];
  /** Percentile bands at each timestep. */
  p10: number[];
  p25: number[];
  p50: number[];
  p75: number[];
  p90: number[];
  /** Mean terminal price (end of horizon). */
  meanTerminal: number;
  /** Probability the stock ends below its starting price. */
  probLossAtHorizon: number;
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function boxMuller(rng: () => number): number {
  // Standard normal via Box-Muller.
  const u1 = Math.max(rng(), 1e-12);
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function quantile(sortedAscending: number[], q: number): number {
  if (sortedAscending.length === 0) return 0;
  const idx = (sortedAscending.length - 1) * q;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedAscending[lo];
  return sortedAscending[lo] + (sortedAscending[hi] - sortedAscending[lo]) * (idx - lo);
}

export function simulatePaths(cfg: PathConfig): PathResult {
  const seed = cfg.seed ?? 42;
  const rng = mulberry32(seed);
  const dt = 1 / cfg.stepsPerYear;
  const steps = Math.max(1, Math.floor(cfg.years * cfg.stepsPerYear));
  const drift = (cfg.mu - 0.5 * cfg.sigma * cfg.sigma) * dt;
  const diffusion = cfg.sigma * Math.sqrt(dt);

  // We don't store the full N x T matrix to save memory.
  // Instead we keep, for each timestep, an array of all path values
  // so we can compute percentiles after the fact.
  const samplesByStep: number[][] = Array.from({ length: steps + 1 }, () => []);
  let belowStart = 0;
  let terminalSum = 0;

  for (let p = 0; p < cfg.paths; p++) {
    let s = cfg.startPrice;
    samplesByStep[0].push(s);
    for (let i = 1; i <= steps; i++) {
      const z = boxMuller(rng);
      s = s * Math.exp(drift + diffusion * z);
      samplesByStep[i].push(s);
    }
    terminalSum += s;
    if (s < cfg.startPrice) belowStart++;
  }

  const t: number[] = new Array(steps + 1);
  const p10: number[] = new Array(steps + 1);
  const p25: number[] = new Array(steps + 1);
  const p50: number[] = new Array(steps + 1);
  const p75: number[] = new Array(steps + 1);
  const p90: number[] = new Array(steps + 1);

  for (let i = 0; i <= steps; i++) {
    const arr = samplesByStep[i];
    arr.sort((a, b) => a - b);
    t[i] = i * dt;
    p10[i] = quantile(arr, 0.1);
    p25[i] = quantile(arr, 0.25);
    p50[i] = quantile(arr, 0.5);
    p75[i] = quantile(arr, 0.75);
    p90[i] = quantile(arr, 0.9);
  }

  return {
    t,
    p10,
    p25,
    p50,
    p75,
    p90,
    meanTerminal: terminalSum / cfg.paths,
    probLossAtHorizon: belowStart / cfg.paths,
  };
}

/**
 * Quick deterministic ramp — for the "expected case" projections shown
 * alongside Monte Carlo bands.
 */
export function deterministicPath(
  startPrice: number,
  annualReturn: number,
  years: number,
  stepsPerYear = 12,
): { t: number[]; price: number[] } {
  const steps = Math.floor(years * stepsPerYear);
  const t: number[] = [];
  const price: number[] = [];
  const monthlyReturn = Math.pow(1 + annualReturn, 1 / stepsPerYear) - 1;
  let s = startPrice;
  for (let i = 0; i <= steps; i++) {
    t.push(i / stepsPerYear);
    price.push(s);
    s *= 1 + monthlyReturn;
  }
  return { t, price };
}

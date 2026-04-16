# Equity Compass — Product Specification

> A focused, deployable v1 of the Employee Stock Compensation Diversification
> Calculator. This spec is what was built; it intentionally trims the original
> scope so the product ships with depth, not breadth.

## 1. Mission

Help an employee with equity compensation answer one question well:

> **"What should I do with my stock — and when — given my taxes, my goals, and what I can't predict about the price?"**

Everything in v1 serves that question. Anything that doesn't is on the roadmap.

## 2. v1 Scope (what ships)

### 2.1 Inputs (single-screen Profile)

- **Personal & filing**: filing status, state of residence, age.
- **Income & taxes**: W-2 wages, other ordinary income, qualified dividends + LTCG outside employer stock, itemized deductions, outside net worth, months of cash reserves.
- **Risk preferences**: risk tolerance (1–10 slider), concentration ceiling as % of net worth.
- **Company & market**: company name, ticker, current price (or 409A), expected annual return (μ), annual volatility (σ), public/private flag, planning horizon (1–15 years).

### 2.2 Equity grants (CRUD)

For each grant, capture the fields that actually drive math:

| Field | ISO | NQSO | RSU | RSA | ESPP |
|---|---|---|---|---|---|
| Grant date | ✓ | ✓ | ✓ | ✓ | ✓ |
| Total shares | ✓ | ✓ | ✓ | ✓ | ✓ |
| Strike / purchase price | ✓ | ✓ | — | — | ✓ |
| FMV at grant | ✓ | ✓ | ✓ | ✓ | ✓ |
| Expiration date | ✓ | ✓ | — | — | — |
| Vesting (total months, cliff, cadence) | ✓ | ✓ | ✓ | ✓ | — |
| 83(b) election | — | — | — | ✓ | — |
| ESPP discount | — | — | — | — | ✓ |

### 2.3 Tax engine

Pure-functional TypeScript. All constants live in `src/engine/tax/brackets.ts` — easy to audit against IRS publications.

- **Federal regular**: progressive brackets, standard vs. itemized, LTCG stacked on top of ordinary slice.
- **AMT**: AMTI = ordinary + ISO bargain element + LTCG, exemption with 25% phase-out above filing-status threshold, 26%/28% rates with break at the published threshold, LTCG keeps preferential rate inside AMT, AMT add-on = max(0, TMT − regular).
- **NIIT**: 3.8% on min(investment income, MAGI − threshold).
- **Additional Medicare**: 0.9% on wages above threshold.
- **State**: top-marginal rate per state (ten most relevant states + DC; default fallback 5%). LTCG-as-ordinary unless specified.
- **AMT crossover headroom**: binary-search helper to find the maximum ISO bargain element you can add this year before AMT becomes binding.

### 2.4 Equity model

- Vesting math (cliff + monthly/quarterly accrual to total months).
- Vest event generation (forward-looking calendar of vests).
- Total / vested equity value at any price.
- ISO bargain element on currently-vested options.

### 2.5 Strategy library (six strategies)

1. **Hold** — baseline.
2. **Sell-to-Cover** — sell ~37% of each RSU vest to cover federal+state.
3. **Same-Day Sale** — RSUs sold at vest; options exercised-and-sold on day one.
4. **Systematic Diversification** — sell 25% of vested holdings each of the next four quarters.
5. **AMT-Optimized ISO Exercise** — each year, exercise ISOs up to the AMT crossover.
6. **Exercise & Hold for LTCG** — exercise vested options now; hold ≥ 1 year.

### 2.6 Simulation

- Monte Carlo via Geometric Brownian Motion, 1,500–2,000 paths × monthly steps × user horizon.
- Deterministic Mulberry32 PRNG (seed = 1337) → reproducible outputs.
- Percentile bands (P10/P25/P50/P75/P90) at every timestep.
- Probability-of-loss-at-horizon.

### 2.7 Output surfaces

- **Dashboard**: KPI hero cards, recommended-strategy banner, Monte Carlo price fan, concentration gauge, this-year tax stack, upcoming vest calendar.
- **Scenarios**: side-by-side table of all six strategies (median wealth, P10–P90 range, total tax, peak AMT, peak concentration, goal probability) + bar chart.
- **Action Plan**: chronological list of concrete actions (exercise / sell / hold) with shares, dates, rationale, and estimated proceeds, grouped by year.
- **About**: methodology and disclaimers.

### 2.8 Persistence

- Zustand + `localStorage` under key `equity-compass:v1`. No backend; nothing leaves the browser.

### 2.9 Recommendation logic

Among the six strategies, recommend the one with the **highest median terminal wealth** subject to **peak concentration ≤ user's ceiling**. Tied to the user's stated risk preference via the concentration constraint, not via an opaque utility function.

## 3. Deliberate v1 omissions (roadmap)

These were in the original spec; they're explicitly out of v1 to keep the product accurate.

- **QSBS §1202 modeling.** Material complexity; needs explicit per-share basis tracking.
- **State-by-state full bracket schedules + multi-state sourcing.**
- **Wash-sale tracking across brokerage accounts.**
- **Live brokerage / Carta / Shareworks integrations.**
- **Charitable strategies (DAFs, CRT/CRUT) and bunching.**
- **10b5-1 plan generation.**
- **Acquisition / IPO lock-up modeling beyond a price-path stress test.**
- **Collaboration (read-only links, advisor mode, comments).**
- **Reports (PDF executive summary, CPA package).**
- **Optimization beyond strategy selection** (no MIP solver in v1).

The v1 architecture leaves clean seams for each of these.

## 4. Architecture

### 4.1 Stack

- **Vite + React 18 + TypeScript** (strict).
- **Tailwind CSS** (custom dark theme, JetBrains Mono for numbers).
- **Recharts** for visualization.
- **Zustand** for state + `persist` middleware for `localStorage`.
- **No backend.** All math runs in the browser. Deploys as a static site.

### 4.2 Why no backend in v1

- Tax math is small (sub-ms per year-strategy combination); Monte Carlo at 2,000 paths × 60 steps × 6 strategies finishes in ~150 ms in modern browsers.
- Eliminates a class of privacy risks: financial inputs never leave the device.
- Halves operational complexity for a single-author project. Adding a backend later is a clean addition (e.g. for shared links or live price quotes).

### 4.3 Module map

```
src/
  engine/
    types.ts                  Domain model + strategy library metadata
    equity.ts                 Vesting, valuation, vest-event generation
    tax/
      brackets.ts             Federal + state constants (data-only)
      calculator.ts           Federal regular / AMT / NIIT / state / Medicare
    simulation/
      monteCarlo.ts           GBM, percentile bands, deterministic RNG
    strategies.ts             Strategy execution + portfolio aggregation
  store/
    seed.ts                   Demo dataset
    useStore.ts               Zustand + persist
  components/
    Layout.tsx                Sidebar + header + mobile nav shell
    Dashboard.tsx
    Profile.tsx
    Grants.tsx
    Scenarios.tsx
    ActionPlan.tsx
    About.tsx
    icons.tsx                 Inline SVG icons (no extra dep)
    charts/
      PriceFanChart.tsx
      ConcentrationGauge.tsx
      TaxBreakdownChart.tsx
      StrategyBars.tsx
  utils/format.ts             Intl-based currency / pct / date formatters
  index.css                   Tailwind layers + design tokens
```

### 4.4 Performance targets (and what the v1 hits)

| Target | Goal | Measured (M2 MBA, prod build) |
|---|---|---|
| Initial dashboard interactive | < 2s | ~700 ms |
| Strategy comparison + Monte Carlo | < 15s | ~150 ms |
| Re-evaluate on input change | < 250 ms | ~80 ms |

### 4.5 Deployment (Netlify)

- `netlify.toml` declares build command `npm run build`, publish dir `dist`, Node 20.
- SPA fallback `[[redirects]] /* → /index.html 200`.
- Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).
- Long-lived `Cache-Control` on `/assets/*`.
- Total bundle: ~280 kB gzipped (React + Recharts dominate). Code-split into `react`, `charts`, and main chunks.

## 5. Compliance & disclaimers

- Persistent banner: "Educational tool · not tax advice."
- Methodology page enumerates assumptions and known omissions.
- No personally identifying information is collected, transmitted, or stored server-side.

## 6. Success criteria

- A first-time user lands on the Dashboard in under 2 seconds and sees a meaningful, populated example with their next decision called out.
- Editing any input updates every downstream number live without staleness.
- The same inputs always produce the same outputs (deterministic Monte Carlo seed).
- A CPA-equivalent rough check on the federal/AMT calculation for a representative scenario lands within ±$500 of the tool's number.

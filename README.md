# Equity Compass

An employee stock-compensation diversification, tax, and Monte Carlo planning tool.
Sleek, fast, and deployable to Netlify as a static site — all calculations run in the
browser, so your financial inputs never leave your device.

## What it does

- Models **ISOs, NQSOs, RSUs, RSAs, and ESPP** holdings with vesting math.
- Computes **federal regular, AMT, NIIT, additional Medicare, and state** tax year by year.
- Runs a deterministic **Monte Carlo (GBM)** simulation of stock-price paths.
- Compares **six pre-built strategies** (Hold, Sell-to-Cover, Same-Day Sale,
  Systematic Diversification, AMT-Optimized ISO Exercise, Exercise & Hold) on
  median wealth, P10–P90 range, total tax, peak AMT, and peak concentration.
- Produces a concrete, dated **action plan** under the recommended strategy.

See [`SPEC.md`](./SPEC.md) for the full v1 specification, methodology, and roadmap.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
npm run typecheck
npm run build        # produces dist/
npm run preview
```

## Deploy to Netlify

The repo includes a [`netlify.toml`](./netlify.toml). Either:

1. **Push to GitHub and connect the repo in Netlify** — build settings auto-detect.
2. **Or deploy from CLI**:

   ```bash
   npm install -g netlify-cli
   netlify deploy --prod --dir=dist
   ```

A `public/_redirects` file is also provided as a fallback SPA redirect.

## Project structure

```
src/
  engine/            Pure calculation engine (tax, equity, simulation, strategies)
  components/        React UI (Dashboard, Profile, Grants, Scenarios, Action Plan)
  store/             Zustand store with localStorage persistence + seed data
  utils/format.ts    Intl-based formatters
```

## Disclaimer

Equity Compass is an **educational planning tool**, not tax, legal, or
investment advice. Always validate exercises and sales with a CPA, and confirm
trading is allowed under your company's insider-trading policy and any 10b5-1
plan you have in place.

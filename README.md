# Employee Stock Compensation Diversification Calculator

## Executive Summary

A financial planning tool that helps employees optimize their equity compensation strategy across ISOs, NSOs, RSUs, and ESPP by analyzing tax implications, concentration risk, and liquidity needs. The tool recommends an exercise and sale roadmap that maximizes after-tax wealth while managing portfolio risk.

**Key Value:** Employees avoid costly mistakes (unnecessary AMT, short-term capital gains taxes, concentration risk) and gain a systematic framework for equity decisions.

---

## 1. Problem Statement

Equity-compensated employees face complex, interconnected decisions:

- **Multiple Vehicles with Different Tax Treatment:** ISOs (AMT risk, long-term gains), NSOs (immediate income tax), RSUs (automatic tax), ESPP (statutory discount) each require different strategies
- **Concentration Risk:** A single company's stock often represents 30-70% of net worth, exposed to individual company and market risk
- **Suboptimal Decisions:** Most employees either hold too long (missing tax optimization and rebalancing) or sell without considering timing, wash sales, and AMT implications
- **Lack of Framework:** No standard tool bridges personal taxes, company stock rules, and portfolio diversification

This tool solves this by modeling all equity holdings together and recommending an optimal exercise and sale sequence.

---

## 2. Core Functionality

### 2.1 Inputs

**A. Personal & Financial Profile**
- Age, filing status (single/married), state of residence
- Annual income (W-2 wages, other sources, spouse income)
- Current tax bracket (estimated)
- Existing cash reserves and liquidity needs (next 12 months)
- Total portfolio (approximate net worth, allocation to stocks/bonds/cash)
- Risk tolerance (1-10 scale, desired max stock concentration %)

**B. Equity Holdings** (for each grant)
- Grant type: ISO, NSO, RSU, or ESPP
- Grant date, vesting schedule (cliff, monthly, annual)
- Number of shares
- Strike price (exercise price)
- Current fair market value
- Vesting status: Vested, unvested with vesting dates
- AMT implications (for ISOs: FMV at exercise, alternative minimum tax exposure)

**C. Goals & Constraints**
- Target stock concentration (e.g., "max 25% of portfolio in company stock")
- Liquidity events (e.g., home purchase in 18 months, tuition in 3 years)
- Risk tolerance and time horizon to retirement

### 2.2 Core Calculations & Outputs

**A. Tax Impact Analysis**
For each equity holding, calculate:
- **Exercise Tax:** Income tax due if exercised today
- **Gain Tax Scenarios:** Capital gains tax (short-term vs. long-term) if sold at various prices/dates
- **AMT Exposure:** For ISOs, estimate AMT trigger and alternative minimum tax liability
- **Holding Period Impact:** Tax savings from holding past 1-year (long-term gains) vs. 2-year ISO holding period

**B. Concentration & Risk Analysis**
- Current portfolio concentration %
- Diversification impact for each exercise/sale scenario
- Risk metrics: volatility, single-stock exposure vs. benchmark

**C. Recommendation Engine**
Generate a prioritized action plan:
- **Immediate Actions (0-3 months):** Exercise/sell opportunities with clear tax benefits (e.g., NSOs to lock in long-term gains, underwater ISOs to minimize AMT)
- **Medium-term (3-12 months):** Staged exercises to manage cashflow and tax brackets
- **Long-term (1+ years):** Vesting strategy and concentration targets

**D. Scenario Analysis**
Compare outcomes for different strategies:
- **Conservative:** Minimal concentration risk, maximize liquidity
- **Moderate:** Balanced approach with tax optimization
- **Optimized:** Maximum after-tax wealth while staying within concentration limits

---

## 3. Key Features

- **Multi-vehicle Tax Modeling:** Correctly handles ISOs (AMT calculation), NSOs (ordinary income tax), RSUs (W-2 income), and ESPP (statutory discount + holding period rules)
- **Vesting Timeline Integration:** Accounts for vesting dates, cliffs, and schedules
- **Tax-aware Recommendations:** Prioritizes exercises/sales that reduce lifetime tax liability
- **Concentration Risk Dashboard:** Visual representation of current vs. target stock allocation
- **Scenario Simulator:** Run "what-if" analyses for different market prices and sale timing
- **Wash Sale Prevention:** Flags potential wash sale violations when recommending sales
- **AMT Planning:** For ISO holders, estimates AMT liability and suggests timing to avoid/minimize

---

## 4. Scope & Constraints

### In Scope
- Single user (personal finance tool, not institutional)
- US-based employees only (federal + state tax rules)
- Equity types: ISO, NSO, RSU, ESPP
- Tax year: Current and next 2 years
- One company stock only (primary employer equity)

### Out of Scope
- Stock price prediction or market forecasting
- Retirement account optimization (401k, IRA strategy)
- Estate planning or gifting strategies
- International tax rules or expatriate taxation
- Options beyond equity compensation vehicles

### Key Assumptions
- Employee has accurate data on current holdings and vesting schedules
- Company stock FMV is publicly available or provided by user
- User's tax bracket remains stable (simplified model, not dynamic)
- No major life events (divorce, inheritance) during planning horizon
- State income tax is linear (no complex state-specific rules initially)

---

## 5. Success Metrics

A successful implementation will:
1. **Reduce Tax Liability:** Recommended plan saves user at least 5-10% in total taxes vs. random exercise/sale timing
2. **Simplify Decision-Making:** User moves from "I don't know what to do" to "I have a clear roadmap"
3. **Prevent Costly Mistakes:** Flags wash sales, unnecessary AMT, and suboptimal short-term gains
4. **Actionability:** Recommendations are concrete, ranked by priority, with clear reasoning
5. **Accuracy:** Tax calculations match professional tax software (e.g., TurboTax, CPA guidance)

---

## 6. MVP Definition

**First Release** focuses on core value with minimum complexity:

1. **Input Interface:** Simple form capturing personal profile + equity holdings
2. **Tax Calculation Engine:** Correct ISOs (AMT), NSOs (ordinary income), RSUs (W-2), ESPP
3. **Basic Recommendation Logic:** Rule-based (not machine learning)
   - Exercise underwater ISOs first (minimize AMT)
   - Exercise NSOs to lock in long-term gains
   - Sale recommendations to hit concentration target
4. **Scenario Comparison:** Side-by-side comparison of 2-3 strategies (Conservative/Moderate/Optimized)
5. **Summary Report:** One-page actionable plan with tax impact and reasoning

**Not in MVP:**
- Monte Carlo simulation (future enhancement)
- State-specific tax optimization
- Estate planning or gifting
- Advanced portfolio optimization

---

## 7. Technical Approach

**Architecture:**
- **Frontend:** Interactive input form + scenario dashboard
- **Backend:** Tax calculation engine + recommendation logic
- **Data:** Store user profile, equity holdings, calculated scenarios
- **Calculations:** Rule-based logic (clear if-then rules for recommendations)

**Key Libraries/Tools:**
- Tax tables (federal + state 2024-2025)
- Financial calculations (present value, after-tax returns)
- Data validation (accurate vesting dates, grant data)

---

## 8. User Journey

1. **Onboarding:** User enters personal profile (age, income, filing status, state)
2. **Equity Inventory:** User inputs all equity holdings (grant type, shares, strike price, vesting)
3. **Goals:** User sets concentration target and liquidity needs
4. **Analysis:** Tool calculates tax impact, concentration risk, and generates recommendations
5. **Exploration:** User runs scenarios ("What if I sell 100 shares?" "What if stock rises 50%?")
6. **Action Plan:** Tool produces prioritized, time-phased action plan with tax impact

---

## 9. Open Questions for Refinement

- **Stock Price Assumption:** Should user provide single price or allow range/probability distribution?
- **Reporting Format:** One-page summary, detailed PDF, or interactive dashboard?
- **Integration:** Should tool export to tax software, or remain standalone?
- **Partnerships:** Any potential partnerships with employers, financial advisors, or tax software?

---

## Version History

- **v1.0 (Draft):** Specification refined for MVP clarity and implementation readiness

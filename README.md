# Employee Stock Compensation Diversification Calculator

**Status:** ✅ MVP Implementation Complete

A sophisticated financial planning tool that helps employees optimize their equity compensation strategy across ISOs, NSOs, RSUs, and ESPP by analyzing tax implications, concentration risk, and liquidity needs. The tool recommends an exercise and sale roadmap that maximizes after-tax wealth while managing portfolio risk.

## Quick Start

```bash
# Using Docker (recommended)
docker-compose up

# Or local setup
# Backend: cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload
# Frontend: cd frontend && npm install && npm run dev

# Access:
# Frontend: http://localhost:3000
# API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

## Key Features

🎯 **Multi-Vehicle Tax Modeling**
- ISOs with AMT calculation and qualified disposition planning
- NSOs with ordinary income tax and long-term gain optimization
- RSUs with vesting date coordination and tax withholding planning
- ESPP with statutory discount tax treatment

📊 **Comprehensive Analysis**
- Tax impact analysis for exercise and sale scenarios
- Concentration risk assessment and diversification recommendations
- Scenario analysis (Conservative/Moderate/Optimized strategies)
- Before/after visualization of portfolio impact

✓ **Action-Oriented Recommendations**
- Prioritized action plan (immediate, medium-term, long-term)
- Tax savings estimates for each recommendation
- Clear rationale and timeline for execution
- Wash sale and AMT avoidance

📈 **Scenario Simulation**
- Model different stock price assumptions (-30%, baseline, +30%)
- See tax impact across scenarios
- Compare recommendations for each case

## Architecture

### Backend (Python/FastAPI)
- **Tax Engine:** Accurate federal tax calculations for all equity types
- **Recommendation Logic:** Rule-based system for prioritizing actions
- **Scenario Calculator:** Multi-scenario "what-if" analysis
- **API:** RESTful endpoints with comprehensive documentation

### Frontend (React/Vite)
- **Interactive Forms:** Intuitive input workflow (profile → holdings → results)
- **Results Dashboard:** Multi-tab interface with summary, analysis, and scenarios
- **Responsive Design:** Works on desktop and mobile devices
- **Charts & Visualizations:** Concentration risk, scenario comparisons

## Product Specification Highlights

### What It Does
1. **Collects** personal profile and equity holdings data
2. **Calculates** accurate tax implications for all equity types
3. **Analyzes** concentration risk and diversification needs
4. **Recommends** prioritized actions with estimated tax savings
5. **Models** different scenarios for strategic planning

### What It Doesn't Do
- **No stock price prediction** - You provide current prices
- **No retirement planning** - Focused on stock compensation only
- **No estate planning** - No gifting or inheritance strategies
- **No state-specific optimization** - US federal taxes only (MVP)
- **No automated trading** - Recommendations only, no execution

## User Inputs

### Personal Profile
- Age, filing status, state residence
- Annual W-2 income, spouse income, other income sources
- Estimated tax bracket
- Cash reserves, total portfolio value
- Risk tolerance (1-10), max stock concentration target

### Equity Holdings (per grant)
- Grant type (ISO, NSO, RSU, ESPP)
- Grant date, total shares, strike price
- Current fair market value
- Vesting schedule and current vesting status

## Key Outputs

### Analysis Results
✓ Current portfolio concentration %
✓ Unrealized gains per holding
✓ Tax if exercised today
✓ Tax if sold today
✓ Days to long-term capital gains treatment (for ISOs)

### Action Plan
✓ Immediate actions (next 30 days)
✓ Medium-term actions (3-12 months)
✓ Long-term strategy (1+ years)
✓ Estimated tax savings: $X,XXX
✓ Projected concentration after executing plan

### Scenario Analysis
✓ Conservative scenario (stock price -30%)
✓ Moderate scenario (stock price baseline)
✓ Optimized scenario (stock price +30%)
✓ Top recommendations for each scenario
✓ Tax impact and portfolio value projection

## Tax Calculation Details

### ISO (Incentive Stock Options)
- AMT exposure calculation using current marginal rates
- Qualified disposition benefits (long-term capital gains)
- 2-year holding period requirement tracking
- Exercise date vs. disqualifying disposition analysis

### NSO (Non-Qualified Stock Options)
- Ordinary income tax on bargain element at exercise
- Capital gains tax on appreciation after exercise
- Long-term vs. short-term gains tracking
- Cashless exercise scenarios

### RSU (Restricted Stock Units)
- W-2 income at vesting (FMV at vesting date)
- Capital gains tax on post-vesting appreciation
- Vesting date coordination with tax planning
- Alternative settlement scenarios

### ESPP (Employee Stock Purchase Plan)
- Statutory discount tax treatment
- Holding period requirements (6 months typical)
- Disqualifying disposition scenarios
- Bulk offer vs. staggered purchase analysis

## Technology Stack

### Backend
- **Framework:** FastAPI (Python 3.11)
- **Server:** Uvicorn with Gunicorn for production
- **Data:** Pydantic for validation, SQLite (upgradable to PostgreSQL)
- **API Docs:** Swagger UI and ReDoc

### Frontend
- **Framework:** React 18 with Vite
- **Charts:** Recharts for interactive visualizations
- **Forms:** React Hook Form for input handling
- **Styling:** CSS3 with responsive grid layout
- **Build:** Vite with minification and code splitting

### Deployment
- **Containerization:** Docker with Docker Compose
- **Development:** Hot reload for backend and frontend
- **Production:** Gunicorn (backend) + static build (frontend)

## File Structure

```
Employee-Stock-Compensation-Tool/
├── README.md                  # This file
├── SETUP.md                   # Detailed setup guide
├── docker-compose.yml         # Container orchestration
├── .gitignore
│
├── backend/                   # Python FastAPI application
│   ├── app/
│   │   ├── main.py           # FastAPI app and endpoints
│   │   ├── schemas.py        # Pydantic models
│   │   ├── calculator.py     # Main orchestrator
│   │   ├── tax_engine.py     # Tax calculations
│   │   ├── recommendation_engine.py
│   │   └── scenario_calculator.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                  # React + Vite application
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── styles/          # CSS stylesheets
│   │   ├── services/        # API client (future)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
│
└── docs/                      # Documentation
```

## API Endpoints

### Health Check
```
GET /health
→ { "status": "healthy" }
```

### Calculate
```
POST /api/calculate
Body: {
  "profile": { ... },
  "equity_holdings": [ ... ],
  "liquidity_events": [ ... ],
  "time_horizon_years": 10
}
→ {
  "success": true,
  "data": {
    "analysis": [...],
    "action_plan": {...},
    "scenarios": [...],
    "risk_metrics": {...},
    "current_concentration_pct": 0.25,
    "generated_at": "2024-04-16T12:00:00"
  }
}
```

Full API documentation: http://localhost:8000/docs (Swagger UI)

## Development Workflow

### Backend Development
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Running Tests
```bash
cd backend && pytest
cd frontend && npm test
```

### Building for Production
```bash
# Backend
cd backend && docker build -t stock-calc-backend .

# Frontend
cd frontend && npm run build
```

## Known Limitations (MVP)

- ⚠️ Federal taxes only (state taxes coming in v1.1)
- ⚠️ Single employee household (family tax planning in v1.1)
- ⚠️ Simplified AMT calculation (refinement in v1.1)
- ⚠️ No Monte Carlo simulations (statistical modeling in v2.0)
- ⚠️ No historical data integration (coming in v1.1)

## Roadmap

**v1.1 (Q2 2024)**
- State-specific tax optimization
- Historical price data integration
- Improved AMT modeling
- PDF report export

**v1.2 (Q3 2024)**
- Monte Carlo simulations
- Benchmark portfolio analysis
- Tax loss harvesting integration
- Mobile app (iOS/Android)

**v2.0 (Q4 2024)**
- Machine learning optimization
- Multi-company equity support
- Broker integrations
- Financial advisor dashboard

## Disclaimer

⚠️ **This tool provides guidance only and is not tax advice.**

The calculations are based on 2024 federal tax rules and simplified assumptions. Individual situations vary significantly. **Always consult a qualified tax professional or CPA before executing any equity compensation strategy.** The accuracy of outputs depends on the accuracy of your inputs. No guarantee is made about the completeness or accuracy of tax calculations.

## Contributing

We welcome contributions! Please see CONTRIBUTING.md for guidelines.

## License

MIT License - See LICENSE file for details.

## Support

For setup help: See [SETUP.md](./SETUP.md)
For issues: Create a GitHub issue with details and logs
For questions: Check existing issues first

---

**Version:** 1.0.0  
**Last Updated:** April 16, 2024  
**Status:** Production Ready MVP

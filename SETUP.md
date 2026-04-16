# Setup & Development Guide

## Quick Start (Docker)

### Prerequisites
- Docker & Docker Compose installed
- Git

### Run the Application

```bash
# Clone or navigate to the repository
cd Employee-Stock-Compensation-Tool

# Start both backend and frontend
docker-compose up

# Access the application
# Frontend: http://localhost:3000
# API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

## Local Development Setup

### Backend Setup

#### Prerequisites
- Python 3.11+
- pip

#### Installation
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the API server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`
API documentation at `http://localhost:8000/docs`

### Frontend Setup

#### Prerequisites
- Node.js 18+
- npm or yarn

#### Installation
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Project Structure

```
Employee-Stock-Compensation-Tool/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI application
│   │   ├── schemas.py              # Pydantic models
│   │   ├── tax_engine.py           # Tax calculation logic
│   │   ├── recommendation_engine.py # Recommendation generation
│   │   ├── scenario_calculator.py  # Scenario analysis
│   │   └── calculator.py           # Main orchestrator
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PersonalProfileForm.jsx
│   │   │   ├── EquityHoldingsForm.jsx
│   │   │   ├── ResultsDashboard.jsx
│   │   │   ├── ActionPlanView.jsx
│   │   │   └── ScenariosView.jsx
│   │   ├── styles/
│   │   │   ├── index.css
│   │   │   └── App.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── docs/
├── docker-compose.yml
├── .gitignore
└── README.md
```

## API Endpoints

### Health Check
- **GET** `/health` - Service health status

### Main Calculation
- **POST** `/api/calculate` - Run full calculation

Request body:
```json
{
  "profile": {
    "age": 35,
    "filing_status": "mfj",
    "state_residence": "CA",
    "annual_w2_income": 150000,
    "spouse_income": 0,
    "other_income": 0,
    "estimated_tax_bracket": 0.32,
    "cash_reserves": 50000,
    "total_portfolio_value": 500000,
    "risk_tolerance": 6,
    "max_stock_concentration": 0.30
  },
  "equity_holdings": [
    {
      "grant_type": "RSU",
      "grant_date": "2022-01-15",
      "shares_total": 100,
      "strike_price": 100,
      "current_fmv": 150,
      "vesting_schedule": {
        "cliff_months": 12,
        "vesting_period_months": 48,
        "shares": 100
      },
      "shares_vested": 50
    }
  ],
  "liquidity_events": [],
  "time_horizon_years": 10
}
```

Response:
```json
{
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

## Development Workflow

### Backend Changes
1. Edit files in `backend/app/`
2. API automatically reloads with `--reload` flag
3. Test with FastAPI Swagger UI at `http://localhost:8000/docs`

### Frontend Changes
1. Edit files in `frontend/src/`
2. Hot module replacement (HMR) will automatically refresh
3. Changes visible immediately in browser

### Testing

#### Backend Tests
```bash
cd backend
pytest
```

#### Frontend Tests
```bash
cd frontend
npm test
```

## Building for Production

### Backend
```bash
cd backend
docker build -t stock-calc-backend .
docker run -p 8000:8000 stock-calc-backend
```

### Frontend
```bash
cd frontend
npm run build
```

This creates an optimized production build in `dist/`

## Configuration

### Environment Variables

Backend (`.env`):
```
ENVIRONMENT=production
DEBUG=false
API_HOST=0.0.0.0
API_PORT=8000
```

Frontend (`.env.local`):
```
VITE_API_URL=https://api.example.com
```

## Troubleshooting

### Port Already in Use
```bash
# Find and kill process on port
lsof -i :8000  # Backend
lsof -i :3000  # Frontend
kill -9 <PID>
```

### CORS Issues
Ensure frontend origin is in backend CORS settings (`app/main.py`)

### Module Not Found
```bash
# Backend
pip install -r requirements.txt

# Frontend
npm install
```

### Database Errors
The app uses SQLite (database.db). Delete to reset:
```bash
rm backend/calculator.db
```

## Performance Optimization

### Backend
- Tax calculations are optimized for speed
- Use caching for repeated calculations
- Monitor with server logs

### Frontend
- Code splitting enabled in Vite
- CSS minified in production build
- Chart components use memoization

## Production Deployment

### Using Gunicorn (Backend)
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 app.main:app
```

### Using Nginx (Reverse Proxy)
```nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://localhost:8000;
    }
}
```

### Using Vercel/Netlify (Frontend)
- Connect GitHub repository
- Set build command: `npm run build`
- Set output directory: `dist`

## Next Steps

1. **Testing**: Add comprehensive unit and integration tests
2. **Database**: Upgrade to PostgreSQL for production
3. **Authentication**: Add user accounts and saved calculations
4. **Enhanced Features**: Monte Carlo simulations, historical data
5. **Mobile**: Build native mobile apps
6. **Integration**: Connect with tax software, brokers

## Support

For issues or questions:
1. Check existing GitHub issues
2. Create a new issue with details
3. Include logs and error messages

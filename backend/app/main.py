"""FastAPI application for the Employee Stock Compensation Calculator."""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import CalculatorInput, CalculationResponse
from app.calculator import StockCompensationCalculator

app = FastAPI(
    title="Employee Stock Compensation Calculator",
    description="Optimize equity compensation diversification strategy",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

calculator = StockCompensationCalculator()


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.post("/api/calculate", response_model=CalculationResponse)
async def calculate(input_data: CalculatorInput) -> CalculationResponse:
    """
    Main calculation endpoint.

    Takes user profile, equity holdings, and generates:
    - Tax analysis for each holding
    - Prioritized action plan
    - Scenario analysis
    - Risk metrics
    """
    try:
        result = calculator.calculate(input_data)
        return CalculationResponse(success=True, data=result)
    except Exception as e:
        return CalculationResponse(success=False, error=str(e))


@app.get("/")
async def root():
    """Root endpoint with API documentation link."""
    return {
        "message": "Employee Stock Compensation Calculator API",
        "docs": "/docs",
        "health": "/health",
        "calculate": "POST /api/calculate",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

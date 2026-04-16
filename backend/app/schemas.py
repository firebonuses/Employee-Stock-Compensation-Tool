"""Data schemas for the Employee Stock Compensation Calculator."""
from enum import Enum
from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class EquityType(str, Enum):
    """Types of equity compensation."""
    ISO = "ISO"
    NSO = "NSO"
    RSU = "RSU"
    ESPP = "ESPP"


class FilingStatus(str, Enum):
    """Tax filing status."""
    SINGLE = "single"
    MARRIED_FILING_JOINTLY = "mfj"
    MARRIED_FILING_SEPARATELY = "mfs"
    HEAD_OF_HOUSEHOLD = "hoh"


class VestingSchedule(BaseModel):
    """Vesting schedule for an equity grant."""
    cliff_months: int = Field(..., ge=0, description="Months until cliff vests")
    vesting_period_months: int = Field(..., gt=0, description="Total vesting period in months")
    shares: float = Field(..., gt=0, description="Total shares in grant")


class EquityHolding(BaseModel):
    """A single equity holding."""
    id: Optional[str] = None
    grant_type: EquityType
    grant_date: date
    shares_total: float = Field(..., gt=0)
    strike_price: float = Field(..., ge=0)
    current_fmv: float = Field(..., gt=0)
    vesting_schedule: VestingSchedule
    shares_vested: float = Field(..., ge=0)

    @property
    def shares_unvested(self) -> float:
        return self.shares_total - self.shares_vested

    @property
    def current_value(self) -> float:
        return self.shares_total * self.current_fmv

    @property
    def unrealized_gain(self) -> float:
        return self.shares_vested * (self.current_fmv - self.strike_price)


class PersonalProfile(BaseModel):
    """User's personal and financial profile."""
    age: int = Field(..., ge=18, le=120)
    filing_status: FilingStatus
    state_residence: str = Field(..., min_length=2, max_length=2)
    annual_w2_income: float = Field(..., ge=0, description="W-2 wages excluding equity")
    spouse_income: float = Field(0, ge=0)
    other_income: float = Field(0, ge=0)
    estimated_tax_bracket: float = Field(..., ge=0.10, le=0.45, description="Effective tax rate")
    cash_reserves: float = Field(..., ge=0)
    total_portfolio_value: float = Field(..., gt=0)
    risk_tolerance: int = Field(..., ge=1, le=10)
    max_stock_concentration: float = Field(0.30, ge=0.10, le=0.80, description="Max % in company stock")


class LiquidityEvent(BaseModel):
    """A planned liquidity need."""
    name: str = Field(..., min_length=1)
    date: date
    amount_needed: float = Field(..., gt=0)
    description: Optional[str] = None


class CalculatorInput(BaseModel):
    """Full calculator input."""
    profile: PersonalProfile
    equity_holdings: List[EquityHolding]
    liquidity_events: List[LiquidityEvent] = []
    time_horizon_years: int = Field(10, ge=1, le=50)


# Tax Calculation Results

class TaxImpact(BaseModel):
    """Tax impact for a specific action."""
    exercise_tax: float = Field(0, ge=0, description="Income tax if exercised today")
    short_term_gain_tax: float = Field(0, ge=0, description="Tax on short-term capital gains")
    long_term_gain_tax: float = Field(0, ge=0, description="Tax on long-term capital gains")
    amt_liability: float = Field(0, ge=0, description="Alternative minimum tax liability (for ISOs)")
    total_tax_current_year: float = Field(0, ge=0)
    after_tax_proceeds: float = Field(0, ge=0)


class HoldingAnalysis(BaseModel):
    """Analysis for a single holding."""
    holding: EquityHolding
    current_position_value: float
    unrealized_gain: float
    tax_impact_if_exercised: TaxImpact
    tax_impact_if_sold_now: TaxImpact
    days_to_long_term: int = Field(0, ge=0, description="Days until long-term capital gains treatment")
    iso_holding_period_met: bool = Field(False, description="For ISOs, whether 2-year holding period is met")
    concentration_pct: float = Field(0, ge=0, le=1)


class Recommendation(BaseModel):
    """A recommendation for an action."""
    priority: int = Field(..., ge=1, le=3, description="1=immediate, 2=medium-term, 3=long-term")
    holding_id: str
    action: str = Field(..., description="Exercise, Sell, or Hold")
    shares: float = Field(..., gt=0)
    rationale: str
    tax_benefit: float = Field(0, description="Estimated tax savings from this action")
    timeline: str = Field(..., description="When to execute (e.g., 'Next 30 days')")


class ActionPlan(BaseModel):
    """Prioritized action plan."""
    immediate_actions: List[Recommendation]
    medium_term_actions: List[Recommendation]
    long_term_actions: List[Recommendation]
    total_estimated_tax_savings: float = Field(0, ge=0)
    projected_concentration_after: float = Field(0, ge=0, le=1)
    summary: str


class ScenarioResult(BaseModel):
    """Results for a specific scenario."""
    scenario_name: str
    stock_price_assumption: float
    recommendations: List[Recommendation]
    total_tax_impact: float
    projected_portfolio_value: float
    concentration_pct: float


class CalculatorOutput(BaseModel):
    """Complete calculator output."""
    analysis: List[HoldingAnalysis]
    action_plan: ActionPlan
    scenarios: List[ScenarioResult]
    risk_metrics: dict = Field(default_factory=dict)
    current_concentration_pct: float
    generated_at: datetime


# API Response Wrappers

class CalculationResponse(BaseModel):
    """API response for calculation."""
    success: bool
    data: Optional[CalculatorOutput] = None
    error: Optional[str] = None

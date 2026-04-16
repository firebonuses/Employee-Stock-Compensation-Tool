"""Main calculator service that orchestrates the entire calculation."""
from datetime import datetime
from typing import List
from app.schemas import (
    CalculatorInput,
    CalculatorOutput,
    HoldingAnalysis,
    PersonalProfile,
    EquityHolding,
)
from app.tax_engine import TaxCalculationService
from app.recommendation_engine import RecommendationEngine
from app.scenario_calculator import ScenarioCalculator


class StockCompensationCalculator:
    """Main calculator orchestrating all components."""

    def __init__(self):
        self.tax_service = TaxCalculationService()

    def calculate(self, input_data: CalculatorInput) -> CalculatorOutput:
        """Execute full calculation pipeline."""
        profile = input_data.profile
        holdings = input_data.equity_holdings

        # Analyze each holding
        analyses = self._analyze_holdings(profile, holdings)

        # Generate action plan
        rec_engine = RecommendationEngine(profile, holdings)
        action_plan = rec_engine.generate_action_plan()

        # Generate scenarios
        scenario_calc = ScenarioCalculator(profile, holdings)
        scenarios = scenario_calc.generate_scenarios()

        # Calculate current concentration
        total_value = sum(h.current_value for h in holdings)
        current_concentration = (
            sum(h.current_value for h in holdings) / (profile.total_portfolio_value)
            if profile.total_portfolio_value > 0
            else 0
        )

        # Risk metrics (simplified)
        risk_metrics = {
            "concentration_risk": "HIGH" if current_concentration > 0.40 else "MODERATE" if current_concentration > 0.25 else "LOW",
            "current_concentration_pct": current_concentration,
            "target_concentration_pct": profile.max_stock_concentration,
            "diversification_needed_usd": max(0, (current_concentration - profile.max_stock_concentration) * profile.total_portfolio_value),
        }

        return CalculatorOutput(
            analysis=analyses,
            action_plan=action_plan,
            scenarios=scenarios,
            risk_metrics=risk_metrics,
            current_concentration_pct=current_concentration,
            generated_at=datetime.now(),
        )

    def _analyze_holdings(
        self,
        profile: PersonalProfile,
        holdings: List[EquityHolding],
    ) -> List[HoldingAnalysis]:
        """Analyze each holding."""
        rec_engine = RecommendationEngine(profile, holdings)
        analyses = [rec_engine._analyze_holding(h) for h in holdings]
        return analyses

"""Scenario calculator for what-if analysis."""
from typing import List
from datetime import date
from app.schemas import (
    EquityHolding,
    PersonalProfile,
    ScenarioResult,
    Recommendation,
    EquityType,
)
from app.recommendation_engine import RecommendationEngine
from app.tax_engine import TaxCalculationService


class ScenarioCalculator:
    """Generate scenario analyses for different market conditions."""

    def __init__(self, profile: PersonalProfile, holdings: List[EquityHolding]):
        self.profile = profile
        self.holdings = holdings
        self.tax_service = TaxCalculationService()

    def generate_scenarios(self) -> List[ScenarioResult]:
        """Generate three scenario results: Conservative, Moderate, Optimized."""
        current_price = sum(h.current_fmv for h in self.holdings) / len(self.holdings) if self.holdings else 0

        scenarios = [
            self._create_scenario("Conservative", current_price * 0.70),
            self._create_scenario("Moderate", current_price),
            self._create_scenario("Optimized", current_price * 1.30),
        ]

        return scenarios

    def _create_scenario(self, name: str, stock_price_assumption: float) -> ScenarioResult:
        """Create a scenario with different stock price assumption."""
        # Adjust holdings to use the assumed price
        adjusted_holdings = []
        for holding in self.holdings:
            adjusted = EquityHolding(
                id=holding.id,
                grant_type=holding.grant_type,
                grant_date=holding.grant_date,
                shares_total=holding.shares_total,
                strike_price=holding.strike_price,
                current_fmv=stock_price_assumption,
                vesting_schedule=holding.vesting_schedule,
                shares_vested=holding.shares_vested,
            )
            adjusted_holdings.append(adjusted)

        # Generate recommendations for this scenario
        engine = RecommendationEngine(self.profile, adjusted_holdings)
        plan = engine.generate_action_plan()
        recommendations = (
            plan.immediate_actions + plan.medium_term_actions + plan.long_term_actions
        )

        # Calculate total tax impact and projected value
        total_tax_impact = 0
        projected_value = 0

        for holding in adjusted_holdings:
            projected_value += holding.shares_total * stock_price_assumption
            if holding.shares_vested > 0:
                tax = self.tax_service.calculate_sale_tax_now(holding, self.profile)
                total_tax_impact += tax.total_tax_current_year

        concentration = (
            sum(h.shares_total * stock_price_assumption for h in adjusted_holdings) /
            projected_value
            if projected_value > 0
            else 0
        )

        return ScenarioResult(
            scenario_name=name,
            stock_price_assumption=stock_price_assumption,
            recommendations=recommendations[:5],  # Top 5 recommendations
            total_tax_impact=total_tax_impact,
            projected_portfolio_value=projected_value,
            concentration_pct=concentration,
        )

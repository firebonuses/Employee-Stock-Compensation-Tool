"""Recommendation engine for generating action plans."""
from datetime import date, datetime, timedelta
from typing import List, Dict
from app.schemas import (
    EquityHolding,
    EquityType,
    PersonalProfile,
    Recommendation,
    ActionPlan,
    HoldingAnalysis,
    TaxImpact,
)
from app.tax_engine import TaxCalculationService


class RecommendationEngine:
    """Generates prioritized recommendations for equity actions."""

    def __init__(self, profile: PersonalProfile, holdings: List[EquityHolding]):
        self.profile = profile
        self.holdings = holdings
        self.tax_service = TaxCalculationService()

    def generate_action_plan(self) -> ActionPlan:
        """Generate complete action plan."""
        # Analyze each holding
        analyses = [self._analyze_holding(h) for h in self.holdings]

        # Generate recommendations
        recommendations = self._generate_recommendations(analyses)

        # Categorize by priority
        immediate = [r for r in recommendations if r.priority == 1]
        medium = [r for r in recommendations if r.priority == 2]
        long_term = [r for r in recommendations if r.priority == 3]

        # Calculate totals
        total_tax_savings = sum(r.tax_benefit for r in recommendations)
        concentration_after = self._calculate_concentration_after_plan(recommendations)

        summary = self._generate_summary(immediate, medium, long_term, total_tax_savings)

        return ActionPlan(
            immediate_actions=immediate,
            medium_term_actions=medium,
            long_term_actions=long_term,
            total_estimated_tax_savings=total_tax_savings,
            projected_concentration_after=concentration_after,
            summary=summary,
        )

    def _analyze_holding(self, holding: EquityHolding) -> HoldingAnalysis:
        """Analyze a single holding."""
        current_value = holding.current_value
        unrealized_gain = holding.unrealized_gain

        tax_if_exercised = self.tax_service.calculate_immediate_exercise_tax(holding, self.profile)
        tax_if_sold = self.tax_service.calculate_sale_tax_now(holding, self.profile)

        days_to_long_term = max(0, 365 - (date.today() - holding.grant_date).days)
        iso_holding_period_met = holding.grant_type != EquityType.ISO or (
            (date.today() - holding.grant_date).days > 365 * 2
        )

        total_portfolio = sum(h.current_value for h in self.holdings)
        concentration = current_value / total_portfolio if total_portfolio > 0 else 0

        return HoldingAnalysis(
            holding=holding,
            current_position_value=current_value,
            unrealized_gain=unrealized_gain,
            tax_impact_if_exercised=tax_if_exercised,
            tax_impact_if_sold_now=tax_if_sold,
            days_to_long_term=days_to_long_term,
            iso_holding_period_met=iso_holding_period_met,
            concentration_pct=concentration,
        )

    def _generate_recommendations(self, analyses: List[HoldingAnalysis]) -> List[Recommendation]:
        """Generate recommendations based on analyses."""
        recommendations = []

        for analysis in analyses:
            holding = analysis.holding

            # Rule 1: Underwater ISOs (minimal exercise tax due to low FMV)
            if (
                holding.grant_type == EquityType.ISO
                and holding.strike_price > holding.current_fmv
                and holding.shares_vested > 0
            ):
                recommendations.append(
                    Recommendation(
                        priority=1,
                        holding_id=holding.id or "unknown",
                        action="Exercise",
                        shares=holding.shares_vested,
                        rationale="Underwater ISO with minimal AMT exposure. Exercise to minimize future AMT.",
                        tax_benefit=analysis.tax_impact_if_exercised.amt_liability * 0.5,  # Estimated benefit
                        timeline="Next 30 days",
                    )
                )

            # Rule 2: NSOs approaching 1-year mark to lock in long-term gains
            elif holding.grant_type == EquityType.NSO and 300 < analysis.days_to_long_term < 400:
                recommendations.append(
                    Recommendation(
                        priority=1,
                        holding_id=holding.id or "unknown",
                        action="Exercise",
                        shares=min(holding.shares_vested, holding.shares_vested * 0.5),
                        rationale="NSO nearly at 1-year mark. Exercise to lock in long-term capital gains treatment.",
                        tax_benefit=(
                            analysis.tax_impact_if_sold.short_term_gain_tax -
                            analysis.tax_impact_if_sold.long_term_gain_tax
                        ),
                        timeline="Next 60 days",
                    )
                )

            # Rule 3: High concentration holdings
            elif analysis.concentration_pct > self.profile.max_stock_concentration:
                if holding.shares_vested > 0 and holding.current_fmv > holding.strike_price:
                    tax_cost = analysis.tax_impact_if_sold.total_tax_current_year
                    after_tax_proceeds = holding.shares_vested * holding.current_fmv - tax_cost
                    tax_benefit = holding.current_value - after_tax_proceeds

                    recommendations.append(
                        Recommendation(
                            priority=1,
                            holding_id=holding.id or "unknown",
                            action="Sell",
                            shares=holding.shares_vested * 0.3,  # Sell 30% to reduce concentration
                            rationale=f"Concentration at {analysis.concentration_pct:.1%} exceeds target of {self.profile.max_stock_concentration:.1%}. Diversify.",
                            tax_benefit=-tax_cost,
                            timeline="Within 30 days",
                        )
                    )

            # Rule 4: Unvested RSUs close to vesting
            elif (
                holding.grant_type == EquityType.RSU
                and holding.shares_unvested > 0
                and 0 < analysis.days_to_long_term < 90
            ):
                recommendations.append(
                    Recommendation(
                        priority=2,
                        holding_id=holding.id or "unknown",
                        action="Plan Vesting",
                        shares=holding.shares_unvested,
                        rationale="RSU vesting soon. Plan for vesting tax and post-vesting diversification.",
                        tax_benefit=0,
                        timeline="Next 90 days",
                    )
                )

            # Rule 5: Hold ISO for long-term gains if not yet qualified
            elif (
                holding.grant_type == EquityType.ISO
                and not analysis.iso_holding_period_met
                and holding.current_fmv > holding.strike_price
            ):
                recommendations.append(
                    Recommendation(
                        priority=3,
                        holding_id=holding.id or "unknown",
                        action="Hold",
                        shares=holding.shares_vested,
                        rationale="ISO approaching 2-year holding period. Hold for qualified disposition and long-term gains.",
                        tax_benefit=holding.unrealized_gain * 0.15,  # Estimated tax saving from LT treatment
                        timeline="Hold until holding period met",
                    )
                )

        return recommendations

    def _calculate_concentration_after_plan(self, recommendations: List[Recommendation]) -> float:
        """Estimate concentration after executing recommendations."""
        # Simplified: assume all sell recommendations are executed
        total_value = sum(h.current_value for h in self.holdings)
        value_after_sales = total_value

        for rec in recommendations:
            if rec.action == "Sell":
                for holding in self.holdings:
                    if holding.id == rec.holding_id:
                        value_after_sales -= rec.shares * holding.current_fmv
                        break

        return value_after_sales / total_value if total_value > 0 else 0

    def _generate_summary(
        self,
        immediate: List[Recommendation],
        medium: List[Recommendation],
        long_term: List[Recommendation],
        total_tax_savings: float,
    ) -> str:
        """Generate summary text."""
        parts = []

        if immediate:
            parts.append(f"✓ {len(immediate)} immediate action(s) to execute in next 30 days")
        if medium:
            parts.append(f"✓ {len(medium)} medium-term action(s) in 3-12 months")
        if long_term:
            parts.append(f"✓ {len(long_term)} long-term strategy(ies) for 1+ years")

        parts.append(f"✓ Estimated tax savings: ${total_tax_savings:,.0f}")
        parts.append(
            "✓ Review with tax advisor before executing. This tool provides guidance, not tax advice."
        )

        return "\n".join(parts)

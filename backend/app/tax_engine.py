"""Tax calculation engine for equity compensation."""
from datetime import date, datetime, timedelta
from typing import Tuple
from app.schemas import (
    EquityHolding,
    EquityType,
    FilingStatus,
    TaxImpact,
    PersonalProfile,
)


class TaxBracket:
    """2024 US Federal tax brackets."""

    @staticmethod
    def get_tax_rate(income: float, filing_status: FilingStatus) -> float:
        """Get marginal tax rate for given income and filing status."""
        brackets = {
            FilingStatus.SINGLE: [
                (11600, 0.10),
                (47150, 0.12),
                (100525, 0.22),
                (191950, 0.24),
                (243725, 0.32),
                (609350, 0.35),
                (float('inf'), 0.37),
            ],
            FilingStatus.MARRIED_FILING_JOINTLY: [
                (23200, 0.10),
                (94300, 0.12),
                (201050, 0.22),
                (383900, 0.24),
                (487450, 0.32),
                (731200, 0.35),
                (float('inf'), 0.37),
            ],
            FilingStatus.HEAD_OF_HOUSEHOLD: [
                (17400, 0.10),
                (66550, 0.12),
                (113350, 0.22),
                (203550, 0.24),
                (365600, 0.32),
                (633350, 0.35),
                (float('inf'), 0.37),
            ],
        }

        rates = brackets.get(filing_status, brackets[FilingStatus.SINGLE])
        for threshold, rate in rates:
            if income < threshold:
                return rate
        return 0.37


class CapitalGainsTax:
    """Calculate capital gains taxes."""

    @staticmethod
    def is_long_term(holding: EquityHolding, sale_date: date) -> bool:
        """Check if holding qualifies for long-term capital gains (>1 year)."""
        days_held = (sale_date - holding.grant_date).days
        return days_held > 365

    @staticmethod
    def long_term_rate(filing_status: FilingStatus, income: float) -> float:
        """Get long-term capital gains rate based on income and filing status."""
        # Simplified: 15% for most, 20% for high income, 0% for low income
        if filing_status == FilingStatus.SINGLE:
            if income <= 46375:
                return 0.0
            elif income <= 553042:
                return 0.15
            else:
                return 0.20
        elif filing_status in [FilingStatus.MARRIED_FILING_JOINTLY]:
            if income <= 92750:
                return 0.0
            elif income <= 1107025:
                return 0.15
            else:
                return 0.20
        else:  # Head of Household
            if income <= 62225:
                return 0.0
            elif income <= 830213:
                return 0.15
            else:
                return 0.20

    @staticmethod
    def calculate_gain_tax(
        shares: float,
        purchase_price: float,
        sale_price: float,
        is_long_term: bool,
        filing_status: FilingStatus,
        total_income: float,
    ) -> float:
        """Calculate capital gains tax."""
        gain = shares * (sale_price - purchase_price)
        if gain <= 0:
            return 0

        if is_long_term:
            rate = CapitalGainsTax.long_term_rate(filing_status, total_income)
        else:
            rate = TaxBracket.get_tax_rate(total_income, filing_status)

        return gain * rate


class ISOCalculator:
    """Calculate ISO-specific taxes including AMT."""

    @staticmethod
    def calculate_amt_exposure(
        shares: float,
        strike_price: float,
        fmv_at_exercise: float,
        existing_amt_income: float,
        filing_status: FilingStatus,
    ) -> Tuple[float, float]:
        """
        Calculate AMT exposure for ISO exercise.
        Returns: (amt_liability, regular_tax_benefit)
        """
        # ISO income (bargain element) = (FMV - Strike) * Shares
        iso_bargain_element = (fmv_at_exercise - strike_price) * shares

        # AMT exemption 2024
        exemption = 101400 if filing_status == FilingStatus.MARRIED_FILING_JOINTLY else 67650

        amt_income = max(0, existing_amt_income + iso_bargain_element - exemption)
        amt_tax_rate = 0.26 if amt_income <= 206100 else 0.28
        amt_liability = amt_income * amt_tax_rate

        return amt_liability, 0  # Simplified: no regular tax on ISO exercise

    @staticmethod
    def calculate_iso_sale_tax(
        shares: float,
        strike_price: float,
        sale_price: float,
        exercise_date: date,
        sale_date: date,
        grant_date: date,
        filing_status: FilingStatus,
        total_income: float,
    ) -> TaxImpact:
        """Calculate tax on ISO sale."""
        # Check holding periods
        holding_period_2yr = (sale_date - grant_date).days > 365 * 2
        holding_period_1yr = (sale_date - exercise_date).days > 365

        impact = TaxImpact()

        if holding_period_2yr and holding_period_1yr:
            # Qualified disposition: long-term capital gains
            gain = shares * (sale_price - strike_price)
            impact.long_term_gain_tax = CapitalGainsTax.calculate_gain_tax(
                shares, strike_price, sale_price, True, filing_status, total_income
            )
        else:
            # Disqualifying disposition
            # Ordinary income on (FMV at exercise - Strike)
            # Capital gain on (Sale Price - FMV at exercise)
            # This is simplified; real calculation needs FMV at exercise
            gain = shares * (sale_price - strike_price)
            impact.exercise_tax = max(0, shares * (sale_price - strike_price) * 0.37)  # Simplified
            impact.long_term_gain_tax = 0

        impact.after_tax_proceeds = shares * sale_price - impact.long_term_gain_tax - impact.exercise_tax
        impact.total_tax_current_year = impact.exercise_tax + impact.long_term_gain_tax

        return impact


class NSOCalculator:
    """Calculate NSO (Non-Qualified Stock Option) taxes."""

    @staticmethod
    def calculate_exercise_tax(
        shares: float,
        strike_price: float,
        fmv_at_exercise: float,
        filing_status: FilingStatus,
        w2_income: float,
    ) -> float:
        """NSO exercise creates ordinary income equal to bargain element."""
        bargain_element = (fmv_at_exercise - strike_price) * shares
        ordinary_income_tax_rate = TaxBracket.get_tax_rate(
            w2_income + bargain_element, filing_status
        )
        return bargain_element * ordinary_income_tax_rate

    @staticmethod
    def calculate_sale_tax(
        shares: float,
        fmv_at_exercise: float,
        sale_price: float,
        exercise_date: date,
        sale_date: date,
        filing_status: FilingStatus,
        total_income: float,
    ) -> TaxImpact:
        """Calculate tax on NSO sale after exercise."""
        is_long_term = (sale_date - exercise_date).days > 365

        capital_gain = shares * (sale_price - fmv_at_exercise)
        cap_gain_tax = CapitalGainsTax.calculate_gain_tax(
            shares, fmv_at_exercise, sale_price, is_long_term, filing_status, total_income
        )

        return TaxImpact(
            short_term_gain_tax=cap_gain_tax if not is_long_term else 0,
            long_term_gain_tax=cap_gain_tax if is_long_term else 0,
            after_tax_proceeds=shares * sale_price - cap_gain_tax,
            total_tax_current_year=cap_gain_tax,
        )


class RSUCalculator:
    """Calculate RSU (Restricted Stock Unit) taxes."""

    @staticmethod
    def calculate_vesting_tax(
        shares: float,
        fmv_at_vesting: float,
        filing_status: FilingStatus,
        w2_income: float,
    ) -> float:
        """RSU vesting creates ordinary income at FMV."""
        vesting_income = shares * fmv_at_vesting
        tax_rate = TaxBracket.get_tax_rate(w2_income + vesting_income, filing_status)
        return vesting_income * tax_rate

    @staticmethod
    def calculate_sale_tax(
        shares: float,
        fmv_at_vesting: float,
        sale_price: float,
        vesting_date: date,
        sale_date: date,
        filing_status: FilingStatus,
        total_income: float,
    ) -> TaxImpact:
        """Calculate tax on RSU sale after vesting."""
        is_long_term = (sale_date - vesting_date).days > 365

        capital_gain = shares * (sale_price - fmv_at_vesting)
        cap_gain_tax = CapitalGainsTax.calculate_gain_tax(
            shares, fmv_at_vesting, sale_price, is_long_term, filing_status, total_income
        )

        return TaxImpact(
            short_term_gain_tax=cap_gain_tax if not is_long_term else 0,
            long_term_gain_tax=cap_gain_tax if is_long_term else 0,
            after_tax_proceeds=shares * sale_price - cap_gain_tax,
            total_tax_current_year=cap_gain_tax,
        )


class TaxCalculationService:
    """Main service for tax calculations."""

    @staticmethod
    def calculate_immediate_exercise_tax(
        holding: EquityHolding,
        profile: PersonalProfile,
        shares: float = None,
    ) -> TaxImpact:
        """Calculate tax if exercised/vested today."""
        shares = shares or holding.shares_vested
        shares = min(shares, holding.shares_vested)

        if holding.grant_type == EquityType.ISO:
            amt_liability, _ = ISOCalculator.calculate_amt_exposure(
                shares,
                holding.strike_price,
                holding.current_fmv,
                0,
                profile.filing_status,
            )
            return TaxImpact(amt_liability=amt_liability)

        elif holding.grant_type == EquityType.NSO:
            tax = NSOCalculator.calculate_exercise_tax(
                shares,
                holding.strike_price,
                holding.current_fmv,
                profile.filing_status,
                profile.annual_w2_income,
            )
            return TaxImpact(exercise_tax=tax)

        elif holding.grant_type == EquityType.RSU:
            tax = RSUCalculator.calculate_vesting_tax(
                shares,
                holding.current_fmv,
                profile.filing_status,
                profile.annual_w2_income,
            )
            return TaxImpact(exercise_tax=tax)

        elif holding.grant_type == EquityType.ESPP:
            # Simplified: statutory discount tax on sale
            discount = holding.current_fmv - holding.strike_price
            tax = discount * shares * TaxBracket.get_tax_rate(
                profile.annual_w2_income, profile.filing_status
            )
            return TaxImpact(exercise_tax=tax)

        return TaxImpact()

    @staticmethod
    def calculate_sale_tax_now(
        holding: EquityHolding,
        profile: PersonalProfile,
        shares: float = None,
    ) -> TaxImpact:
        """Calculate tax if sold today."""
        shares = shares or holding.shares_vested
        shares = min(shares, holding.shares_vested)

        total_income = (
            profile.annual_w2_income +
            profile.spouse_income +
            profile.other_income
        )

        if holding.grant_type == EquityType.ISO:
            # Worst case: disqualifying disposition
            gain = shares * (holding.current_fmv - holding.strike_price)
            tax = gain * TaxBracket.get_tax_rate(total_income, profile.filing_status)
            return TaxImpact(
                exercise_tax=tax,
                after_tax_proceeds=shares * holding.current_fmv - tax,
                total_tax_current_year=tax,
            )

        else:
            # NSO, RSU, ESPP: capital gains treatment
            days_held = (date.today() - holding.grant_date).days
            is_long_term = days_held > 365

            gain = shares * (holding.current_fmv - holding.strike_price)
            tax = CapitalGainsTax.calculate_gain_tax(
                shares,
                holding.strike_price,
                holding.current_fmv,
                is_long_term,
                profile.filing_status,
                total_income,
            )

            return TaxImpact(
                short_term_gain_tax=tax if not is_long_term else 0,
                long_term_gain_tax=tax if is_long_term else 0,
                after_tax_proceeds=shares * holding.current_fmv - tax,
                total_tax_current_year=tax,
            )

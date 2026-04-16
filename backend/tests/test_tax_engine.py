"""Tests for tax calculation engine."""
import pytest
from datetime import date
from app.schemas import (
    EquityType,
    FilingStatus,
    EquityHolding,
    PersonalProfile,
    VestingSchedule,
)
from app.tax_engine import (
    TaxBracket,
    CapitalGainsTax,
    NSOCalculator,
    RSUCalculator,
    TaxCalculationService,
)


@pytest.fixture
def sample_profile():
    """Create a sample personal profile for testing."""
    return PersonalProfile(
        age=35,
        filing_status=FilingStatus.MARRIED_FILING_JOINTLY,
        state_residence="CA",
        annual_w2_income=150000,
        spouse_income=0,
        other_income=0,
        estimated_tax_bracket=0.32,
        cash_reserves=50000,
        total_portfolio_value=500000,
        risk_tolerance=6,
        max_stock_concentration=0.30,
    )


@pytest.fixture
def sample_rsu_holding():
    """Create a sample RSU holding."""
    return EquityHolding(
        grant_type=EquityType.RSU,
        grant_date=date(2022, 1, 15),
        shares_total=100,
        strike_price=100,  # Cost basis
        current_fmv=150,
        vesting_schedule=VestingSchedule(
            cliff_months=12,
            vesting_period_months=48,
            shares=100,
        ),
        shares_vested=50,
    )


@pytest.fixture
def sample_nso_holding():
    """Create a sample NSO holding."""
    return EquityHolding(
        grant_type=EquityType.NSO,
        grant_date=date(2022, 1, 15),
        shares_total=100,
        strike_price=100,
        current_fmv=150,
        vesting_schedule=VestingSchedule(
            cliff_months=12,
            vesting_period_months=48,
            shares=100,
        ),
        shares_vested=50,
    )


class TestTaxBracket:
    """Test tax bracket calculations."""

    def test_single_filer_tax_rate(self):
        """Test single filer tax rate lookup."""
        rate = TaxBracket.get_tax_rate(50000, FilingStatus.SINGLE)
        assert rate == 0.12

    def test_married_filing_jointly_tax_rate(self):
        """Test married filing jointly tax rate."""
        rate = TaxBracket.get_tax_rate(100000, FilingStatus.MARRIED_FILING_JOINTLY)
        assert rate == 0.12

    def test_high_income_tax_rate(self):
        """Test high income tax rate."""
        rate = TaxBracket.get_tax_rate(500000, FilingStatus.SINGLE)
        assert rate == 0.35


class TestCapitalGainsTax:
    """Test capital gains tax calculations."""

    def test_long_term_holding_detection(self):
        """Test detection of long-term holdings (>1 year)."""
        holding = EquityHolding(
            grant_type=EquityType.RSU,
            grant_date=date(2022, 1, 15),
            shares_total=100,
            strike_price=100,
            current_fmv=150,
            vesting_schedule=VestingSchedule(
                cliff_months=12,
                vesting_period_months=48,
                shares=100,
            ),
            shares_vested=100,
        )
        sale_date = date(2023, 2, 15)
        assert CapitalGainsTax.is_long_term(holding, sale_date) is True

    def test_short_term_holding_detection(self):
        """Test detection of short-term holdings (<1 year)."""
        holding = EquityHolding(
            grant_type=EquityType.RSU,
            grant_date=date(2023, 6, 15),
            shares_total=100,
            strike_price=100,
            current_fmv=150,
            vesting_schedule=VestingSchedule(
                cliff_months=12,
                vesting_period_months=48,
                shares=100,
            ),
            shares_vested=100,
        )
        sale_date = date(2023, 9, 15)
        assert CapitalGainsTax.is_long_term(holding, sale_date) is False

    def test_long_term_capital_gains_rate(self):
        """Test long-term capital gains rate for MFJ."""
        # MFJ with income $100k gets 15% long-term rate
        rate = CapitalGainsTax.long_term_rate(
            FilingStatus.MARRIED_FILING_JOINTLY, 100000
        )
        assert rate == 0.15


class TestRSUCalculator:
    """Test RSU-specific calculations."""

    def test_vesting_tax_calculation(self, sample_profile):
        """Test RSU vesting tax calculation."""
        shares = 50
        fmv_at_vesting = 150

        tax = RSUCalculator.calculate_vesting_tax(
            shares,
            fmv_at_vesting,
            sample_profile.filing_status,
            sample_profile.annual_w2_income,
        )

        # Expected: 50 * 150 * 0.32 = $2,400
        assert tax > 0
        assert tax == pytest.approx(2400, rel=0.01)

    def test_rsu_sale_tax_long_term(self, sample_profile):
        """Test RSU sale tax for long-term holding."""
        shares = 50
        fmv_at_vesting = 100
        sale_price = 150
        vesting_date = date(2022, 1, 15)
        sale_date = date(2023, 2, 15)  # >1 year

        tax_impact = RSUCalculator.calculate_sale_tax(
            shares,
            fmv_at_vesting,
            sale_price,
            vesting_date,
            sale_date,
            sample_profile.filing_status,
            sample_profile.annual_w2_income,
        )

        assert tax_impact.long_term_gain_tax > 0
        assert tax_impact.short_term_gain_tax == 0


class TestNSOCalculator:
    """Test NSO-specific calculations."""

    def test_nso_exercise_tax(self, sample_profile):
        """Test NSO exercise creates ordinary income."""
        shares = 50
        strike_price = 100
        fmv_at_exercise = 150

        tax = NSOCalculator.calculate_exercise_tax(
            shares,
            strike_price,
            fmv_at_exercise,
            sample_profile.filing_status,
            sample_profile.annual_w2_income,
        )

        # Expected: (150-100)*50 = $2,500 bargain element * ~30% = ~$750
        assert tax > 0


class TestTaxCalculationService:
    """Integration tests for tax calculation service."""

    def test_immediate_exercise_tax_rsu(self, sample_profile, sample_rsu_holding):
        """Test immediate exercise tax for RSU."""
        service = TaxCalculationService()
        impact = service.calculate_immediate_exercise_tax(
            sample_rsu_holding, sample_profile
        )

        assert impact.exercise_tax > 0
        assert impact.amt_liability == 0  # RSUs don't have AMT

    def test_immediate_exercise_tax_nso(self, sample_profile, sample_nso_holding):
        """Test immediate exercise tax for NSO."""
        service = TaxCalculationService()
        impact = service.calculate_immediate_exercise_tax(
            sample_nso_holding, sample_profile
        )

        assert impact.exercise_tax > 0

    def test_sale_tax_calculation(self, sample_profile, sample_rsu_holding):
        """Test sale tax calculation."""
        service = TaxCalculationService()
        impact = service.calculate_sale_tax_now(sample_rsu_holding, sample_profile)

        assert impact.total_tax_current_year > 0
        assert impact.after_tax_proceeds > 0


class TestEdgeCases:
    """Test edge cases and boundary conditions."""

    def test_zero_gain_no_tax(self, sample_profile):
        """Test that zero gain results in zero tax."""
        holding = EquityHolding(
            grant_type=EquityType.RSU,
            grant_date=date(2022, 1, 15),
            shares_total=100,
            strike_price=150,
            current_fmv=150,  # No gain
            vesting_schedule=VestingSchedule(
                cliff_months=12,
                vesting_period_months=48,
                shares=100,
            ),
            shares_vested=100,
        )

        service = TaxCalculationService()
        impact = service.calculate_sale_tax_now(holding, sample_profile)

        assert impact.long_term_gain_tax == pytest.approx(0, abs=1)

    def test_underwater_option(self, sample_profile):
        """Test underwater option (strike > FMV)."""
        holding = EquityHolding(
            grant_type=EquityType.NSO,
            grant_date=date(2022, 1, 15),
            shares_total=100,
            strike_price=150,
            current_fmv=100,  # Underwater
            vesting_schedule=VestingSchedule(
                cliff_months=12,
                vesting_period_months=48,
                shares=100,
            ),
            shares_vested=100,
        )

        service = TaxCalculationService()
        impact = service.calculate_sale_tax_now(holding, sample_profile)

        # Tax on negative gain should be zero
        assert impact.total_tax_current_year == pytest.approx(0, abs=1)

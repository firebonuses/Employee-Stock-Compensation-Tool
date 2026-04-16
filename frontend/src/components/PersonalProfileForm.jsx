import React, { useState } from 'react'
import { useForm } from 'react-hook-form'

function PersonalProfileForm({ onSubmit }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      age: 35,
      filing_status: 'mfj',
      state_residence: 'CA',
      annual_w2_income: 150000,
      spouse_income: 0,
      other_income: 0,
      estimated_tax_bracket: 0.32,
      cash_reserves: 50000,
      total_portfolio_value: 500000,
      risk_tolerance: 6,
      max_stock_concentration: 0.30,
    }
  })

  const portfolioValue = watch('total_portfolio_value')
  const concentration = watch('max_stock_concentration')

  return (
    <div className="form-container">
      <h2>Step 1: Your Profile</h2>
      <p className="form-description">
        Tell us about your finances. We'll use this to calculate taxes and recommendations.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="form">
        <fieldset>
          <legend>Personal Information</legend>

          <div className="form-group">
            <label htmlFor="age">Age *</label>
            <input
              type="number"
              id="age"
              min="18"
              max="120"
              {...register('age', { required: 'Age is required' })}
            />
            {errors.age && <span className="error">{errors.age.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="filing_status">Filing Status *</label>
            <select id="filing_status" {...register('filing_status')}>
              <option value="single">Single</option>
              <option value="mfj">Married Filing Jointly</option>
              <option value="mfs">Married Filing Separately</option>
              <option value="hoh">Head of Household</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="state_residence">State of Residence *</label>
            <input
              type="text"
              id="state_residence"
              maxLength="2"
              placeholder="CA"
              {...register('state_residence', { required: 'State is required', minLength: 2 })}
            />
            {errors.state_residence && <span className="error">{errors.state_residence.message}</span>}
          </div>
        </fieldset>

        <fieldset>
          <legend>Income</legend>

          <div className="form-group">
            <label htmlFor="annual_w2_income">Annual W-2 Income (excluding stock) *</label>
            <input
              type="number"
              id="annual_w2_income"
              min="0"
              step="1000"
              {...register('annual_w2_income', { required: 'W-2 income is required' })}
            />
            {errors.annual_w2_income && <span className="error">{errors.annual_w2_income.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="spouse_income">Spouse Income</label>
            <input
              type="number"
              id="spouse_income"
              min="0"
              step="1000"
              {...register('spouse_income')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="other_income">Other Income (dividends, rental, etc.)</label>
            <input
              type="number"
              id="other_income"
              min="0"
              step="1000"
              {...register('other_income')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="estimated_tax_bracket">Estimated Tax Bracket *</label>
            <select id="estimated_tax_bracket" {...register('estimated_tax_bracket')}>
              <option value="0.10">10%</option>
              <option value="0.12">12%</option>
              <option value="0.22">22%</option>
              <option value="0.24">24%</option>
              <option value="0.32">32%</option>
              <option value="0.35">35%</option>
              <option value="0.37">37%</option>
            </select>
          </div>
        </fieldset>

        <fieldset>
          <legend>Financial Position</legend>

          <div className="form-group">
            <label htmlFor="cash_reserves">Cash Reserves & Emergency Fund *</label>
            <input
              type="number"
              id="cash_reserves"
              min="0"
              step="10000"
              {...register('cash_reserves', { required: 'Cash reserves required' })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="total_portfolio_value">Total Portfolio Value (including company stock) *</label>
            <input
              type="number"
              id="total_portfolio_value"
              min="1"
              step="50000"
              {...register('total_portfolio_value', { required: 'Portfolio value required' })}
            />
            {errors.total_portfolio_value && <span className="error">{errors.total_portfolio_value.message}</span>}
          </div>
        </fieldset>

        <fieldset>
          <legend>Goals & Risk Tolerance</legend>

          <div className="form-group">
            <label htmlFor="risk_tolerance">
              Risk Tolerance: <strong>{watch('risk_tolerance')}/10</strong>
            </label>
            <input
              type="range"
              id="risk_tolerance"
              min="1"
              max="10"
              {...register('risk_tolerance')}
            />
            <p className="form-hint">1 = Very Conservative, 10 = Very Aggressive</p>
          </div>

          <div className="form-group">
            <label htmlFor="max_stock_concentration">
              Max Company Stock as % of Portfolio: <strong>{(concentration * 100).toFixed(0)}%</strong>
            </label>
            <input
              type="range"
              id="max_stock_concentration"
              min="0.10"
              max="0.80"
              step="0.05"
              {...register('max_stock_concentration', { valueAsNumber: true })}
            />
            <p className="form-hint">
              Current max: ${(portfolioValue * concentration).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </p>
          </div>
        </fieldset>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Next: Add Equity Holdings
          </button>
        </div>
      </form>
    </div>
  )
}

export default PersonalProfileForm

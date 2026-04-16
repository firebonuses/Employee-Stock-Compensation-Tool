import React, { useState } from 'react'
import { useForm } from 'react-hook-form'

function EquityHoldingsForm({ onSubmit, onBack, loading }) {
  const [holdings, setHoldings] = useState([])
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      grant_type: 'RSU',
      grant_date: '',
      shares_total: 100,
      strike_price: 100,
      current_fmv: 150,
      vesting_schedule: {
        cliff_months: 12,
        vesting_period_months: 48,
        shares: 100,
      },
      shares_vested: 25,
    }
  })

  const handleAddHolding = (data) => {
    const newHolding = {
      id: `holding-${Date.now()}`,
      ...data,
      shares_total: parseFloat(data.shares_total),
      strike_price: parseFloat(data.strike_price),
      current_fmv: parseFloat(data.current_fmv),
      shares_vested: parseFloat(data.shares_vested),
      vesting_schedule: {
        cliff_months: parseInt(data.vesting_schedule.cliff_months),
        vesting_period_months: parseInt(data.vesting_schedule.vesting_period_months),
        shares: parseFloat(data.shares_total),
      },
    }
    setHoldings([...holdings, newHolding])
    reset()
  }

  const handleRemoveHolding = (id) => {
    setHoldings(holdings.filter(h => h.id !== id))
  }

  const totalValue = holdings.reduce((sum, h) => sum + (h.shares_total * h.current_fmv), 0)
  const totalUnrealizedGain = holdings.reduce(
    (sum, h) => sum + (Math.max(0, h.shares_vested * (h.current_fmv - h.strike_price))),
    0
  )

  return (
    <div className="form-container">
      <h2>Step 2: Add Equity Holdings</h2>
      <p className="form-description">
        Add each grant of stock options, RSUs, ISOs, or ESPP shares. Include vesting dates and current value.
      </p>

      <form onSubmit={handleSubmit(handleAddHolding)} className="form">
        <fieldset>
          <legend>Add a Grant</legend>

          <div className="form-group">
            <label htmlFor="grant_type">Grant Type *</label>
            <select id="grant_type" {...register('grant_type')}>
              <option value="RSU">RSU (Restricted Stock Unit)</option>
              <option value="ISO">ISO (Incentive Stock Option)</option>
              <option value="NSO">NSO (Non-Qualified Stock Option)</option>
              <option value="ESPP">ESPP (Employee Stock Purchase Plan)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="grant_date">Grant Date *</label>
            <input
              type="date"
              id="grant_date"
              {...register('grant_date', { required: 'Grant date is required' })}
            />
            {errors.grant_date && <span className="error">{errors.grant_date.message}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="shares_total">Total Shares *</label>
              <input
                type="number"
                id="shares_total"
                min="1"
                step="0.01"
                {...register('shares_total', { required: 'Shares required' })}
              />
              {errors.shares_total && <span className="error">{errors.shares_total.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="strike_price">Strike Price (or Cost Basis) *</label>
              <input
                type="number"
                id="strike_price"
                min="0"
                step="0.01"
                {...register('strike_price', { required: 'Strike price required' })}
              />
              {errors.strike_price && <span className="error">{errors.strike_price.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="current_fmv">Current Fair Market Value *</label>
              <input
                type="number"
                id="current_fmv"
                min="0"
                step="0.01"
                {...register('current_fmv', { required: 'FMV required' })}
              />
              {errors.current_fmv && <span className="error">{errors.current_fmv.message}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="shares_vested">Shares Currently Vested *</label>
              <input
                type="number"
                id="shares_vested"
                min="0"
                step="0.01"
                {...register('shares_vested', { required: 'Vested shares required' })}
              />
              {errors.shares_vested && <span className="error">{errors.shares_vested.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="cliff_months">Cliff Vesting (months)</label>
              <input
                type="number"
                id="cliff_months"
                min="0"
                step="1"
                {...register('vesting_schedule.cliff_months')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="vesting_period">Total Vesting Period (months)</label>
              <input
                type="number"
                id="vesting_period"
                min="1"
                step="1"
                {...register('vesting_schedule.vesting_period_months')}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-secondary">
              + Add This Grant
            </button>
          </div>
        </fieldset>
      </form>

      {holdings.length > 0 && (
        <div className="holdings-summary">
          <h3>Your Equity Holdings ({holdings.length})</h3>
          <table className="holdings-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Shares</th>
                <th>Strike</th>
                <th>Current FMV</th>
                <th>Value</th>
                <th>Vested</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {holdings.map(holding => (
                <tr key={holding.id}>
                  <td>{holding.grant_type}</td>
                  <td>{holding.shares_total.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                  <td>${holding.strike_price.toFixed(2)}</td>
                  <td>${holding.current_fmv.toFixed(2)}</td>
                  <td>${(holding.shares_total * holding.current_fmv).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                  <td>{holding.shares_vested.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                  <td>
                    <button
                      className="btn-danger"
                      onClick={() => handleRemoveHolding(holding.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="holdings-totals">
            <p><strong>Total Portfolio Value:</strong> {totalValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
            <p><strong>Unrealized Gain (vested):</strong> {totalUnrealizedGain.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
          </div>

          <div className="form-actions">
            <button className="btn-primary" onClick={() => onSubmit(holdings)} disabled={loading}>
              {loading ? 'Analyzing...' : 'Analyze & Get Recommendations'}
            </button>
            <button className="btn-secondary" onClick={onBack}>
              Back
            </button>
          </div>
        </div>
      )}

      {holdings.length === 0 && (
        <div className="empty-state">
          <p>No holdings added yet. Fill out the form above to add your first grant.</p>
        </div>
      )}
    </div>
  )
}

export default EquityHoldingsForm

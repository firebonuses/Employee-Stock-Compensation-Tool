import React, { useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import ActionPlanView from './ActionPlanView'
import ScenariosView from './ScenariosView'

function ResultsDashboard({ results }) {
  const [activeTab, setActiveTab] = useState('summary')

  const concentration = results.current_concentration_pct
  const concentrationColor = concentration > 0.40 ? '#e74c3c' : concentration > 0.25 ? '#f39c12' : '#27ae60'

  const concentrationData = [
    { name: 'Company Stock', value: concentration * 100 },
    { name: 'Other Assets', value: (1 - concentration) * 100 },
  ]

  const COLORS = ['#3498db', '#95a5a6']

  return (
    <div className="results-dashboard">
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          📊 Summary
        </button>
        <button
          className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          ✓ Action Plan
        </button>
        <button
          className={`tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          📈 Holdings Analysis
        </button>
        <button
          className={`tab-btn ${activeTab === 'scenarios' ? 'active' : ''}`}
          onClick={() => setActiveTab('scenarios')}
        >
          🎯 Scenarios
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'summary' && (
          <div className="summary-section">
            <h2>Your Equity Situation</h2>

            <div className="metrics-grid">
              <div className="metric-card">
                <h3>Portfolio Concentration</h3>
                <p className="metric-value" style={{ color: concentrationColor }}>
                  {(concentration * 100).toFixed(1)}%
                </p>
                <p className="metric-label">
                  {concentration > 0.40
                    ? '⚠️ HIGH - Consider diversifying'
                    : concentration > 0.25
                    ? '⚠️ MODERATE - Watch this level'
                    : '✓ HEALTHY'}
                </p>
                <p className="metric-sublabel">Target: {(results.risk_metrics.target_concentration_pct * 100).toFixed(0)}%</p>
              </div>

              <div className="metric-card">
                <h3>Est. Tax Savings</h3>
                <p className="metric-value">
                  ${results.action_plan.total_estimated_tax_savings.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </p>
                <p className="metric-label">From recommended actions</p>
              </div>

              <div className="metric-card">
                <h3>Immediate Actions</h3>
                <p className="metric-value">{results.action_plan.immediate_actions.length}</p>
                <p className="metric-label">
                  {results.action_plan.immediate_actions.length > 0
                    ? 'Execute in next 30 days'
                    : 'No immediate actions needed'}
                </p>
              </div>

              <div className="metric-card">
                <h3>Total Equity Value</h3>
                <p className="metric-value">
                  ${results.analysis.reduce((sum, a) => sum + a.current_position_value, 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </p>
                <p className="metric-label">Across all holdings</p>
              </div>
            </div>

            <div className="charts-grid">
              <div className="chart-container">
                <h3>Concentration Split</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={concentrationData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name} ${value.toFixed(1)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-container">
                <h3>Risk Assessment</h3>
                <div className="risk-breakdown">
                  <p>
                    <strong>Concentration Risk:</strong>{' '}
                    <span className={`risk-badge ${results.risk_metrics.concentration_risk}`}>
                      {results.risk_metrics.concentration_risk}
                    </span>
                  </p>
                  <p>
                    <strong>Diversification Needed:</strong>{' '}
                    <span className="metric-value">
                      ${results.risk_metrics.diversification_needed_usd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </span>
                  </p>
                  <p className="form-hint">
                    Selling this amount would reduce your concentration to the target level.
                  </p>
                </div>
              </div>
            </div>

            <div className="summary-text">
              <h3>Key Insights</h3>
              <div className="insight-box">
                <p>{results.action_plan.summary}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <ActionPlanView actionPlan={results.action_plan} />
        )}

        {activeTab === 'analysis' && (
          <div className="analysis-section">
            <h2>Holdings Analysis</h2>
            <table className="analysis-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Shares</th>
                  <th>Current Value</th>
                  <th>Unrealized Gain</th>
                  <th>Concentration %</th>
                  <th>Tax If Sold</th>
                  <th>Days to LT</th>
                </tr>
              </thead>
              <tbody>
                {results.analysis.map((analysis, idx) => (
                  <tr key={idx}>
                    <td>{analysis.holding.grant_type}</td>
                    <td>{analysis.holding.shares_vested.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                    <td>${analysis.current_position_value.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                    <td>${analysis.unrealized_gain.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                    <td>{(analysis.concentration_pct * 100).toFixed(1)}%</td>
                    <td>${analysis.tax_impact_if_sold_now.total_tax_current_year.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                    <td>{analysis.days_to_long_term}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'scenarios' && (
          <ScenariosView scenarios={results.scenarios} />
        )}
      </div>
    </div>
  )
}

export default ResultsDashboard

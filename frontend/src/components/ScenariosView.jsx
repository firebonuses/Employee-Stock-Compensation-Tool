import React from 'react'

function ScenariosView({ scenarios }) {
  return (
    <div className="scenarios-section">
      <h2>Scenario Analysis</h2>
      <p className="section-description">
        How would your situation change if the stock price moved? Here's what happens in different scenarios.
      </p>

      <div className="scenarios-grid">
        {scenarios.map((scenario, idx) => (
          <div key={idx} className="scenario-card">
            <h3>{scenario.scenario_name}</h3>

            <div className="scenario-metrics">
              <div className="metric">
                <label>Stock Price Assumption</label>
                <p className="value">${scenario.stock_price_assumption.toFixed(2)}</p>
              </div>

              <div className="metric">
                <label>Portfolio Value</label>
                <p className="value">
                  ${scenario.projected_portfolio_value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </p>
              </div>

              <div className="metric">
                <label>Est. Tax Impact</label>
                <p className="value" style={{ color: scenario.total_tax_impact > 0 ? '#e74c3c' : '#27ae60' }}>
                  ${scenario.total_tax_impact.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </p>
              </div>

              <div className="metric">
                <label>Concentration %</label>
                <p className="value">
                  {(scenario.concentration_pct * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            {scenario.recommendations.length > 0 && (
              <div className="scenario-recs">
                <h4>Top Actions in This Scenario</h4>
                <ul>
                  {scenario.recommendations.slice(0, 3).map((rec, recIdx) => (
                    <li key={recIdx}>
                      <strong>{rec.action}</strong> {rec.shares.toLocaleString('en-US', { maximumFractionDigits: 2 })} shares
                      <br />
                      <small>{rec.rationale}</small>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="scenarios-insights">
        <h3>What This Means</h3>
        <div className="insight-list">
          <div className="insight-item">
            <h4>Stock Price Up 30%</h4>
            <p>
              Higher valuations increase your tax liability if you sell, but also increase your wealth.
              Consider selling smaller tranches to spread out tax impact.
            </p>
          </div>
          <div className="insight-item">
            <h4>Stock Price Flat</h4>
            <p>
              This baseline scenario assumes current prices. It's the most likely near-term scenario
              and should guide your immediate actions.
            </p>
          </div>
          <div className="insight-item">
            <h4>Stock Price Down 30%</h4>
            <p>
              Lower prices reduce gains and tax liability. This is the time to harvest losses if exercising
              options, or hold until recovery if you're bullish on the company.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScenariosView

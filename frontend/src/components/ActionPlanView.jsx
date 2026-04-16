import React from 'react'

function ActionPlanView({ actionPlan }) {
  const renderRecommendation = (rec, index) => (
    <div key={index} className="recommendation-card">
      <div className="recommendation-header">
        <h4>
          {rec.action === 'Exercise' && '📋'}
          {rec.action === 'Sell' && '💰'}
          {rec.action === 'Hold' && '⏳'}
          {rec.action === 'Plan Vesting' && '📅'}
          {' '} {rec.action} {rec.shares.toLocaleString('en-US', { maximumFractionDigits: 2 })} Shares
        </h4>
        <span className={`timeline-badge priority-${rec.priority}`}>
          {rec.timeline}
        </span>
      </div>
      <p className="recommendation-rationale">{rec.rationale}</p>
      {rec.tax_benefit > 0 && (
        <p className="recommendation-benefit">
          💡 Estimated tax benefit: ${rec.tax_benefit.toLocaleString('en-US', { maximumFractionDigits: 0 })}
        </p>
      )}
    </div>
  )

  return (
    <div className="action-plan-section">
      <h2>Your Action Plan</h2>

      {actionPlan.immediate_actions.length > 0 && (
        <div className="action-group immediate">
          <h3>🔴 Immediate Actions (Next 30 Days)</h3>
          <p className="action-group-description">
            These actions have clear tax benefits and should be executed soon.
          </p>
          {actionPlan.immediate_actions.map((rec, idx) =>
            renderRecommendation(rec, `immediate-${idx}`)
          )}
        </div>
      )}

      {actionPlan.medium_term_actions.length > 0 && (
        <div className="action-group medium">
          <h3>🟡 Medium-Term Actions (3-12 Months)</h3>
          <p className="action-group-description">
            Execute these as you approach vesting dates or tax planning milestones.
          </p>
          {actionPlan.medium_term_actions.map((rec, idx) =>
            renderRecommendation(rec, `medium-${idx}`)
          )}
        </div>
      )}

      {actionPlan.long_term_actions.length > 0 && (
        <div className="action-group long-term">
          <h3>🟢 Long-Term Strategy (1+ Years)</h3>
          <p className="action-group-description">
            Hold these positions to achieve long-term capital gains treatment or wait for better timing.
          </p>
          {actionPlan.long_term_actions.map((rec, idx) =>
            renderRecommendation(rec, `long-${idx}`)
          )}
        </div>
      )}

      <div className="plan-summary">
        <h3>Summary</h3>
        <div className="summary-box">
          <p className="summary-text">{actionPlan.summary}</p>
          <p className="warning-note">
            ⚠️ <strong>Important:</strong> This is guidance only, not tax advice. Consult a qualified tax professional
            before executing any trades. Tax laws are complex and individual situations vary.
          </p>
        </div>
      </div>

      <div className="checklist">
        <h3>Before You Execute</h3>
        <ul className="checklist-items">
          <li>☐ Review with your tax professional or CPA</li>
          <li>☐ Check your company's blackout dates and trading windows</li>
          <li>☐ Verify current stock price with your broker</li>
          <li>☐ Understand wash sale implications if selling at a loss</li>
          <li>☐ Plan for the tax liability in the current year</li>
          <li>☐ Have a diversification plan for proceeds</li>
        </ul>
      </div>
    </div>
  )
}

export default ActionPlanView

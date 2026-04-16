import React, { useState } from 'react'
import axios from 'axios'
import PersonalProfileForm from './components/PersonalProfileForm'
import EquityHoldingsForm from './components/EquityHoldingsForm'
import ResultsDashboard from './components/ResultsDashboard'
import './styles/App.css'

function App() {
  const [currentStep, setCurrentStep] = useState('profile') // profile, holdings, results
  const [profileData, setProfileData] = useState(null)
  const [holdingsData, setHoldingsData] = useState([])
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleProfileSubmit = (profile) => {
    setProfileData(profile)
    setCurrentStep('holdings')
    setError(null)
  }

  const handleHoldingsSubmit = async (holdings) => {
    if (holdings.length === 0) {
      setError('Please add at least one equity holding')
      return
    }

    setHoldingsData(holdings)
    setLoading(true)
    setError(null)

    try {
      const input = {
        profile: profileData,
        equity_holdings: holdings,
        liquidity_events: [],
        time_horizon_years: 10,
      }

      const response = await axios.post('/api/calculate', input)

      if (response.data.success) {
        setResults(response.data.data)
        setCurrentStep('results')
      } else {
        setError(response.data.error || 'Calculation failed')
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setCurrentStep('profile')
    setProfileData(null)
    setHoldingsData([])
    setResults(null)
    setError(null)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>📊 Stock Compensation Calculator</h1>
        <p>Optimize your equity diversification strategy</p>
      </header>

      <main className="app-main">
        {error && (
          <div className="error-banner">
            <p>{error}</p>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {currentStep === 'profile' && (
          <PersonalProfileForm onSubmit={handleProfileSubmit} />
        )}

        {currentStep === 'holdings' && (
          <EquityHoldingsForm
            onSubmit={handleHoldingsSubmit}
            onBack={() => setCurrentStep('profile')}
            loading={loading}
          />
        )}

        {currentStep === 'results' && results && (
          <div>
            <ResultsDashboard results={results} />
            <div className="action-buttons">
              <button className="btn-primary" onClick={handleReset}>
                Start Over
              </button>
              <button className="btn-secondary" onClick={() => window.print()}>
                Print Report
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>⚠️ This tool provides guidance only. Consult a tax professional before making decisions.</p>
      </footer>
    </div>
  )
}

export default App

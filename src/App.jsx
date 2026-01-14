import { useState } from 'react'
import { parseScreenerText, formatParsedData } from './screenerParser'
import { fetchYahooData, formatYahooData } from './yahooClient'

function App() {
  const [stockCode, setStockCode] = useState('')
  const [screenerText, setScreenerText] = useState('')
  const [output, setOutput] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [yahooLoading, setYahooLoading] = useState(false)

  const handleExtract = async () => {
    setError(null)
    setOutput(null)

    // Validate screener text
    if (!screenerText.trim()) {
      setError('Please paste screener.in content')
      return
    }

    setLoading(true)

    try {
      // Parse screener data (instant, client-side)
      const parsed = parseScreenerText(screenerText)
      const formatted = formatParsedData(parsed)

      // Initialize output with screener data
      const result = {
        screener: formatted,
        yahoo: null
      }

      setOutput(result)
      setLoading(false)

      // Optionally fetch Yahoo data if stock code provided
      if (stockCode.trim()) {
        setYahooLoading(true)
        try {
          const yahooData = await fetchYahooData(stockCode.trim())
          const formattedYahoo = formatYahooData(yahooData)
          setOutput(prev => ({
            ...prev,
            yahoo: formattedYahoo
          }))
        } catch (e) {
          console.error('Yahoo fetch error:', e)
          // Don't set error, just show N/A for Yahoo fields
        }
        setYahooLoading(false)
      }
    } catch (e) {
      setError(e.message || 'Failed to parse screener data')
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!output) return

    // Build text output
    let text = '=== STOCK DATA ===\n\n'
    
    // Add screener data
    const { screener, yahoo } = output
    
    const sections = [
      { title: 'PRICE & VOLUME', data: { ...screener.priceVolume, ...(yahoo || {}) } },
      { title: 'VALUATION', data: screener.valuation },
      { title: 'FINANCIAL STRENGTH', data: screener.financialStrength },
      { title: 'GROWTH', data: screener.growth },
      { title: 'SHAREHOLDING', data: screener.shareholding },
      { title: 'CORPORATE SIGNALS', data: screener.corporateSignals }
    ]

    sections.forEach(({ title, data }) => {
      text += `── ${title} ──\n`
      Object.entries(data).forEach(([key, value]) => {
        text += `${key}: ${value ?? 'N/A'}\n`
      })
      text += '\n'
    })

    navigator.clipboard.writeText(text)
  }

  const renderValue = (value, key) => {
    if (value === null || value === undefined) {
      return <span className="data-value na">N/A</span>
    }
    
    // Check for positive/negative values
    const strValue = String(value)
    let className = 'data-value'
    
    if (strValue.startsWith('+')) {
      className += ' positive'
    } else if (strValue.startsWith('-') && !strValue.includes('/')) {
      className += ' negative'
    }
    
    return <span className={className}>{value}</span>
  }

  const renderDataGroup = (title, data, source = null) => {
    if (!data) return null
    
    const entries = Object.entries(data).filter(([_, v]) => v !== undefined)
    if (entries.length === 0) return null

    return (
      <div className="data-group">
        <div className="group-title">
          {title}
          {source && <span className={`source-badge ${source.toLowerCase()}`}>{source}</span>}
        </div>
        {entries.map(([key, value]) => (
          <div className="data-row" key={key}>
            <span className="data-label">{key}</span>
            {renderValue(value, key)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1>STOCK EXTRACTOR</h1>
        <p>Paste screener.in data • Get structured output</p>
      </header>

      <div className="input-section">
        <div className="input-row">
          <input
            type="text"
            className="stock-input"
            placeholder="Stock code (e.g., HDFCBANK)"
            value={stockCode}
            onChange={(e) => setStockCode(e.target.value.toUpperCase())}
          />
          <button 
            className="extract-btn" 
            onClick={handleExtract}
            disabled={loading}
          >
            {loading ? '...' : 'Extract'}
          </button>
        </div>
        
        <div className="textarea-wrapper">
          <textarea
            className="screener-textarea"
            placeholder="Paste the entire screener.in page content here...&#10;&#10;Go to screener.in/company/SYMBOL → Select All (Ctrl+A) → Copy (Ctrl+C) → Paste here"
            value={screenerText}
            onChange={(e) => setScreenerText(e.target.value)}
          />
          <span className="char-count">{screenerText.length.toLocaleString()} chars</span>
        </div>
      </div>

      <div className="output-section">
        <div className="output-header">
          <h2>Output</h2>
          {output && (
            <button className="copy-btn" onClick={handleCopy}>
              Copy All
            </button>
          )}
        </div>
        
        <div className="output-content">
          {error && (
            <div className="error-message">{error}</div>
          )}
          
          {loading && (
            <div className="loading">Parsing screener data...</div>
          )}
          
          {!output && !loading && !error && (
            <div className="empty-state">
              Paste screener.in content and click Extract
            </div>
          )}
          
          {output && (
            <>
              {/* Price & Volume - Combined from screener + yahoo */}
              {renderDataGroup('Price & Volume', {
                ...output.screener.priceVolume,
                ...(output.yahoo ? {
                  'Day High / Low': output.yahoo['Day High / Low'],
                  'Volume (today)': output.yahoo['Volume (today)'],
                  '10-day Avg Volume': output.yahoo['10-day Avg Volume']
                } : {
                  'Day High / Low': yahooLoading ? '...' : null,
                  'Volume (today)': yahooLoading ? '...' : null,
                  '10-day Avg Volume': yahooLoading ? '...' : null
                })
              })}
              
              {/* Valuation */}
              {renderDataGroup('Valuation', {
                ...output.screener.valuation,
                'Industry P/E': null // Not available
              })}
              
              {/* Financial Strength */}
              {renderDataGroup('Financial Strength', {
                ...output.screener.financialStrength,
                'Debt to Equity': output.yahoo?.['Debt to Equity'] || (yahooLoading ? '...' : null)
              })}
              
              {/* Growth */}
              {renderDataGroup('Growth', output.screener.growth)}
              
              {/* Shareholding */}
              {renderDataGroup('Shareholding', output.screener.shareholding)}
              
              {/* Corporate Signals */}
              {renderDataGroup('Corporate Signals', output.screener.corporateSignals)}
            </>
          )}
        </div>
      </div>

      <footer className="footer">
        <p>
          Data from <a href="https://screener.in" target="_blank" rel="noopener">screener.in</a> 
          {stockCode && ' + Yahoo Finance'}
        </p>
      </footer>
    </div>
  )
}

export default App


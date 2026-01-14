// =============================================================================
// Yahoo Finance Client
// Fetches only 4 live data points: Day High/Low, Volume, Avg Volume, D/E
// =============================================================================

const YAHOO_BASE_URL = "https://query1.finance.yahoo.com/v8/finance/chart";

/**
 * Fetch live stock data from Yahoo Finance
 * @param {string} symbol - Stock symbol (e.g., "HDFCBANK")
 * @returns {Promise<object>} - Live data: dayHigh, dayLow, volume, avgVolume, debtToEquity
 */
export async function fetchYahooData(symbol) {
  // Add .NS suffix for NSE stocks
  const yahooSymbol = symbol.toUpperCase().endsWith('.NS') 
    ? symbol.toUpperCase() 
    : `${symbol.toUpperCase()}.NS`;
  
  try {
    // Fetch chart data for price and volume
    const chartUrl = `${YAHOO_BASE_URL}/${yahooSymbol}?interval=1d&range=1d`;
    const chartResponse = await fetch(chartUrl);
    
    if (!chartResponse.ok) {
      throw new Error(`Yahoo API error: ${chartResponse.status}`);
    }
    
    const chartData = await chartResponse.json();
    const result = chartData?.chart?.result?.[0];
    
    if (!result) {
      throw new Error("No data returned from Yahoo Finance");
    }
    
    const meta = result.meta || {};
    const quote = result.indicators?.quote?.[0] || {};
    
    // Get day high/low from current trading day
    const dayHigh = meta.regularMarketDayHigh || 
                    (quote.high ? Math.max(...quote.high.filter(v => v !== null)) : null);
    const dayLow = meta.regularMarketDayLow || 
                   (quote.low ? Math.min(...quote.low.filter(v => v !== null)) : null);
    
    // Get volume
    const volume = meta.regularMarketVolume || 
                   (quote.volume ? quote.volume.reduce((a, b) => (a || 0) + (b || 0), 0) : null);
    
    // Get 10-day average volume (approximation from meta)
    const avgVolume = meta.averageDailyVolume10Day || null;
    
    // For Debt to Equity, we need the quoteSummary endpoint
    let debtToEquity = null;
    try {
      const summaryUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${yahooSymbol}?modules=financialData`;
      const summaryResponse = await fetch(summaryUrl);
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        debtToEquity = summaryData?.quoteSummary?.result?.[0]?.financialData?.debtToEquity?.raw || null;
      }
    } catch (e) {
      // D/E fetch failed, continue without it
      console.warn("Could not fetch Debt to Equity:", e.message);
    }
    
    return {
      dayHigh,
      dayLow,
      volume,
      avgVolume10d: avgVolume,
      debtToEquity,
      source: "Yahoo Finance",
      symbol: yahooSymbol
    };
  } catch (error) {
    console.error("Yahoo Finance fetch error:", error);
    return {
      dayHigh: null,
      dayLow: null,
      volume: null,
      avgVolume10d: null,
      debtToEquity: null,
      error: error.message,
      source: "Yahoo Finance"
    };
  }
}

/**
 * Format volume number for display (e.g., 2100000 -> "21L")
 * @param {number} volume - Raw volume number
 * @returns {string} - Formatted volume string
 */
export function formatVolume(volume) {
  if (volume === null || volume === undefined) return null;
  
  if (volume >= 10000000) {
    return `${(volume / 10000000).toFixed(2)} Cr`;
  } else if (volume >= 100000) {
    return `${(volume / 100000).toFixed(2)} L`;
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(2)} K`;
  }
  return volume.toString();
}

/**
 * Format Yahoo data for display
 * @param {object} yahooData - Data from fetchYahooData
 * @returns {object} - Formatted data for UI
 */
export function formatYahooData(yahooData) {
  if (yahooData.error) {
    return {
      "Day High / Low": "N/A",
      "Volume (today)": "N/A",
      "10-day Avg Volume": "N/A",
      "Debt to Equity": "N/A"
    };
  }
  
  return {
    "Day High / Low": yahooData.dayHigh && yahooData.dayLow 
      ? `₹${yahooData.dayHigh.toFixed(2)} / ₹${yahooData.dayLow.toFixed(2)}` 
      : null,
    "Volume (today)": formatVolume(yahooData.volume),
    "10-day Avg Volume": formatVolume(yahooData.avgVolume10d),
    "Debt to Equity": yahooData.debtToEquity !== null 
      ? yahooData.debtToEquity.toFixed(2) 
      : null
  };
}


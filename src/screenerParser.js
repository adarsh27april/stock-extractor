// =============================================================================
// Screener.in Text Parser
// Extracts structured stock data from copy-pasted Screener.in content
// =============================================================================

// =============================================================================
// Number Parsing Utilities
// =============================================================================

/**
 * Parse Indian formatted number (e.g., "14,41,457" or "₹ 937")
 * @param {string} str - String containing the number
 * @returns {number|null} - Parsed number or null if invalid
 */
export function parseIndianNumber(str) {
  if (!str || typeof str !== "string") return null;
  
  // Remove currency symbol, whitespace, and commas
  const cleaned = str.replace(/[₹,\s]/g, "").trim();
  
  // Handle percentage
  const withoutPercent = cleaned.replace(/%$/, "");
  
  const num = parseFloat(withoutPercent);
  return isNaN(num) ? null : num;
}

/**
 * Extract a number following a pattern in text
 * @param {string} text - Full text to search
 * @param {RegExp} pattern - Regex with capture group for the number
 * @returns {number|null}
 */
function extractNumber(text, pattern) {
  const match = text.match(pattern);
  if (!match || !match[1]) return null;
  return parseIndianNumber(match[1]);
}

/**
 * Extract a string following a pattern in text
 * @param {string} text - Full text to search
 * @param {RegExp} pattern - Regex with capture group
 * @returns {string|null}
 */
function extractString(text, pattern) {
  const match = text.match(pattern);
  return match?.[1]?.trim() || null;
}

// =============================================================================
// Price & Volume Extraction
// =============================================================================

function extractPriceVolume(text) {
  // Current Market Price: "₹ 937" or "₹937"
  const cmp = extractNumber(text, /₹\s*([\d,]+(?:\.\d+)?)/);
  
  // High / Low: "High / Low\n₹ 1,020 / 812" or inline
  const highLowMatch = text.match(/High\s*\/\s*Low\s*[\n\r]*₹?\s*([\d,]+)\s*\/\s*([\d,]+)/i);
  let highLow = null;
  let high = null;
  let low = null;
  if (highLowMatch) {
    high = parseIndianNumber(highLowMatch[1]);
    low = parseIndianNumber(highLowMatch[2]);
    highLow = `${highLowMatch[1]} / ${highLowMatch[2]}`;
  }

  return {
    cmp,
    dayHighLow: highLow,  // Note: Screener shows 52W High/Low, not daily
    week52HighLow: highLow,
    week52High: high,
    week52Low: low,
    volumeToday: "N/A",      // Not available in Screener copy-paste
    avgVolume10d: "N/A"      // Not available in Screener copy-paste
  };
}

// =============================================================================
// Valuation Metrics Extraction
// =============================================================================

function extractValuation(text) {
  // P/E Ratio: "Stock P/E\n20.3" or "P/E\n20.26"
  const peRatio = extractNumber(text, /(?:Stock\s+)?P\/E\s*[\n\r]*([\d.]+)/i);
  
  // Book Value: "Book Value\n₹ 337"
  const bookValue = extractNumber(text, /Book\s+Value\s*[\n\r]*₹?\s*([\d,]+(?:\.\d+)?)/i);
  
  // Face Value: "Face Value\n₹ 1.00"
  const faceValue = extractNumber(text, /Face\s+Value\s*[\n\r]*₹?\s*([\d.]+)/i);
  
  // CMP for P/B calculation
  const cmp = extractNumber(text, /₹\s*([\d,]+(?:\.\d+)?)/);
  
  // Calculate P/B ratio
  let pbRatio = null;
  if (cmp && bookValue && bookValue > 0) {
    pbRatio = Math.round((cmp / bookValue) * 100) / 100;
  }
  
  // Also check for explicit P/B in "Cons" section: "trading at 2.78 times its book value"
  const explicitPB = extractNumber(text, /trading\s+at\s+([\d.]+)\s+times\s+its\s+book\s+value/i);
  if (explicitPB) {
    pbRatio = explicitPB;
  }

  return {
    peRatio,
    industryPE: "N/A",  // Not available in Screener copy-paste
    pbRatio,
    bookValue,
    faceValue
  };
}

// =============================================================================
// Financial Strength Extraction
// =============================================================================

function extractFinancialStrength(text) {
  // Market Cap: "Market Cap\n₹ 14,41,457 Cr." or "Mar Cap Rs.Cr.\n1441456.96"
  let marketCap = extractString(text, /Market\s+Cap\s*[\n\r]*₹?\s*([\d,]+(?:\.\d+)?\s*(?:Cr\.?)?)/i);
  if (!marketCap) {
    const mcNum = extractNumber(text, /Mar\s+Cap\s+Rs\.?Cr\.?\s*[\n\r]*([\d,]+(?:\.\d+)?)/i);
    if (mcNum) marketCap = `${mcNum.toLocaleString('en-IN')} Cr`;
  }
  
  // EPS TTM: Look in P&L section (annual data) for TTM column
  // The annual P&L table has columns like "Mar 2024  Mar 2025  TTM"
  // Find the EPS row in the section that contains "TTM" header
  let epsTTM = null;
  
  // Look for P&L section with TTM column - EPS row pattern
  // Format: "EPS in Rs	8.84	10.19	...	44.01	46.42" where last value is TTM
  const plSection = text.match(/Profit\s+&\s+Loss[\s\S]*?TTM[\s\S]*?EPS\s+in\s+Rs\s+([\d.\s\t]+)/i);
  if (plSection) {
    const values = plSection[1].trim().split(/[\s\t]+/).filter(v => /^\d/.test(v));
    if (values.length > 0) {
      // The last value in annual P&L EPS row is TTM
      epsTTM = parseIndianNumber(values[values.length - 1]);
    }
  }
  
  // Fallback: Look for explicit "TTM" marker after EPS values
  if (!epsTTM) {
    // Try matching the pattern with TTM as last column header
    const ttmMatch = text.match(/Mar\s+2025\s+TTM[\s\S]*?EPS\s+in\s+Rs[\s\S]*?([\d.]+)\s*$/m);
    if (ttmMatch) {
      epsTTM = parseIndianNumber(ttmMatch[1]);
    }
  }
  
  // ROE: "ROE\n14.3 %" or "ROE %\n14%"
  const roe = extractNumber(text, /ROE\s*%?\s*[\n\r]*([\d.]+)\s*%?/i);
  
  // ROCE: "ROCE\n7.35 %" 
  const roce = extractNumber(text, /ROCE\s*%?\s*[\n\r]*([\d.]+)\s*%?/i);

  return {
    marketCap: marketCap || "N/A",
    debtToEquity: "N/A",  // Not directly available
    epsTTM,
    roe,
    roce
  };
}

// =============================================================================
// Growth & Profitability Extraction
// =============================================================================

function extractGrowth(text) {
  // Revenue/Sales Growth TTM: "Compounded Sales Growth\n...TTM:\n6%"
  let revenueGrowthYoY = extractString(text, /Compounded\s+Sales\s+Growth[\s\S]*?TTM[:\s]*([\d.]+%)/i);
  
  // Net Profit Growth TTM: "Compounded Profit Growth\n...TTM:\n8%"
  let profitGrowthYoY = extractString(text, /Compounded\s+Profit\s+Growth[\s\S]*?TTM[:\s]*([\d.]+%)/i);
  
  // Operating/Financing Margin: Look for latest "Financing Margin %" row
  let operatingMargin = null;
  const marginMatch = text.match(/Financing\s+Margin\s+%\s+([\d%\s\t-]+)/i);
  if (marginMatch) {
    const values = marginMatch[1].trim().split(/[\s\t]+/);
    // Get the latest non-empty value
    for (let i = values.length - 1; i >= 0; i--) {
      if (values[i] && values[i] !== "-") {
        operatingMargin = values[i].includes("%") ? values[i] : `${values[i]}%`;
        break;
      }
    }
  }

  return {
    revenueGrowthYoY: revenueGrowthYoY || "N/A",
    profitGrowthYoY: profitGrowthYoY || "N/A",
    operatingMargin: operatingMargin || "N/A"
  };
}

// =============================================================================
// Shareholding Pattern Extraction
// =============================================================================

function extractShareholding(text) {
  // Find shareholding section and extract latest quarter values
  const result = {
    promoter: null,
    promoterChange: null,
    fii: null,
    dii: null,
    public: null
  };
  
  // Promoters: "Promoters +\t25.59%\t25.52%\t0.00%..." - get last value
  const promoterMatch = text.match(/Promoters?\s*\+?\s+([\d.%\s\t]+)/i);
  if (promoterMatch) {
    const values = promoterMatch[1].trim().split(/[\s\t]+/).filter(v => v.includes("%") || /^\d/.test(v));
    if (values.length >= 1) {
      result.promoter = parseIndianNumber(values[values.length - 1]);
      // Calculate change from previous quarter
      if (values.length >= 2) {
        const prev = parseIndianNumber(values[values.length - 2]);
        const curr = result.promoter;
        if (prev !== null && curr !== null) {
          result.promoterChange = Math.round((curr - prev) * 100) / 100;
        }
      }
    }
  }
  
  // FIIs: "FIIs +\t32.24%\t33.38%..." - get last value
  const fiiMatch = text.match(/FIIs?\s*\+?\s+([\d.%\s\t]+)/i);
  if (fiiMatch) {
    const values = fiiMatch[1].trim().split(/[\s\t]+/).filter(v => v.includes("%") || /^\d/.test(v));
    if (values.length >= 1) {
      result.fii = parseIndianNumber(values[values.length - 1]);
    }
  }
  
  // DIIs: "DIIs +\t28.09%\t26.75%..." - get last value
  const diiMatch = text.match(/DIIs?\s*\+?\s+([\d.%\s\t]+)/i);
  if (diiMatch) {
    const values = diiMatch[1].trim().split(/[\s\t]+/).filter(v => v.includes("%") || /^\d/.test(v));
    if (values.length >= 1) {
      result.dii = parseIndianNumber(values[values.length - 1]);
    }
  }
  
  // Public: "Public +\t13.91%\t14.19%..." - get last value
  const publicMatch = text.match(/Public\s*\+?\s+([\d.%\s\t]+)/i);
  if (publicMatch) {
    const values = publicMatch[1].trim().split(/[\s\t]+/).filter(v => v.includes("%") || /^\d/.test(v));
    if (values.length >= 1) {
      result.public = parseIndianNumber(values[values.length - 1]);
    }
  }

  return result;
}

// =============================================================================
// Corporate Signals Extraction
// =============================================================================

function extractCorporateSignals(text) {
  // Upcoming result date: "Upcoming result date: 17 January 2026"
  const resultDate = extractString(text, /Upcoming\s+result\s+date[:\s]*([\d]+\s+\w+\s+\d{4})/i);
  
  // Recent corporate actions from announcements section
  let recentCorporateAction = "N/A";
  
  // Look for dividend, bonus, split, ESOP mentions
  const esopMatch = text.match(/ESOP\s*\/?\s*ESPS[^\n]*(\d+\s+\w+)/i);
  const dividendMatch = text.match(/Dividend[^\n]*(\d+\s+\w+)/i);
  const bonusMatch = text.match(/Bonus[^\n]*(\d+\s+\w+)/i);
  const splitMatch = text.match(/Split[^\n]*(\d+\s+\w+)/i);
  
  if (esopMatch) {
    recentCorporateAction = `ESOP/ESPS Allotment (${esopMatch[1]})`;
  } else if (dividendMatch) {
    recentCorporateAction = `Dividend (${dividendMatch[1]})`;
  } else if (bonusMatch) {
    recentCorporateAction = `Bonus (${bonusMatch[1]})`;
  } else if (splitMatch) {
    recentCorporateAction = `Stock Split (${splitMatch[1]})`;
  }
  
  // Recent announcements: Look for "Board Meeting" or important announcements
  let recentAnnouncement = "No";
  let announcementHeadline = null;
  
  const boardMeetingMatch = text.match(/Board\s+Meeting[^\n]*\n[^\n]*([\w\s\d,–-]+)/i);
  if (boardMeetingMatch) {
    recentAnnouncement = "Yes";
    announcementHeadline = boardMeetingMatch[0].substring(0, 100).trim();
  }
  
  // Check for RBI approval or other significant announcements
  const rbiMatch = text.match(/RBI\s+approved[^\n]*/i);
  if (rbiMatch) {
    recentAnnouncement = "Yes";
    announcementHeadline = announcementHeadline || rbiMatch[0].substring(0, 100).trim();
  }

  return {
    upcomingResultDate: resultDate || "N/A",
    recentCorporateAction,
    recentAnnouncement,
    announcementHeadline
  };
}

// =============================================================================
// Main Parser Function
// =============================================================================

/**
 * Parse raw Screener.in copy-pasted text and extract structured data
 * @param {string} rawText - Raw text from Screener.in
 * @returns {object} - Structured stock data
 */
export function parseScreenerText(rawText) {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("Invalid input: rawText must be a non-empty string");
  }

  const priceVolume = extractPriceVolume(rawText);
  const valuation = extractValuation(rawText);
  const financialStrength = extractFinancialStrength(rawText);
  const growth = extractGrowth(rawText);
  const shareholding = extractShareholding(rawText);
  const corporateSignals = extractCorporateSignals(rawText);

  return {
    priceVolume,
    valuation,
    financialStrength,
    growth,
    shareholding,
    corporateSignals,
    _meta: {
      parsedAt: new Date().toISOString(),
      source: "screener.in",
      dataPoints: countDataPoints({ priceVolume, valuation, financialStrength, growth, shareholding, corporateSignals })
    }
  };
}

/**
 * Count how many data points were successfully extracted
 */
function countDataPoints(data) {
  let total = 0;
  let extracted = 0;
  
  function count(obj) {
    for (const key of Object.keys(obj)) {
      if (key === "_meta") continue;
      const val = obj[key];
      if (val && typeof val === "object" && !Array.isArray(val)) {
        count(val);
      } else {
        total++;
        if (val !== null && val !== "N/A") {
          extracted++;
        }
      }
    }
  }
  
  count(data);
  return { total, extracted };
}

/**
 * Format parsed data as a flat key-value object for easy display
 * @param {object} parsed - Output from parseScreenerText
 * @returns {object} - Flat key-value pairs
 */
export function flattenParsedData(parsed) {
  return {
    // Price & Volume
    "Current Market Price (CMP)": parsed.priceVolume.cmp,
    "Day High / Low": parsed.priceVolume.dayHighLow || "N/A",
    "52-Week High / Low": parsed.priceVolume.week52HighLow || "N/A",
    "Volume (today)": parsed.priceVolume.volumeToday,
    "10-day average volume": parsed.priceVolume.avgVolume10d,
    
    // Valuation
    "P/E Ratio": parsed.valuation.peRatio,
    "Industry P/E": parsed.valuation.industryPE,
    "P/B Ratio": parsed.valuation.pbRatio,
    "Face Value": parsed.valuation.faceValue,
    
    // Financial Strength
    "Market Capitalization": parsed.financialStrength.marketCap,
    "Debt to Equity": parsed.financialStrength.debtToEquity,
    "EPS (TTM)": parsed.financialStrength.epsTTM,
    "ROE (%)": parsed.financialStrength.roe,
    "ROCE (%)": parsed.financialStrength.roce,
    
    // Growth & Profitability
    "Revenue growth (YoY)": parsed.growth.revenueGrowthYoY,
    "Net profit growth (YoY)": parsed.growth.profitGrowthYoY,
    "Operating margin": parsed.growth.operatingMargin,
    
    // Shareholding
    "Promoter holding (%)": parsed.shareholding.promoter,
    "Promoter holding change": parsed.shareholding.promoterChange,
    "FII holding (%)": parsed.shareholding.fii,
    "DII holding (%)": parsed.shareholding.dii,
    "Public holding (%)": parsed.shareholding.public,
    
    // Corporate Signals
    "Recent results date": parsed.corporateSignals.upcomingResultDate,
    "Recent corporate action": parsed.corporateSignals.recentCorporateAction,
    "Recent announcement": parsed.corporateSignals.recentAnnouncement
  };
}


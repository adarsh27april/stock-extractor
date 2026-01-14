// =============================================================================
// Screener.in Text Parser
// Extracts structured stock data from copy-pasted Screener.in content
// Enhanced for client-side use - extracts 19 data points
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
  let week52HighLow = null;
  let week52High = null;
  let week52Low = null;
  if (highLowMatch) {
    week52High = parseIndianNumber(highLowMatch[1]);
    week52Low = parseIndianNumber(highLowMatch[2]);
    week52HighLow = `₹${highLowMatch[1]} / ₹${highLowMatch[2]}`;
  }

  return {
    cmp,
    week52HighLow,
    week52High,
    week52Low
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
  
  // Calculate P/B ratio from CMP and Book Value
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
    if (mcNum) marketCap = `₹${mcNum.toLocaleString('en-IN')} Cr`;
  } else if (!marketCap.startsWith('₹')) {
    marketCap = `₹${marketCap}`;
  }
  
  // EPS TTM: Look in P&L section (annual data) for TTM column
  let epsTTM = null;
  
  // Look for P&L section with TTM column - EPS row pattern
  // Format: "EPS in Rs	8.84	10.19	...	44.01	46.42" where last value is TTM
  const plSection = text.match(/Profit\s+&\s+Loss[\s\S]*?TTM[\s\S]*?EPS\s+in\s+Rs\s+([\d.\s\t]+)/i);
  if (plSection) {
    const values = plSection[1].trim().split(/[\s\t]+/).filter(v => /^\d/.test(v));
    if (values.length > 0) {
      epsTTM = parseIndianNumber(values[values.length - 1]);
    }
  }
  
  // Fallback: Try to find EPS row directly
  if (!epsTTM) {
    const epsMatch = text.match(/EPS\s+in\s+Rs\s+([\d.\s\t]+)/i);
    if (epsMatch) {
      const values = epsMatch[1].trim().split(/[\s\t]+/).filter(v => /^\d/.test(v));
      if (values.length > 0) {
        epsTTM = parseIndianNumber(values[values.length - 1]);
      }
    }
  }
  
  // ROE: "ROE\n14.3 %" or "ROE %\n14%"
  const roe = extractNumber(text, /ROE\s*%?\s*[\n\r]*([\d.]+)\s*%?/i);
  
  // ROCE: "ROCE\n7.35 %" 
  const roce = extractNumber(text, /ROCE\s*%?\s*[\n\r]*([\d.]+)\s*%?/i);

  return {
    marketCap: marketCap || null,
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
  
  // Alternative pattern: "TTM:\n6%"
  if (!revenueGrowthYoY) {
    const salesMatch = text.match(/Compounded\s+Sales\s+Growth[\s\S]*?TTM[\s\S]*?([\d.]+)\s*%/i);
    if (salesMatch) {
      revenueGrowthYoY = `${salesMatch[1]}%`;
    }
  }
  
  // Net Profit Growth TTM: "Compounded Profit Growth\n...TTM:\n8%"
  let profitGrowthYoY = extractString(text, /Compounded\s+Profit\s+Growth[\s\S]*?TTM[:\s]*([\d.]+%)/i);
  
  if (!profitGrowthYoY) {
    const profitMatch = text.match(/Compounded\s+Profit\s+Growth[\s\S]*?TTM[\s\S]*?([\d.]+)\s*%/i);
    if (profitMatch) {
      profitGrowthYoY = `${profitMatch[1]}%`;
    }
  }
  
  // Operating/Financing Margin: Look for latest "Financing Margin %" row
  let operatingMargin = null;
  const marginMatch = text.match(/Financing\s+Margin\s+%\s+([\d%\s\t\-]+)/i);
  if (marginMatch) {
    const values = marginMatch[1].trim().split(/[\s\t]+/).filter(v => v && v !== "-");
    // Get the latest non-negative value (last in row before TTM might be negative)
    for (let i = values.length - 1; i >= 0; i--) {
      const val = values[i].replace('%', '');
      if (val && !isNaN(parseFloat(val))) {
        operatingMargin = values[i].includes('%') ? values[i] : `${values[i]}%`;
        break;
      }
    }
  }

  return {
    revenueGrowthYoY: revenueGrowthYoY || null,
    profitGrowthYoY: profitGrowthYoY || null,
    operatingMargin: operatingMargin || null
  };
}

// =============================================================================
// Shareholding Pattern Extraction
// =============================================================================

function extractShareholding(text) {
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
  let recentCorporateAction = null;
  
  // Look for dividend, bonus, split, ESOP mentions in announcements
  const esopMatch = text.match(/(?:Allotment\s+of\s+)?ESOP\s*\/?\s*ESPS[^\n]*?(\d+\s+\w+)/i);
  const dividendMatch = text.match(/Dividend[^\n]*?(\d+\s+\w+)/i);
  const bonusMatch = text.match(/Bonus[^\n]*?(\d+\s+\w+)/i);
  const splitMatch = text.match(/Split[^\n]*?(\d+\s+\w+)/i);
  
  if (esopMatch) {
    recentCorporateAction = `ESOP/ESPS (${esopMatch[1]})`;
  } else if (dividendMatch) {
    recentCorporateAction = `Dividend (${dividendMatch[1]})`;
  } else if (bonusMatch) {
    recentCorporateAction = `Bonus (${bonusMatch[1]})`;
  } else if (splitMatch) {
    recentCorporateAction = `Stock Split (${splitMatch[1]})`;
  }
  
  // Recent announcements: Look for announcements section
  let hasAnnouncement = false;
  let announcementHeadline = null;
  
  // Check for Board Meeting announcement
  const boardMeetingMatch = text.match(/Board\s+Meeting[^\n]*(?:Intimation|Approving)[^\n]*/i);
  if (boardMeetingMatch) {
    hasAnnouncement = true;
    announcementHeadline = boardMeetingMatch[0].substring(0, 100).trim();
  }
  
  // Check for SEBI/LODR announcements
  const lodrMatch = text.match(/(?:Intimation|Announcement)\s+Under\s+(?:SEBI|Regulation)[^\n]*/i);
  if (lodrMatch && !announcementHeadline) {
    hasAnnouncement = true;
    announcementHeadline = lodrMatch[0].substring(0, 100).trim();
  }
  
  // Check for RBI approval or other significant announcements
  const rbiMatch = text.match(/RBI\s+approved[^\n]*/i);
  if (rbiMatch) {
    hasAnnouncement = true;
    announcementHeadline = announcementHeadline || rbiMatch[0].substring(0, 100).trim();
  }

  return {
    upcomingResultDate: resultDate || null,
    recentCorporateAction,
    hasAnnouncement,
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
    corporateSignals
  };
}

/**
 * Format parsed data as a flat key-value object for easy display
 * @param {object} parsed - Output from parseScreenerText
 * @returns {object} - Flat key-value pairs grouped by category
 */
export function formatParsedData(parsed) {
  return {
    priceVolume: {
      "Current Market Price": parsed.priceVolume.cmp ? `₹${parsed.priceVolume.cmp}` : null,
      "52-Week High / Low": parsed.priceVolume.week52HighLow
    },
    valuation: {
      "P/E Ratio": parsed.valuation.peRatio,
      "P/B Ratio": parsed.valuation.pbRatio,
      "Book Value": parsed.valuation.bookValue ? `₹${parsed.valuation.bookValue}` : null,
      "Face Value": parsed.valuation.faceValue ? `₹${parsed.valuation.faceValue}` : null
    },
    financialStrength: {
      "Market Cap": parsed.financialStrength.marketCap,
      "EPS (TTM)": parsed.financialStrength.epsTTM ? `₹${parsed.financialStrength.epsTTM}` : null,
      "ROE": parsed.financialStrength.roe ? `${parsed.financialStrength.roe}%` : null,
      "ROCE": parsed.financialStrength.roce ? `${parsed.financialStrength.roce}%` : null
    },
    growth: {
      "Revenue Growth (YoY)": parsed.growth.revenueGrowthYoY,
      "Profit Growth (YoY)": parsed.growth.profitGrowthYoY,
      "Operating Margin": parsed.growth.operatingMargin
    },
    shareholding: {
      "Promoter": parsed.shareholding.promoter !== null ? `${parsed.shareholding.promoter}%` : null,
      "Promoter Change": parsed.shareholding.promoterChange !== null 
        ? `${parsed.shareholding.promoterChange > 0 ? '+' : ''}${parsed.shareholding.promoterChange}%` 
        : null,
      "FII": parsed.shareholding.fii !== null ? `${parsed.shareholding.fii}%` : null,
      "DII": parsed.shareholding.dii !== null ? `${parsed.shareholding.dii}%` : null,
      "Public": parsed.shareholding.public !== null ? `${parsed.shareholding.public}%` : null
    },
    corporateSignals: {
      "Results Date": parsed.corporateSignals.upcomingResultDate,
      "Corporate Action": parsed.corporateSignals.recentCorporateAction,
      "Recent Announcement": parsed.corporateSignals.hasAnnouncement 
        ? (parsed.corporateSignals.announcementHeadline || "Yes") 
        : "No"
    }
  };
}

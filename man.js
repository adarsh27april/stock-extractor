#!/usr/bin/env node
// =============================================================================
// Stock Extractor - Manual Page
// Usage: node man.js [topic]
// =============================================================================

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const UNDERLINE = "\x1b[4m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";

const topic = process.argv[2]?.toLowerCase();

const manPages = {
  main: `
${BOLD}STOCK-EXTRACTOR(1)${RESET}              User Commands              ${BOLD}STOCK-EXTRACTOR(1)${RESET}

${BOLD}${UNDERLINE}NAME${RESET}
       stock-extractor - Extract Indian stock market data from NSE and Screener.in

${BOLD}${UNDERLINE}SYNOPSIS${RESET}
       ${GREEN}node index.js${RESET} ${CYAN}<SYMBOL>${RESET} [--raw]
       ${GREEN}node screenerCli.js${RESET} ${CYAN}<input-file>${RESET} [--json] [--raw]
       ${GREEN}node man.js${RESET} [${CYAN}nse${RESET} | ${CYAN}screener${RESET} | ${CYAN}data${RESET} | ${CYAN}examples${RESET}]

${BOLD}${UNDERLINE}DESCRIPTION${RESET}
       A toolkit for extracting comprehensive stock data from Indian markets.
       
       This project provides two complementary data sources:
       
       ${BOLD}1. NSE API (index.js)${RESET}
          Fetches real-time data directly from NSE India's public APIs.
          Best for: Live prices, volume, corporate actions, announcements.
       
       ${BOLD}2. Screener Parser (screenerCli.js)${RESET}
          Parses copy-pasted text from screener.in website.
          Best for: Fundamentals, ratios, growth metrics, shareholding.

${BOLD}${UNDERLINE}MANUAL TOPICS${RESET}
       ${GREEN}node man.js${RESET}              Show this overview
       ${GREEN}node man.js nse${RESET}          NSE API tool documentation
       ${GREEN}node man.js screener${RESET}     Screener parser documentation
       ${GREEN}node man.js data${RESET}         List of all extractable data points
       ${GREEN}node man.js examples${RESET}     Usage examples and workflows

${BOLD}${UNDERLINE}QUICK START${RESET}
       ${DIM}# Get live NSE data for a stock${RESET}
       ${GREEN}node index.js HDFCBANK${RESET}
       
       ${DIM}# Parse screener.in data (after pasting content to file)${RESET}
       ${GREEN}node screenerCli.js screener-input.txt${RESET}

${BOLD}${UNDERLINE}FILES${RESET}
       index.js            NSE API client entry point
       screenerCli.js      Screener.in text parser CLI
       src/screenerParser.js   Core parsing functions
       src/format.js       Output formatting utilities
       nseClient.js        NSE session/cookie management
       nseData.js          NSE API fetch and normalize functions

${BOLD}${UNDERLINE}AUTHOR${RESET}
       Stock Extractor Project

${BOLD}${UNDERLINE}SEE ALSO${RESET}
       ${CYAN}https://www.nseindia.com${RESET}
       ${CYAN}https://www.screener.in${RESET}

${DIM}stock-extractor 1.0.0                January 2026                            1${RESET}
`,

  nse: `
${BOLD}INDEX.JS(1)${RESET}                     NSE API Tool                     ${BOLD}INDEX.JS(1)${RESET}

${BOLD}${UNDERLINE}NAME${RESET}
       index.js - Fetch real-time stock data from NSE India APIs

${BOLD}${UNDERLINE}SYNOPSIS${RESET}
       ${GREEN}node index.js${RESET} ${CYAN}<SYMBOL>${RESET} [${YELLOW}--raw${RESET}]

${BOLD}${UNDERLINE}DESCRIPTION${RESET}
       Fetches live stock data from NSE India's public APIs. Automatically
       handles session management and cookie authentication required by NSE.

${BOLD}${UNDERLINE}ARGUMENTS${RESET}
       ${CYAN}<SYMBOL>${RESET}
              NSE stock symbol (e.g., HDFCBANK, RELIANCE, TCS, INFY)
              Case-insensitive. Required.

${BOLD}${UNDERLINE}OPTIONS${RESET}
       ${YELLOW}--raw${RESET}
              Display raw JSON responses from NSE APIs alongside formatted
              output. Useful for debugging or accessing additional fields.

${BOLD}${UNDERLINE}DATA EXTRACTED${RESET}
       ${BOLD}Quote Section:${RESET}
         • Current Market Price (CMP)
         • Day High / Day Low
         • 52-Week High / 52-Week Low
         • Market Capitalization
         • P/E Ratio (standalone)
         • Face Value
         • Today's Volume
         • Deliverable %
         • Volatility

       ${BOLD}Corporate Actions:${RESET}
         • Latest dividend, bonus, split, rights
         • Ex-date and record date

       ${BOLD}Announcements:${RESET}
         • Latest company announcement headline

       ${BOLD}Shareholding:${RESET}
         • Available when NSE provides data (often limited)

${BOLD}${UNDERLINE}EXAMPLES${RESET}
       ${GREEN}node index.js HDFCBANK${RESET}
              Fetch HDFC Bank data with formatted output

       ${GREEN}node index.js RELIANCE --raw${RESET}
              Fetch Reliance data with raw API responses

       ${GREEN}node index.js TCS${RESET}
              Fetch TCS data

${BOLD}${UNDERLINE}EXIT STATUS${RESET}
       0      Success
       1      Missing symbol argument or API error

${BOLD}${UNDERLINE}NOTES${RESET}
       • NSE may rate-limit or block requests if called too frequently
       • Session cookies are automatically managed
       • Some data points may return null if NSE doesn't provide them

${DIM}stock-extractor 1.0.0                January 2026                            1${RESET}
`,

  screener: `
${BOLD}SCREENERCLI.JS(1)${RESET}            Screener Parser Tool            ${BOLD}SCREENERCLI.JS(1)${RESET}

${BOLD}${UNDERLINE}NAME${RESET}
       screenerCli.js - Parse stock data from screener.in copy-pasted text

${BOLD}${UNDERLINE}SYNOPSIS${RESET}
       ${GREEN}node screenerCli.js${RESET} ${CYAN}<input-file>${RESET} [${YELLOW}--json${RESET}] [${YELLOW}--raw${RESET}]

${BOLD}${UNDERLINE}DESCRIPTION${RESET}
       Extracts structured stock data from raw text copied from screener.in.
       Provides comprehensive fundamental data not available via NSE APIs.

${BOLD}${UNDERLINE}ARGUMENTS${RESET}
       ${CYAN}<input-file>${RESET}
              Path to text file containing copy-pasted screener.in content.
              Required.

${BOLD}${UNDERLINE}OPTIONS${RESET}
       ${YELLOW}--json${RESET}
              Output as flat JSON object (key-value pairs).
              Ideal for piping to other tools or scripts.

       ${YELLOW}--raw${RESET}
              Output full nested JSON structure with metadata.
              Includes extraction statistics and timestamp.

${BOLD}${UNDERLINE}HOW TO GET INPUT DATA${RESET}
       1. Visit ${CYAN}https://www.screener.in/company/<SYMBOL>/${RESET}
          Example: https://www.screener.in/company/HDFCBANK/
       
       2. Select all content on the page (Ctrl+A or Cmd+A)
       
       3. Copy the content (Ctrl+C or Cmd+C)
       
       4. Paste into a text file:
          ${GREEN}nano screener-input.txt${RESET}
          ${DIM}# Paste content and save${RESET}
       
       5. Run the parser:
          ${GREEN}node screenerCli.js screener-input.txt${RESET}

${BOLD}${UNDERLINE}DATA EXTRACTED${RESET}
       ${BOLD}Price & Volume:${RESET}
         • Current Market Price (CMP)
         • 52-Week High / Low
         • Volume: N/A (not in screener copy-paste)
         • 10-day avg volume: N/A

       ${BOLD}Valuation Metrics:${RESET}
         • P/E Ratio
         • P/B Ratio (calculated from CMP / Book Value)
         • Face Value
         • Industry P/E: N/A

       ${BOLD}Financial Strength:${RESET}
         • Market Capitalization
         • EPS (TTM)
         • ROE (%)
         • ROCE (%)
         • Debt to Equity: N/A

       ${BOLD}Growth & Profitability:${RESET}
         • Revenue Growth (YoY) - TTM
         • Net Profit Growth (YoY) - TTM
         • Operating/Financing Margin

       ${BOLD}Shareholding Pattern:${RESET}
         • Promoter Holding (%)
         • Promoter Holding Change (quarter-over-quarter)
         • FII Holding (%)
         • DII Holding (%)
         • Public Holding (%)

       ${BOLD}Corporate Signals:${RESET}
         • Upcoming Results Date
         • Recent Corporate Actions (dividend, ESOP, bonus, split)
         • Recent Announcements (Yes/No + headline)

${BOLD}${UNDERLINE}EXAMPLES${RESET}
       ${GREEN}node screenerCli.js screener-input.txt${RESET}
              Parse with formatted console output

       ${GREEN}node screenerCli.js screener-input.txt --json${RESET}
              Output as flat JSON

       ${GREEN}node screenerCli.js data.txt --raw${RESET}
              Output with full structure and metadata

       ${GREEN}node screenerCli.js screener-input.txt --json > output.json${RESET}
              Save JSON output to file

${BOLD}${UNDERLINE}EXIT STATUS${RESET}
       0      Success
       1      Missing file, empty file, or parse error

${DIM}stock-extractor 1.0.0                January 2026                            1${RESET}
`,

  data: `
${BOLD}DATA-POINTS(7)${RESET}              Extractable Data Points              ${BOLD}DATA-POINTS(7)${RESET}

${BOLD}${UNDERLINE}NAME${RESET}
       data-points - Complete list of stock data fields and their sources

${BOLD}${UNDERLINE}DESCRIPTION${RESET}
       This page lists all data points that can be extracted using this
       toolkit, along with their availability from each source.

${BOLD}${UNDERLINE}DATA AVAILABILITY MATRIX${RESET}

       ${BOLD}Legend:${RESET} ✓ Available  ✗ Not available  ~ Partial/Limited

       ┌─────────────────────────────────┬───────────┬───────────┐
       │ ${BOLD}Data Point${RESET}                       │ ${CYAN}NSE API${RESET}   │ ${CYAN}Screener${RESET}  │
       ├─────────────────────────────────┼───────────┼───────────┤
       │ ${UNDERLINE}PRICE & VOLUME${RESET}                   │           │           │
       │ Current Market Price (CMP)      │    ✓      │    ✓      │
       │ Day High / Low                  │    ✓      │    ✗      │
       │ 52-Week High / Low              │    ✓      │    ✓      │
       │ Volume (today)                  │    ✓      │    ✗      │
       │ 10-day average volume           │    ~      │    ✗      │
       ├─────────────────────────────────┼───────────┼───────────┤
       │ ${UNDERLINE}VALUATION METRICS${RESET}                │           │           │
       │ P/E Ratio                       │    ✓      │    ✓      │
       │ Industry P/E                    │    ✗      │    ✗      │
       │ P/B Ratio                       │    ✗      │    ✓      │
       │ Book Value                      │    ✗      │    ✓      │
       │ Face Value                      │    ✓      │    ✓      │
       ├─────────────────────────────────┼───────────┼───────────┤
       │ ${UNDERLINE}FINANCIAL STRENGTH${RESET}               │           │           │
       │ Market Capitalization           │    ✓      │    ✓      │
       │ Debt to Equity                  │    ✗      │    ✗      │
       │ EPS (TTM)                       │    ✗      │    ✓      │
       │ ROE (%)                         │    ✗      │    ✓      │
       │ ROCE (%)                        │    ✗      │    ✓      │
       ├─────────────────────────────────┼───────────┼───────────┤
       │ ${UNDERLINE}GROWTH & PROFITABILITY${RESET}           │           │           │
       │ Revenue Growth (YoY)            │    ✗      │    ✓      │
       │ Net Profit Growth (YoY)         │    ✗      │    ✓      │
       │ Operating Margin                │    ✗      │    ✓      │
       ├─────────────────────────────────┼───────────┼───────────┤
       │ ${UNDERLINE}SHAREHOLDING PATTERN${RESET}             │           │           │
       │ Promoter Holding (%)            │    ~      │    ✓      │
       │ Promoter Holding Change         │    ✗      │    ✓      │
       │ FII Holding (%)                 │    ~      │    ✓      │
       │ DII Holding (%)                 │    ~      │    ✓      │
       │ Public Holding (%)              │    ~      │    ✓      │
       ├─────────────────────────────────┼───────────┼───────────┤
       │ ${UNDERLINE}CORPORATE SIGNALS${RESET}                │           │           │
       │ Recent Results Date             │    ✗      │    ✓      │
       │ Corporate Actions               │    ✓      │    ✓      │
       │ Recent Announcements            │    ✓      │    ✓      │
       └─────────────────────────────────┴───────────┴───────────┘

${BOLD}${UNDERLINE}RECOMMENDED APPROACH${RESET}
       For comprehensive data, use ${BOLD}both sources${RESET}:
       
       • ${CYAN}NSE API${RESET}: Live price, volume, day high/low, deliverable %
       • ${CYAN}Screener${RESET}: Fundamentals, ratios, growth, full shareholding

${BOLD}${UNDERLINE}NOT AVAILABLE FROM EITHER SOURCE${RESET}
       • Industry P/E (requires sector comparison data)
       • Debt to Equity (not directly in screener copy-paste)
       • 10-day average volume (would need historical data)

${DIM}stock-extractor 1.0.0                January 2026                            1${RESET}
`,

  examples: `
${BOLD}EXAMPLES(7)${RESET}                   Usage Examples                   ${BOLD}EXAMPLES(7)${RESET}

${BOLD}${UNDERLINE}NAME${RESET}
       examples - Common usage patterns and workflows

${BOLD}${UNDERLINE}BASIC USAGE${RESET}

       ${BOLD}1. Quick NSE data fetch:${RESET}
       ${GREEN}node index.js RELIANCE${RESET}
       
       ${BOLD}2. Parse screener data:${RESET}
       ${DIM}# First, copy content from screener.in and save to file${RESET}
       ${GREEN}node screenerCli.js screener-input.txt${RESET}

${BOLD}${UNDERLINE}OUTPUT FORMATS${RESET}

       ${BOLD}Human-readable output (default):${RESET}
       ${GREEN}node screenerCli.js screener-input.txt${RESET}
       
       ${BOLD}JSON output for scripting:${RESET}
       ${GREEN}node screenerCli.js screener-input.txt --json${RESET}
       
       ${BOLD}Full structured output with metadata:${RESET}
       ${GREEN}node screenerCli.js screener-input.txt --raw${RESET}
       
       ${BOLD}Raw NSE API responses:${RESET}
       ${GREEN}node index.js HDFCBANK --raw${RESET}

${BOLD}${UNDERLINE}SAVING OUTPUT TO FILE${RESET}

       ${GREEN}node screenerCli.js screener-input.txt --json > hdfc-data.json${RESET}
       ${GREEN}node index.js HDFCBANK > hdfc-nse.txt${RESET}

${BOLD}${UNDERLINE}WORKFLOW: COMPLETE STOCK ANALYSIS${RESET}

       ${DIM}# Step 1: Get live NSE data${RESET}
       ${GREEN}node index.js HDFCBANK${RESET}
       
       ${DIM}# Step 2: Go to https://www.screener.in/company/HDFCBANK/${RESET}
       ${DIM}# Step 3: Select All (Ctrl+A) and Copy (Ctrl+C)${RESET}
       ${DIM}# Step 4: Paste into screener-input.txt${RESET}
       
       ${DIM}# Step 5: Parse screener data${RESET}
       ${GREEN}node screenerCli.js screener-input.txt${RESET}

${BOLD}${UNDERLINE}WORKFLOW: BATCH ANALYSIS${RESET}

       ${DIM}# Create separate input files for each stock${RESET}
       ${DIM}# hdfc.txt, reliance.txt, tcs.txt${RESET}
       
       ${GREEN}for file in hdfc.txt reliance.txt tcs.txt; do${RESET}
       ${GREEN}  echo "=== \$file ==="${RESET}
       ${GREEN}  node screenerCli.js "\$file" --json${RESET}
       ${GREEN}done${RESET}

${BOLD}${UNDERLINE}COMMON STOCK SYMBOLS${RESET}

       ${BOLD}Banking:${RESET}     HDFCBANK, ICICIBANK, SBIN, AXISBANK, KOTAKBANK
       ${BOLD}IT:${RESET}          TCS, INFY, WIPRO, HCLTECH, TECHM
       ${BOLD}Oil & Gas:${RESET}   RELIANCE, ONGC, IOC, BPCL
       ${BOLD}Auto:${RESET}        TATAMOTORS, MARUTI, M&M, BAJAJ-AUTO
       ${BOLD}Pharma:${RESET}      SUNPHARMA, DRREDDY, CIPLA, DIVISLAB
       ${BOLD}FMCG:${RESET}        HINDUNILVR, ITC, NESTLEIND, BRITANNIA

${BOLD}${UNDERLINE}TROUBLESHOOTING${RESET}

       ${BOLD}NSE API returns error:${RESET}
       • Wait a few seconds and retry (rate limiting)
       • Check if symbol is correct (use NSE website to verify)
       
       ${BOLD}Screener parser missing data:${RESET}
       • Ensure you copied the ENTIRE page (Ctrl+A)
       • Check if the text file is not empty
       • Some fields are genuinely not available (marked N/A)

${DIM}stock-extractor 1.0.0                January 2026                            1${RESET}
`
};

// Show requested topic or main page
const page = manPages[topic] || manPages.main;

if (topic && !manPages[topic]) {
  console.log(`${YELLOW}Unknown topic: ${topic}${RESET}`);
  console.log(`Available topics: ${Object.keys(manPages).filter(k => k !== 'main').join(', ')}`);
  console.log();
}

console.log(page);


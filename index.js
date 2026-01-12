// =============================================================================
// NSE Stock Data CLI
// Fetches and displays stock data from NSE India
// Usage: node index.js <SYMBOL> [--raw]
// =============================================================================

import {
  fetchAnnouncements,
  fetchCorporateActions,
  fetchQuoteEquity,
  fetchQuoteEquitySection,
  fetchShareholdingBestEffort,
  normalizeAnnouncementsHeadline,
  normalizeCorporateActionsLatest,
  normalizeQuoteMetrics,
  normalizeTradeInfoMetrics
} from "./nseData.js";
import { initNSE } from "./nseClient.js";
import { printApiError, printKV, printSection } from "./src/format.js";

// =============================================================================
// Parse Arguments
// =============================================================================

const SYMBOL = process.argv[2];
const RAW = process.argv.includes("--raw");

if (!SYMBOL) {
  console.error("Usage: node index.js <SYMBOL> [--raw]");
  console.error("Example: node index.js HDFCBANK");
  process.exit(1);
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  console.log(`Fetching data for ${SYMBOL}...\n`);

  // Step 1: Warm up NSE session (gets cookies)
  try {
    await initNSE();
  } catch (err) {
    printApiError("initNSE", err);
    process.exit(1);
  }

  // Step 2: Fire all API calls in parallel, print as each completes
  const tasks = [
    fetchAndPrintQuote(),
    fetchAndPrintTradeInfo(),
    fetchAndPrintCorporateActions(),
    fetchAndPrintAnnouncements(),
    fetchAndPrintShareholding()
  ];

  await Promise.allSettled(tasks);
}

// =============================================================================
// Quote Section (merged output from quote-equity + trade_info)
// =============================================================================

let quoteHeaderPrinted = false;

function printQuoteField(label, value) {
  if (!quoteHeaderPrinted) {
    printSection("Quote");
    quoteHeaderPrinted = true;
  }
  printKV(label, value);
}

async function fetchAndPrintQuote() {
  try {
    const quote = await fetchQuoteEquity(SYMBOL);
    
    if (RAW) {
      printSection("RAW quote-equity");
      console.log(JSON.stringify(quote, null, 2));
    }

    const m = normalizeQuoteMetrics(quote);
    printQuoteField("CMP", m.cmp);
    printQuoteField("Day High", m.dayHigh);
    printQuoteField("Day Low", m.dayLow);
    printQuoteField("52W High", m.week52High);
    printQuoteField("52W Low", m.week52Low);
    printQuoteField("Market Cap", m.marketCap);
    printQuoteField("P/E (standalone)", m.peStandalone);
    printQuoteField("Face Value", m.faceValue);
  } catch (err) {
    printApiError("quote-equity", err);
  }
}

async function fetchAndPrintTradeInfo() {
  try {
    const tradeInfo = await fetchQuoteEquitySection(SYMBOL, "trade_info");
    
    if (RAW) {
      printSection("RAW trade_info");
      console.log(JSON.stringify(tradeInfo, null, 2));
    }

    const t = normalizeTradeInfoMetrics(tradeInfo);
    
    // Only print if we got useful data
    if (t.volume || t.deliverablePct || t.volatility) {
      printQuoteField("Today Volume", t.volume);
      printQuoteField("Deliverable %", t.deliverablePct);
      printQuoteField("Volatility", t.volatility);
    }
  } catch (err) {
    printApiError("trade_info", err);
  }
}

// =============================================================================
// Corporate Actions
// =============================================================================

async function fetchAndPrintCorporateActions() {
  try {
    const actions = await fetchCorporateActions(SYMBOL);
    
    if (RAW) {
      printSection("RAW corporate-actions");
      console.log(JSON.stringify(actions, null, 2));
    }

    printSection("Corporate Actions");
    printKV("Latest", normalizeCorporateActionsLatest(actions));
  } catch (err) {
    printApiError("corporate-actions", err);
  }
}

// =============================================================================
// Announcements
// =============================================================================

async function fetchAndPrintAnnouncements() {
  try {
    const ann = await fetchAnnouncements(SYMBOL);
    
    if (RAW) {
      printSection("RAW announcements");
      console.log(JSON.stringify(ann, null, 2));
    }

    printSection("Announcements");
    printKV("Headline", normalizeAnnouncementsHeadline(ann));
  } catch (err) {
    printApiError("announcements", err);
  }
}

// =============================================================================
// Shareholding (best effort - often returns 404)
// =============================================================================

async function fetchAndPrintShareholding() {
  try {
    const sh = await fetchShareholdingBestEffort(SYMBOL);
    
    if (RAW) {
      printSection("RAW shareholding");
      console.log(JSON.stringify(sh, null, 2));
    }

    printSection("Shareholding");
    printKV("Data", sh ?? "not available");
  } catch (err) {
    printApiError("shareholding", err);
  }
}

// =============================================================================
// Run
// =============================================================================

main();

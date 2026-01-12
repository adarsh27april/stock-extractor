// =============================================================================
// NSE Data Fetchers and Normalizers
// Fetches stock data from NSE and converts it to a clean format
// =============================================================================

import { initNSE, fetchNSE } from "./nseClient.js";

const BASE_URL = "https://www.nseindia.com/api";

// =============================================================================
// API Fetchers
// =============================================================================

// Get stock quote (price, P/E, market cap, etc.)
export async function fetchQuoteEquity(symbol) {
  await initNSE();
  return fetchNSE(`${BASE_URL}/quote-equity?symbol=${encode(symbol)}`);
}

// Get trade info section (volume, delivery %)
export async function fetchQuoteEquitySection(symbol, section) {
  await initNSE();
  return fetchNSE(`${BASE_URL}/quote-equity?symbol=${encode(symbol)}&section=${encode(section)}`);
}

// Get corporate actions (bonus, dividend, split)
export async function fetchCorporateActions(symbol) {
  await initNSE();
  return fetchNSE(`${BASE_URL}/corporates-corporateActions?symbol=${encode(symbol)}&index=equities`);
}

// Get company announcements
export async function fetchAnnouncements(symbol) {
  await initNSE();
  return fetchNSE(`${BASE_URL}/corporate-announcements?symbol=${encode(symbol)}&index=equities`);
}

// Get shareholding pattern (tries multiple endpoints as NSE changes these often)
export async function fetchShareholdingBestEffort(symbol) {
  await initNSE();
  const sym = encode(symbol);

  // Try different endpoints - NSE frequently changes these
  const urls = [
    `${BASE_URL}/corporate-share-holdings?symbol=${sym}&series=EQ`,
    `${BASE_URL}/shareholding-pattern?symbol=${sym}&series=EQ`
  ];

  let lastError = null;
  for (const url of urls) {
    try {
      return await fetchNSE(url);
    } catch (err) {
      lastError = err;
      // Continue to next URL on 4xx errors
      if (is4xxError(err)) continue;
      throw err;
    }
  }
  
  throw lastError ?? new Error("Shareholding not available");
}

// =============================================================================
// Data Normalizers - Convert NSE responses to clean format
// =============================================================================

// Extract key metrics from quote-equity response
export function normalizeQuoteMetrics(quote) {
  const cmp = num(pick(quote?.priceInfo?.lastPrice, quote?.priceInfo?.close));
  
  return {
    cmp,
    dayHigh: num(pick(quote?.priceInfo?.intraDayHighLow?.max, quote?.priceInfo?.dayHigh)),
    dayLow: num(pick(quote?.priceInfo?.intraDayHighLow?.min, quote?.priceInfo?.dayLow)),
    week52High: num(pick(quote?.priceInfo?.weekHighLow?.max)),
    week52Low: num(pick(quote?.priceInfo?.weekHighLow?.min)),
    marketCap: getMarketCap(quote, cmp),
    peStandalone: num(pick(quote?.metadata?.pdSymbolPe, quote?.metadata?.pe)),
    faceValue: num(pick(quote?.securityInfo?.faceValue, quote?.metadata?.faceValue))
  };
}

// Extract trade metrics (volume, delivery %, volatility)
export function normalizeTradeInfoMetrics(resp) {
  const tradeInfo = resp?.marketDeptOrderBook?.tradeInfo ?? resp?.tradeInfo ?? resp;
  const securityDP = resp?.securityWiseDP;

  return {
    volume: num(pick(
      tradeInfo?.totalTradedVolume,
      tradeInfo?.totalTradedQuantity
    )),
    deliverablePct: num(pick(
      securityDP?.deliveryToTradedQuantity,
      securityDP?.deliveryPercentage,
      tradeInfo?.deliveryToTradedQuantity
    )),
    volatility: num(pick(
      resp?.metadata?.volatility,
      tradeInfo?.volatility
    ))
  };
}

// Get latest corporate action
export function normalizeCorporateActionsLatest(resp) {
  const list = toArray(resp?.data) || toArray(resp) || [];
  return list[0] ?? null;
}

// Get latest announcement headline
export function normalizeAnnouncementsHeadline(resp) {
  const list = toArray(resp?.data) || toArray(resp?.rows) || toArray(resp) || [];
  const first = list[0];
  return first?.subject ?? first?.headline ?? first?.title ?? null;
}

// =============================================================================
// Helper Functions
// =============================================================================

function encode(str) {
  return encodeURIComponent(str);
}

// Return first non-null value
function pick(...values) {
  for (const v of values) {
    if (v !== undefined && v !== null) return v;
  }
  return null;
}

// Convert value to number (handles strings with commas/%)
function num(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  
  const cleaned = String(value).replace(/[,% ]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

// Convert to array if it's an array, else null
function toArray(val) {
  return Array.isArray(val) ? val : null;
}

// Check if error is a 4xx HTTP error
function is4xxError(err) {
  const status = String(err?.status ?? "");
  const msg = String(err?.message ?? "");
  return status.startsWith("4") || msg.includes("status=404");
}

// Calculate market cap from quote data
function getMarketCap(quote, cmp) {
  // Try direct market cap fields
  const direct = num(pick(
    quote?.securityInfo?.marketCapitalisation,
    quote?.securityInfo?.marketCap,
    quote?.metadata?.marketCap
  ));
  if (direct) return direct;

  // Calculate from CMP * issued shares
  const issuedSize = num(pick(
    quote?.securityInfo?.issuedSize,
    quote?.securityInfo?.issuedCapital
  ));
  
  if (cmp && issuedSize) {
    const computed = cmp * issuedSize;
    // Sanity check: should be between 1B and 1000T
    if (computed > 1e9 && computed < 1e15) return computed;
  }
  
  return null;
}

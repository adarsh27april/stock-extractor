// =============================================================================
// NSE HTTP Client
// Handles cookie-based session management for NSE India APIs
// =============================================================================

import axios from "axios";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";

// Cookie jar stores session cookies automatically
const jar = new CookieJar();

// Browser-like headers to avoid NSE blocking
const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json,text/plain,*/*",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Referer": "https://www.nseindia.com/",
  "Connection": "keep-alive",
  "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin"
};

// Create axios client with cookie support
const client = wrapper(
  axios.create({
    jar,
    withCredentials: true,
    timeout: 15000,
    headers: BROWSER_HEADERS
  })
);

// Track if we've already warmed up the session
let initialized = false;

// =============================================================================
// Public Functions
// =============================================================================

// Warm up NSE session by visiting homepage (gets cookies)
// Must be called before any API request
export async function initNSE() {
  if (initialized) return;

  await client.get("https://www.nseindia.com", {
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "none",
      "sec-fetch-user": "?1",
      "Upgrade-Insecure-Requests": "1"
    }
  });

  // Wait for session to stabilize
  await delay(1000);
  initialized = true;
}

// Fetch data from NSE API endpoint
export async function fetchNSE(url) {
  try {
    const resp = await client.get(url);
    return resp.data;
  } catch (err) {
    throw createNseError(err, url);
  }
}

// Reset session (useful if cookies expire)
export function resetSession() {
  initialized = false;
}

// =============================================================================
// Helper Functions
// =============================================================================

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Convert HTML error page to clean text
function stripHtml(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Extract readable error reason from response
function getErrorReason(data) {
  if (data == null) return "No response";
  
  if (typeof data === "string") {
    const text = stripHtml(data);
    if (!text) return "Empty response";
    if (/resource not found/i.test(text)) return "Resource not found";
    return text.slice(0, 100);
  }
  
  if (typeof data === "object") {
    const keys = Object.keys(data).slice(0, 5);
    return keys.length ? `JSON: ${keys.join(", ")}` : "Empty JSON";
  }
  
  return String(data).slice(0, 100);
}

// Create a clean error object with status, url, and reason
function createNseError(err, url) {
  const status = err?.response?.status;
  const reason = getErrorReason(err?.response?.data);
  
  const error = new Error(`Request failed | status=${status} | reason=${reason}`);
  error.status = status;
  error.url = url;
  error.reason = reason;
  
  return error;
}

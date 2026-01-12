// =============================================================================
// Screener.in Text Parser CLI
// Usage: node screenerCli.js <input-file.txt> [--json] [--raw]
// =============================================================================

import { readFileSync } from "fs";
import { parseScreenerText, flattenParsedData } from "./src/screenerParser.js";
import { printSection, printKV } from "./src/format.js";

// =============================================================================
// Parse Arguments
// =============================================================================

const args = process.argv.slice(2);
const inputFile = args.find(arg => !arg.startsWith("--"));
const JSON_OUTPUT = args.includes("--json");
const RAW_OUTPUT = args.includes("--raw");

if (!inputFile) {
  console.error("Usage: node screenerCli.js <input-file.txt> [--json] [--raw]");
  console.error("");
  console.error("Options:");
  console.error("  --json    Output as JSON");
  console.error("  --raw     Output full parsed object (with nested structure)");
  console.error("");
  console.error("Example:");
  console.error("  node screenerCli.js screener-input.txt");
  console.error("  node screenerCli.js screener-input.txt --json");
  process.exit(1);
}

// =============================================================================
// Main
// =============================================================================

function main() {
  // Read input file
  let rawText;
  try {
    rawText = readFileSync(inputFile, "utf-8");
  } catch (err) {
    console.error(`Error reading file: ${inputFile}`);
    console.error(err.message);
    process.exit(1);
  }

  if (!rawText.trim()) {
    console.error("Error: Input file is empty");
    process.exit(1);
  }

  console.log(`Parsing Screener.in data from: ${inputFile}\n`);

  // Parse the text
  let parsed;
  try {
    parsed = parseScreenerText(rawText);
  } catch (err) {
    console.error("Error parsing text:", err.message);
    process.exit(1);
  }

  // Output based on mode
  if (RAW_OUTPUT) {
    console.log(JSON.stringify(parsed, null, 2));
    return;
  }

  if (JSON_OUTPUT) {
    const flat = flattenParsedData(parsed);
    console.log(JSON.stringify(flat, null, 2));
    return;
  }

  // Default: formatted output
  printFormattedOutput(parsed);
}

// =============================================================================
// Formatted Output
// =============================================================================

function printFormattedOutput(parsed) {
  const flat = flattenParsedData(parsed);

  // Price & Volume
  printSection("Price & Volume");
  printKV("Current Market Price (CMP)", flat["Current Market Price (CMP)"]);
  printKV("Day High / Low", flat["Day High / Low"]);
  printKV("52-Week High / Low", flat["52-Week High / Low"]);
  printKV("Volume (today)", flat["Volume (today)"]);
  printKV("10-day average volume", flat["10-day average volume"]);

  // Valuation Metrics
  printSection("Valuation Metrics");
  printKV("P/E Ratio", flat["P/E Ratio"]);
  printKV("Industry P/E", flat["Industry P/E"]);
  printKV("P/B Ratio", flat["P/B Ratio"]);
  printKV("Face Value", flat["Face Value"]);

  // Financial Strength
  printSection("Financial Strength");
  printKV("Market Capitalization", flat["Market Capitalization"]);
  printKV("Debt to Equity", flat["Debt to Equity"]);
  printKV("EPS (TTM)", flat["EPS (TTM)"]);
  printKV("ROE (%)", flat["ROE (%)"]);
  printKV("ROCE (%)", flat["ROCE (%)"]);

  // Growth & Profitability
  printSection("Growth & Profitability");
  printKV("Revenue growth (YoY)", flat["Revenue growth (YoY)"]);
  printKV("Net profit growth (YoY)", flat["Net profit growth (YoY)"]);
  printKV("Operating margin", flat["Operating margin"]);

  // Shareholding Pattern
  printSection("Shareholding Pattern");
  printKV("Promoter holding (%)", flat["Promoter holding (%)"]);
  printKV("Promoter holding change", flat["Promoter holding change"]);
  printKV("FII holding (%)", flat["FII holding (%)"]);
  printKV("DII holding (%)", flat["DII holding (%)"]);
  printKV("Public holding (%)", flat["Public holding (%)"]);

  // Corporate Signals
  printSection("Corporate Signals");
  printKV("Recent results date", flat["Recent results date"]);
  printKV("Recent corporate action", flat["Recent corporate action"]);
  printKV("Recent announcement", flat["Recent announcement"]);

  // Meta info
  printSection("Summary");
  printKV("Data points extracted", `${parsed._meta.dataPoints.extracted} / ${parsed._meta.dataPoints.total}`);
  printKV("Parsed at", parsed._meta.parsedAt);
}

// =============================================================================
// Run
// =============================================================================

main();


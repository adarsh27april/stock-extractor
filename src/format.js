// =============================================================================
// Output Formatting Helpers
// =============================================================================

// Print a section header
export function printSection(title) {
  console.log(`\n== ${title} ==`);
}

// Print a key-value pair
export function printKV(label, value) {
  console.log(`${label}: ${format(value)}`);
}

// Print an API error (one line, no HTML noise)
export function printApiError(apiName, err) {
  const status = err?.status ?? "";
  const reason = err?.reason ?? err?.message ?? String(err);
  console.log(`${apiName} failed: ${status} ${reason}`.trim());
}

// Format value for display
function format(value) {
  if (value === undefined || value === null) return "null";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

# Stock Extractor

Extract Indian stock market data from NSE and Screener.in.

## Installation

```bash
npm install
```

## Usage

### 1. NSE API (Live Data)

```bash
node index.js <SYMBOL>
node index.js <SYMBOL> --raw
```

Example: `node index.js HDFCBANK`

### 2. Screener Parser (Copy-Paste Data)

1. Go to `https://www.screener.in/company/<SYMBOL>/` (e.g., HDFCBANK, RELIANCE)
2. Select all (`Ctrl+A`) and copy (`Ctrl+C`)
3. Paste into `screener-input.txt`
4. Run:

```bash
node screenerCli.js <input-file>
node screenerCli.js <input-file> --json
```

Example: `node screenerCli.js screener-input.txt`

### Use with Stock Decision Engine

After running the tools above (for example `node index.js` or `node screenerCli.js`), paste the output into the custom-built GPT named "Stock Decision Engine" available at https://chatgpt.com/g/g-69652e719608819186eefb24890e72f0-stock-decision-engine to get decision insights and recommendations.

## Manual

```bash
node man.js              # Overview
node man.js nse          # NSE API docs
node man.js screener     # Screener parser docs
node man.js data         # Data availability
node man.js examples     # Usage examples
```

## Data Extracted

| Source | Data |
|--------|------|
| NSE | CMP, Day High/Low, 52W High/Low, Volume, P/E, Market Cap |
| Screener | P/E, P/B, EPS, ROE, ROCE, Growth metrics, Shareholding |

## License

MIT


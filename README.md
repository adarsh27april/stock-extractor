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


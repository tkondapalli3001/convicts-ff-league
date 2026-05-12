export type StockPick = {
  owner: string
  ticker: string
  startPrice: number
  startDate: string  // "YYYY-MM-DD"
  endDate: string    // "YYYY-MM-DD" — Jul 15 of draft year; window is open until this date
}

// 2026 draft cycle: Jan 12 → Jul 15
// Pick order determined by ROI ranking (highest ROI = picks first)
export const STOCK_PICKS_2026: StockPick[] = [
  { owner: 'Dani',   ticker: 'RIOT', startPrice: 16.45,   startDate: '2026-01-12', endDate: '2026-07-15' },
  { owner: 'Nathan', ticker: 'NVDA', startPrice: 184.94,  startDate: '2026-01-12', endDate: '2026-07-15' },
  { owner: 'Armaan', ticker: 'MSFT', startPrice: 477.18,  startDate: '2026-01-12', endDate: '2026-07-15' },
  { owner: 'Kerry',  ticker: 'PVLA', startPrice: 100.49,  startDate: '2026-01-12', endDate: '2026-07-15' },
  { owner: 'Eric',   ticker: 'CRWV', startPrice: 89.93,   startDate: '2026-01-12', endDate: '2026-07-15' },
  { owner: 'Teja',   ticker: 'ORCL', startPrice: 204.68,  startDate: '2026-01-12', endDate: '2026-07-15' },
  { owner: 'Raghav', ticker: 'TSM',  startPrice: 331.77,  startDate: '2026-01-12', endDate: '2026-07-15' },
  { owner: 'Dustin', ticker: 'ASTS', startPrice: 98.39,   startDate: '2026-01-12', endDate: '2026-07-15' },
  { owner: 'Manu',   ticker: 'RL',   startPrice: 363.25,  startDate: '2026-01-12', endDate: '2026-07-15' },
  { owner: 'Anurag', ticker: 'LLY',  startPrice: 1081.00, startDate: '2026-01-12', endDate: '2026-07-15' },
]

export const MARKET_BENCHMARK_2026 = {
  label: 'Market',
  ticker: '%5EGSPC',   // ^GSPC URL-encoded for Yahoo Finance
  displayTicker: 'S&P 500',
  startPrice: 6977.27,
  startDate: '2026-01-12',
  endDate: '2026-07-15',
}

// Fetches current price for a single ticker via Yahoo Finance (no API key required).
async function fetchPrice(ticker: string): Promise<number | null> {
  try {
    const url = `https://corsproxy.io/?https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    const json = await res.json()
    return json?.chart?.result?.[0]?.meta?.regularMarketPrice ?? null
  } catch {
    return null
  }
}

// Fetches current prices for all tickers in parallel.
// Returns a map of ticker → current price. Missing entries mean the fetch failed.
export async function fetchCurrentPrices(
  tickers: string[]
): Promise<Record<string, number>> {
  const results = await Promise.all(
    tickers.map(async t => ({ ticker: t, price: await fetchPrice(t) }))
  )
  const map: Record<string, number> = {}
  for (const { ticker, price } of results) {
    if (price !== null) map[ticker] = price
  }
  return map
}

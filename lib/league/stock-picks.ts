export type StockPick = {
  owner: string
  ticker: string
  startPrice: number
  /** Closing price on endDate — the contest is settled, so this never changes. */
  endPrice: number
  startDate: string  // "YYYY-MM-DD"
  endDate: string    // "YYYY-MM-DD" — Jul 15 of draft year; the window closes here
}

// 2026 draft cycle: Jan 12 → Jul 15. Settled — endPrice is the 7/15/2026 close.
// Pick order is the final ROI ranking (highest ROI drafts first) and is locked;
// quoting live prices after the close would drift away from the real order.
export const STOCK_PICKS_2026: StockPick[] = [
  { owner: 'Daniyaal', ticker: 'RIOT', startPrice: 16.45,   endPrice: 20.10,   startDate: '2026-01-12', endDate: '2026-07-15' },
  { owner: 'Nathan',   ticker: 'NVDA', startPrice: 184.94,  endPrice: 212.50,  startDate: '2026-01-12', endDate: '2026-07-15' },
  { owner: 'Armaan',   ticker: 'MSFT', startPrice: 477.18,  endPrice: 395.63,  startDate: '2026-01-12', endDate: '2026-07-15' },
  { owner: 'Kerry',    ticker: 'PVLA', startPrice: 100.49,  endPrice: 151.97,  startDate: '2026-01-12', endDate: '2026-07-15' },
  { owner: 'Eric',     ticker: 'CRWV', startPrice: 89.93,   endPrice: 77.12,   startDate: '2026-01-12', endDate: '2026-07-15' },
  { owner: 'Teja',     ticker: 'ORCL', startPrice: 204.68,  endPrice: 132.49,  startDate: '2026-01-12', endDate: '2026-07-15' },
  { owner: 'Raghav',   ticker: 'TSM',  startPrice: 331.77,  endPrice: 419.48,  startDate: '2026-01-12', endDate: '2026-07-15' },
  { owner: 'Dustin',   ticker: 'ASTS', startPrice: 98.39,   endPrice: 66.31,   startDate: '2026-01-12', endDate: '2026-07-15' },
  { owner: 'Manu',     ticker: 'RL',   startPrice: 363.25,  endPrice: 374.08,  startDate: '2026-01-12', endDate: '2026-07-15' },
  { owner: 'Sonu',     ticker: 'LLY',  startPrice: 1081.00, endPrice: 1156.63, startDate: '2026-01-12', endDate: '2026-07-15' },
]

export const MARKET_BENCHMARK_2026 = {
  label: 'Market',
  ticker: '%5EGSPC',   // ^GSPC URL-encoded for Yahoo Finance
  displayTicker: 'S&P 500',
  startPrice: 6977.27,
  endPrice: 7572.40,
  startDate: '2026-01-12',
  endDate: '2026-07-15',
}

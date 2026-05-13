'use client'

import type { StockPick } from '@/lib/stock-picks'
import { MARKET_BENCHMARK_2026 } from '@/lib/stock-picks'

interface Props {
  picks: StockPick[]
  currentPrices: Record<string, number>
  loading: boolean
  lastUpdated: Date | null
}

function roi(current: number, start: number) {
  return ((current - start) / start) * 100
}

function fmtRoi(pct: number) {
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
}

function fmtPrice(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function StockStandings({ picks, currentPrices, loading, lastUpdated }: Props) {
  const rows = picks.map(p => {
    const current = currentPrices[p.ticker]
    const roiPct = current !== undefined ? roi(current, p.startPrice) : null
    return { ...p, current, roiPct }
  })

  // Sort by ROI descending, nulls last
  const rankedRows = [...rows].sort((a, b) => {
    if (a.roiPct === null && b.roiPct === null) return 0
    if (a.roiPct === null) return 1
    if (b.roiPct === null) return -1
    return b.roiPct - a.roiPct
  })

  // Convicts Fund aggregate
  const fundStart = picks.reduce((s, p) => s + p.startPrice, 0)
  const fundCurrent = rows.every(r => r.current !== undefined)
    ? rows.reduce((s, r) => s + (r.current ?? 0), 0)
    : null
  const fundRoi = fundCurrent !== null ? roi(fundCurrent, fundStart) : null

  // Market benchmark
  const marketCurrent = currentPrices[MARKET_BENCHMARK_2026.ticker]
  const marketRoi = marketCurrent !== undefined
    ? roi(marketCurrent, MARKET_BENCHMARK_2026.startPrice)
    : null

  const startLabel = new Date(picks[0]?.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })

  const roiColor = (pct: number | null) => {
    if (pct === null) return 'text-s-text3'
    return pct >= 0 ? 'text-s-green' : 'text-s-red'
  }

  const beatingMarket = fundRoi !== null && marketRoi !== null && fundRoi >= marketRoi

  return (
    <div className="gl p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[560px]">
          <thead>
            <tr>
              <th className="text-center px-3 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border w-12">#</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border">Owner</th>
              <th className="text-left px-3 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border">Stock Pick</th>
              <th className="text-right px-3 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border whitespace-nowrap">
                Price on {startLabel}
              </th>
              <th className="text-right px-3 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border">Today</th>
              <th className="text-right px-4 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border">ROI</th>
            </tr>
          </thead>
          <tbody>
            {rankedRows.map((row, i) => (
              <tr key={row.owner} className="border-b border-s-border/40 hover:bg-s-bg3/40 transition-colors">
                <td className="px-3 py-3 text-center text-[12px] font-extrabold text-s-text3">
                  {row.roiPct !== null ? i + 1 : '—'}
                </td>
                <td className="px-4 py-3 text-[13px] font-semibold text-s-text">{row.owner}</td>
                <td className="px-3 py-3">
                  <span className="text-[13px] font-black text-s-text">{row.ticker}</span>
                </td>
                <td className="px-3 py-3 text-right text-[13px] text-s-text2 num">{fmtPrice(row.startPrice)}</td>
                <td className="px-3 py-3 text-right text-[13px] num">
                  {loading && row.current === undefined ? (
                    <span className="inline-block w-3 h-3 border-2 border-s-border2 border-t-s-blue rounded-full animate-spin" />
                  ) : row.current !== undefined ? (
                    <span className="text-s-text">{fmtPrice(row.current)}</span>
                  ) : (
                    <span className="text-s-text3">—</span>
                  )}
                </td>
                <td className={`px-4 py-3 text-right text-[13px] font-bold num ${roiColor(row.roiPct)}`}>
                  {row.roiPct !== null ? fmtRoi(row.roiPct) : '—'}
                </td>
              </tr>
            ))}

            {/* Convicts Fund row */}
            <tr className="border-t-2 border-s-border bg-s-bg3/30">
              <td className="px-3 py-3 text-center text-[11px] text-s-text3">—</td>
              <td className="px-4 py-3 text-[12px] font-extrabold text-s-text" colSpan={2}>Convicts Fund</td>
              <td className="px-3 py-3 text-right text-[13px] text-s-text2 num font-bold">{fmtPrice(fundStart)}</td>
              <td className="px-3 py-3 text-right text-[13px] num">
                {fundCurrent !== null ? (
                  <span className="text-s-text font-bold">{fmtPrice(fundCurrent)}</span>
                ) : <span className="text-s-text3">—</span>}
              </td>
              <td className={`px-4 py-3 text-right text-[13px] font-extrabold num ${roiColor(fundRoi)}`}>
                {fundRoi !== null ? fmtRoi(fundRoi) : '—'}
              </td>
            </tr>

            {/* Market benchmark row */}
            <tr className="border-t border-s-border/40 bg-s-bg3/20">
              <td className="px-3 py-3 text-center text-[11px] text-s-text3">—</td>
              <td className="px-4 py-3 text-[12px] font-extrabold text-s-text2" colSpan={2}>
                {MARKET_BENCHMARK_2026.displayTicker}
              </td>
              <td className="px-3 py-3 text-right text-[13px] text-s-text3 num">{fmtPrice(MARKET_BENCHMARK_2026.startPrice)}</td>
              <td className="px-3 py-3 text-right text-[13px] num">
                {marketCurrent !== undefined ? (
                  <span className="text-s-text2">{fmtPrice(marketCurrent)}</span>
                ) : <span className="text-s-text3">—</span>}
              </td>
              <td className={`px-4 py-3 text-right text-[13px] font-bold num ${roiColor(marketRoi)}`}>
                {marketRoi !== null ? fmtRoi(marketRoi) : '—'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Last updated footer */}
      <div className="px-4 py-2 text-[10px] text-s-text3 border-t border-s-border/30">
        {loading
          ? 'Fetching live prices…'
          : lastUpdated
          ? `Updated ${lastUpdated.toLocaleTimeString()}`
          : 'Prices unavailable — showing start prices only'}
      </div>

      {/* Fund vs Market statement */}
      {fundRoi !== null && marketRoi !== null && (
        <div
          className={`px-4 py-3 text-[13px] font-bold border-t border-s-border/40 flex items-center gap-2 ${
            beatingMarket ? 'text-s-green' : 'text-s-red'
          }`}
          style={{
            background: beatingMarket
              ? 'rgba(34, 197, 94, 0.06)'
              : 'rgba(239, 68, 68, 0.06)',
          }}
        >
          <span className="text-[18px]">{beatingMarket ? '📈' : '📉'}</span>
          <span>
            {beatingMarket
              ? `Convicts Fund is beating the market! (${fmtRoi(fundRoi)} vs ${fmtRoi(marketRoi)})`
              : `Convicts Fund is trailing the market. (${fmtRoi(fundRoi)} vs ${fmtRoi(marketRoi)})`}
          </span>
        </div>
      )}
    </div>
  )
}

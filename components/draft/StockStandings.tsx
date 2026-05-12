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
  // Build enriched rows
  const rows = picks.map(p => {
    const current = currentPrices[p.ticker]
    const roiPct = current !== undefined ? roi(current, p.startPrice) : null
    return { ...p, current, roiPct }
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

  // Pick order: sort rows by ROI desc (nulls last)
  const pickOrder = [...rows]
    .filter(r => r.roiPct !== null)
    .sort((a, b) => (b.roiPct as number) - (a.roiPct as number))

  const startLabel = new Date(picks[0]?.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })

  const roiColor = (pct: number | null) => {
    if (pct === null) return 'text-s-text3'
    return pct >= 0 ? 'text-s-green' : 'text-s-red'
  }

  return (
    <div className="gl p-0 overflow-hidden">
      <div className="flex flex-col lg:flex-row gap-0">

        {/* ── LEFT: Main performance table ────────────────────────── */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full border-collapse min-w-[480px]">
            <thead>
              <tr>
                <th className="text-left px-4 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border">Owner</th>
                <th className="text-left px-3 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border"></th>
                <th className="text-right px-3 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border whitespace-nowrap">
                  Price on {startLabel}
                </th>
                <th className="text-right px-3 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border">Today</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border">ROI</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.owner} className="border-b border-s-border/40 hover:bg-s-bg3/40 transition-colors">
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
                <td className="px-4 py-3 text-[12px] font-extrabold text-s-text2" colSpan={2}>Market</td>
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

          {/* Footer: last updated */}
          <div className="px-4 py-2 text-[10px] text-s-text3 border-t border-s-border/30">
            {loading
              ? 'Fetching live prices…'
              : lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString()}`
              : 'Prices unavailable — showing start prices only'}
          </div>
        </div>

        {/* ── RIGHT: Pick order table ──────────────────────────────── */}
        <div className="lg:w-[200px] border-t lg:border-t-0 lg:border-l border-s-border flex-shrink-0">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left px-4 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border">Pick Order</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border">ROI</th>
              </tr>
            </thead>
            <tbody>
              {pickOrder.map((row, i) => (
                <tr key={row.owner} className="border-b border-s-border/40 hover:bg-s-bg3/40 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-[11px] text-s-text3 font-bold mr-2">{i + 1})</span>
                    <span className="text-[13px] font-semibold text-s-text">{row.owner}</span>
                  </td>
                  <td className={`px-4 py-3 text-right text-[13px] font-bold num ${roiColor(row.roiPct)}`}>
                    {fmtRoi(row.roiPct as number)}
                  </td>
                </tr>
              ))}
              {/* Fill remaining slots if some prices are missing */}
              {picks
                .filter(p => !pickOrder.find(r => r.owner === p.owner))
                .map(p => (
                  <tr key={p.owner} className="border-b border-s-border/40">
                    <td className="px-4 py-3">
                      <span className="text-[11px] text-s-text3 font-bold mr-2">—</span>
                      <span className="text-[13px] font-semibold text-s-text3">{p.owner}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] text-s-text3">—</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

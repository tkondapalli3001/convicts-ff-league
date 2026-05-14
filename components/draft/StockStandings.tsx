'use client'

import { useState } from 'react'
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
  const [sortKey, setSortKey] = useState<'owner' | 'ticker' | 'roi' | 'startPrice' | 'current'>('roi')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir(key === 'roi' || key === 'current' ? 'desc' : 'asc') }
  }
  const icon = (key: typeof sortKey) => sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

  const rows = picks.map(p => {
    const current = currentPrices[p.ticker]
    const roiPct = current !== undefined ? roi(current, p.startPrice) : null
    return { ...p, current, roiPct }
  })

  const rankedRows = [...rows].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    if (sortKey === 'owner') return dir * a.owner.localeCompare(b.owner)
    if (sortKey === 'ticker') return dir * a.ticker.localeCompare(b.ticker)
    if (sortKey === 'startPrice') return dir * (a.startPrice - b.startPrice)
    if (sortKey === 'current') {
      if (a.current === undefined && b.current === undefined) return 0
      if (a.current === undefined) return 1
      if (b.current === undefined) return -1
      return dir * (a.current - b.current)
    }
    if (a.roiPct === null && b.roiPct === null) return 0
    if (a.roiPct === null) return 1
    if (b.roiPct === null) return -1
    return dir * (a.roiPct - b.roiPct)
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
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-center px-3 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border w-10">#</th>
              <th onClick={() => toggleSort('owner')} className="text-left px-4 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border cursor-pointer select-none hover:text-s-text2">Manager{icon('owner')}</th>
              <th onClick={() => toggleSort('ticker')} className="text-left px-3 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border cursor-pointer select-none hover:text-s-text2">Stock Pick{icon('ticker')}</th>
              <th onClick={() => toggleSort('roi')} className="text-right px-4 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border cursor-pointer select-none hover:text-s-text2">ROI{icon('roi')}</th>
              <th onClick={() => toggleSort('startPrice')} className="text-right px-3 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border cursor-pointer select-none hover:text-s-text2 whitespace-nowrap">
                Price on {startLabel}{icon('startPrice')}
              </th>
              <th onClick={() => toggleSort('current')} className="text-right px-3 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border cursor-pointer select-none hover:text-s-text2">Today{icon('current')}</th>
            </tr>
          </thead>
          <tbody>
            {rankedRows.map((row, i) => (
              <tr key={row.owner} className="border-b border-s-border/40 hover:bg-s-bg3/40 transition-colors">
                <td className="px-3 py-3 text-center text-[12px] font-extrabold text-s-text3 whitespace-nowrap">
                  {row.roiPct !== null ? i + 1 : '—'}
                </td>
                <td className="px-4 py-3 text-[13px] font-semibold text-s-text whitespace-nowrap">{row.owner}</td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className="text-[13px] font-black text-s-text">{row.ticker}</span>
                </td>
                <td className={`px-4 py-3 text-right text-[13px] font-bold num whitespace-nowrap ${roiColor(row.roiPct)}`}>
                  {row.roiPct !== null ? fmtRoi(row.roiPct) : '—'}
                </td>
                <td className="px-3 py-3 text-right text-[13px] text-s-text2 num whitespace-nowrap">{fmtPrice(row.startPrice)}</td>
                <td className="px-3 py-3 text-right text-[13px] num whitespace-nowrap">
                  {loading && row.current === undefined ? (
                    <span className="inline-block w-3 h-3 border-2 border-s-border2 border-t-s-blue rounded-full animate-spin" />
                  ) : row.current !== undefined ? (
                    <span className="text-s-text">{fmtPrice(row.current)}</span>
                  ) : (
                    <span className="text-s-text3">—</span>
                  )}
                </td>
              </tr>
            ))}

            {/* Convicts Fund row */}
            <tr className="border-t-2 border-s-border bg-s-bg3/30">
              <td className="px-3 py-3 text-center text-[11px] text-s-text3">—</td>
              <td className="px-4 py-3 text-[12px] font-extrabold text-s-text whitespace-nowrap" colSpan={2}>Convicts Fund</td>
              <td className={`px-4 py-3 text-right text-[13px] font-extrabold num whitespace-nowrap ${roiColor(fundRoi)}`}>
                {fundRoi !== null ? fmtRoi(fundRoi) : '—'}
              </td>
              <td className="px-3 py-3 text-right text-[13px] text-s-text2 num font-bold whitespace-nowrap">{fmtPrice(fundStart)}</td>
              <td className="px-3 py-3 text-right text-[13px] num whitespace-nowrap">
                {fundCurrent !== null ? (
                  <span className="text-s-text font-bold">{fmtPrice(fundCurrent)}</span>
                ) : <span className="text-s-text3">—</span>}
              </td>
            </tr>

            {/* Market benchmark row */}
            <tr className="border-t border-s-border/40 bg-s-bg3/20">
              <td className="px-3 py-3 text-center text-[11px] text-s-text3">—</td>
              <td className="px-4 py-3 text-[12px] font-extrabold text-s-text2 whitespace-nowrap" colSpan={2}>
                {MARKET_BENCHMARK_2026.displayTicker}
              </td>
              <td className={`px-4 py-3 text-right text-[13px] font-bold num whitespace-nowrap ${roiColor(marketRoi)}`}>
                {marketRoi !== null ? fmtRoi(marketRoi) : '—'}
              </td>
              <td className="px-3 py-3 text-right text-[13px] text-s-text3 num whitespace-nowrap">{fmtPrice(MARKET_BENCHMARK_2026.startPrice)}</td>
              <td className="px-3 py-3 text-right text-[13px] num whitespace-nowrap">
                {marketCurrent !== undefined ? (
                  <span className="text-s-text2">{fmtPrice(marketCurrent)}</span>
                ) : <span className="text-s-text3">—</span>}
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

      {/* Fund vs Market banner */}
      {fundRoi !== null && marketRoi !== null && (
        <div
          className={`mx-4 mb-4 mt-2 rounded-[12px] border p-5 text-center ${
            beatingMarket ? 'border-green-500/30' : 'border-red-500/30'
          }`}
          style={{
            background: beatingMarket
              ? 'linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(16,185,129,0.06) 100%)'
              : 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(220,38,38,0.06) 100%)',
          }}
        >
          <div className="text-[32px] mb-1">{beatingMarket ? '📈' : '📉'}</div>
          <div className={`text-[15px] font-extrabold ${beatingMarket ? 'text-s-green' : 'text-s-red'}`}>
            {beatingMarket ? 'Convicts Fund is beating the market!' : 'Convicts Fund is trailing the market.'}
          </div>
          <div className="text-[12px] text-s-text3 mt-1">
            Fund {fmtRoi(fundRoi)} · Market {fmtRoi(marketRoi)}
          </div>
        </div>
      )}
    </div>
  )
}

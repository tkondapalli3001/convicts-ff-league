'use client'

import { useState } from 'react'
import type { StockPick } from '@/lib/stock-picks'
import { MARKET_BENCHMARK_2026 } from '@/lib/stock-picks'

interface Props {
  picks: StockPick[]
}

function roi(end: number, start: number) {
  return ((end - start) / start) * 100
}

function fmtRoi(pct: number) {
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
}

function fmtPrice(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    month: 'numeric', day: 'numeric', year: 'numeric',
  })
}

export default function StockStandings({ picks }: Props) {
  const [sortKey, setSortKey] = useState<'owner' | 'ticker' | 'roi' | 'startPrice' | 'endPrice'>('roi')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir(key === 'roi' || key === 'endPrice' ? 'desc' : 'asc') }
  }
  const icon = (key: typeof sortKey) => sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

  const rows = picks.map(p => ({ ...p, roiPct: roi(p.endPrice, p.startPrice) }))

  // Draft pick number is the settled ROI ranking — computed once, independent of
  // the table's sort, so re-sorting by ticker or price never renumbers the picks.
  const pickNumber: Record<string, number> = {}
  ;[...rows]
    .sort((a, b) => b.roiPct - a.roiPct)
    .forEach((r, i) => { pickNumber[r.owner] = i + 1 })

  const rankedRows = [...rows].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    if (sortKey === 'owner') return dir * a.owner.localeCompare(b.owner)
    if (sortKey === 'ticker') return dir * a.ticker.localeCompare(b.ticker)
    if (sortKey === 'startPrice') return dir * (a.startPrice - b.startPrice)
    if (sortKey === 'endPrice') return dir * (a.endPrice - b.endPrice)
    return dir * (a.roiPct - b.roiPct)
  })

  // Convicts Fund aggregate — equal-share basket of every pick
  const fundStart = picks.reduce((s, p) => s + p.startPrice, 0)
  const fundEnd   = picks.reduce((s, p) => s + p.endPrice, 0)
  const fundRoi   = roi(fundEnd, fundStart)

  const marketRoi = roi(MARKET_BENCHMARK_2026.endPrice, MARKET_BENCHMARK_2026.startPrice)

  const startLabel = fmtDate(picks[0]?.startDate ?? MARKET_BENCHMARK_2026.startDate)
  const endLabel   = fmtDate(picks[0]?.endDate ?? MARKET_BENCHMARK_2026.endDate)

  const roiColor = (pct: number) => pct >= 0 ? 'text-s-green' : 'text-s-red'

  const beatingMarket = fundRoi >= marketRoi

  return (
    <div className="gl p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-center px-3 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border w-12">Pick</th>
              <th onClick={() => toggleSort('owner')} className="text-left px-4 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border cursor-pointer select-none hover:text-s-text2">Manager{icon('owner')}</th>
              <th onClick={() => toggleSort('ticker')} className="text-left px-3 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border cursor-pointer select-none hover:text-s-text2">Stock Pick{icon('ticker')}</th>
              <th onClick={() => toggleSort('roi')} className="text-right px-4 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border cursor-pointer select-none hover:text-s-text2">ROI{icon('roi')}</th>
              <th onClick={() => toggleSort('startPrice')} className="text-right px-3 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border cursor-pointer select-none hover:text-s-text2 whitespace-nowrap">
                Open {startLabel}{icon('startPrice')}
              </th>
              <th onClick={() => toggleSort('endPrice')} className="text-right px-3 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border cursor-pointer select-none hover:text-s-text2 whitespace-nowrap">
                Close {endLabel}{icon('endPrice')}
              </th>
            </tr>
          </thead>
          <tbody>
            {rankedRows.map(row => (
              <tr key={row.owner} className="border-b border-s-border/40 hover:bg-s-bg3/40 transition-colors">
                <td className="px-3 py-3 text-center text-[12px] font-extrabold text-s-text3 whitespace-nowrap">
                  {pickNumber[row.owner]}
                </td>
                <td className="px-4 py-3 text-[13px] font-semibold text-s-text whitespace-nowrap">{row.owner}</td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className="text-[13px] font-black text-s-text">{row.ticker}</span>
                </td>
                <td className={`px-4 py-3 text-right text-[13px] font-bold num whitespace-nowrap ${roiColor(row.roiPct)}`}>
                  {fmtRoi(row.roiPct)}
                </td>
                <td className="px-3 py-3 text-right text-[13px] text-s-text2 num whitespace-nowrap">{fmtPrice(row.startPrice)}</td>
                <td className="px-3 py-3 text-right text-[13px] text-s-text num whitespace-nowrap">{fmtPrice(row.endPrice)}</td>
              </tr>
            ))}

            {/* Convicts Fund row */}
            <tr className="border-t-2 border-s-border bg-s-bg3/30">
              <td className="px-3 py-3 text-center text-[11px] text-s-text3">—</td>
              <td className="px-4 py-3 text-[12px] font-extrabold text-s-text whitespace-nowrap" colSpan={2}>Convicts Fund</td>
              <td className={`px-4 py-3 text-right text-[13px] font-extrabold num whitespace-nowrap ${roiColor(fundRoi)}`}>
                {fmtRoi(fundRoi)}
              </td>
              <td className="px-3 py-3 text-right text-[13px] text-s-text2 num font-bold whitespace-nowrap">{fmtPrice(fundStart)}</td>
              <td className="px-3 py-3 text-right text-[13px] text-s-text num font-bold whitespace-nowrap">{fmtPrice(fundEnd)}</td>
            </tr>

            {/* Market benchmark row */}
            <tr className="border-t border-s-border/40 bg-s-bg3/20">
              <td className="px-3 py-3 text-center text-[11px] text-s-text3">—</td>
              <td className="px-4 py-3 text-[12px] font-extrabold text-s-text2 whitespace-nowrap" colSpan={2}>
                {MARKET_BENCHMARK_2026.displayTicker}
              </td>
              <td className={`px-4 py-3 text-right text-[13px] font-bold num whitespace-nowrap ${roiColor(marketRoi)}`}>
                {fmtRoi(marketRoi)}
              </td>
              <td className="px-3 py-3 text-right text-[13px] text-s-text3 num whitespace-nowrap">{fmtPrice(MARKET_BENCHMARK_2026.startPrice)}</td>
              <td className="px-3 py-3 text-right text-[13px] text-s-text2 num whitespace-nowrap">{fmtPrice(MARKET_BENCHMARK_2026.endPrice)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Settled footer */}
      <div className="px-4 py-2 text-[10px] text-s-text3 border-t border-s-border/30">
        Final — settled at the {endLabel} close. Pick order locked.
      </div>

      {/* Fund vs Market banner */}
      <div
        className={`mx-4 mb-4 mt-2 rounded-[6px] border p-5 text-center ${
          beatingMarket ? 'border-[rgba(127,168,134,0.3)]' : 'border-[rgba(180,99,107,0.3)]'
        }`}
        style={{
          background: beatingMarket
            ? 'linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(16,185,129,0.06) 100%)'
            : 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(220,38,38,0.06) 100%)',
        }}
      >
        <div className="text-[32px] mb-1">{beatingMarket ? '📈' : '📉'}</div>
        <div className={`text-[15px] font-extrabold ${beatingMarket ? 'text-s-green' : 'text-s-red'}`}>
          {beatingMarket ? 'Convicts Fund beat the market!' : 'Convicts Fund trailed the market.'}
        </div>
        <div className="text-[12px] text-s-text3 mt-1">
          Fund {fmtRoi(fundRoi)} · Market {fmtRoi(marketRoi)}
        </div>
      </div>
    </div>
  )
}

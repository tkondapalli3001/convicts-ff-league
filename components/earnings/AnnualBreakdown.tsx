'use client'

import { useLeague } from '@/context/LeagueContext'
import { EARNINGS_DATA, BUY_INS } from '@/lib/constants'

export default function AnnualBreakdown() {
  const { state } = useLeague()
  const { years } = state

  // Use all years from earnings data if league hasn't loaded yet
  const displayYears = years.length > 0 ? years : [2019, 2020, 2021, 2022, 2023, 2024, 2025]

  return (
    <div className="bg-s-bg2 border border-s-border rounded-[12px] p-[18px] mb-4">
      <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-s-text3 mb-[14px]">
        Annual Breakdown
      </div>

      {/* Buy-in row — above the scrollable table */}
      <div className="flex flex-wrap gap-2 items-center mb-[14px] pb-[14px] border-b border-s-border">
        <span className="text-[10px] font-bold uppercase tracking-[1px] text-s-text3">Buy-In</span>
        {displayYears.map(y => (
          <span key={y} className="inline-flex items-center gap-1 px-2 py-[2px] rounded-[4px] bg-s-bg3 border border-s-border text-[10px]">
            <span className="text-s-text3">{y}:</span>
            <span className="font-bold text-s-text2">${BUY_INS[y] ?? '—'}</span>
          </span>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: `${displayYears.length * 60 + 160}px` }}>
          <thead>
            <tr>
              <th className="sticky left-0 bg-s-bg2" style={{ zIndex: 1 }}>Owner</th>
              <th className="text-s-gold font-bold">Total</th>
              {displayYears.map(y => <th key={y}>{y}</th>)}
            </tr>
          </thead>
          <tbody>
            {EARNINGS_DATA.map(e => {
              const tc = e.total >= 0 ? 'text-s-green' : 'text-s-red'
              return (
                <tr key={e.owner}>
                  <td className="table-sticky-col font-bold text-s-text">{e.owner}</td>
                  <td className={`font-bold bg-[#1a1000] ${tc}`}>{e.total >= 0 ? '+' : ''}${e.total}</td>
                  {displayYears.map(y => {
                    const v = e[`y${y}` as keyof typeof e] as number | null
                    if (v === null || v === undefined)
                      return <td key={y} className="text-s-text3">–</td>
                    const cls = v > 0 ? 'text-s-green font-bold' : v < 0 ? 'text-s-red' : 'text-s-text3'
                    return <td key={y} className={cls}>{v > 0 ? '+' : ''}${v}</td>
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

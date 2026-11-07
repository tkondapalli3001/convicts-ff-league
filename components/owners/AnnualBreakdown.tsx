'use client'

import { useLeague } from '@/context/LeagueContext'
import { EARNINGS_DATA, BUY_INS } from '@/lib/league'
import OwnerAvatar from '@/components/shared/OwnerAvatar'
import StatRows, { type StatField } from '@/components/shared/StatRows'
import { fmtMoney } from '@/lib/utils'

interface LedgerRow {
  owner: string
  /** null on the buy-in row, which isn't anyone's money */
  total: number | null
  byYear: Record<number, number>
}

function moneyColor(v: number): string {
  return v > 0 ? 'text-s-green font-bold' : v < 0 ? 'text-s-red' : 'text-s-text3'
}

/** Phones: the total and the last two seasons that paid out; every other year a tap away. */
function phoneFields(years: number[]): StatField<LedgerRow>[] {
  const paid = years.filter(y => EARNINGS_DATA.some(e => e.byYear[y] !== undefined))
  const recent = paid.slice(-2).reverse()
  const rest = years.filter(y => !recent.includes(y)).reverse()
  return [
    {
      label: 'Total',
      value: r => (r.total == null ? '' : <span className={`font-bold ${r.total >= 0 ? 'text-s-green' : 'text-s-red'}`}>{fmtMoney(r.total)}</span>),
    },
    ...[...recent, ...rest].map(y => ({
      label: String(y),
      value: (r: LedgerRow) => {
        const v = r.byYear[y]
        if (r.total == null) return <span className="text-s-gold">${v ?? '—'}</span>
        return v === undefined ? <span className="text-s-text3">–</span> : <span className={moneyColor(v)}>{fmtMoney(v)}</span>
      },
    })),
  ]
}

export default function AnnualBreakdown() {
  const { state } = useLeague()
  const { years } = state

  // Use every season in the earnings data if the league hasn't loaded yet
  const displayYears = years.length > 0
    ? years
    : [...new Set(EARNINGS_DATA.flatMap(e => Object.keys(e.byYear).map(Number)))].sort((a, b) => a - b)

  const ledger: LedgerRow[] = [{ owner: 'Buy-In', total: null, byYear: BUY_INS }, ...EARNINGS_DATA]

  return (
    <div className="gl p-3 sm:p-[18px] mb-4 relative overflow-hidden">
      <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-gold-soft mb-[14px] relative z-10">
        Annual Breakdown
      </div>

      <StatRows
        className="-mx-3 -mb-3"
        rows={ledger}
        rowKey={r => r.owner}
        owner={r => (r.total == null ? null : r.owner)}
        fields={phoneFields(displayYears)}
        lead={r => (r.total == null ? (
          <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-s-gold">{r.owner}</span>
        ) : (
          <span className="flex items-center gap-2">
            <OwnerAvatar name={r.owner} size="xs" />
            <span className="min-w-0 break-words text-[13px] font-bold leading-tight text-s-text">{r.owner}</span>
          </span>
        ))}
      />

      <div className="hidden overflow-x-auto ab-table sm:block">
        <table className="w-full border-collapse" style={{ minWidth: `${displayYears.length * 60 + 160}px` }}>
          <thead>
            <tr>
              <th className="sticky left-0 z-10" style={{ background: '#0B0B0D' }}>Manager</th>
              <th>Total</th>
              {displayYears.map(y => <th key={y}>{y}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b-2 border-s-border2">
              <td className="sticky-owner sticky left-0 z-[1] text-[10px] font-bold uppercase tracking-[1.5px] text-s-gold">
                Buy-In
              </td>
              <td></td>
              {displayYears.map(y => (
                <td key={y} className="text-[12px] font-bold text-s-gold num">
                  ${BUY_INS[y] ?? '—'}
                </td>
              ))}
            </tr>
            {EARNINGS_DATA.map(e => {
              const tc = e.total >= 0 ? 'text-s-green' : 'text-s-red'
              return (
                <tr key={e.owner} className="hover:bg-[rgba(201,150,46,0.05)] transition-colors">
                  <td className="sticky-owner sticky left-0 z-[1] font-bold text-s-text">
                    <div className="flex items-center gap-2">
                      <OwnerAvatar name={e.owner} size="sm" />
                      {e.owner}
                    </div>
                  </td>
                  <td className={`font-bold num ${tc}`}>{fmtMoney(e.total)}</td>
                  {displayYears.map(y => {
                    const v = e.byYear[y]
                    if (v === undefined)
                      return <td key={y} className="text-s-text3">–</td>
                    return <td key={y} className={`num ${moneyColor(v)}`}>{fmtMoney(v)}</td>
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

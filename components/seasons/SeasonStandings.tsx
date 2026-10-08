'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLeague } from '@/context/LeagueContext'
import { computeLuckIndex } from '@/lib/stats'

import FinishBadge from '@/components/shared/FinishBadge'
import WinPctBadge from '@/components/shared/WinPctBadge'
import OwnerAvatar from '@/components/shared/OwnerAvatar'
import SortHeader from '@/components/shared/SortHeader'

type SortKey = 'manager' | 'year' | 'finish' | 'wins' | 'losses' | 'winpct' | 'pf' | 'pa' | 'margin' | 'luck'

interface Row {
  manager: string
  year: number
  finish: number | null
  wins: number
  losses: number
  winpct: number
  pf: number
  pa: number
  margin: number
  playoffs: boolean
  luck: number
}

interface Props {
  onYearChange?: (year: number | null) => void
}

export default function SeasonStandings({ onYearChange }: Props) {
  const { state } = useLeague()
  const { ownerSeasons, years, matchups, rosterUserMaps } = state
  const router = useRouter()

  const [activeYears, setActiveYears] = useState<Set<number>>(new Set())
  const [sortKey, setSortKey] = useState<SortKey>('winpct')
  const [sortDir, setSortDir] = useState<1 | -1>(-1)

  // Default to the most recent year once data loads
  useEffect(() => {
    if (years.length) {
      const latest = years[years.length - 1]
      setActiveYears(new Set([latest]))
      onYearChange?.(latest)
    }
  }, [years.length])  // eslint-disable-line react-hooks/exhaustive-deps

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => (d === 1 ? -1 : 1))
    else { setSortKey(key); setSortDir(1) }
  }

  function toggleYear(y: number) {
    // Notify the parent outside the state updater — updaters run during
    // render, where updating another component trips a React error
    const reset = activeYears.size === 1 && activeYears.has(y)
    setActiveYears(reset ? new Set(years) : new Set([y]))
    onYearChange?.(reset ? null : y)
  }

  // Season Luck Index per owner — the shared lib/stats implementation, so it
  // matches Records, search, and the 2026 tab
  const luckMap = useMemo<Record<string, number>>(() => {
    const result: Record<string, number> = {}
    for (const year of years) {
      for (const e of computeLuckIndex(matchups, rosterUserMaps, year)) result[`${e.owner}:${year}`] = e.luckIndex
    }
    return result
  }, [matchups, rosterUserMaps, years])

  const rows = useMemo<Row[]>(() => {
    const result: Row[] = []
    for (const [name, seasons] of Object.entries(ownerSeasons)) {
      seasons.forEach(s => {
        if (!activeYears.has(s.year)) return
        const games = s.wins + s.losses
        const margin = games > 0 ? parseFloat(((s.pf - s.pa) / games).toFixed(2)) : 0
        result.push({
          manager: name,
          year: s.year,
          finish: s.finish,
          wins: s.wins,
          losses: s.losses,
          winpct: s.wins / (s.wins + s.losses || 1),
          pf: s.pf,
          pa: s.pa,
          margin,
          playoffs: s.inPlayoffs,
          luck: luckMap[`${name}:${s.year}`] ?? 0,
        })
      })
    }

    result.sort((a, b) => {
      let av: number | string = a[sortKey] ?? -Infinity
      let bv: number | string = b[sortKey] ?? -Infinity
      if (typeof av === 'string') return (av as string).localeCompare(bv as string) * sortDir
      return ((av as number) - (bv as number)) * sortDir
    })
    return result
  }, [ownerSeasons, activeYears, sortKey, sortDir, luckMap])

  const sort = { sortKey, sortDir, onSort: handleSort }

  return (
    <div className="gl p-[18px]">
      <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-gold-soft mb-[14px]">
        Season Standings — Click year to isolate · Tap a manager to view their profile
      </div>

      {/* Year filters */}
      <div className="flex gap-[6px] flex-wrap mb-[14px]">
        {years.map(y => (
          <button
            key={y}
            onClick={() => toggleYear(y)}
            className={[
              'px-3 py-[5px] rounded-full border text-[11px] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap',
              activeYears.has(y)
                ? 'border-gold text-gold-soft bg-[rgba(201,150,46,0.10)]'
                : 'border-[rgba(230,190,90,0.14)] text-s-text3 hover:text-gold-soft',
            ].join(' ')}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="relative">
        <div className="overflow-x-auto scrollbar-hide ss-table" style={{ WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full border-collapse min-w-[640px]">
            <thead>
              <tr>
                <SortHeader {...sort} k="manager" label="Manager"
                  className="sticky left-0 z-10 border-r border-white/[0.06]" style={{ background: '#0B0B0D' }} />
                <SortHeader {...sort} k="year"    label="Year" />
                <SortHeader {...sort} k="finish"  label="Finish" />
                <SortHeader {...sort} k="wins"    label="W" />
                <SortHeader {...sort} k="losses"  label="L" />
                <SortHeader {...sort} k="winpct"  label="Win%" />
                <SortHeader {...sort} k="pf"      label="PF/Gm" />
                <SortHeader {...sort} k="pa"      label="PA/Gm" />
                <SortHeader {...sort} k="margin"  label="+/−/Gm" />
                <SortHeader
                  {...sort}
                  k="luck"
                  label="Luck"
                  tip={{
                    term: 'Luck Index',
                    text: 'actual wins minus expected wins. Expected wins add up, week by week, the share of the league you outscored — as if you played everyone (ties count half). Positive = more wins than your scoring deserved; negative = unlucky.',
                  }}
                />
                <th>Playoffs</th>
              </tr>
            </thead>
          <tbody>
            {rows.map((r) => {
              const pct = (r.winpct * 100).toFixed(1)
              return (
                <tr
                  key={`${r.manager}-${r.year}`}
                  onDoubleClick={() => router.push(`/owners/${encodeURIComponent(r.manager)}`)}
                  className="hover:bg-[rgba(201,150,46,0.05)] transition-colors"
                >
                  <td className="sticky-owner sticky left-0 z-[1] border-r border-white/[0.06] font-bold text-s-text">
                    {/* Single tap — double-click on the row alone was unreachable on touch */}
                    <Link
                      href={`/owners/${encodeURIComponent(r.manager)}`}
                      className="flex items-center gap-2 transition-colors hover:text-gold-soft"
                    >
                      <OwnerAvatar name={r.manager} size="sm" />
                      {r.manager}
                    </Link>
                  </td>
                  <td className="font-display text-[17px] font-bold text-s-text2">{r.year}</td>
                  <td><FinishBadge finish={r.finish} /></td>
                  <td className="font-display text-[17px] font-bold" style={{ color: '#7FA886' }}>{r.wins}</td>
                  <td className="font-display text-[17px] font-bold" style={{ color: '#B4636B' }}>{r.losses}</td>
                  <td><WinPctBadge pct={pct} /></td>
                  <td className="font-display text-[17px] font-semibold text-s-text2 num">{r.wins + r.losses > 0 ? (r.pf / (r.wins + r.losses)).toFixed(1) : '—'}</td>
                  <td className="font-display text-[17px] font-semibold num" style={{ color: '#B4636B' }}>{r.wins + r.losses > 0 ? (r.pa / (r.wins + r.losses)).toFixed(1) : '—'}</td>
                  <td className="font-display text-[17px] font-bold num" style={{ color: r.margin >= 0 ? '#7FA886' : '#B4636B' }}>
                    {r.margin >= 0 ? '+' : ''}{r.margin.toFixed(1)}
                  </td>
                  <td className="font-display text-[17px] font-bold num" style={{ color: r.luck >= 0 ? '#7FA886' : '#B4636B' }}>
                    {r.luck >= 0 ? '+' : ''}{r.luck.toFixed(1)}
                  </td>
                  <td>
                    {r.playoffs ? (
                      <span className="inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[10px] font-bold bg-[rgba(127,168,134,0.12)] text-s-green border border-[rgba(127,168,134,0.3)]" style={{ boxShadow: '0 0 8px #7FA88630' }}>
                        ● Clinched
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[10px] font-bold bg-[rgba(180,99,107,0.12)] text-s-red border border-[rgba(180,99,107,0.3)]">
                        ✕ Eliminated
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
          </table>
        </div>
        {/* Right-edge gradient fade — signals scrollable content */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-r from-transparent to-[rgba(11,14,17,0.85)] z-10" />
      </div>

    </div>
  )
}

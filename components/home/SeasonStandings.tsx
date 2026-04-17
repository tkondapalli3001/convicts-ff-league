'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLeague } from '@/context/LeagueContext'

import FinishBadge from '@/components/shared/FinishBadge'
import WinPctBadge from '@/components/shared/WinPctBadge'

type SortKey = 'manager' | 'year' | 'finish' | 'wins' | 'losses' | 'winpct' | 'pf' | 'pa' | 'margin'

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
}

interface Props {
  onYearChange?: (year: number | null) => void
}

export default function SeasonStandings({ onYearChange }: Props) {
  const { state } = useLeague()
  const { ownerSeasons, years } = state
  const router = useRouter()

  const [activeYears, setActiveYears] = useState<Set<number>>(new Set(years))
  const [sortKey, setSortKey] = useState<SortKey>('winpct')
  const [sortDir, setSortDir] = useState<1 | -1>(-1)

  // Keep activeYears in sync when years load from Sleeper
  useEffect(() => {
    if (years.length) {
      setActiveYears(new Set(years))
      onYearChange?.(null)
    }
  }, [years.length])  // eslint-disable-line react-hooks/exhaustive-deps

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => (d === 1 ? -1 : 1))
    else { setSortKey(key); setSortDir(1) }
  }

  function toggleYear(y: number) {
    setActiveYears(prev => {
      if (prev.size === 1 && prev.has(y)) {
        onYearChange?.(null)
        return new Set(years)
      }
      onYearChange?.(y)
      return new Set([y])
    })
  }

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
  }, [ownerSeasons, activeYears, sortKey, sortDir])

  const SortTh = ({ k, label, hideOnMobile }: { k: SortKey; label: string; hideOnMobile?: boolean }) => (
    <th
      onClick={() => handleSort(k)}
      className={hideOnMobile ? 'hidden md:table-cell' : ''}
      style={{ color: sortKey === k ? '#f59e0b' : undefined }}
    >
      {label} {sortKey === k ? (sortDir === 1 ? '↑' : '↓') : ''}
    </th>
  )

  return (
    <div className="bg-s-bg2 border border-s-border rounded-[12px] p-[18px]">
      <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-s-text3 mb-[14px]">
        Season Standings — Click year to isolate · Double-click row to view owner
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
                ? 'bg-[#1a2e4a] border-s-blue text-[#93c5fd]'
                : 'bg-s-bg3 border-s-border text-s-text3 hover:border-s-border2 hover:text-s-text2',
            ].join(' ')}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
        <table className="w-full border-collapse min-w-[500px]">
          <thead>
            <tr>
              <SortTh k="manager" label="Manager" />
              <SortTh k="year"    label="Year" />
              <SortTh k="finish"  label="Finish" />
              <SortTh k="wins"    label="W" />
              <SortTh k="losses"  label="L" />
              <SortTh k="winpct"  label="Win%" />
              <SortTh k="pf"      label="PF/Gm" hideOnMobile />
              <SortTh k="pa"      label="PA/Gm" hideOnMobile />
              <SortTh k="margin"  label="+/−/Gm" hideOnMobile />
              <th className="hidden md:table-cell">Playoffs</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const pct = (r.winpct * 100).toFixed(1)
              return (
                <tr
                  key={`${r.manager}-${r.year}`}
                  onDoubleClick={() => router.push(`/owners/${r.manager}`)}
                >
                  <td className="sticky-col font-bold text-s-text">{r.manager}</td>
                  <td>
                    <span className="inline-block px-2 py-[2px] rounded-full text-[10px] font-bold bg-s-bg4 text-s-text3 border border-s-border">
                      {r.year}
                    </span>
                  </td>
                  <td><FinishBadge finish={r.finish} /></td>
                  <td className="text-s-green font-bold">{r.wins}</td>
                  <td className="text-s-red">{r.losses}</td>
                  <td><WinPctBadge pct={pct} /></td>
                  <td className="text-s-text2 hidden md:table-cell">{r.wins + r.losses > 0 ? (r.pf / (r.wins + r.losses)).toFixed(1) : '—'}</td>
                  <td className="text-s-text2 hidden md:table-cell">{r.wins + r.losses > 0 ? (r.pa / (r.wins + r.losses)).toFixed(1) : '—'}</td>
                  <td className="hidden md:table-cell">
                    <span className={r.margin >= 0 ? 'text-s-green' : 'text-s-red'}>
                      {r.margin >= 0 ? '+' : ''}{r.margin.toFixed(1)}
                    </span>
                  </td>
                  <td className="hidden md:table-cell">
                    {r.playoffs ? (
                      <span className="inline-flex items-center px-2 py-[2px] rounded-full text-[10px] font-bold bg-[#3d2000] text-s-gold border border-[#5a3200]">✓ Playoffs</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-[2px] rounded-full text-[10px] font-bold bg-s-bg4 text-s-text3 border border-s-border">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLeague } from '@/context/LeagueContext'

import FinishBadge from '@/components/shared/FinishBadge'
import WinPctBadge from '@/components/shared/WinPctBadge'
import OwnerAvatar from '@/components/shared/OwnerAvatar'

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
  allPlayW: number
  allPlayL: number
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
    setActiveYears(prev => {
      if (prev.size === 1 && prev.has(y)) {
        onYearChange?.(null)
        return new Set(years)
      }
      onYearChange?.(y)
      return new Set([y])
    })
  }

  // Compute All-Play W/L per owner per year from raw weekly matchup data
  const allPlayMap = useMemo<Record<string, { w: number; l: number }>>(() => {
    const result: Record<string, { w: number; l: number }> = {}
    for (const [yearStr, weekMap] of Object.entries(matchups)) {
      const year = Number(yearStr)
      const rMap = rosterUserMaps[year] ?? {}
      for (const weekData of Object.values(weekMap)) {
        if (weekData.isPlayoff) continue
        const teamScores = weekData.matchups
          .map(m => ({
            owner: rMap[String(m.roster_id)] ?? `Team${m.roster_id}`,
            score: m.points ?? 0,
          }))
          .filter(t => t.score > 0)
        const N = teamScores.length
        if (N < 2) continue
        for (const team of teamScores) {
          const key = `${team.owner}:${year}`
          if (!result[key]) result[key] = { w: 0, l: 0 }
          result[key].w += teamScores.filter(t => t.owner !== team.owner && t.score < team.score).length
          result[key].l += teamScores.filter(t => t.owner !== team.owner && t.score > team.score).length
        }
      }
    }
    return result
  }, [matchups, rosterUserMaps])

  const rows = useMemo<Row[]>(() => {
    const result: Row[] = []
    for (const [name, seasons] of Object.entries(ownerSeasons)) {
      seasons.forEach(s => {
        if (!activeYears.has(s.year)) return
        const games = s.wins + s.losses
        const margin = games > 0 ? parseFloat(((s.pf - s.pa) / games).toFixed(2)) : 0
        const ap = allPlayMap[`${name}:${s.year}`] ?? { w: 0, l: 0 }
        const apTotal = ap.w + ap.l
        const expectedWins = apTotal > 0 ? (s.wins + s.losses) * (ap.w / apTotal) : 0
        const luck = parseFloat((s.wins - expectedWins).toFixed(2))
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
          allPlayW: ap.w,
          allPlayL: ap.l,
          luck,
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
  }, [ownerSeasons, activeYears, sortKey, sortDir, allPlayMap])

  const SortTh = ({ k, label, hideOnMobile, stickyFirst }: { k: SortKey; label: string; hideOnMobile?: boolean; stickyFirst?: boolean }) => (
    <th
      onClick={() => handleSort(k)}
      className={[hideOnMobile ? 'hidden md:table-cell' : '', stickyFirst ? 'sticky left-0 z-10 border-r border-white/[0.06]' : ''].filter(Boolean).join(' ')}
      style={{
        color: sortKey === k ? '#C9A24B' : undefined,
        background: stickyFirst ? '#0B0B0D' : undefined,
      }}
    >
      {label} {sortKey === k ? (sortDir === 1 ? '↑' : '↓') : ''}
    </th>
  )

  return (
    <div className="gl p-[18px]">
      <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-gold-soft mb-[14px]">
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
                <SortTh k="manager" label="Manager" stickyFirst />
                <SortTh k="year"    label="Year" />
                <SortTh k="finish"  label="Finish" />
                <SortTh k="wins"    label="W" />
                <SortTh k="losses"  label="L" />
                <SortTh k="winpct"  label="Win%" />
                <SortTh k="pf"      label="PF/Gm" />
                <SortTh k="pa"      label="PA/Gm" />
                <SortTh k="margin"  label="+/−/Gm" />
                <SortTh k="luck"    label="Luck" />
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
                    <div className="flex items-center gap-2">
                      <OwnerAvatar name={r.manager} size="sm" />
                      {r.manager}
                    </div>
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

      <p className="mt-3 px-1 text-[10px] text-s-text3 leading-relaxed">
        <span className="font-bold text-s-text2">Luck Index</span> = Actual Wins − Expected Wins.
        Expected Wins is your All-Play win rate (how often you beat the rest of the field each week) applied to your actual schedule length.
        Positive = you won more than your scoring deserved; negative = you were unlucky.
      </p>
    </div>
  )
}

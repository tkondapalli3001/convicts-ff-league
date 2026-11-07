'use client'

import { useState, useMemo, useEffect } from 'react'
import { useUrlParam } from '@/hooks/useUrlParam'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLeague } from '@/context/LeagueContext'
import { computeLuckIndex, scheduleLuckNote, type UncertaintySummary } from '@/lib/stats'
import InfoTip from '@/components/shared/InfoTip'
import uncertaintyData from '@/public/data/uncertainty.json'

import FinishBadge from '@/components/shared/FinishBadge'
import WinPctBadge from '@/components/shared/WinPctBadge'
import OwnerAvatar from '@/components/shared/OwnerAvatar'
import SortHeader from '@/components/shared/SortHeader'
import StatRows, { type StatField } from '@/components/shared/StatRows'
import { fmtRecord } from '@/lib/utils'

const scheduleLuck = uncertaintyData as UncertaintySummary

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

const LUCK_TIP = 'actual wins minus expected wins. Expected wins add up, week by week, the share of the league you outscored — as if you played everyone (ties count half). Positive = more wins than your scoring deserved; negative = unlucky.'

function perGame(total: number, r: Row): string {
  return r.wins + r.losses > 0 ? (total / (r.wins + r.losses)).toFixed(1) : '—'
}

function signed(n: number) {
  return <span className="font-bold" style={{ color: n >= 0 ? '#7FA886' : '#B4636B' }}>{n >= 0 ? '+' : ''}{n.toFixed(1)}</span>
}

function luckNote(r: Row) {
  const luck = scheduleLuck.luck[r.year]?.[r.manager]
  return luck ? <InfoTip term={`${r.manager}’s ${r.year} luck`}>{scheduleLuckNote(luck, scheduleLuck.sims)}</InfoTip> : null
}

function PlayoffChip({ playoffs }: { playoffs: boolean }) {
  return playoffs ? (
    <span className="inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[10px] font-bold bg-[rgba(127,168,134,0.12)] text-s-green border border-[rgba(127,168,134,0.3)]" style={{ boxShadow: '0 0 8px #7FA88630' }}>
      ● Clinched
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[10px] font-bold bg-[rgba(180,99,107,0.12)] text-s-red border border-[rgba(180,99,107,0.3)]">
      ✕ Eliminated
    </span>
  )
}

/** Phones: record, scoring and luck up front; finish sits by the name. The rest is a tap away. */
const PHONE_FIELDS: StatField<Row, SortKey>[] = [
  { label: 'Record', sortKey: 'wins', covers: ['losses', 'winpct'], value: r => <span className="font-bold text-s-text">{fmtRecord(r.wins, r.losses)}</span> },
  { label: 'PF/Gm', sortKey: 'pf', value: r => perGame(r.pf, r) },
  { label: 'Luck', sortKey: 'luck', tip: { term: 'Luck Index', text: LUCK_TIP }, value: r => signed(r.luck), rowTip: luckNote },
  { label: 'Win%', value: r => <WinPctBadge pct={(r.winpct * 100).toFixed(1)} /> },
  { label: 'PA/Gm', sortKey: 'pa', value: r => <span style={{ color: '#B4636B' }}>{perGame(r.pa, r)}</span> },
  { label: '+/−/Gm', sortKey: 'margin', value: r => signed(r.margin) },
  { label: 'Playoffs', value: r => <PlayoffChip playoffs={r.playoffs} /> },
]
const PHONE_SORTS: { key: SortKey; label: string }[] = [
  { key: 'winpct', label: 'Win%' },
  { key: 'wins', label: 'Wins' },
  { key: 'losses', label: 'Losses' },
  { key: 'finish', label: 'Finish' },
  { key: 'pf', label: 'PF/Gm' },
  { key: 'pa', label: 'PA/Gm' },
  { key: 'margin', label: '+/−/Gm' },
  { key: 'luck', label: 'Luck' },
  { key: 'year', label: 'Year' },
  { key: 'manager', label: 'Manager' },
]

interface Props {
  onYearChange?: (year: number | null) => void
}

export default function SeasonStandings({ onYearChange }: Props) {
  const { state } = useLeague()
  const { ownerSeasons, years, matchups, rosterUserMaps } = state
  const router = useRouter()

  // '' = the most recent year, 'all' = every year, else one year
  const [yearParam, setYearParam] = useUrlParam('year', '')
  const latest = years[years.length - 1]
  const activeYears = useMemo(() => {
    if (yearParam === 'all') return new Set(years)
    const picked = Number(yearParam)
    return new Set(years.includes(picked) ? [picked] : latest != null ? [latest] : [])
  }, [yearParam, years, latest])
  const [sortKey, setSortKey] = useState<SortKey>('winpct')
  const [sortDir, setSortDir] = useState<1 | -1>(-1)

  // The bracket below follows the year on show
  useEffect(() => {
    if (years.length) onYearChange?.(activeYears.size === 1 ? [...activeYears][0] : null)
  }, [activeYears, years.length])  // eslint-disable-line react-hooks/exhaustive-deps

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => (d === 1 ? -1 : 1))
    // Names A–Z and finishes 1st-first; other numbers start biggest first, like the Career Leaderboard
    else { setSortKey(key); setSortDir(key === 'manager' || key === 'finish' ? 1 : -1) }
  }

  function toggleYear(y: number) {
    setYearParam(activeYears.size === 1 && activeYears.has(y) ? 'all' : String(y))
  }

  // Season Luck Index per owner — the shared lib/stats implementation, so it
  // matches Records, search, and the season tab
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
    <div className="gl p-3 sm:p-[18px]">
      <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-gold-soft mb-[14px]">
        Season Standings — Tap a year to isolate · Tap a manager for <span className="sm:hidden">more</span><span className="hidden sm:inline">their profile</span>
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

      <StatRows
        className="-mx-3 -mb-3"
        rows={rows}
        rowKey={r => `${r.manager}-${r.year}`}
        owner={r => r.manager}
        fields={PHONE_FIELDS}
        sort={{ key: sortKey, dir: sortDir, onSort: handleSort, options: PHONE_SORTS }}
        lead={r => (
          <span className="flex items-center gap-2">
            <OwnerAvatar name={r.manager} size="xs" />
            <span className="min-w-0">
              <span className="block break-words text-[13px] font-bold leading-tight text-s-text">{r.manager}</span>
              <span className="mt-1 flex flex-wrap items-center gap-1.5">
                <FinishBadge finish={r.finish} />
                {activeYears.size > 1 && <span className="font-display text-[13px] font-bold text-s-text3">{r.year}</span>}
              </span>
            </span>
          </span>
        )}
      />

      {/* Table */}
      <div className="relative hidden sm:block">
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
                  tip={{ term: 'Luck Index', text: LUCK_TIP }}
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
                    {luckNote(r)}
                  </td>
                  <td><PlayoffChip playoffs={r.playoffs} /></td>
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

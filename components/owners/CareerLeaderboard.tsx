'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useLeague } from '@/context/LeagueContext'
import { MANUAL_CHAMPS, MANUAL_SHAME, EARNINGS_DATA, USER_ID_TO_OWNER } from '@/lib/constants'
import WinPctBadge from '@/components/shared/WinPctBadge'

type SortKey = 'name' | 'numSeasons' | 'allW' | 'allL' | 'winpct' | 'avgPF' | 'avgFinish' | 'playoffApps' | 'champs' | 'shame' | 'earn'

export default function CareerLeaderboard() {
  const { state } = useLeague()
  const { ownerSeasons, allMatchups, brackets, rosterUserMaps, leagues } = state
  const [sortKey, setSortKey] = useState<SortKey>('winpct')
  const [sortDir, setSortDir] = useState<1 | -1>(1)
  const [playoffOnly, setPlayoffOnly] = useState(false)
  const router = useRouter()

  // Build a set of exact game keys (year|||week|||team1|||team2) for championship-path games only.
  // Excludes 3rd/5th place consolation games (g.p === 3 or g.p === 5) and the losers bracket.
  const winnersBracketGameKeys = useMemo(() => {
    const set = new Set<string>()
    for (const [yearStr, bracket] of Object.entries(brackets)) {
      const year = Number(yearStr)
      const rMap = rosterUserMaps[year] ?? {}
      const playoffStart = leagues[year]?.settings?.playoff_week_start ?? 15
      ;(bracket.winners ?? [])
        .filter(g => !g.p || g.p === 1)  // keep unplaced rounds + championship; exclude 3rd/5th
        .forEach(g => {
          const t1Id = g.t1 ?? null
          const t2Id = g.t2 ?? null
          if (t1Id != null && t2Id != null) {
            const week = playoffStart + (g.r - 1)
            const t1Name = rMap[String(t1Id)] ?? `Team${t1Id}`
            const t2Name = rMap[String(t2Id)] ?? `Team${t2Id}`
            set.add(`${year}|||${week}|||${t1Name}|||${t2Name}`)
            set.add(`${year}|||${week}|||${t2Name}|||${t1Name}`)
          }
        })
    }
    return set
  }, [brackets, rosterUserMaps, leagues])

  const canonicalNames = [...new Set(Object.values(USER_ID_TO_OWNER))]
  const names = canonicalNames.filter(n => ownerSeasons[n]).sort()

  function handleSort(k: SortKey) {
    if (sortKey === k) setSortDir(d => (d === 1 ? -1 : 1))
    else { setSortKey(k); setSortDir(1) }
  }

  const data = useMemo(() => {
    return names.map(name => {
      const allSeasons = ownerSeasons[name] || []
      const playoffApps = allSeasons.filter(s => s.inPlayoffs).length
      const champs = MANUAL_CHAMPS.filter(c => c.winner?.includes(name))
        .reduce((sum, c) => sum + (c.half ? 0.5 : 1), 0)
      const shame = MANUAL_SHAME.filter(s => s.loser === name).length
      const earn = EARNINGS_DATA.find(e => e.owner === name)

      let allW: number, allL: number, avgPF: number, numSeasons: number, avgFinish: number | null

      if (playoffOnly) {
        // Use actual playoff game records from allMatchups
        const playoffGames = allMatchups.filter(
          g => g.type === 'P' &&
               (g.team1 === name || g.team2 === name) &&
               winnersBracketGameKeys.has(`${g.year}|||${g.week}|||${g.team1}|||${g.team2}`)
        )
        allW = playoffGames.filter(g => g.winner === name).length
        allL = playoffGames.filter(g => g.loser === name).length
        avgPF = playoffGames.length
          ? playoffGames.reduce((sum, g) => sum + (g.team1 === name ? g.pts1 : g.pts2), 0) / playoffGames.length
          : 0
        numSeasons = playoffApps
        const playoffFinishes = allSeasons.filter(s => s.inPlayoffs && s.finish != null).map(s => s.finish as number)
        avgFinish = playoffFinishes.length ? playoffFinishes.reduce((a, b) => a + b, 0) / playoffFinishes.length : null
      } else {
        allW = allSeasons.reduce((a, s) => a + s.wins, 0)
        allL = allSeasons.reduce((a, s) => a + s.losses, 0)
        avgPF = allSeasons.length ? allSeasons.reduce((a, s) => a + s.pf, 0) / allSeasons.length : 0
        numSeasons = allSeasons.length
        const finishes = allSeasons.filter(s => s.finish != null).map(s => s.finish as number)
        avgFinish = finishes.length ? finishes.reduce((a, b) => a + b, 0) / finishes.length : null
      }

      return {
        name, numSeasons, allW, allL,
        winpct: allW / (allW + allL || 1),
        avgPF, playoffApps, champs, shame,
        earn: earn ? earn.total : null,
        avgFinish,
      }
    })
  }, [names.join(','), ownerSeasons, allMatchups, winnersBracketGameKeys, playoffOnly])

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      let av = a[sortKey] as number | null
      let bv = b[sortKey] as number | null
      const fallback = sortDir < 0 ? -Infinity : Infinity
      av = av ?? fallback
      bv = bv ?? fallback
      return (bv - av) * sortDir
    })
  }, [data, sortKey, sortDir])

  const SortTh = ({ k, label, hideOnMobile }: { k: SortKey; label: string; hideOnMobile?: boolean }) => (
    <th
      onClick={() => handleSort(k)}
      className={hideOnMobile ? 'hidden md:table-cell cursor-pointer' : 'cursor-pointer'}
      style={{ color: sortKey === k ? '#f59e0b' : undefined }}
    >
      {label}
    </th>
  )

  return (
    <div className="bg-s-bg2 border border-s-border rounded-[12px] p-[18px]">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-s-text3">
          Career Leaderboard{playoffOnly ? ' — Playoff Games Only' : ''}
        </div>
        <button
          onClick={() => setPlayoffOnly(p => !p)}
          className={[
            'px-3 py-[5px] rounded-full border text-[11px] font-semibold cursor-pointer transition-all duration-150',
            playoffOnly
              ? 'bg-[#2d1a00] border-s-gold text-s-gold'
              : 'bg-s-bg3 border-s-border text-s-text3 hover:border-s-border2 hover:text-s-text2',
          ].join(' ')}
        >
          {playoffOnly ? '← All Games' : 'Playoffs Only'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[700px]">
          <thead>
            <tr>
              <th>#</th>
              <SortTh k="name"        label="Manager" />
              <SortTh k="numSeasons"  label={playoffOnly ? 'Apps' : 'Seasons'}  hideOnMobile />
              <SortTh k="allW"        label="W" />
              <SortTh k="allL"        label="L" />
              <SortTh k="winpct"      label="Win%" />
              <SortTh k="avgPF"       label={playoffOnly ? 'Avg PF/Gm' : 'Avg PF'}   hideOnMobile />
              <SortTh k="avgFinish"   label="Avg Fin"  hideOnMobile />
              {!playoffOnly && <SortTh k="playoffApps" label="Playoffs" hideOnMobile />}
              <SortTh k="champs"      label="🏆" />
              <SortTh k="shame"       label="🚽" />
              <SortTh k="earn"        label="Net $" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((d, i) => {
              const rankColors = ['bg-[#3d2000] text-s-gold', 'bg-[#1a2030] text-[#b0c4de]', 'bg-[#1a1000] text-[#cd7f32]']
              const rankCls = i < 3 ? rankColors[i] : 'bg-s-bg4 text-s-text3'
              const pct = (d.winpct * 100).toFixed(1)
              return (
                <tr key={d.name} onClick={() => router.push(`/owners/${encodeURIComponent(d.name)}`)}>
                  <td>
                    <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[11px] font-extrabold ${rankCls}`}>{i + 1}</span>
                  </td>
                  <td className="font-bold text-s-text">{d.name}</td>
                  <td className="hidden md:table-cell text-s-text3">{d.numSeasons}</td>
                  <td className="text-s-green font-bold">{d.allW}</td>
                  <td className="text-s-red">{d.allL}</td>
                  <td><WinPctBadge pct={pct} /></td>
                  <td className="hidden md:table-cell text-s-text2">{d.avgPF.toFixed(1)}</td>
                  <td className="hidden md:table-cell text-s-text2">{d.avgFinish != null ? d.avgFinish.toFixed(1) : '—'}</td>
                  {!playoffOnly && <td className="hidden md:table-cell text-s-text2">{d.playoffApps}/{d.numSeasons}</td>}
                  <td>{d.champs > 0 ? <span className="inline-flex items-center px-2 py-[2px] rounded-full text-[10px] font-bold bg-[#3d2000] text-s-gold border border-[#5a3200]">🏆 {d.champs}x</span> : <span className="text-s-text3">—</span>}</td>
                  <td>{d.shame > 0 ? <span className="inline-flex items-center px-2 py-[2px] rounded-full text-[10px] font-bold bg-[#3d0000] text-s-red border border-[#5a0000]">🚽 {d.shame}x</span> : <span className="text-s-text3">—</span>}</td>
                  <td className={d.earn != null ? (d.earn >= 0 ? 'text-s-green font-bold' : 'text-s-red font-bold') : 'text-s-text3'}>
                    {d.earn != null ? `${d.earn >= 0 ? '+' : ''}$${d.earn}` : '—'}
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

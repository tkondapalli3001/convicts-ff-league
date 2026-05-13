'use client'

import { useMemo } from 'react'
import { useLeague } from '@/context/LeagueContext'

const POS_COLORS: Record<string, string> = {
  QB:  'bg-amber-500/20 text-amber-400 border-amber-500/30',
  RB:  'bg-green-500/20 text-green-400 border-green-500/30',
  WR:  'bg-blue-500/20 text-blue-400 border-blue-500/30',
  TE:  'bg-purple-500/20 text-purple-400 border-purple-500/30',
  K:   'bg-slate-500/20 text-slate-400 border-slate-500/30',
  DEF: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

interface PickResult {
  year: number
  playerName: string
  position: string
  owner: string
  pickNo: number
  totalPts: number
  pickRank: number
  ptsRank: number
  value: number
}

export default function StealsBusts() {
  const { state } = useLeague()
  const { draftData, matchups, rosterUserMaps, years } = state

  const { steals, busts } = useMemo(() => {
    const allResults: PickResult[] = []

    for (const year of years) {
      const draft = draftData[year]
      if (!draft?.picks?.length) continue
      const rMap = rosterUserMaps[year] ?? {}
      const weekData = matchups[year]
      if (!weekData) continue

      // Aggregate total points per player_id for this season
      const playerPts: Record<string, number> = {}
      for (const { matchups: weekMatchups } of Object.values(weekData)) {
        for (const m of weekMatchups) {
          if (!m.players_points) continue
          for (const [pid, pts] of Object.entries(m.players_points)) {
            playerPts[pid] = (playerPts[pid] ?? 0) + pts
          }
        }
      }

      // Only include players with actual production (starters produce points)
      const pickedPlayers = draft.picks.map(pick => {
        const pts = playerPts[pick.player_id] ?? 0
        const owner = rMap[String(pick.roster_id)] ?? `Slot ${pick.draft_slot}`
        const playerName = [pick.metadata.first_name, pick.metadata.last_name].filter(Boolean).join(' ')
          || pick.player_id
        return {
          year,
          playerName,
          position: pick.metadata.position ?? '?',
          owner,
          pickNo: pick.pick_no,
          totalPts: pts,
        }
      }).filter(p => p.totalPts > 0 && p.position !== '?')

      // Per-position: compute pick rank and points rank
      const positions = [...new Set(pickedPlayers.map(p => p.position))]
      for (const pos of positions) {
        const group = pickedPlayers
          .filter(p => p.position === pos)
          .sort((a, b) => a.pickNo - b.pickNo)

        const byPts = [...group].sort((a, b) => b.totalPts - a.totalPts)

        group.forEach((p, pickIdx) => {
          const ptsIdx = byPts.findIndex(x => x.playerName === p.playerName && x.pickNo === p.pickNo)
          allResults.push({
            ...p,
            pickRank: pickIdx + 1,
            ptsRank: ptsIdx + 1,
            value: (pickIdx + 1) - (ptsIdx + 1),
          })
        })
      }
    }

    // Steals: high value (picked late, produced well)
    const steals = [...allResults]
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)

    // Busts: low value (picked early, produced poorly)
    const busts = [...allResults]
      .sort((a, b) => a.value - b.value)
      .slice(0, 10)

    return { steals, busts }
  }, [draftData, matchups, rosterUserMaps, years])

  if (!steals.length && !busts.length) {
    return (
      <div className="gl p-6 text-center text-s-text3 text-[12px]">
        Not enough draft + scoring data to compute steals and busts yet.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-s-text3">
        Steals picked later than their positional peers but outscored them. Busts were drafted early but underperformed.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PickList title="Top Steals" emoji="💎" picks={steals} isSteal />
        <PickList title="Top Busts" emoji="💀" picks={busts} isSteal={false} />
      </div>
    </div>
  )
}

function PickList({ title, emoji, picks, isSteal }: {
  title: string
  emoji: string
  picks: PickResult[]
  isSteal: boolean
}) {
  return (
    <div className="gl overflow-hidden">
      <div className="px-4 py-3 border-b border-s-border flex items-center gap-2">
        <span className="text-[16px]">{emoji}</span>
        <span className="text-[12px] font-extrabold tracking-[1.5px] uppercase text-s-text">{title}</span>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left px-4 py-2 text-[9px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border">#</th>
            <th className="text-left px-3 py-2 text-[9px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border">Player</th>
            <th className="text-left px-3 py-2 text-[9px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border">Owner</th>
            <th className="text-center px-3 py-2 text-[9px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border">Pick</th>
            <th className="text-center px-3 py-2 text-[9px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border">Pts</th>
            <th className="text-center px-3 py-2 text-[9px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border">Value</th>
          </tr>
        </thead>
        <tbody>
          {picks.map((p, i) => {
            const posClass = POS_COLORS[p.position] ?? 'bg-slate-500/20 text-slate-400 border-slate-500/30'
            return (
              <tr key={`${p.year}-${p.playerName}-${p.pickNo}`} className="border-b border-s-border/40 hover:bg-s-bg3/30 transition-colors">
                <td className="px-4 py-2 text-[11px] font-bold text-s-text3">{i + 1}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-bold px-1 py-0 rounded border ${posClass}`}>{p.position}</span>
                    <div>
                      <div className="text-[12px] font-semibold text-s-text leading-tight">{p.playerName}</div>
                      <div className="text-[9px] text-s-text3">{p.year}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 text-[11px] text-s-text2">{p.owner}</td>
                <td className="px-3 py-2 text-center text-[11px] text-s-text3">
                  <span className="font-mono">#{p.pickNo}</span>
                  <span className="text-[9px] ml-1 text-s-text3">({p.pickRank} at pos)</span>
                </td>
                <td className="px-3 py-2 text-center text-[11px] font-mono text-s-text2">
                  {p.totalPts.toFixed(1)}
                </td>
                <td className={`px-3 py-2 text-center text-[12px] font-extrabold ${isSteal ? 'text-s-green' : 'text-s-red'}`}>
                  {isSteal ? `+${p.value}` : p.value}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

'use client'

import { useLeague } from '@/context/LeagueContext'
import StatBox from '@/components/shared/StatBox'

export default function QuickStats() {
  const { state } = useLeague()
  const { allMatchups, leagueChain, years } = state

  const totalGames = allMatchups.length
  const totalPts = allMatchups.reduce((a, m) => a + m.pts1 + m.pts2, 0)
  const avgPts = totalGames > 0 ? (totalPts / (totalGames * 2)).toFixed(1) : '—'
  const seasons = leagueChain.length

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-[10px] mb-5">
      <StatBox
        label="Seasons"
        value={seasons || '—'}
        sub={years.length >= 2 ? `${years[0]}–${years[years.length - 1]}` : undefined}
      />
      <StatBox
        label="Games Played"
        value={totalGames || '—'}
        sub="all matchups"
      />
      <StatBox
        label="Avg Score"
        value={avgPts}
        sub="pts per team/game"
      />
      <StatBox
        label="Dynasty 👑"
        value="Daniyaal"
        sub="2x Champ (most)"
        valueColor="#8b5cf6"
      />
      <StatBox
        label="Toilet Bowl 🚽"
        value="Nathan & Teja"
        sub="2x losers each 💀"
        valueColor="#ef4444"
      />
      <StatBox
        label="Buy-in Rise"
        value="$20→$125"
        sub="6x escalation"
      />
    </div>
  )
}

'use client'

import { useMemo } from 'react'
import { playoffStartWeek } from '@/lib/data-processing'
import { lastFinalWeek, seasonHonors, standingBadges, type Badge } from '@/lib/current-season'
import { computePowerRankings, type PowerRankingRow } from '@/lib/stats'
import type { LiveSeason } from '@/hooks/useLiveSeason'

export interface PowerRankingsData {
  rows: PowerRankingRow[]
  /** Last regular-season week with final scores; 0 before Week 1 is final. */
  throughWeek: number
  /** owner → streak and last-season flair (🔥 🧊 🏆 🚽). */
  badges: Record<string, Badge[]>
}

/** Power Rankings on the season tab — final regular-season weeks only. */
export function usePowerRankings(live: LiveSeason): PowerRankingsData {
  const { state, base, season, games } = live
  // Last season's champ and toilet bowl don't change between polls
  const honors = useMemo(() => (season ? seasonHonors(base, season) : null), [base, season])
  return useMemo(() => {
    if (!season || !honors) return { rows: [], throughWeek: 0, badges: {} }
    const playoffStart = playoffStartWeek(state.leagues[season])
    const throughWeek = Math.min(lastFinalWeek(state, season), playoffStart - 1)
    const rows = computePowerRankings(games.filter(m => m.week <= throughWeek), throughWeek)
    const badges = Object.fromEntries(rows.map(r => [r.name, standingBadges(r.name, r.streak, honors)]))
    return { rows, throughWeek, badges }
  }, [state, season, games, honors])
}

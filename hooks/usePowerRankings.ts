'use client'

import { useMemo } from 'react'
import { flattenSeasonMatchups } from '@/lib/data-processing'
import { lastFinalWeek } from '@/lib/preview'
import { computePowerRankings, type PowerRankingRow } from '@/lib/stats'
import type { LiveSeason } from '@/hooks/useLiveSeason'

export interface PowerRankingsData {
  rows: PowerRankingRow[]
  /** Last regular-season week with final scores; 0 before Week 1 is final. */
  throughWeek: number
}

/** Power Rankings tab of the 2026 page — final regular-season weeks only. */
export function usePowerRankings(live: LiveSeason): PowerRankingsData {
  const { state, season } = live
  return useMemo(() => {
    if (!season) return { rows: [], throughWeek: 0 }
    const playoffStart = state.leagues[season]?.settings?.playoff_week_start || 15
    const throughWeek = Math.min(lastFinalWeek(state, season), playoffStart - 1)
    const games = flattenSeasonMatchups(state, season).filter(m => m.week <= throughWeek)
    return { rows: computePowerRankings(games, throughWeek), throughWeek }
  }, [state, season])
}

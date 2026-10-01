'use client'

import { useEffect, useMemo, useState } from 'react'
import { loadWeekPairings, scheduleGaps, seasonSchedule } from '@/lib/preview'
import type { ScheduleGame } from '@/lib/preview'
import type { LiveSeason } from '@/hooks/useLiveSeason'
import type { SleeperMatchup } from '@/types'

/**
 * The 2026 tab's full regular-season schedule, week → pairings. The base
 * state loads only the weeks played so far; the rest (Sleeper publishes the
 * whole schedule up front) loads once per visit — shared by the playoff odds
 * and each owner's schedule on Rosters.
 */
export function useSeasonSchedule(live: LiveSeason): Record<number, ScheduleGame[]> {
  const { state, season } = live
  const leagueId = season ? state.leagueChain.find(e => e.year === season)?.id : undefined
  const gaps = useMemo(() => (season ? scheduleGaps(state, season).join(',') : ''), [state, season])
  const [future, setFuture] = useState<Record<number, SleeperMatchup[]>>({})

  useEffect(() => {
    if (!leagueId || !gaps) return
    let cancelled = false
    loadWeekPairings(leagueId, gaps.split(',').map(Number))
      .then(rows => { if (!cancelled && Object.keys(rows).length) setFuture(prev => ({ ...prev, ...rows })) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [leagueId, gaps])

  return useMemo(() => (season ? seasonSchedule(state, season, future) : {}), [state, season, future])
}

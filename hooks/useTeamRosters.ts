'use client'

import { useMemo } from 'react'
import { playerLookup, buildTeamRosters, buildRosterMoves, weekStatus } from '@/lib/preview'
import type { TeamRoster, RosterMove, WeekStatus } from '@/lib/preview'
import type { LiveSeason } from '@/hooks/useLiveSeason'

export interface TeamRostersData {
  rosters: TeamRoster[]
  moves: RosterMove[]
  week: number
  status: WeekStatus
}

/** Rosters tab of the 2026 page: every lineup for the current week, plus the week's moves. */
export function useTeamRosters(live: LiveSeason): TeamRostersData {
  const { state, season, week, projections, extraPlayers, transactions } = live
  return useMemo(() => {
    if (!season) return { rosters: [], moves: [], week, status: 'upcoming' as WeekStatus }
    const lookup = playerLookup(state, season, projections, extraPlayers)
    const status = weekStatus(state, season, week)
    return {
      rosters: buildTeamRosters(state, season, week, status, projections, lookup),
      moves: buildRosterMoves(transactions, state.rosterUserMaps[season] ?? {}, lookup),
      week,
      status,
    }
  }, [state, season, week, projections, extraPlayers, transactions])
}

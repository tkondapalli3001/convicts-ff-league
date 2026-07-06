import { useMemo } from 'react'
import { useLeague } from '@/context/LeagueContext'
import { buildCareerStats } from '@/lib/stats'

/** Memoized all-time career stats per active owner (see lib/stats/career.ts). */
export function useCareerStats() {
  const { state } = useLeague()
  const { ownerSeasons, allMatchups } = state
  return useMemo(
    () => buildCareerStats({ ownerSeasons, allMatchups }),
    [ownerSeasons, allMatchups]
  )
}

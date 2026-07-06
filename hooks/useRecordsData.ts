import { useMemo } from 'react'
import { useLeague } from '@/context/LeagueContext'
import { computeRecords } from '@/lib/stats'

/** Memoized record-book stats (see lib/stats/records.ts for the computation). */
export function useRecordsData() {
  const { state } = useLeague()
  const { allMatchups, ownerSeasons, brackets, rosterUserMaps, leagues } = state
  return useMemo(
    () => computeRecords({ allMatchups, ownerSeasons, brackets, rosterUserMaps, leagues }),
    [allMatchups, ownerSeasons, brackets, rosterUserMaps, leagues]
  )
}

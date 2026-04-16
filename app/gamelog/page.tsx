'use client'

import { useState, useMemo, useEffect } from 'react'
import { useLeague } from '@/context/LeagueContext'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import GameLogFilters from '@/components/gamelog/GameLogFilters'
import GameLogTable from '@/components/gamelog/GameLogTable'
import { USER_ID_TO_OWNER } from '@/lib/constants'

export default function GameLogPage() {
  const { state } = useLeague()
  const { loaded, error, allMatchups, years, ownerSeasons } = state

  const [activeYears, setActiveYears]   = useState<Set<number>>(new Set())
  const [activeOwners, setActiveOwners] = useState<Set<string>>(new Set())

  // Initialize year filters once data loads
  useEffect(() => {
    if (years.length) setActiveYears(new Set(years))
  }, [years.length])  // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <ErrorState error={error} />
  if (!loaded) return <LoadingSpinner />

  const canonicalNames = [...new Set(Object.values(USER_ID_TO_OWNER))]
  const ownerNames = canonicalNames.filter(n => ownerSeasons[n]).sort()

  function toggleYear(y: number) {
    setActiveYears(prev => {
      // If this is already the only active year, reset to all years
      if (prev.size === 1 && prev.has(y)) return new Set(years)
      // Otherwise, select only this year
      return new Set([y])
    })
  }
  function toggleOwner(name: string) {
    setActiveOwners(prev => {
      // If this is already the only selected owner, clear the filter (show all)
      if (prev.size === 1 && prev.has(name)) return new Set<string>()
      // Otherwise, select only this owner
      return new Set([name])
    })
  }

  const filtered = useMemo(() => {
    return allMatchups.filter(g => {
      if (!activeYears.has(g.year)) return false
      if (activeOwners.size > 0) {
        // Show matchup if either team is in the active owner filter
        if (!activeOwners.has(g.team1) && !activeOwners.has(g.team2)) return false
      }
      return true
    })
  }, [allMatchups, activeYears, activeOwners])

  return (
    <div className="animate-fade-in">
      <h1 className="text-[26px] font-extrabold text-s-text mb-1">Full Game Log</h1>
      <p className="text-[13px] text-s-text3 mb-6">
        {allMatchups.length} total matchups · Double-click any row to filter by those two teams
      </p>

      <GameLogFilters
        years={years}
        ownerNames={ownerNames}
        activeYears={activeYears}
        activeOwners={activeOwners}
        onToggleYear={toggleYear}
        onToggleOwner={toggleOwner}
      />

      <div className="text-[10px] text-s-text3 mb-2">{filtered.length} matchups shown</div>

      <GameLogTable matchups={filtered} />
    </div>
  )
}

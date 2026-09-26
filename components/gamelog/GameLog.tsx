'use client'

import { useMemo, useState } from 'react'
import { useLeague } from '@/context/LeagueContext'
import { USER_ID_TO_OWNER } from '@/lib/constants'
import GameLogFilters from '@/components/gamelog/GameLogFilters'
import GameLogTable from '@/components/gamelog/GameLogTable'
import GameDetailModal from '@/components/gamelog/GameDetailModal'
import type { Matchup } from '@/types'

/**
 * Seasons → Game Log: every completed-season matchup, filterable by year and
 * owner (click to isolate, click again to reset), with a box score on tap.
 * Opens on the most recent season.
 */
export default function GameLog() {
  const { state } = useLeague()
  const { allMatchups, years, ownerSeasons, matchups, leagues } = state

  // null = untouched → the most recent season
  const [pickedYears, setPickedYears] = useState<Set<number> | null>(null)
  const [activeOwners, setActiveOwners] = useState<Set<string>>(new Set())
  const [selectedGame, setSelectedGame] = useState<Matchup | null>(null)

  const latest = years[years.length - 1]
  const activeYears = useMemo(
    () => pickedYears ?? new Set(latest != null ? [latest] : []),
    [pickedYears, latest],
  )

  const ownerNames = useMemo(
    () => [...new Set(Object.values(USER_ID_TO_OWNER))].filter(n => ownerSeasons[n]).sort(),
    [ownerSeasons],
  )

  const filtered = useMemo(() => {
    return allMatchups
      .filter(g => {
        if (!activeYears.has(g.year)) return false
        if (activeOwners.size > 0 && !activeOwners.has(g.team1) && !activeOwners.has(g.team2)) return false
        return true
      })
      .sort((a, b) => b.year - a.year || b.week - a.week)
  }, [allMatchups, activeYears, activeOwners])

  function toggleYear(y: number) {
    setPickedYears(() => (activeYears.size === 1 && activeYears.has(y) ? new Set(years) : new Set([y])))
  }
  function toggleOwner(name: string) {
    setActiveOwners(prev => (prev.size === 1 && prev.has(name) ? new Set<string>() : new Set([name])))
  }

  return (
    <>
      <GameLogFilters
        years={years}
        ownerNames={ownerNames}
        activeYears={activeYears}
        activeOwners={activeOwners}
        onToggleYear={toggleYear}
        onToggleOwner={toggleOwner}
      />
      <div className="mb-2 text-[10px] text-s-text3">{filtered.length} matchups shown</div>
      <GameLogTable matchups={filtered} onClick={setSelectedGame} />
      <GameDetailModal
        triggerGame={selectedGame}
        onClose={() => setSelectedGame(null)}
        rawMatchups={matchups}
        leagues={leagues}
      />
    </>
  )
}

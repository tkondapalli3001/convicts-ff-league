'use client'

import { useMemo, useState } from 'react'
import { useUrlParam } from '@/hooks/useUrlParam'
import { useLeague } from '@/context/LeagueContext'
import { USER_ID_TO_OWNER } from '@/lib/league'
import GameLogFilters from '@/components/seasons/GameLogFilters'
import GameLogTable from '@/components/seasons/GameLogTable'
import GameDetailModal from '@/components/seasons/GameDetailModal'
import type { Matchup } from '@/types'

/**
 * Seasons → Game Log: every completed-season matchup, filterable by year and
 * owner (click to isolate, click again to reset), with a box score on tap.
 * Opens on the most recent season.
 */
export default function GameLog() {
  const { state } = useLeague()
  const { allMatchups, years, ownerSeasons, matchups, leagues } = state

  // '' = the most recent season, 'all' = every season, else one season
  const [yearParam, setYearParam] = useUrlParam('logYear', '')
  const [ownerParam, setOwnerParam] = useUrlParam('owner', '')
  const [selectedGame, setSelectedGame] = useState<Matchup | null>(null)

  const latest = years[years.length - 1]
  const activeYears = useMemo(() => {
    if (yearParam === 'all') return new Set(years)
    const picked = Number(yearParam)
    return new Set(years.includes(picked) ? [picked] : latest != null ? [latest] : [])
  }, [yearParam, years, latest])
  const activeOwners = useMemo(() => new Set(ownerParam ? [ownerParam] : []), [ownerParam])

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
    setYearParam(activeYears.size === 1 && activeYears.has(y) ? 'all' : String(y))
  }
  function toggleOwner(name: string) {
    setOwnerParam(ownerParam === name ? '' : name)
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
        shown={filtered.length}
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

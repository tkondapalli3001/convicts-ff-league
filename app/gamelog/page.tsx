'use client'

import { useState, useMemo, useEffect } from 'react'
import { useLeague } from '@/context/LeagueContext'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import PillTabs from '@/components/shared/PillTabs'
import PageHeader from '@/components/shared/PageHeader'
import GameLogFilters from '@/components/gamelog/GameLogFilters'
import GameLogTable from '@/components/gamelog/GameLogTable'
import GameDetailModal from '@/components/gamelog/GameDetailModal'
import SeasonStandings from '@/components/home/SeasonStandings'
import PlayoffBracket from '@/components/home/PlayoffBracket'
import { USER_ID_TO_OWNER } from '@/lib/constants'
import type { Matchup } from '@/types'

type Tab = 'standings' | 'gamelog'

const TABS: { id: Tab; label: string }[] = [
  { id: 'standings', label: 'Standings' },
  { id: 'gamelog',   label: 'Game Log'  },
]

export default function GameLogPage() {
  const { state } = useLeague()
  const { loaded, error, allMatchups, years, ownerSeasons, matchups: rawMatchups, leagues } = state

  const [activeTab, setActiveTab] = useState<Tab>('standings')

  // Game log filters
  const [activeYears, setActiveYears]   = useState<Set<number>>(new Set())
  const [activeOwners, setActiveOwners] = useState<Set<string>>(new Set())
  const [selectedGame, setSelectedGame] = useState<Matchup | null>(null)

  // Playoff bracket year (driven by standings year selection)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  // Default game log to most recent year once data loads
  useEffect(() => {
    if (years.length) setActiveYears(new Set([years[years.length - 1]]))
  }, [years.length])  // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    return allMatchups
      .filter(g => {
        if (!activeYears.has(g.year)) return false
        if (activeOwners.size > 0) {
          if (!activeOwners.has(g.team1) && !activeOwners.has(g.team2)) return false
        }
        return true
      })
      .sort((a, b) => b.year - a.year || b.week - a.week)
  }, [allMatchups, activeYears, activeOwners])

  if (error) return <ErrorState error={error} />
  if (!loaded) return <LoadingSpinner />

  const canonicalNames = [...new Set(Object.values(USER_ID_TO_OWNER))]
  const ownerNames = canonicalNames.filter(n => ownerSeasons[n]).sort()

  function toggleYear(y: number) {
    setActiveYears(prev => {
      if (prev.size === 1 && prev.has(y)) return new Set(years)
      return new Set([y])
    })
  }
  function toggleOwner(name: string) {
    setActiveOwners(prev => {
      if (prev.size === 1 && prev.has(name)) return new Set<string>()
      return new Set([name])
    })
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Seasons"
        subtitle={`${allMatchups.length} total matchups across ${years.length} seasons`}
      />

      <PillTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {/* ── STANDINGS TAB ─────────────────────────────────────────── */}
      {activeTab === 'standings' && (
        <div className="space-y-4">
          <SeasonStandings onYearChange={setSelectedYear} />
          {selectedYear !== null && <PlayoffBracket year={selectedYear} />}
        </div>
      )}

      {/* ── GAME LOG TAB ──────────────────────────────────────────── */}
      {activeTab === 'gamelog' && (
        <>
          <GameLogFilters
            years={years}
            ownerNames={ownerNames}
            activeYears={activeYears}
            activeOwners={activeOwners}
            onToggleYear={toggleYear}
            onToggleOwner={toggleOwner}
          />
          <div className="text-[10px] text-s-text3 mb-2">{filtered.length} matchups shown</div>
          <GameLogTable matchups={filtered} onClick={setSelectedGame} />
          <GameDetailModal
            triggerGame={selectedGame}
            onClose={() => setSelectedGame(null)}
            rawMatchups={rawMatchups}
            leagues={leagues}
          />
        </>
      )}
    </div>
  )
}

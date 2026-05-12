'use client'

import { useState, useMemo, useEffect } from 'react'
import { useLeague } from '@/context/LeagueContext'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import GameLogFilters from '@/components/gamelog/GameLogFilters'
import GameLogTable from '@/components/gamelog/GameLogTable'
import GameDetailModal from '@/components/gamelog/GameDetailModal'
import SeasonStandings from '@/components/home/SeasonStandings'
import PlayoffBracket from '@/components/home/PlayoffBracket'
import LuckTable from '@/components/luck/LuckTable'
import { computeLuckIndex } from '@/lib/luck'
import { USER_ID_TO_OWNER } from '@/lib/constants'
import type { Matchup } from '@/types'

export default function GameLogPage() {
  const { state } = useLeague()
  const { loaded, error, allMatchups, years, ownerSeasons, matchups: rawMatchups, leagues, rosterUserMaps } = state

  // Game log filters
  const [activeYears, setActiveYears]   = useState<Set<number>>(new Set())
  const [activeOwners, setActiveOwners] = useState<Set<string>>(new Set())
  const [selectedGame, setSelectedGame] = useState<Matchup | null>(null)

  // Season standings collapsible
  const [standingsOpen, setStandingsOpen] = useState(false)
  const [selectedYear, setSelectedYear]   = useState<number | null>(null)

  // Luck index collapsible
  const [luckOpen, setLuckOpen]   = useState(false)
  const [luckYear, setLuckYear]   = useState<number | null>(null)

  // Default game log to most recent year once data loads
  useEffect(() => {
    if (years.length) setActiveYears(new Set([years[years.length - 1]]))
  }, [years.length])  // eslint-disable-line react-hooks/exhaustive-deps

  // Default luck year to most recent
  useEffect(() => {
    if (years.length && luckYear === null) setLuckYear(Math.max(...years))
  }, [years.length])  // eslint-disable-line react-hooks/exhaustive-deps

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

  const activeYear = luckYear ?? Math.max(...years)
  const luckEntries = useMemo(
    () => computeLuckIndex(rawMatchups, rosterUserMaps, ownerSeasons, activeYear),
    [rawMatchups, rosterUserMaps, ownerSeasons, activeYear]
  )

  const sortedYears = [...years].sort((a, b) => b - a)

  return (
    <div className="animate-fade-in">

      {/* ── SEASON-BY-SEASON STANDINGS (collapsible) ─────────────── */}
      <div className="mb-5">
        <button
          onClick={() => setStandingsOpen(o => !o)}
          className="w-full flex items-center justify-between px-5 py-4 bento-card hover:border-s-border2 transition-colors duration-150 text-left"
        >
          <span className="text-[10px] font-bold tracking-[3px] uppercase text-s-text3">
            Season-by-Season Standings
          </span>
          <span
            className="text-s-text3 text-[14px] leading-none transition-transform duration-200"
            style={{ display: 'inline-block', transform: standingsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            ▾
          </span>
        </button>
        {standingsOpen && (
          <div className="mt-3 space-y-3">
            <SeasonStandings onYearChange={setSelectedYear} />
            {selectedYear !== null && <PlayoffBracket year={selectedYear} />}
          </div>
        )}
      </div>

      {/* ── GAME LOG ─────────────────────────────────────────────── */}
      <h1 className="text-[26px] font-extrabold text-s-text mb-1">Seasons</h1>
      <p className="text-[13px] text-s-text3 mb-6">
        {allMatchups.length} total matchups · Click any row to see lineup details
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

      <GameLogTable matchups={filtered} onClick={setSelectedGame} />

      <GameDetailModal
        triggerGame={selectedGame}
        onClose={() => setSelectedGame(null)}
        rawMatchups={rawMatchups}
        leagues={leagues}
      />

      {/* ── LUCK INDEX (collapsible) ──────────────────────────────── */}
      <div className="mt-6">
        <button
          onClick={() => setLuckOpen(o => !o)}
          className="w-full flex items-center justify-between px-5 py-4 bento-card hover:border-s-border2 transition-colors duration-150 text-left"
        >
          <span className="text-[10px] font-bold tracking-[3px] uppercase text-s-text3">
            Luck Index · All-Play Expected vs Actual Wins
          </span>
          <span
            className="text-s-text3 text-[14px] leading-none transition-transform duration-200"
            style={{ display: 'inline-block', transform: luckOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            ▾
          </span>
        </button>
        {luckOpen && (
          <div className="mt-3">
            <div className="flex gap-[6px] flex-wrap mb-4 px-1">
              {sortedYears.map(y => (
                <button
                  key={y}
                  onClick={() => setLuckYear(y)}
                  className={[
                    'px-3 py-[5px] rounded-full border text-[11px] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap',
                    activeYear === y
                      ? 'bg-[#1a2e4a] border-s-blue text-[#93c5fd]'
                      : 'bg-s-bg3 border-s-border text-s-text3 hover:border-s-border2 hover:text-s-text2',
                  ].join(' ')}
                >
                  {y}
                </button>
              ))}
            </div>
            <LuckTable entries={luckEntries} year={activeYear} />
          </div>
        )}
      </div>
    </div>
  )
}

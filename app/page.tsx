'use client'

import { useState } from 'react'
import { useLeague } from '@/context/LeagueContext'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import TrophySection from '@/components/home/TrophySection'
import SeasonStandings from '@/components/home/SeasonStandings'
import PlayoffBracket from '@/components/home/PlayoffBracket'
import CareerLeaderboard from '@/components/owners/CareerLeaderboard'

export default function HomePage() {
  const { state } = useLeague()
  const { loaded, error } = state
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [standingsOpen, setStandingsOpen] = useState(false)

  if (error) return <ErrorState error={error} />
  if (!loaded) return <LoadingSpinner />

  return (
    <div className="animate-fade-in">
      <h1 className="text-[26px] font-extrabold text-s-text mb-1">MC Fantasy Football League</h1>
      <p className="text-[13px] text-s-text2 mb-6">
        {state.leagueChain.length} Seasons · {state.years[0]}–{state.years[state.years.length - 1]} · 12 Managers · Live from Sleeper API
      </p>

      <TrophySection />

      {/* All-Time Standings — primary default view */}
      <div className="mb-4">
        <CareerLeaderboard />
      </div>

      {/* Season Standings — collapsible dropdown */}
      <div className="mb-4">
        <button
          onClick={() => setStandingsOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 bg-s-bg2 border border-s-border rounded-[12px] text-left hover:border-s-border2 transition-colors duration-150"
        >
          <span className="text-[11px] font-bold tracking-[2px] uppercase text-s-text2">
            Season-by-Season Standings
          </span>
          <span className="text-s-text3 text-[14px] leading-none transition-transform duration-200" style={{ display: 'inline-block', transform: standingsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▾
          </span>
        </button>

        {standingsOpen && (
          <div className="mt-2">
            <SeasonStandings onYearChange={setSelectedYear} />
            {selectedYear !== null && (
              <div className="mt-4">
                <PlayoffBracket year={selectedYear} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

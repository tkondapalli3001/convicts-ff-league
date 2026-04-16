'use client'

import { useState } from 'react'
import { useLeague } from '@/context/LeagueContext'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import TrophySection from '@/components/home/TrophySection'
import SeasonStandings from '@/components/home/SeasonStandings'
import PlayoffBracket from '@/components/home/PlayoffBracket'

export default function HomePage() {
  const { state } = useLeague()
  const { loaded, error } = state
  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  if (error) return <ErrorState error={error} />
  if (!loaded) return <LoadingSpinner />

  return (
    <div className="animate-fade-in">
      <h1 className="text-[26px] font-extrabold text-s-text mb-1">MC Fantasy Football League</h1>
      <p className="text-[13px] text-s-text3 mb-6">
        {state.leagueChain.length} Seasons · {state.years[0]}–{state.years[state.years.length - 1]} · 12 Managers · Live from Sleeper API
      </p>

      <TrophySection />
      <SeasonStandings onYearChange={setSelectedYear} />
      {selectedYear !== null && (
        <PlayoffBracket year={selectedYear} />
      )}
    </div>
  )
}

'use client'

import { useLeague } from '@/context/LeagueContext'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import QuickStats from '@/components/home/QuickStats'
import TrophySection from '@/components/home/TrophySection'
import SeasonStandings from '@/components/home/SeasonStandings'

export default function HomePage() {
  const { state } = useLeague()
  const { loaded, error } = state

  if (error) return <ErrorState error={error} />
  if (!loaded) return <LoadingSpinner />

  return (
    <div className="animate-fade-in">
      <h1 className="text-[26px] font-extrabold text-s-text mb-1">MC Fantasy Football League</h1>
      <p className="text-[13px] text-s-text3 mb-6">
        {state.leagueChain.length} Seasons · {state.years[0]}–{state.years[state.years.length - 1]} · 12 Managers · Live from Sleeper API
      </p>

      <QuickStats />
      <TrophySection />
      <SeasonStandings />
    </div>
  )
}

'use client'

import { useLeague } from '@/context/LeagueContext'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import SeasonStandings from '@/components/home/SeasonStandings'
import AvgScoreChart from '@/components/trends/AvgScoreChart'

export default function SeasonsPage() {
  const { state } = useLeague()
  const { loaded, error } = state

  if (error) return <ErrorState error={error} />
  if (!loaded) return <LoadingSpinner />

  return (
    <div className="animate-fade-in">
      <h1 className="text-[26px] font-extrabold text-s-text mb-1">Seasons</h1>
      <p className="text-[13px] text-s-text2 mb-6">Year-by-year standings and scoring trends</p>
      <SeasonStandings />
      <div className="mt-6">
        <AvgScoreChart />
      </div>
    </div>
  )
}

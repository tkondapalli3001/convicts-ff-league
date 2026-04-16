'use client'

import { useLeague } from '@/context/LeagueContext'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import FinishTracker from '@/components/trends/FinishTracker'
import AvgScoreChart from '@/components/trends/AvgScoreChart'
import TrashTalkCard from '@/components/trends/TrashTalkCard'
import { TRASH_TALK } from '@/lib/constants'

export default function TrendsPage() {
  const { state } = useLeague()
  const { loaded, error } = state

  if (error) return <ErrorState error={error} />
  if (!loaded) return <LoadingSpinner />

  return (
    <div className="animate-fade-in">
      <h1 className="text-[26px] font-extrabold text-s-text mb-1">Trends & Trash Talk</h1>
      <p className="text-[13px] text-s-text3 mb-6">Year-over-year performance tracker + roast material</p>

      <FinishTracker />
      <AvgScoreChart />

      <div className="text-[10px] font-bold tracking-[3px] uppercase text-s-text3 mb-3">🔥 Trash Talk Corner</div>
      {TRASH_TALK.map(t => (
        <TrashTalkCard key={t.owner} {...t} />
      ))}
    </div>
  )
}

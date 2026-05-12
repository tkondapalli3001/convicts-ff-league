'use client'

import { useLeague } from '@/context/LeagueContext'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import CareerLeaderboard from '@/components/owners/CareerLeaderboard'
import RivalryCalc from '@/components/records/RivalryCalc'

export default function OwnersPage() {
  const { state } = useLeague()
  const { loaded, error } = state

  if (error) return <ErrorState error={error} />
  if (!loaded) return <LoadingSpinner />

  return (
    <div className="animate-fade-in">
      <h1 className="text-[26px] font-extrabold text-s-text mb-1">Owner Profiles</h1>
      <p className="text-[13px] text-s-text3 mb-6">Click any row to drill into career stats, H2H records & game log</p>
      <CareerLeaderboard />
      <div className="text-[10px] font-bold tracking-[3px] uppercase text-s-text3 mt-8 mb-2">⚔️ Head-to-Head Rivalry</div>
      <RivalryCalc />
    </div>
  )
}

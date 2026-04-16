'use client'

import { useMemo } from 'react'
import { useLeague } from '@/context/LeagueContext'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import LuckTable from '@/components/luck/LuckTable'
import { computeLuckIndex } from '@/lib/luck'

export default function LuckPage() {
  const { state } = useLeague()
  const { loaded, error, matchups, rosterUserMaps, ownerSeasons, years } = state

  if (error) return <ErrorState error={error} />
  if (!loaded) return <LoadingSpinner />

  const entries = useMemo(
    () => computeLuckIndex(matchups, rosterUserMaps, ownerSeasons),
    [matchups, rosterUserMaps, ownerSeasons]
  )

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6 animate-fade-in">
      <h1 className="text-[26px] font-extrabold text-s-text mb-1">Luck Index</h1>
      <p className="text-[13px] text-s-text3 mb-6">
        All-play expected wins vs actual wins across {years.length} seasons — who got robbed?
      </p>
      <LuckTable entries={entries} />
    </div>
  )
}

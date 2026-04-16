'use client'

import { useLeague } from '@/context/LeagueContext'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import OwnerCard from '@/components/owners/OwnerCard'
import CareerLeaderboard from '@/components/owners/CareerLeaderboard'
import { USER_ID_TO_OWNER } from '@/lib/constants'

export default function OwnersPage() {
  const { state } = useLeague()
  const { loaded, error, ownerSeasons } = state

  if (error) return <ErrorState error={error} />
  if (!loaded) return <LoadingSpinner />

  const canonicalNames = [...new Set(Object.values(USER_ID_TO_OWNER))]
  const names = canonicalNames.filter(n => ownerSeasons[n]).sort()

  return (
    <div className="animate-fade-in">
      <h1 className="text-[26px] font-extrabold text-s-text mb-1">Owner Profiles</h1>
      <p className="text-[13px] text-s-text3 mb-6">Click any card to drill into career stats, H2H records & game log</p>

      {/* Owner cards grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-[10px] mb-5">
        {names.map(name => (
          <OwnerCard key={name} name={name} seasons={ownerSeasons[name] || []} />
        ))}
      </div>

      {/* Career leaderboard */}
      <CareerLeaderboard />
    </div>
  )
}

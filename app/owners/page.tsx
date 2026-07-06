'use client'

import { useState } from 'react'
import { useLeague } from '@/context/LeagueContext'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import PillTabs from '@/components/shared/PillTabs'
import PageHeader from '@/components/shared/PageHeader'
import CareerLeaderboard from '@/components/owners/CareerLeaderboard'
import AnnualBreakdown from '@/components/earnings/AnnualBreakdown'
import RivalryCalc from '@/components/records/RivalryCalc'

type Tab = 'leaderboard' | 'earnings' | 'h2h'

const TABS: { id: Tab; label: string }[] = [
  { id: 'leaderboard', label: 'Career Leaderboard' },
  { id: 'earnings',    label: 'Earnings Ledger'    },
  { id: 'h2h',         label: 'Head-to-Head'       },
]

export default function OwnersPage() {
  const { state } = useLeague()
  const { loaded, error } = state
  const [activeTab, setActiveTab] = useState<Tab>('leaderboard')

  if (error) return <ErrorState error={error} />
  if (!loaded) return <LoadingSpinner />

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Owner Profiles"
        subtitle="Click any row to drill into career stats, H2H records & game log"
      />

      <PillTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'leaderboard' && <CareerLeaderboard />}
      {activeTab === 'earnings' && <AnnualBreakdown />}
      {activeTab === 'h2h' && <RivalryCalc />}
    </div>
  )
}

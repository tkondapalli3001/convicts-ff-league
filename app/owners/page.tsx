'use client'

import { useState } from 'react'
import { useLeague } from '@/context/LeagueContext'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import CareerLeaderboard from '@/components/owners/CareerLeaderboard'
import RivalryCalc from '@/components/records/RivalryCalc'

type Tab = 'leaderboard' | 'h2h'

const TABS: { id: Tab; label: string }[] = [
  { id: 'leaderboard', label: 'Career Leaderboard' },
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
      <h1 className="text-[26px] font-extrabold text-s-text mb-1">Owner Profiles</h1>
      <p className="text-[13px] text-s-text3 mb-5">Click any row to drill into career stats, H2H records & game log</p>

      {/* Tab nav */}
      <div className="flex gap-[6px] mb-5 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              'px-4 py-[7px] rounded-[8px] border text-[12px] font-bold transition-all duration-150 cursor-pointer',
              activeTab === tab.id
                ? 'bg-s-gold text-[#000] border-s-gold'
                : 'bg-s-bg2 border-s-border text-s-text2 hover:border-s-border2 hover:text-s-text',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'leaderboard' && <CareerLeaderboard />}
      {activeTab === 'h2h' && <RivalryCalc />}
    </div>
  )
}

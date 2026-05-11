'use client'

import { useState } from 'react'
import { useLeague } from '@/context/LeagueContext'
import { usePlayersData } from '@/hooks/usePlayersData'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import PlayerWinRateTable from '@/components/players/PlayerWinRateTable'
import PlayerOwnershipTable from '@/components/players/PlayerOwnershipTable'
import DraftStructureTable from '@/components/players/DraftStructureTable'

type Tab = 'winrate' | 'ownership' | 'strategy'

const TABS: { id: Tab; label: string }[] = [
  { id: 'winrate',   label: 'Win Rate' },
  { id: 'ownership', label: 'Draft Ownership' },
  { id: 'strategy',  label: 'Draft Strategy' },
]

export default function PlayersPage() {
  const { state } = useLeague()
  const { loaded, error } = state
  const { playerWinRates, ownership, draftStructure, loading, loadingText, error: dataError } = usePlayersData()
  const [activeTab, setActiveTab] = useState<Tab>('winrate')

  if (error) return <ErrorState error={error} />
  if (!loaded) return <LoadingSpinner />

  return (
    <div className="animate-fade-in">
      <h1 className="text-[26px] font-extrabold text-s-text mb-1">Players</h1>
      <p className="text-[13px] text-s-text2 mb-6">
        Player performance and draft tendencies across all seasons
      </p>

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

      {/* Loading state for draft data */}
      {loading && (
        <div className="flex items-center gap-3 px-4 py-3 bg-s-bg2 border border-s-border rounded-[10px] mb-4 text-[12px] text-s-text2">
          <div className="w-4 h-4 border-2 border-s-border2 border-t-s-gold rounded-full animate-spin flex-shrink-0" />
          {loadingText}
        </div>
      )}

      {dataError && (
        <div className="px-4 py-3 bg-[#220000] border border-[#5a0000] rounded-[10px] mb-4 text-[12px] text-s-red">
          Failed to load draft data: {dataError}
        </div>
      )}

      {activeTab === 'winrate' && (
        <PlayerWinRateTable players={playerWinRates} minGames={5} />
      )}

      {activeTab === 'ownership' && (
        loading && !ownership.length
          ? <div className="text-s-text3 text-[12px] text-center py-12">Loading draft picks…</div>
          : <PlayerOwnershipTable ownership={ownership} />
      )}

      {activeTab === 'strategy' && (
        loading && !draftStructure.length
          ? <div className="text-s-text3 text-[12px] text-center py-12">Loading draft picks…</div>
          : <DraftStructureTable data={draftStructure} />
      )}
    </div>
  )
}

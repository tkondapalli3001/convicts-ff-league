'use client'

import { useState, useMemo, useEffect } from 'react'
import { useLeague } from '@/context/LeagueContext'
import { usePlayersData } from '@/hooks/usePlayersData'
import { useTransactionsData } from '@/hooks/useTransactionsData'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import PlayerWinRateTable from '@/components/players/PlayerWinRateTable'
import PlayerOwnershipTable from '@/components/players/PlayerOwnershipTable'
import DraftStructureTable from '@/components/players/DraftStructureTable'
import TransactionFilters from '@/components/transactions/TransactionFilters'
import TransactionTable from '@/components/transactions/TransactionTable'
import TransactionDetailModal from '@/components/transactions/TransactionDetailModal'
import TradesByYearChart from '@/components/players/TradesByYearChart'
import { USER_ID_TO_OWNER } from '@/lib/constants'
import type { EnrichedTransaction } from '@/hooks/useTransactionsData'
import type { Transaction } from '@/types'

type Tab = 'winrate' | 'ownership' | 'strategy' | 'transactions'

const TABS: { id: Tab; label: string }[] = [
  { id: 'winrate',      label: 'Win Rate'        },
  { id: 'ownership',   label: 'Draft Ownership'  },
  { id: 'strategy',    label: 'Draft Strategy'   },
  { id: 'transactions', label: 'Transactions'    },
]

export default function PlayersPage() {
  const { state } = useLeague()
  const { loaded, error, years, ownerSeasons } = state
  const { playerWinRates, ownership, draftStructure, loading, loadingText, error: dataError } = usePlayersData()
  const { transactions, loading: txLoading, loadingText: txLoadingText, error: txError } = useTransactionsData()
  const [activeTab, setActiveTab] = useState<Tab>('winrate')

  // Transactions state
  const [activeYears, setActiveYears]   = useState<Set<number>>(new Set())
  const [activeOwners, setActiveOwners] = useState<Set<string>>(new Set())
  const [activeTypes, setActiveTypes]   = useState<Set<Transaction['type']>>(new Set(['trade', 'waiver', 'free_agent']))
  const [selectedTx, setSelectedTx]     = useState<EnrichedTransaction | null>(null)

  useEffect(() => {
    if (years.length) setActiveYears(new Set(years))
  }, [years.length]) // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <ErrorState error={error} />
  if (!loaded) return <LoadingSpinner />

  const canonicalNames = [...new Set(Object.values(USER_ID_TO_OWNER))]
  const ownerNames = canonicalNames.filter(n => ownerSeasons[n]).sort()

  function toggleYear(y: number) {
    setActiveYears(prev => {
      const next = new Set(prev)
      if (next.has(y)) { if (next.size > 1) next.delete(y) }
      else next.add(y)
      return next
    })
  }
  function toggleOwner(name: string) {
    setActiveOwners(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }
  function toggleType(t: Transaction['type']) {
    setActiveTypes(prev => {
      const next = new Set(prev)
      if (next.has(t)) {
        if (next.size === 1) return prev
        next.delete(t)
      } else {
        next.add(t)
      }
      return next
    })
  }

  const filteredTx = useMemo(() => {
    return transactions.filter(tx => {
      if (!activeYears.has(tx.year)) return false
      if (!activeTypes.has(tx.type)) return false
      if (activeOwners.size > 0) {
        const matches = tx.ownerNames.some(n => activeOwners.has(n))
        if (!matches) return false
      }
      return true
    })
  }, [transactions, activeYears, activeOwners, activeTypes])

  const tradeCount  = filteredTx.filter(t => t.type === 'trade').length
  const waiverCount = filteredTx.filter(t => t.type === 'waiver' || t.type === 'free_agent').length

  return (
    <div className="animate-fade-in">
      <h1 className="text-[26px] font-extrabold text-s-text mb-1">Players</h1>
      <p className="text-[13px] text-s-text2 mb-6">
        Player performance, draft tendencies, and transactions across all seasons
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

      {/* Loading state for draft/player data */}
      {activeTab !== 'transactions' && loading && (
        <div className="flex items-center gap-3 px-4 py-3 bg-s-bg2 border border-s-border rounded-[10px] mb-4 text-[12px] text-s-text2">
          <div className="w-4 h-4 border-2 border-s-border2 border-t-s-gold rounded-full animate-spin flex-shrink-0" />
          {loadingText}
        </div>
      )}
      {activeTab !== 'transactions' && dataError && (
        <div className="px-4 py-3 bg-[#220000] border border-[#5a0000] rounded-[10px] mb-4 text-[12px] text-s-red">
          Failed to load draft data: {dataError}
        </div>
      )}

      {activeTab === 'winrate' && (
        <PlayerWinRateTable players={playerWinRates} />
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

      {activeTab === 'transactions' && (
        <div>
          {txLoading && (
            <div className="flex items-center gap-3 px-4 py-3 bg-s-bg2 border border-s-border rounded-[10px] mb-4 text-[12px] text-s-text2">
              <div className="w-4 h-4 border-2 border-s-border2 border-t-s-gold rounded-full animate-spin flex-shrink-0" />
              {txLoadingText}
            </div>
          )}
          {txError && (
            <div className="px-4 py-3 bg-[#220000] border border-[#5a0000] rounded-[10px] mb-4 text-[12px] text-s-red">
              Failed to load transactions: {txError}
            </div>
          )}
          <TransactionFilters
            years={years}
            owners={ownerNames}
            activeYears={activeYears}
            activeOwners={activeOwners}
            activeTypes={activeTypes}
            onToggleYear={toggleYear}
            onToggleOwner={toggleOwner}
            onToggleType={toggleType}
          />
          {!txLoading && (
            <TradesByYearChart
              transactions={transactions}
              activeYears={activeYears}
              activeOwners={activeOwners}
              years={years}
            />
          )}
          <div className="text-[10px] text-s-text3 mb-2">
            {filteredTx.length} transactions · {tradeCount} trades · {waiverCount} waiver/FA moves
          </div>
          <TransactionTable transactions={filteredTx} onClick={setSelectedTx} />
          <TransactionDetailModal tx={selectedTx} onClose={() => setSelectedTx(null)} />
        </div>
      )}
    </div>
  )
}

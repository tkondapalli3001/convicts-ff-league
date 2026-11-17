'use client'

import { useUrlParam } from '@/hooks/useUrlParam'
import { useState, useMemo, useEffect } from 'react'
import { useLeague } from '@/context/LeagueContext'
import { usePlayersData } from '@/hooks/usePlayersData'
import { useTransactionsData } from '@/hooks/useTransactionsData'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import PillTabs from '@/components/shared/PillTabs'
import PageHeader from '@/components/shared/PageHeader'
import PlayerWinRateTable from '@/components/players/PlayerWinRateTable'
import PlayerScoringTable, { type BakedScoring } from '@/components/players/PlayerScoringTable'
import PlayerOwnershipTable from '@/components/players/PlayerOwnershipTable'
import PlayerCardModal from '@/components/players/PlayerCardModal'
import TransactionFilters from '@/components/transactions/TransactionFilters'
import TransactionTable from '@/components/transactions/TransactionTable'
import TransactionDetailModal from '@/components/transactions/TransactionDetailModal'
import TradesByYearChart from '@/components/players/TradesByYearChart'
import MostTradedPlayersTable from '@/components/players/MostTradedPlayersTable'
import { playerPageOwners } from '@/lib/data-processing'
import type { EnrichedTransaction, PlayerStat } from '@/types'
import type { TxTypeFilter } from '@/components/transactions/TransactionFilters'

type Tab = 'winrate' | 'scoring' | 'ownership' | 'transactions'

const TABS: { id: Tab; label: string }[] = [
  { id: 'scoring',      label: 'Scoring'         },
  { id: 'winrate',      label: 'Win Rate'        },
  { id: 'ownership',   label: 'Draft Ownership'  },
  { id: 'transactions', label: 'Transactions'    },
]
const TAB_IDS = TABS.map(t => t.id)

/** Scoring's opening view worked out from the snapshot at build time (app/players/page.tsx), so the tab is in the HTML. */
export interface BuiltScoring {
  years: number[]
  ownerNames: string[]
  scoring: BakedScoring
}

export default function PlayersPage({ built }: { built: BuiltScoring | null }) {
  const { state } = useLeague()
  const { loaded, error, ownerSeasons } = state
  const { playerWinRates, ownership, playerScores, loading, loadingText, error: dataError } = usePlayersData()
  const [activeTab, setActiveTab] = useUrlParam<Tab>('tab', 'scoring', TAB_IDS)
  // Transactions download only once their tab is opened (then stay cached)
  const { transactions, years: txYears, loading: txLoading, loadingText: txLoadingText, error: txError } = useTransactionsData(activeTab === 'transactions')

  // Player card modal (lifted to page level so fixed positioning works)
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerStat | null>(null)

  // Transactions state
  const [activeYears, setActiveYears]   = useState<Set<number>>(new Set())
  const [activeOwners, setActiveOwners] = useState<Set<string>>(new Set())
  const [activeTypes, setActiveTypes]   = useState<Set<TxTypeFilter>>(new Set(['trade', 'waivers']))
  const [selectedTx, setSelectedTx]     = useState<EnrichedTransaction | null>(null)

  // Opens on the latest season, like Standings and the Game Log; one tap shows every year
  useEffect(() => {
    if (txYears.length) setActiveYears(new Set([txYears[txYears.length - 1]]))
  }, [txYears.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const filteredTx = useMemo(() => {
    return transactions.filter(tx => {
      if (!activeYears.has(tx.year)) return false
      const txCategory: TxTypeFilter = tx.type === 'trade' ? 'trade' : 'waivers'
      if (!activeTypes.has(txCategory)) return false
      if (activeOwners.size > 0) {
        const matches = tx.ownerNames.some(n => activeOwners.has(n))
        if (!matches) return false
      }
      return true
    })
  }, [transactions, activeYears, activeOwners, activeTypes])

  if (error) return <ErrorState error={error} />

  // The title and tabs paint at once; only what's under them waits for data
  const shell = (
    <>
      <PageHeader
        kicker="The Player Database"
        title="Players"
        subtitle="Player performance, draft tendencies, and transactions across all seasons"
      />
      <PillTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
    </>
  )
  // Scoring's opening view is baked into the HTML from the build; every other tab waits on the spinner
  if (!loaded && !(built && activeTab === 'scoring')) return <div className="animate-fade-in">{shell}<LoadingSpinner /></div>

  const years = loaded ? state.years : built?.years ?? []
  const ownerNames = loaded ? playerPageOwners(ownerSeasons) : built?.ownerNames ?? []

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
  function toggleType(t: TxTypeFilter) {
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

  const tradeCount  = filteredTx.filter(t => t.type === 'trade').length
  const waiverCount = filteredTx.filter(t => t.type === 'waiver' || t.type === 'free_agent').length

  return (
    <div className="animate-fade-in">
      {shell}

      {/* A loading note takes the table's place rather than sitting above it, so nothing jumps when the data lands */}
      {activeTab !== 'transactions' && activeTab !== 'scoring' && dataError && (
        <div className="px-4 py-3 bg-[#220000] border border-[rgba(180,99,107,0.3)] rounded-[6px] mb-4 text-[12px] text-s-red">
          Failed to load draft data: {dataError}
        </div>
      )}

      {activeTab === 'winrate' && (
        loading && !playerWinRates.length
          ? <div className="flex items-center gap-3 px-4 py-3 gl rounded-[6px] mb-4 text-[12px] text-s-text2">
              <div className="w-4 h-4 border-2 border-s-border2 border-t-s-gold rounded-full animate-spin flex-shrink-0" />
              {loadingText}
            </div>
          : <PlayerWinRateTable players={playerWinRates} onPlayerClick={setSelectedPlayer} />
      )}
      {/* Same elements before and after the load (only their values update), so nothing repaints.
          data-baked lets a deep link hide this until the page takes over (globals.css). */}
      {activeTab === 'scoring' && (
        playerScores.length === 0 && !built
          ? <div className="text-s-text3 text-[12px] text-center py-12">Loading scoring data…</div>
          : (
            <div data-baked={loaded ? undefined : ''}>
              <PlayerScoringTable playerScores={playerScores.length ? playerScores : null} baked={built?.scoring} years={years} ownerNames={ownerNames} />
            </div>
          )
      )}
      {!loaded && <div data-baked-fallback><LoadingSpinner /></div>}
      {activeTab === 'ownership' && (
        loading && !ownership.length
          ? <div className="text-s-text3 text-[12px] text-center py-12">{loadingText || 'Loading draft picks…'}</div>
          : <PlayerOwnershipTable ownership={ownership} />
      )}
      {activeTab === 'transactions' && (
        <div>
          {txError && (
            <div className="px-4 py-3 bg-[#220000] border border-[rgba(180,99,107,0.3)] rounded-[6px] mb-4 text-[12px] text-s-red">
              Failed to load transactions: {txError}
            </div>
          )}
          <TransactionFilters
            years={txYears}
            owners={ownerNames}
            activeYears={activeYears}
            activeOwners={activeOwners}
            activeTypes={activeTypes}
            onToggleYear={toggleYear}
            onToggleOwner={toggleOwner}
            onToggleType={toggleType}
            onAllYears={() => setActiveYears(new Set(txYears))}
            shown={filteredTx.length}
          />
          {/* Under the filters, in the chart's place: the filters don't move when the moves arrive */}
          {txLoading && (
            <div className="flex items-center gap-3 px-4 py-3 gl rounded-[6px] mb-4 text-[12px] text-s-text2">
              <div className="w-4 h-4 border-2 border-s-border2 border-t-s-gold rounded-full animate-spin flex-shrink-0" />
              {txLoadingText}
            </div>
          )}
          {!txLoading && (
            <TradesByYearChart
              transactions={transactions}
              activeYears={activeYears}
              activeOwners={activeOwners}
              years={txYears}
            />
          )}
          {!txLoading && (
            <MostTradedPlayersTable
              transactions={transactions}
              playerWinRates={playerWinRates}
            />
          )}
          {!txLoading && (
            <>
              <div className="text-[10px] text-s-text3 mb-2">
                {filteredTx.length} transactions · {tradeCount} trades · {waiverCount} waiver moves
              </div>
              <TransactionTable transactions={filteredTx} onClick={setSelectedTx} />
            </>
          )}
          <TransactionDetailModal tx={selectedTx} onClose={() => setSelectedTx(null)} />
        </div>
      )}

      {/* Player card modal rendered at page root so fixed positioning works correctly */}
      {selectedPlayer && (
        <PlayerCardModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  )
}

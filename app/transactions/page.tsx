'use client'

import { useState, useMemo, useEffect } from 'react'
import { useLeague } from '@/context/LeagueContext'
import { useTransactionsData, type EnrichedTransaction } from '@/hooks/useTransactionsData'
import { USER_ID_TO_OWNER } from '@/lib/constants'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import TransactionFilters from '@/components/transactions/TransactionFilters'
import TransactionTable from '@/components/transactions/TransactionTable'
import TransactionDetailModal from '@/components/transactions/TransactionDetailModal'
import type { TxTypeFilter } from '@/components/transactions/TransactionFilters'

export default function TransactionsPage() {
  const { state } = useLeague()
  const { loaded, error, years, ownerSeasons } = state
  const { transactions, loading, loadingText, error: dataError } = useTransactionsData()

  const [activeYears, setActiveYears] = useState<Set<number>>(new Set())
  const [activeOwners, setActiveOwners] = useState<Set<string>>(new Set())
  const [activeTypes, setActiveTypes] = useState<Set<TxTypeFilter>>(new Set(['trade', 'waivers']))
  const [selectedTx, setSelectedTx] = useState<EnrichedTransaction | null>(null)

  useEffect(() => {
    if (years.length) setActiveYears(new Set(years))
  }, [years.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
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
  if (!loaded) return <LoadingSpinner />

  const canonicalNames = [...new Set(Object.values(USER_ID_TO_OWNER))]
  const ownerNames = canonicalNames.filter(n => ownerSeasons[n]).sort()

  function toggleYear(y: number) {
    setActiveYears(prev => {
      if (prev.size === 1 && prev.has(y)) return new Set(years)
      return new Set([y])
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

  const tradeCount = filtered.filter(t => t.type === 'trade').length
  const waiverCount = filtered.filter(t => t.type === 'waiver' || t.type === 'free_agent').length

  return (
    <div className="animate-fade-in">
      <h1 className="text-[26px] font-extrabold text-s-text mb-1">Transactions</h1>
      <p className="text-[13px] text-s-text2 mb-6">
        All trades, waiver claims, and free agent signings across all seasons
      </p>

      {/* Loading progress */}
      {loading && (
        <div className="flex items-center gap-3 px-4 py-3 gl rounded-[10px] mb-4 text-[12px] text-s-text2">
          <div className="w-4 h-4 border-2 border-s-border2 border-t-s-gold rounded-full animate-spin flex-shrink-0" />
          {loadingText}
        </div>
      )}

      {dataError && (
        <div className="px-4 py-3 bg-[#220000] border border-[#5a0000] rounded-[10px] mb-4 text-[12px] text-s-red">
          Failed to load transactions: {dataError}
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

      <div className="text-[10px] text-s-text3 mb-2">
        {filtered.length} transactions · {tradeCount} trades · {waiverCount} waiver/FA moves
      </div>

      <TransactionTable transactions={filtered} onClick={setSelectedTx} />

      <TransactionDetailModal tx={selectedTx} onClose={() => setSelectedTx(null)} />
    </div>
  )
}

'use client'

import { useMemo, useState } from 'react'
import TransactionFilters, { type TxTypeFilter } from '@/components/transactions/TransactionFilters'
import TransactionTable from '@/components/transactions/TransactionTable'
import TransactionDetailModal from '@/components/transactions/TransactionDetailModal'
import type { EnrichedTransaction } from '@/hooks/useTransactionsData'
import type { SeasonTransactions as Data } from '@/hooks/useSeasonTransactions'

const NO_YEARS: number[] = []
const NO_ACTIVE_YEARS = new Set<number>()

function plural(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? '' : 's'}`
}

/** 2026 → Transactions: every move this season, filterable by type and manager. */
export default function SeasonTransactions({ data }: { data: Data }) {
  const { transactions, owners, loading, failedWeeks } = data
  const [types, setTypes] = useState<Set<TxTypeFilter>>(new Set(['trade', 'waivers']))
  const [activeOwners, setActiveOwners] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<EnrichedTransaction | null>(null)

  const filtered = useMemo(() => transactions.filter(tx => {
    if (!types.has(tx.type === 'trade' ? 'trade' : 'waivers')) return false
    return activeOwners.size === 0 || tx.ownerNames.some(n => activeOwners.has(n))
  }), [transactions, types, activeOwners])

  function toggleType(t: TxTypeFilter) {
    setTypes(prev => {
      if (prev.has(t) && prev.size === 1) return prev // keep at least one type on
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
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

  const trades = filtered.filter(t => t.type === 'trade').length

  return (
    <div>
      <TransactionFilters
        years={NO_YEARS}
        owners={owners}
        activeYears={NO_ACTIVE_YEARS}
        activeOwners={activeOwners}
        activeTypes={types}
        onToggleYear={() => {}}
        onToggleOwner={toggleOwner}
        onToggleType={toggleType}
      />

      {loading && !transactions.length ? (
        <div className="gl mb-4 flex items-center gap-3 rounded-[6px] px-4 py-3 text-[12px] text-s-text2">
          <div className="h-4 w-4 flex-shrink-0 animate-spin rounded-full border-2 border-s-border2 border-t-s-gold" />
          Loading this season&apos;s moves…
        </div>
      ) : (
        <>
          <div className="mb-2 text-[11px] text-s-text3">
            {plural(filtered.length, 'move')} · {plural(trades, 'trade')} · {plural(filtered.length - trades, 'waiver move')}
          </div>
          <TransactionTable transactions={filtered} onClick={setSelected} />
          {failedWeeks.length > 0 && (
            <p className="mt-2 text-[11px] text-s-text3">
              Sleeper didn&apos;t answer for week{failedWeeks.length > 1 ? 's' : ''} {failedWeeks.join(', ')} — those moves will show on the next visit.
            </p>
          )}
        </>
      )}
      <TransactionDetailModal tx={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

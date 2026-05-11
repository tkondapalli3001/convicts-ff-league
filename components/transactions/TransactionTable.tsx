'use client'

import type { EnrichedTransaction } from '@/hooks/useTransactionsData'

const TYPE_BADGE: Record<string, { label: string; className: string }> = {
  trade:      { label: 'TRADE',  className: 'bg-[#1a2e4a] border-s-blue text-[#93c5fd]' },
  waiver:     { label: 'WAV',    className: 'bg-[#1a2010] border-s-green text-[#86efac]' },
  free_agent: { label: 'FA',     className: 'bg-s-bg4 border-s-border text-s-text2' },
}

interface Props {
  transactions: EnrichedTransaction[]
  onClick: (tx: EnrichedTransaction) => void
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function txSummary(tx: EnrichedTransaction): string {
  if (tx.type === 'trade') {
    return `Trade between ${tx.ownerNames.join(' & ')}`
  }
  const added = tx.addedPlayers.map(p => p.name).slice(0, 2).join(', ')
  const owner = tx.ownerNames[0] ?? '?'
  if (tx.type === 'waiver') {
    const bid = tx.settings?.waiver_bid
    return `${owner} claimed ${added || '—'}${bid ? ` ($${bid})` : ''}`
  }
  return `${owner} signed ${added || '—'}`
}

export default function TransactionTable({ transactions, onClick }: Props) {
  if (!transactions.length) {
    return (
      <div className="text-center py-10 text-s-text3 text-[12px]">No transactions match your filters</div>
    )
  }

  return (
    <div className="bg-s-bg2 border border-s-border rounded-[12px] overflow-hidden">
      <div className="max-h-[600px] overflow-y-auto">
        {transactions.map(tx => {
          const badge = TYPE_BADGE[tx.type] ?? TYPE_BADGE.free_agent
          return (
            <div
              key={tx.transaction_id}
              className="flex items-center gap-3 px-3 py-[10px] border-b border-s-bg3 cursor-pointer hover:bg-[#0f172a] transition-colors"
              onClick={() => onClick(tx)}
            >
              {/* Type badge */}
              <span className={`inline-block px-[7px] py-[2px] rounded-full text-[10px] font-bold border flex-shrink-0 ${badge.className}`}>
                {badge.label}
              </span>

              {/* Year / week */}
              <span className="text-[10px] text-s-text3 flex-shrink-0 w-[60px]">
                {tx.year} W{tx.leg}
              </span>

              {/* Summary */}
              <span className="flex-1 text-[12px] text-s-text truncate">{txSummary(tx)}</span>

              {/* Date */}
              <span className="text-[10px] text-s-text3 flex-shrink-0 hidden sm:block">
                {formatDate(tx.created)}
              </span>

              {/* Chevron */}
              <span className="text-s-text3 text-[11px] flex-shrink-0">›</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

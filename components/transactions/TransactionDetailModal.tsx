'use client'

import type { EnrichedTransaction } from '@/hooks/useTransactionsData'

interface Props {
  tx: EnrichedTransaction | null
  onClose: () => void
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

const TYPE_LABEL: Record<string, string> = {
  trade:      'Trade',
  waiver:     'Waiver Claim',
  free_agent: 'Free Agent Signing',
}

export default function TransactionDetailModal({ tx, onClose }: Props) {
  if (!tx) return null

  const isTrade = tx.type === 'trade'

  return (
    <div
      className="fixed inset-0 bg-black/80 z-[500] flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-s-bg2 border border-s-border2 rounded-[18px] p-5 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-[15px] font-extrabold text-s-text">{TYPE_LABEL[tx.type] ?? tx.type}</div>
            <div className="text-[11px] text-s-text3 mt-[2px]">
              {tx.year} Week {tx.leg} · {formatDate(tx.created)}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[20px] text-s-text3 bg-transparent border-0 cursor-pointer hover:text-s-text transition-colors leading-none"
          >
            ✕
          </button>
        </div>

        {/* Parties */}
        <div className="mb-4 pb-4 border-b border-s-border">
          <div className="text-[9px] font-bold tracking-[1.5px] uppercase text-s-text3 mb-2">
            {isTrade ? 'Parties Involved' : 'Owner'}
          </div>
          <div className="flex gap-2 flex-wrap">
            {tx.ownerNames.map(name => (
              <span key={name} className="px-3 py-1 rounded-full bg-s-bg3 border border-s-border text-[12px] font-bold text-s-text">
                {name}
              </span>
            ))}
          </div>
        </div>

        {/* Players added / dropped */}
        {tx.addedPlayers.length > 0 && (
          <div className="mb-4">
            <div className="text-[9px] font-bold tracking-[1.5px] uppercase text-s-green mb-2">
              {isTrade ? 'Players Traded' : 'Added'}
            </div>
            <div className="space-y-[6px]">
              {tx.addedPlayers.map(p => (
                <div key={p.playerId} className="flex items-center justify-between px-3 py-[6px] bg-s-bg3 rounded-[8px]">
                  <span className="text-[12px] font-semibold text-s-text">{p.name}</span>
                  <span className="text-[11px] text-s-green font-bold">→ {p.owner}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tx.droppedPlayers.length > 0 && (
          <div className="mb-4">
            <div className="text-[9px] font-bold tracking-[1.5px] uppercase text-s-red mb-2">
              {isTrade ? 'Players Given Up' : 'Dropped'}
            </div>
            <div className="space-y-[6px]">
              {tx.droppedPlayers.map(p => (
                <div key={p.playerId} className="flex items-center justify-between px-3 py-[6px] bg-s-bg3 rounded-[8px]">
                  <span className="text-[12px] font-semibold text-s-text">{p.name}</span>
                  <span className="text-[11px] text-s-red font-bold">← {p.owner}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Draft picks traded */}
        {isTrade && tx.draft_picks && tx.draft_picks.length > 0 && (
          <div className="mb-4">
            <div className="text-[9px] font-bold tracking-[1.5px] uppercase text-s-gold mb-2">Draft Picks Traded</div>
            <div className="space-y-[6px]">
              {tx.draft_picks.map((pick, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-[6px] bg-s-bg3 rounded-[8px]">
                  <span className="text-[12px] font-semibold text-s-text">
                    {pick.season} Round {pick.round}
                  </span>
                  <span className="text-[11px] text-s-gold font-bold">pick</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Waiver bid */}
        {tx.type === 'waiver' && tx.settings?.waiver_bid != null && (
          <div className="flex items-center justify-between px-3 py-[6px] bg-[#1a1200] border border-[#3a2400] rounded-[8px]">
            <span className="text-[11px] text-s-text3">Waiver Bid</span>
            <span className="text-[14px] font-extrabold text-s-gold">${tx.settings.waiver_bid}</span>
          </div>
        )}
      </div>
    </div>
  )
}

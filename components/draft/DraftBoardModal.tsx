'use client'

import { createPortal } from 'react-dom'
import type { DraftPick, SleeperDraft } from '@/types'

import { useModalClose } from '@/hooks/useModalClose'
import { POS_BADGE_CLASSES as POS_COLORS } from '@/lib/constants'
import { buildDraftBoard } from '@/lib/data-processing'

interface Props {
  year: number
  draft: SleeperDraft
  picks: DraftPick[]
  rMap: Record<string, string>
  onClose: () => void
}

export default function DraftBoardModal({ year, draft, picks, rMap, onClose }: Props) {
  useModalClose(onClose)
  const board = buildDraftBoard(draft, picks, rMap)
  const numSlots = board.slots.length
  const numRounds = board.rounds

  // Portaled to body: the page's animate-fade-in transform would otherwise
  // become the containing block for this fixed overlay and clip it.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${year} draft board`}
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 md:p-8"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative flex w-full max-w-[1400px] min-h-0 flex-col">
        {/* Header — stays put while the board scrolls, so ✕ is always reachable */}
        <div className="flex shrink-0 items-center justify-between gap-3 mb-3">
          <div className="min-w-0">
            <span className="text-[17px] font-extrabold text-s-text sm:text-[20px]">{year} Draft Board</span>
            <span className="ml-2 inline-block text-[10px] font-bold tracking-[1.5px] uppercase text-s-text3 bg-s-bg3 px-2 py-0.5 rounded-full border border-s-border sm:ml-3 sm:text-[11px]">
              {draft.type.toUpperCase()} · {numRounds} rounds
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close draft board"
            className="shrink-0 flex h-9 w-9 items-center justify-center rounded-[6px] border border-s-border bg-s-bg3 text-[18px] leading-none text-s-text2 hover:text-s-text hover:bg-s-bg4 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Board — scrolls in both axes inside its own frame */}
        <div className="gl flex-1 min-h-0 overflow-auto rounded-[6px]">
          <table className="border-collapse" style={{ minWidth: `${numSlots * 120 + 60}px`, width: '100%' }}>
            <thead>
              <tr>
                <th className="sticky left-0 top-0 z-20 text-center px-2 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border w-12 bg-s-bg4">
                  Rd
                </th>
                {board.slots.map(({ slot, owner }) => (
                  <th
                    key={slot}
                    className="sticky top-0 z-10 text-center px-2 py-3 text-[11px] font-bold text-s-text border-b border-s-border border-l border-s-border/40 bg-s-bg4"
                    style={{ minWidth: 110 }}
                  >
                    <div className="text-[9px] text-s-text3 font-semibold mb-0.5">Slot {slot}</div>
                    <div className="truncate max-w-[100px] mx-auto">
                      {owner}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: numRounds }, (_, i) => {
                const round = i + 1
                return (
                  <tr key={round} className="border-b border-s-border/30">
                    <td className="sticky left-0 z-10 px-2 py-1 text-center text-[11px] font-extrabold text-s-text3 bg-s-bg3 border-r border-s-border/40">
                      {round}
                    </td>
                    {board.slots.map(({ slot }) => {
                      const pick = board.picks[`${round}-${slot}`]
                      if (!pick) {
                        return (
                          <td key={slot} className="px-2 py-1.5 border-l border-s-border/40 text-center">
                            <span className="text-[10px] text-s-text3">—</span>
                          </td>
                        )
                      }
                      const playerName = [pick.metadata.first_name, pick.metadata.last_name]
                        .filter(Boolean).join(' ') || pick.player_id
                      const pos = pick.metadata.position ?? '?'
                      const posClass = POS_COLORS[pos] ?? 'bg-white/[0.06] text-s-text3 border-white/10'

                      return (
                        <td key={slot} className="px-2 py-1.5 border-l border-s-border/40">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className={`text-[9px] font-bold px-1 py-0 rounded border ${posClass}`}>
                                {pos}
                              </span>
                              {pick.is_keeper && (
                                <span className="text-[9px] font-bold text-s-gold bg-[rgba(201,150,46,0.10)] px-1 rounded border border-[rgba(230,190,90,0.25)]/50">
                                  KEEP
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-semibold text-s-text leading-tight truncate max-w-[100px]">
                              {playerName}
                            </span>
                            {pick.metadata.team && (
                              <span className="text-[9px] text-s-text3">{pick.metadata.team}</span>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-2 shrink-0 text-[10px] text-s-text3 text-center">
          Swipe the board to see every slot · tap ✕ or press Esc to close
        </div>
      </div>
    </div>,
    document.body
  )
}

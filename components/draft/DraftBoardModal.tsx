'use client'

import type { DraftPick, SleeperDraft } from '@/types'

const POS_COLORS: Record<string, string> = {
  QB:  'bg-amber-500/20 text-amber-400 border-amber-500/30',
  RB:  'bg-green-500/20 text-green-400 border-green-500/30',
  WR:  'bg-blue-500/20 text-blue-400 border-blue-500/30',
  TE:  'bg-purple-500/20 text-purple-400 border-purple-500/30',
  K:   'bg-slate-500/20 text-slate-400 border-slate-500/30',
  DEF: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

interface Props {
  year: number
  draft: SleeperDraft
  picks: DraftPick[]
  rMap: Record<string, string>
  onClose: () => void
}

export default function DraftBoardModal({ year, draft, picks, rMap, onClose }: Props) {
  const isSnake = draft.type === 'snake'

  // Build slot → owner map from round 1
  const slotOwner: Record<number, string> = {}
  for (const pick of picks) {
    if (pick.round === 1) {
      const owner = rMap[String(pick.roster_id)] ?? `Slot ${pick.draft_slot}`
      slotOwner[pick.draft_slot] = owner
    }
  }

  const numSlots = Math.max(...picks.map(p => p.draft_slot), 0) || 10
  const numRounds = Math.max(...picks.map(p => p.round), 0) || 16
  const slots = Array.from({ length: numSlots }, (_, i) => i + 1)

  // Build pick lookup: round × slot → DraftPick
  const pickMap: Record<string, DraftPick> = {}
  for (const pick of picks) {
    pickMap[`${pick.round}-${pick.draft_slot}`] = pick
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/80 backdrop-blur-sm py-8 px-2"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative min-w-[900px] max-w-[1400px] w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[20px] font-extrabold text-s-text">{year} Draft Board</span>
            <span className="ml-3 text-[11px] font-bold tracking-[1.5px] uppercase text-s-text3 bg-s-bg3 px-2 py-0.5 rounded-full border border-s-border">
              {draft.type.toUpperCase()} · {numRounds} rounds
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-s-text3 hover:text-s-text text-[22px] leading-none px-3 py-1 rounded-lg hover:bg-s-bg3 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Board */}
        <div className="gl overflow-x-auto rounded-[14px]">
          <table className="border-collapse" style={{ minWidth: `${numSlots * 120 + 60}px`, width: '100%' }}>
            <thead>
              <tr>
                <th className="text-center px-2 py-3 text-[10px] font-bold tracking-[2px] uppercase text-s-text3 border-b border-s-border w-12 bg-s-bg3/40">
                  Rd
                </th>
                {slots.map(slot => (
                  <th
                    key={slot}
                    className="text-center px-2 py-3 text-[11px] font-bold text-s-text border-b border-s-border border-l border-s-border/40 bg-s-bg3/40"
                    style={{ minWidth: 110 }}
                  >
                    <div className="text-[9px] text-s-text3 font-semibold mb-0.5">Slot {slot}</div>
                    <div className="truncate max-w-[100px] mx-auto">
                      {slotOwner[slot] ?? `—`}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: numRounds }, (_, i) => {
                const round = i + 1
                const displaySlots = isSnake && round % 2 === 0
                  ? [...slots].reverse()
                  : slots
                return (
                  <tr key={round} className="border-b border-s-border/30">
                    <td className="px-2 py-1 text-center text-[11px] font-extrabold text-s-text3 bg-s-bg3/20">
                      {round}
                    </td>
                    {displaySlots.map(slot => {
                      const pick = pickMap[`${round}-${slot}`]
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
                      const posClass = POS_COLORS[pos] ?? 'bg-slate-500/20 text-slate-400 border-slate-500/30'

                      return (
                        <td key={slot} className="px-2 py-1.5 border-l border-s-border/40">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className={`text-[9px] font-bold px-1 py-0 rounded border ${posClass}`}>
                                {pos}
                              </span>
                              {pick.is_keeper && (
                                <span className="text-[9px] font-bold text-s-gold bg-[#3d2000]/60 px-1 rounded border border-[#5a3000]/50">
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

        <div className="mt-2 text-[10px] text-s-text3 text-center">
          Click outside or press ✕ to close
        </div>
      </div>
    </div>
  )
}

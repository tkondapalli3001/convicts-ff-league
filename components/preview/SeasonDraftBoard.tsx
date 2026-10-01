'use client'

import { useMemo } from 'react'
import OwnerAvatar from '@/components/shared/OwnerAvatar'
import SectionCard from '@/components/shared/SectionCard'
import { POS_COLORS } from '@/lib/constants'
import { buildDraftBoard } from '@/lib/data-processing'
import type { DraftPick, SleeperDraft } from '@/types'

const POSITIONS = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF']
const FALLBACK = '#6e7681'

/** 2026 → Draft: the season's board, every pick tinted by position. */
export default function SeasonDraftBoard({ year, draft, picks, rMap }: {
  year: number
  draft: SleeperDraft
  picks: DraftPick[]
  rMap: Record<string, string>
}) {
  const board = useMemo(() => buildDraftBoard(draft, picks, rMap), [draft, picks, rMap])
  const counts = useMemo(() => {
    const out: Record<string, number> = {}
    for (const p of picks) out[p.metadata.position] = (out[p.metadata.position] ?? 0) + 1
    return out
  }, [picks])
  const teams = board.slots.length

  return (
    <SectionCard
      title={`${year} Draft Board`}
      action={
        <span className="text-[10px] font-bold uppercase tracking-[2px] text-s-text3">
          {draft.type} · {board.rounds} rounds
        </span>
      }
    >
      {/* Position key */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 px-4 py-3 sm:px-5">
        {POSITIONS.filter(pos => counts[pos]).map(pos => (
          <span key={pos} className="flex items-center gap-1.5 text-[11px] font-semibold text-s-text2">
            <span className="h-3 w-3 rounded-[2px]" style={{ background: POS_COLORS[pos] ?? FALLBACK }} />
            {pos}
            <span className="font-normal text-s-text3">{counts[pos]}</span>
          </span>
        ))}
      </div>

      {/* The board scrolls inside its own frame so the owners and rounds stay pinned */}
      <div className="max-h-[78vh] overflow-auto border-t" style={{ borderColor: 'rgba(var(--gold-rgb), 0.10)' }}>
        <table className="w-full border-separate border-spacing-0" style={{ minWidth: teams * 104 + 36 }}>
          <thead>
            <tr>
              <th
                className="sticky left-0 top-0 z-30 w-9 cursor-default px-1 py-2 text-center text-[10px] hover:text-s-text3"
                style={{ background: '#0B0B0D' }}
              >
                Rd
              </th>
              {board.slots.map(({ slot, owner }) => (
                <th
                  key={slot}
                  className="sticky top-0 z-20 cursor-default px-1 py-2 text-center hover:text-s-text3"
                  style={{ background: '#0B0B0D' }}
                >
                  <div className="flex flex-col items-center gap-1">
                    <OwnerAvatar name={owner} size="sm" />
                    <span className="max-w-[96px] truncate text-[11px] normal-case tracking-[0.5px] text-s-text">{owner}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: board.rounds }, (_, i) => i + 1).map(round => (
              <tr key={round} className="cursor-default">
                <td
                  className="sticky left-0 z-10 px-1 py-1 text-center font-display text-[15px] font-bold text-s-text3"
                  style={{ background: '#0B0B0D' }}
                >
                  {round}
                </td>
                {board.slots.map(({ slot, owner }) => {
                  const pick = board.picks[`${round}-${slot}`]
                  if (!pick) return <td key={slot} className="p-[3px] text-center text-[10px] text-s-muted">—</td>
                  const pos = pick.metadata.position
                  const color = POS_COLORS[pos] ?? FALLBACK
                  const picker = rMap[String(pick.roster_id)]
                  const traded = picker && picker !== owner
                  const inRound = ((pick.pick_no - 1) % teams) + 1
                  return (
                    <td key={slot} className="p-[3px] align-top">
                      <div
                        className="h-full rounded-[3px] px-2 py-1.5"
                        style={{ background: `${color}26`, borderLeft: `3px solid ${color}` }}
                        title={`${round}.${String(inRound).padStart(2, '0')} · ${pick.metadata.first_name ?? ''} ${pick.metadata.last_name ?? ''} · ${pos}${traded ? ` · picked by ${picker}` : ''}`}
                      >
                        <div className="flex items-center justify-between text-[9px] font-bold">
                          <span className="text-s-text3">{round}.{String(inRound).padStart(2, '0')}</span>
                          <span style={{ color }}>{pos}</span>
                        </div>
                        <div className="mt-0.5 max-w-[92px] truncate text-[10px] leading-tight text-s-text2">
                          {pick.metadata.first_name}
                        </div>
                        <div className="max-w-[92px] truncate font-display text-[15px] font-bold uppercase leading-tight text-s-text">
                          {pick.metadata.last_name || pick.player_id}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1 text-[9px] text-s-text3">
                          {pick.metadata.team && <span>{pick.metadata.team}</span>}
                          {pick.is_keeper && <span className="font-bold text-gold-soft">KEEP</span>}
                          {traded && <span className="truncate text-gold-dim">→ {picker}</span>}
                        </div>
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}

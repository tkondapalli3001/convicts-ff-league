import type { DraftPick, SleeperDraft } from '@/types'
import { draftSlotOwners } from './draft-slots'

export interface DraftBoardData {
  /** Columns in slot order, each with its pre-trade owner. */
  slots: { slot: number; owner: string }[]
  rounds: number
  /** `${round}-${slot}` → the pick made in that cell. */
  picks: Record<string, DraftPick>
}

/** A draft as a rounds × slots grid, each column headed by its pre-trade owner (see draftSlotOwners). */
export function buildDraftBoard(
  draft: SleeperDraft,
  picks: DraftPick[],
  rMap: Record<string, string>,
): DraftBoardData {
  const slotOwner = draftSlotOwners(draft, picks, rMap)
  const numSlots = Math.max(...picks.map(p => p.draft_slot), 0) || 10
  const rounds = Math.max(...picks.map(p => p.round), 0) || 16
  const cells: Record<string, DraftPick> = {}
  for (const pick of picks) cells[`${pick.round}-${pick.draft_slot}`] = pick

  return {
    slots: Array.from({ length: numSlots }, (_, i) => ({ slot: i + 1, owner: slotOwner[i + 1] ?? '—' })),
    rounds,
    picks: cells,
  }
}

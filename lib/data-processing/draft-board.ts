import type { DraftPick, SleeperDraft } from '@/types'

export interface DraftBoardData {
  /** Columns in slot order, each with its pre-trade owner. */
  slots: { slot: number; owner: string }[]
  rounds: number
  /** `${round}-${slot}` → the pick made in that cell. */
  picks: Record<string, DraftPick>
}

/**
 * A draft as a rounds × slots grid. Column owners are the pre-trade
 * assignment: round-1 picks reflect whoever used the pick after trades, so
 * owners come from slot_to_roster_id first, then the most common picker in
 * rounds 2+ (almost never traded), then round 1 for any slot still unresolved.
 */
export function buildDraftBoard(
  draft: SleeperDraft,
  picks: DraftPick[],
  rMap: Record<string, string>,
): DraftBoardData {
  const slotOwner: Record<number, string> = {}

  // Tier 1: slot_to_roster_id (set at draft creation, unaffected by trades)
  const s2r = (draft as unknown as { slot_to_roster_id?: Record<string, number> | null }).slot_to_roster_id
  if (s2r && typeof s2r === 'object') {
    for (const [slotStr, rosterId] of Object.entries(s2r)) {
      const owner = rMap[String(rosterId)]
      if (owner) slotOwner[Number(slotStr)] = owner
    }
  }

  // Tier 2: mode of roster_id across rounds 2+ for any slots still missing
  const votes: Record<number, Record<string, number>> = {}
  for (const pick of picks) {
    if (pick.round < 2) continue
    const owner = rMap[String(pick.roster_id)] ?? `Slot ${pick.draft_slot}`
    const v = (votes[pick.draft_slot] ??= {})
    v[owner] = (v[owner] ?? 0) + 1
  }
  for (const [slotStr, counts] of Object.entries(votes)) {
    const slot = Number(slotStr)
    if (slotOwner[slot]) continue
    slotOwner[slot] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
  }

  // Tier 3: round-1 fallback for any slots still unresolved
  for (const pick of picks) {
    if (pick.round !== 1 || slotOwner[pick.draft_slot] !== undefined) continue
    slotOwner[pick.draft_slot] = rMap[String(pick.roster_id)] ?? `Slot ${pick.draft_slot}`
  }

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

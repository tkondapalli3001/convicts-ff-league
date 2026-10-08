import type { DraftPick, LeagueState, SleeperDraft } from '@/types'
import { resolveOwnerName } from './resolve-owner'

/**
 * Who owned each draft slot (slot → owner) — the pre-trade assignment, so a
 * traded pick still belongs to its slot's original owner. The one answer for
 * the draft boards and Slot Analysis. Most reliable source first:
 *   1. slot_to_roster_id — Sleeper's slot → roster map, set before the draft
 *   2. draft_order — user_id → slot, for any slot still open
 *   3. the most common picker in rounds 2+ (later picks are rarely traded)
 *   4. the round-1 picker, for any slot still open
 */
export function draftSlotOwners(
  draft: SleeperDraft,
  picks: DraftPick[],
  rMap: Record<string, string>,
): Record<number, string> {
  const slotOwner: Record<number, string> = {}

  for (const [slot, rosterId] of Object.entries(draft.slot_to_roster_id ?? {})) {
    const owner = rMap[String(rosterId)]
    if (owner) slotOwner[Number(slot)] = owner
  }

  for (const [userId, slot] of Object.entries(draft.draft_order ?? {})) {
    const owner = resolveOwnerName(userId, '')
    if (owner !== 'Unknown' && slotOwner[slot] === undefined) slotOwner[slot] = owner
  }

  const votes: Record<number, Record<string, number>> = {}
  for (const pick of picks) {
    if (pick.round < 2) continue
    const owner = rMap[String(pick.roster_id)] ?? `Slot ${pick.draft_slot}`
    const v = (votes[pick.draft_slot] ??= {})
    v[owner] = (v[owner] ?? 0) + 1
  }
  for (const [slot, counts] of Object.entries(votes)) {
    if (slotOwner[Number(slot)] !== undefined) continue
    slotOwner[Number(slot)] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
  }

  for (const pick of picks) {
    if (pick.round !== 1 || slotOwner[pick.draft_slot] !== undefined) continue
    slotOwner[pick.draft_slot] = rMap[String(pick.roster_id)] ?? `Slot ${pick.draft_slot}`
  }

  return slotOwner
}

export interface DraftSlotRow {
  year: number
  owner: string
  slot: number
  finish: number | null
  madePlayoffs: boolean
}

/** Every owner's draft slot each completed season, joined with that season's finish and playoff status. */
export function buildDraftSlotRows(
  state: Pick<LeagueState, 'draftData' | 'rosterUserMaps' | 'ownerSeasons' | 'years'>,
): DraftSlotRow[] {
  const { draftData, rosterUserMaps, ownerSeasons, years } = state
  const out: DraftSlotRow[] = []
  for (const year of [...years].sort((a, b) => b - a)) {
    const data = draftData[year]
    if (!data?.picks?.length) continue
    for (const [slot, owner] of Object.entries(draftSlotOwners(data.draft, data.picks, rosterUserMaps[year] ?? {}))) {
      const season = ownerSeasons[owner]?.find(s => s.year === year)
      out.push({
        year,
        owner,
        slot: Number(slot),
        finish: season?.finish ?? null,
        madePlayoffs: season?.inPlayoffs ?? false,
      })
    }
  }
  return out
}

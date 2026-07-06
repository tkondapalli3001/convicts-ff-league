import type { LeagueState } from '@/types'
import { resolveOwnerName } from './resolve-owner'

export interface DraftSlotRow {
  year: number
  owner: string
  slot: number
  finish: number | null
  madePlayoffs: boolean
}

/**
 * One canonical draft slot per owner per year, joined with that season's
 * finish and playoff status. Three tiers handle pick trades correctly:
 *   Tier 1 — slot_to_roster_id: Sleeper's pre-trade assignment, most reliable
 *   Tier 2 — draft_order: user_id→slot map, catches gaps when rMap lookup fails
 *   Tier 3 — snake math on rounds 2+: finds managers whose round-1 pick was
 *            traded away (they have no round-1 entry at all)
 */
export function buildDraftSlotRows(
  state: Pick<LeagueState, 'draftData' | 'rosterUserMaps' | 'ownerSeasons' | 'years'>,
): DraftSlotRow[] {
  const { draftData, rosterUserMaps, ownerSeasons, years } = state
  const out: DraftSlotRow[] = []
  for (const year of [...years].sort((a, b) => b - a)) {
    const data = draftData[year]
    if (!data?.picks?.length) continue
    const rMap = rosterUserMaps[year] ?? {}

    const ownerSlot: Record<string, number> = {}
    const draftAny = data.draft as unknown as {
      slot_to_roster_id?: Record<string, number> | null
      draft_order?: Record<string, number> | null
    }
    const isSnake = data.draft.type === 'snake'
    const N = Math.max(...data.picks.map(p => p.draft_slot), 0) || 10

    // Tier 1: slot_to_roster_id → look up roster_id in rMap
    const s2r = draftAny.slot_to_roster_id
    if (s2r && typeof s2r === 'object') {
      for (const [slotStr, rosterId] of Object.entries(s2r)) {
        const ownerName = rMap[String(rosterId)]
        if (ownerName && !ownerName.startsWith('Team ')) {
          ownerSlot[ownerName] = Number(slotStr)
        }
      }
    }

    // Tier 2: draft_order → resolve user_id directly (bypasses rMap issues)
    const dOrder = draftAny.draft_order
    if (dOrder && typeof dOrder === 'object') {
      for (const [userId, slot] of Object.entries(dOrder)) {
        const ownerName = resolveOwnerName(userId, '')
        if (ownerName && ownerName !== 'Unknown' && !(ownerName in ownerSlot)) {
          ownerSlot[ownerName] = Number(slot)
        }
      }
    }

    // Tier 3: infer slot from rounds 2+ via snake/linear math.
    // A manager who traded away their round-1 pick has no round-1 entry but still
    // picks in rounds 2–N at their original slot position. Vote across all rounds
    // and take the mode so a single traded later-round pick can't corrupt the result.
    const slotVotes: Record<string, Record<number, number>> = {}
    for (const pick of data.picks) {
      if (pick.round < 2) continue
      const ownerName = rMap[String(pick.roster_id)]
        ?? resolveOwnerName(pick.picked_by, '')
      if (!ownerName || ownerName in ownerSlot) continue
      const s = (isSnake && pick.round % 2 === 0)
        ? pick.round * N - pick.pick_no + 1
        : pick.pick_no - (pick.round - 1) * N
      if (s >= 1 && s <= N) {
        if (!slotVotes[ownerName]) slotVotes[ownerName] = {}
        slotVotes[ownerName][s] = (slotVotes[ownerName][s] ?? 0) + 1
      }
    }
    for (const [owner, freq] of Object.entries(slotVotes)) {
      if (owner in ownerSlot) continue
      const best = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]
      if (best) ownerSlot[owner] = Number(best[0])
    }

    for (const [owner, slot] of Object.entries(ownerSlot)) {
      const season = ownerSeasons[owner]?.find(s => s.year === year)
      out.push({
        year,
        owner,
        slot,
        finish: season?.finish ?? null,
        madePlayoffs: season?.inPlayoffs ?? false,
      })
    }
  }
  return out
}

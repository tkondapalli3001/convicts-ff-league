// The best lineup a roster could have set in a week: the one answer for
// potential points, points left on the bench, and lineup grading. Exact: it
// tries every assignment of eligible players to the league's starting slots.
// Its season totals tie to Sleeper's own potential points (roster ppts).

/** The player positions each starting slot accepts. */
const SLOT_POSITIONS: Record<string, string[]> = {
  QB: ['QB'], RB: ['RB'], WR: ['WR'], TE: ['TE'], K: ['K'], DEF: ['DEF'],
  FLEX: ['RB', 'WR', 'TE'], WRRB_FLEX: ['RB', 'WR'], REC_FLEX: ['WR', 'TE'], SUPER_FLEX: ['QB', 'RB', 'WR', 'TE'],
}

/** Bench, injured reserve, and taxi spots aren't part of a lineup. */
const NON_LINEUP = new Set(['BN', 'IR', 'TAXI'])

export interface LineupCandidate {
  id: string
  /** Every position the player may fill (Sleeper's fantasy_positions); a team defense is ['DEF']. */
  positions: string[]
  points: number
}

export interface BestLineup {
  points: number
  /** Each starting slot in league order, with the player filling it (null when nobody can). */
  slots: { slot: string; playerId: string | null }[]
}

/** The starting slots in a league's roster_positions, in order. */
export function startingSlots(rosterPositions: string[]): string[] {
  return rosterPositions.filter(p => !NON_LINEUP.has(p))
}

/**
 * The highest-scoring legal lineup from these players. A slot is filled
 * whenever someone eligible is left, even at negative points — Sleeper's
 * potential points count it the same way.
 */
export function bestLineup(slots: string[], players: LineupCandidate[]): BestLineup {
  const accepts = (slot: string, p: LineupCandidate) => p.positions.some(pos => SLOT_POSITIONS[slot]?.includes(pos))

  // Only a position's top k players can start, where k is how many slots take that
  // position. That shortcut holds while every player fits one position; with a
  // dual-position player on the roster, search everyone.
  const sorted = [...players].sort((a, b) => b.points - a.points)
  let pool = sorted
  if (players.every(p => p.positions.length === 1)) {
    const keep = new Set<string>()
    for (const pos of new Set(players.map(p => p.positions[0]))) {
      const k = slots.filter(s => SLOT_POSITIONS[s]?.includes(pos)).length
      sorted.filter(p => p.positions[0] === pos).slice(0, k).forEach(p => keep.add(p.id))
    }
    pool = sorted.filter(p => keep.has(p.id))
  }

  // Most restrictive slots first keeps the search small
  const order = slots.map((slot, i) => ({ slot, i })).sort(
    (a, b) => (SLOT_POSITIONS[a.slot]?.length ?? 0) - (SLOT_POSITIONS[b.slot]?.length ?? 0),
  )
  const chosen: (string | null)[] = new Array(slots.length).fill(null)
  const used = new Set<string>()
  let best: { points: number; picks: (string | null)[] } = { points: -Infinity, picks: [] }

  function fill(n: number, points: number) {
    if (n === order.length) {
      if (points > best.points) best = { points, picks: [...chosen] }
      return
    }
    const { slot, i } = order[n]
    let filled = false
    for (const p of pool) {
      if (used.has(p.id) || !accepts(slot, p)) continue
      filled = true
      used.add(p.id); chosen[i] = p.id
      fill(n + 1, points + p.points)
      used.delete(p.id); chosen[i] = null
    }
    if (!filled) fill(n + 1, points)
  }
  fill(0, 0)

  return {
    points: best.points === -Infinity ? 0 : best.points,
    slots: slots.map((slot, i) => ({ slot, playerId: best.picks[i] ?? null })),
  }
}

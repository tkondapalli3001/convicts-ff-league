import type { LeagueState } from '@/types'
import { isSeasonComplete } from '@/lib/data-processing'

/**
 * Owner → years they earned a first-round playoff bye (top-2 seed), sorted
 * ascending. A bye = seeded directly into winners-bracket round 2 with no
 * round-1 game. Completed seasons only — Sleeper pre-fills un-played
 * brackets with placeholder seeds that would register phantom byes.
 */
export function playoffByeYears(
  state: Pick<LeagueState, 'brackets' | 'rosterUserMaps' | 'leagues'>,
): Record<string, number[]> {
  const out: Record<string, number[]> = {}

  for (const [yearStr, bracket] of Object.entries(state.brackets)) {
    const year = Number(yearStr)
    if (!isSeasonComplete(state.leagues[year])) continue
    const rMap = state.rosterUserMaps[year] ?? {}

    const inRound1 = new Set<number>()
    ;(bracket.winners ?? []).filter(g => g.r === 1).forEach(g => {
      if (g.t1 != null) inRound1.add(g.t1)
      if (g.t2 != null) inRound1.add(g.t2)
    })

    ;(bracket.winners ?? []).filter(g => g.r === 2).forEach(g => {
      for (const t of [g.t1, g.t2]) {
        if (t != null && !inRound1.has(t)) {
          const name = rMap[String(t)] ?? `Team${t}`
          ;(out[name] ??= []).push(year)
        }
      }
    })
  }

  Object.values(out).forEach(years => years.sort((a, b) => a - b))
  return out
}

// The league's scoring rule, in one place: Sleeper stat keys × the league's
// scoring_settings. Projections, season stats, and the nflverse tie-out all
// score stat lines through this, so they can't disagree on what a stat is worth.

/** Fantasy points for one stat line: every scored stat × the league's multiplier, to the cent. */
export function scoreStats(stats: Record<string, number>, scoring: Record<string, number>): number {
  let total = 0
  for (const [key, mult] of Object.entries(scoring)) {
    const v = stats[key]
    if (typeof v === 'number' && typeof mult === 'number') total += v * mult
  }
  return Math.round(total * 100) / 100
}

// Playoff-implication lines for a matchup: where does a win or a loss land
// each team in the standings? Pure math over the standings table so it can
// be unit-tested without React or fetches.

export interface StandingRow {
  name: string
  wins: number
  losses: number
  pf: number
}

export interface Implication {
  currentSeed: number
  winSeed: number
  lossSeed: number
  /** e.g. "Win: climbs to 3rd · Loss: falls to 6th" — null when nothing moves. */
  line: string | null
  /** e.g. "Sitting on the playoff line (6th of 6 spots)". */
  playoffNote: string | null
}

export function ordinal(n: number): string {
  const rem100 = n % 100
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`
  switch (n % 10) {
    case 1: return `${n}st`
    case 2: return `${n}nd`
    case 3: return `${n}rd`
    default: return `${n}th`
  }
}

function seedWith(standings: StandingRow[], name: string, extraWins: number, extraLosses: number): number {
  const adjusted = standings.map(r =>
    r.name === name ? { ...r, wins: r.wins + extraWins, losses: r.losses + extraLosses } : r
  )
  adjusted.sort((a, b) => b.wins - a.wins || b.pf - a.pf)
  return adjusted.findIndex(r => r.name === name) + 1
}

/**
 * Where a win vs a loss would land `name` in the standings. Only meaningful
 * for regular-season weeks; callers skip playoff games.
 */
export function computeImplication(
  standings: StandingRow[],
  name: string,
  playoffSpots: number
): Implication | null {
  const currentSeed = standings.findIndex(r => r.name === name) + 1
  if (currentSeed === 0) return null

  const winSeed = seedWith(standings, name, 1, 0)
  const lossSeed = seedWith(standings, name, 0, 1)

  const parts: string[] = []
  if (winSeed < currentSeed) parts.push(`Win: climbs to ${ordinal(winSeed)}`)
  if (lossSeed > currentSeed) parts.push(`Loss: falls to ${ordinal(lossSeed)}`)
  const line = parts.length ? parts.join(' · ') : null

  let playoffNote: string | null = null
  if (currentSeed === playoffSpots) {
    playoffNote = `Sitting on the playoff line (${ordinal(currentSeed)} of ${playoffSpots} spots)`
  } else if (currentSeed === playoffSpots + 1) {
    playoffNote = `First team out — one spot below the playoff line`
  } else if (currentSeed > playoffSpots && winSeed <= playoffSpots) {
    playoffNote = `A win jumps them into the playoff field`
  } else if (currentSeed <= playoffSpots && lossSeed > playoffSpots) {
    playoffNote = `A loss drops them out of the playoff field`
  }

  return { currentSeed, winSeed, lossSeed, line, playoffNote }
}

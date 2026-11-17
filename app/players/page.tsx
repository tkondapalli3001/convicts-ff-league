import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import PlayersPage, { type BuiltScoring } from '@/components/players/PlayersPage'
import { DEFAULT_SCORING_VIEW, computePlayerScores, playerPageOwners, scoringPositions, scoringRows } from '@/lib/data-processing'
import { playersFromIndex, type PlayerIndex } from '@/lib/sources'
import { builtState } from '../built-state'

// Players → Scoring's opening view from the snapshot, worked out at build time so it's
// in the HTML and paints before any data loads; the page reruns the same functions once
// loaded. Only the top 25 is baked (every player's scoring is ~150 KB).
function builtScoring(): BuiltScoring | null {
  const state = builtState()
  if (!state) return null
  try {
    const { players } = JSON.parse(readFileSync(join(process.cwd(), 'public', 'data', 'players.json'), 'utf8')) as { players: PlayerIndex }
    const scores = computePlayerScores(state, playersFromIndex(players))
    return {
      years: state.years,
      ownerNames: playerPageOwners(state.ownerSeasons),
      scoring: { positions: scoringPositions(scores), top: scoringRows(scores, DEFAULT_SCORING_VIEW) },
    }
  } catch {
    return null
  }
}

export default function Page() {
  return <PlayersPage built={builtScoring()} />
}

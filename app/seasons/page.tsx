import SeasonsPage, { type BuiltStandings } from '@/components/seasons/SeasonsPage'
import { seasonStandings } from '@/lib/stats'
import { builtState } from '../built-state'

// Seasons → Standings from the snapshot, worked out at build time so it's in the
// HTML and paints before any data loads; the page reruns the same function once loaded.
function builtStandings(): BuiltStandings | null {
  const state = builtState()
  return state ? { avatars: state.ownerAvatarMap, standings: seasonStandings(state) } : null
}

export default function Page() {
  return <SeasonsPage built={builtStandings()} />
}

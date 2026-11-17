import OwnersPage, { type BuiltBoards } from '@/components/owners/OwnersPage'
import { careerBoards } from '@/lib/stats'
import { builtState } from '../built-state'

// Owners → Career Leaderboard from the snapshot, worked out at build time so it's in
// the HTML and paints before any data loads; the page reruns the same function once loaded.
function builtBoards(): BuiltBoards | null {
  const state = builtState()
  return state ? { avatars: state.ownerAvatarMap, boards: careerBoards(state) } : null
}

export default function Page() {
  return <OwnersPage built={builtBoards()} />
}

import RecordsPage, { type BuiltExtremes } from '@/components/records/RecordsPage'
import { computeRecords } from '@/lib/stats'
import { builtState } from '../built-state'

// Records → Extremes from the snapshot, worked out at build time so it's in the
// HTML and paints before any data loads; the page reruns the same function once loaded.
function builtExtremes(): BuiltExtremes | null {
  const state = builtState()
  if (!state) return null
  const r = computeRecords(state)
  return {
    seasonCount: state.years.length,
    avatars: state.ownerAvatarMap,
    records: {
      highScore: r.highScore, lowScore: r.lowScore, highPF: r.highPF, lowPF: r.lowPF,
      maxMargin: r.maxMargin, minMargin: r.minMargin, biggestPlayoffBlowout: r.biggestPlayoffBlowout,
      topRivalry: r.topRivalry, rv1: r.rv1, rv2: r.rv2, high140: r.high140, low80: r.low80,
    },
  }
}

export default function Page() {
  return <RecordsPage built={builtExtremes()} />
}

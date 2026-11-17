import HomePage from '@/components/home/HomePage'
import { homeHero } from '@/lib/stats'
import { builtState } from './built-state'

// Home's hero from the snapshot, worked out at build time so it's in the HTML
// and paints before any data loads. If a file is missing, the page starts on
// the spinner as it used to.
export default function Page() {
  const state = builtState()
  return <HomePage builtHero={state ? homeHero(state) : null} />
}

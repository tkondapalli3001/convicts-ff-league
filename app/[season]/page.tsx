import { CURRENT_SEASON } from '@/lib/league'
import { pageMeta } from '../page-meta'
import SeasonPage from '@/components/current-season/SeasonPage'

// The season tab lives at its year (/2026). One static page, named by
// CURRENT_SEASON — bumping the config moves the tab; no folder rename.
export const dynamicParams = false

export const metadata = pageMeta(String(CURRENT_SEASON), 'This week in the league: power rankings, matchups, rosters, and every move.', `/${CURRENT_SEASON}/`)

export function generateStaticParams() {
  return [{ season: String(CURRENT_SEASON) }]
}

export default function CurrentSeasonPage() {
  return <SeasonPage />
}

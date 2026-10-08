import { CURRENT_SEASON } from '@/lib/league'
import SeasonPage from '@/components/current-season/SeasonPage'

// The season tab lives at its year (/2026). One static page, named by
// CURRENT_SEASON — bumping the config moves the tab; no folder rename.
export const dynamicParams = false

export function generateStaticParams() {
  return [{ season: String(CURRENT_SEASON) }]
}

export default function CurrentSeasonPage() {
  return <SeasonPage />
}

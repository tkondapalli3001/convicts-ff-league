'use client'

import { useLeague } from '@/context/LeagueContext'
import { useMe } from '@/hooks/useMe'
import { useBelowLg } from '@/hooks/useBelowLg'
import { useLiveSeason } from '@/hooks/useLiveSeason'
import { usePreviewData, yourMatchup } from '@/hooks/usePreviewData'
import { PickYourselfSheet } from '@/components/shared/PickYourself'
import YourMatchupCard from '@/components/current-season/YourMatchupCard'
import { CURRENT_SEASON } from '@/lib/league'
import snapshot from '@/public/data/manifest.json'

// A season the snapshot doesn't hold yet is being played (or about to be), so
// the card is on its way: hold its place and the hero below doesn't jump.
const SEASON_EXPECTED = !snapshot.years.includes(CURRENT_SEASON)

/** This week's game: yours once it knows who you are, the Matchup of the Week until then. */
function WeekCard({ me }: { me: string | null }) {
  const live = useLiveSeason()
  const { previews, week, motw } = usePreviewData(live, null)
  if (!live.live) return null

  const mine = me ? yourMatchup(previews, me) : null
  const featured = !mine && motw ? previews[motw.index] : null
  const m = mine ?? (featured ? yourMatchup(previews, featured.teamA.name) : null)
  if (!m) return null

  return (
    <div className="p-4 sm:px-8">
      <YourMatchupCard
        m={m}
        neutral={!mine}
        href={`/${CURRENT_SEASON}/?tab=matchups&week=${week}&matchup=${encodeURIComponent(m.you)}`}
      />
    </div>
  )
}

/**
 * Home leads with the week wherever the bottom bar is the navigation: in
 * season the weekly companion comes before the trophy room. Wider screens
 * keep the champion first and never sync from Home.
 */
export default function HomeThisWeek() {
  const { state } = useLeague()
  const { me } = useMe()
  const below = useBelowLg()

  if (!state.loaded) {
    return SEASON_EXPECTED ? (
      <div className="p-4 sm:px-8" aria-hidden>
        <div className="h-[160px] animate-pulse rounded-[6px] sm:h-[184px]" style={{ background: '#0B0B0D', border: '1px solid rgba(var(--gold-rgb), 0.10)' }} />
      </div>
    ) : null
  }
  if (!below || me === undefined) return null

  return (
    <>
      <WeekCard me={me || null} />
      <PickYourselfSheet />
    </>
  )
}

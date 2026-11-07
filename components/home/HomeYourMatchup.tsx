'use client'

import { useMe } from '@/hooks/useMe'
import { useLiveSeason } from '@/hooks/useLiveSeason'
import { usePreviewData, yourMatchup } from '@/hooks/usePreviewData'
import { PickYourselfPrompt } from '@/components/shared/PickYourself'
import YourMatchupCard from '@/components/current-season/YourMatchupCard'
import { CURRENT_SEASON } from '@/lib/league'

/** Your live game, once it knows who you are. Only then does Home sync with Sleeper. */
function LiveCard({ me }: { me: string }) {
  const live = useLiveSeason()
  const { previews, week } = usePreviewData(live, null)
  const m = live.live ? yourMatchup(previews, me) : null
  if (!m) return null
  return (
    <div className="p-4 sm:px-8">
      <YourMatchupCard m={m} href={`/${CURRENT_SEASON}/?tab=matchups&week=${week}&matchup=${encodeURIComponent(me)}`} />
    </div>
  )
}

export default function HomeYourMatchup() {
  const { me } = useMe()
  if (me === null) return <div className="p-4 sm:px-8"><PickYourselfPrompt /></div>
  return me ? <LiveCard me={me} /> : null
}

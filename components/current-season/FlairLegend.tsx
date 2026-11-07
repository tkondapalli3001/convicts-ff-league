'use client'

import type { Badge } from '@/lib/current-season'
import type { UncertaintySummary } from '@/lib/stats'
import InfoTip from '@/components/shared/InfoTip'
import uncertainty from '@/public/data/uncertainty.json'

const { badges, daddies } = uncertainty as UncertaintySummary
const pct = (x: number) => `${Math.round(x * 100)}%`

/** Key for the flair showing this week — only the badges somebody actually earned. */
export default function FlairLegend({ badges: earned }: { badges: Badge[] }) {
  const unique = [...new Map(earned.map(b => [b.label, b])).values()]
  if (!unique.length) return null
  return (
    <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[11px] text-s-text3 sm:text-[13px]">
      {unique.map(b => (
        <span key={b.label} className="whitespace-nowrap">
          <span className="mr-1.5">{b.emoji}</span>
          <span className="font-semibold text-s-text2">{b.label}</span> · {b.rule}
        </span>
      ))}
      <span className="whitespace-nowrap">
        Do they predict anything?
        <InfoTip term="Mostly no">
          each badge was tested on what came next, using only earlier games, in every finished season. 💦 Daddies won the next meeting {pct(badges.daddy.rate)} ({badges.daddy.wins} of {badges.daddy.n}), and coin flips alone would make {daddies.byChance} of today’s {daddies.count}.
          {' '}🔥 teams won {pct(badges.heater.rate)} of their next games, below the {pct(badges.heater.earned ?? 0)} their points had earned; 🧊 teams won {pct(badges.cold.rate)}, above their {pct(badges.cold.earned ?? 0)}.
          {' '}🏆 champions won {pct(badges.champ.rate)} of their games the next season, 🚽 last-place teams {pct(badges.last.rate)}.
        </InfoTip>
      </span>
    </div>
  )
}

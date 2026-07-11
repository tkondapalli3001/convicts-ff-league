'use client'

import { useRouter } from 'next/navigation'
import { useLeague } from '@/context/LeagueContext'
import { getShameLoser, ownerColor, avatarLetters } from '@/lib/utils'

export default function WallOfShameCard({ years }: { years: number[] }) {
  const { state } = useLeague()
  const router = useRouter()
  const sortedYears = [...years].sort((a, b) => b - a)

  return (
    <div
      className="flex-1 overflow-hidden rounded-[6px]"
      style={{ background: '#0B0B0D', border: '1px solid rgba(180,90,90,0.16)' }}
    >
      {/* Section header — brick dash + brick heading (slightly larger than HOF) */}
      <div
        className="flex items-center gap-2.5 border-b px-6 pb-3 pt-[18px]"
        style={{ borderColor: 'rgba(180,90,90,0.20)' }}
      >
        <span className="h-px w-5" style={{ background: '#8A4A46' }} />
        <div className="text-[13px] font-bold uppercase tracking-[4px] text-loss">Wall of Shame</div>
      </div>

      <div className="py-1.5">
        {sortedYears.map(year => {
          const s = getShameLoser(year, state)
          const shameClr = ownerColor(s.loser)
          const seed = (s as { seed?: number | null }).seed
          return (
            <button
              key={year}
              onClick={() => router.push(`/owners/${encodeURIComponent(s.loser)}`)}
              className="flex w-full items-center gap-3.5 px-6 py-2.5 text-left transition-colors hover:bg-[rgba(180,90,90,0.05)]"
            >
              <span className="w-9 flex-shrink-0 text-[10px] font-bold tracking-[1px]" style={{ color: '#8A4A46' }}>
                {year}
              </span>
              <div
                className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full text-[9px] font-extrabold text-white"
                style={{ background: shameClr, opacity: 0.75 }}
              >
                {avatarLetters(s.loser)}
              </div>
              <span className="min-w-0 flex-1 truncate font-display text-[19px] font-bold uppercase leading-none tracking-[0.5px] text-loss">
                {s.loser}
              </span>
              {seed != null && (
                <span className="flex-shrink-0 text-[9px] font-bold uppercase tracking-[1px]" style={{ color: '#8A4A46' }}>
                  Seed #{seed}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

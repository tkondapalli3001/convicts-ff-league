'use client'

import { useRouter } from 'next/navigation'
import { useLeague } from '@/context/LeagueContext'
import { getChampion, ownerColor, avatarLetters } from '@/lib/utils'

export default function HallOfFameCard({ years }: { years: number[] }) {
  const { state } = useLeague()
  const router = useRouter()
  const sortedYears = [...years].sort((a, b) => b - a)

  return (
    <div
      className="flex-1 overflow-hidden rounded-[6px]"
      style={{ background: '#0B0B0D', border: '1px solid rgba(var(--gold-rgb), 0.14)' }}
    >
      {/* Section header — gold dash + metal-gradient heading */}
      <div
        className="flex items-center gap-2.5 border-b px-6 pb-3 pt-[18px]"
        style={{ borderColor: 'rgba(var(--gold-rgb), 0.16)' }}
      >
        <span className="h-px w-5 bg-gold" />
        <div className="text-metal text-[13px] font-bold uppercase tracking-[4px]">Hall of Fame</div>
      </div>

      <div className="py-1.5">
        {sortedYears.map(year => {
          const c = getChampion(year, state)
          const champClr = ownerColor(c.winner)
          const seed = (c as { seed?: number | string | null }).seed
          return (
            <button
              key={year}
              onClick={() => router.push(`/owners/${encodeURIComponent(c.winner)}`)}
              className="flex w-full items-center gap-3.5 px-6 py-2.5 text-left transition-colors hover:bg-[rgba(201,150,46,0.05)]"
            >
              <span className="w-9 flex-shrink-0 text-[10px] font-bold tracking-[1px] text-gold-dim">{year}</span>
              <div
                className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full text-[9px] font-extrabold text-white"
                style={{ background: champClr, boxShadow: '0 0 0 1px rgba(var(--gold-rgb), 0.35)' }}
              >
                {avatarLetters(c.winner)}
              </div>
              <span className="min-w-0 flex-1 truncate font-display text-[19px] font-bold uppercase leading-none tracking-[0.5px] text-gold-bright">
                {c.winner}
              </span>
              {seed != null && (
                <span className="flex-shrink-0 text-[9px] font-bold uppercase tracking-[1px] text-gold-dim">
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

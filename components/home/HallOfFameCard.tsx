'use client'

import { useRouter } from 'next/navigation'
import { useLeague } from '@/context/LeagueContext'
import { getChampion, ownerColor, avatarLetters } from '@/lib/utils'

export default function HallOfFameCard({ years }: { years: number[] }) {
  const { state } = useLeague()
  const router = useRouter()
  const sortedYears = [...years].sort((a, b) => b - a)

  return (
    <div className="bento-card relative flex-1">
      <div className="absolute pointer-events-none inset-0"
        style={{ background: 'linear-gradient(135deg, rgba(120,53,15,0.18) 0%, transparent 55%)' }} />
      <div className="absolute pointer-events-none"
        style={{ top: -36, right: -36, width: 130, height: 130, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 70%)' }} />
      <div className="px-5 pt-5 pb-3 border-b border-[#5a3800]/40">
        <div className="text-[10px] font-bold tracking-[3px] uppercase text-[#a37a1a]">
          🏆 Hall of Fame
        </div>
      </div>
      <div className="p-2">
        {sortedYears.map(year => {
          const c = getChampion(year, state)
          const champClr = ownerColor(c.winner)
          return (
            <div
              key={year}
              className="flex items-center justify-between px-3 py-2.5 rounded-[10px] hover:bg-[#221500]/60 transition-colors cursor-default"
            >
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-[#7a5a10] w-9">{year}</span>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                  style={{ background: champClr, boxShadow: `0 0 8px ${champClr}44` }}
                >
                  {avatarLetters(c.winner)}
                </div>
                <span
                  className="text-[13px] font-extrabold text-s-gold hover:underline cursor-pointer"
                  onClick={() => router.push(`/owners/${encodeURIComponent(c.winner)}`)}
                >{c.winner}</span>
                {(c as { shared?: boolean }).shared && (
                  <span className="text-[9px] text-[#7a5a10] font-medium">(shared)</span>
                )}
              </div>
              {(c as { seed?: number | string | null }).seed != null && (
                <span className="text-[10px] text-[#7a5a10] font-bold">
                  Seed #{(c as { seed?: number | string | null }).seed}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

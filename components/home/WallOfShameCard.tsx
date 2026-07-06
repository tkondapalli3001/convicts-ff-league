'use client'

import { useRouter } from 'next/navigation'
import { useLeague } from '@/context/LeagueContext'
import { getShameLoser, ownerColor, avatarLetters } from '@/lib/utils'

export default function WallOfShameCard({ years }: { years: number[] }) {
  const { state } = useLeague()
  const router = useRouter()
  const sortedYears = [...years].sort((a, b) => b - a)

  return (
    <div className="bento-card relative flex-1">
      <div className="absolute pointer-events-none inset-0"
        style={{ background: 'linear-gradient(135deg, rgba(127,29,29,0.20) 0%, transparent 55%)' }} />
      <div className="absolute pointer-events-none"
        style={{ top: -36, right: -36, width: 130, height: 130, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(239,68,68,0.16) 0%, transparent 70%)' }} />
      <div className="px-5 pt-5 pb-3 border-b border-[#5a0000]/40">
        <div className="text-[10px] font-bold tracking-[3px] uppercase text-[#7a1010]">
          🚽 Wall of Shame
        </div>
      </div>
      <div className="p-2">
        {sortedYears.map(year => {
          const s = getShameLoser(year, state)
          const shameClr = ownerColor(s.loser)
          return (
            <div
              key={year}
              className="flex items-center justify-between px-3 py-2.5 rounded-[10px] hover:bg-[#220000]/60 transition-colors cursor-default"
            >
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-[#5a1010] w-9">{year}</span>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                  style={{ background: shameClr, boxShadow: `0 0 8px ${shameClr}44` }}
                >
                  {avatarLetters(s.loser)}
                </div>
                <span
                  className="text-[13px] font-extrabold text-s-red hover:underline cursor-pointer"
                  onClick={() => router.push(`/owners/${encodeURIComponent(s.loser)}`)}
                >{s.loser}</span>
              </div>
              {(s as { seed?: number | null }).seed != null && (
                <span className="text-[10px] text-[#5a1010] font-bold">
                  Seed #{(s as { seed?: number | null }).seed}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

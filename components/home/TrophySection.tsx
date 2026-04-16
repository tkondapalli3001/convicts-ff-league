'use client'

import { useLeague } from '@/context/LeagueContext'
import { getChampion, getShameLoser } from '@/lib/utils'

export default function TrophySection() {
  const { state } = useLeague()
  const { years } = state

  if (!years.length) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px] mb-5">
      {/* Hall of Fame */}
      <div>
        <div className="text-[10px] font-bold tracking-[3px] uppercase text-s-text3 mb-[14px]">
          🏆 Hall of Fame — Champions
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-[10px]">
          {[...years].reverse().map(year => {
            const c = getChampion(year, state)
            return (
              <div
                key={year}
                className="bg-[#1a1000] border border-[#3a2400] rounded-[10px] p-[14px] text-center transition-transform duration-150 hover:-translate-y-[2px] animate-fade-in"
              >
                <div className="text-[28px] mb-2">🏆</div>
                <div className="text-[10px] text-s-text3 tracking-[2px] mb-[5px]">{year}</div>
                <div className="text-[15px] font-extrabold text-s-gold">
                  {c.winner}
                  {(c as { shared?: boolean }).shared && (
                    <div className="text-[10px] text-s-text3 font-normal mt-1">Shared</div>
                  )}
                </div>
                {(c as { seed?: number | string | null }).seed != null && (
                  <div className="text-[10px] text-s-text3 mt-1">
                    Seed #{(c as { seed?: number | string | null }).seed}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Wall of Shame */}
      <div>
        <div className="text-[10px] font-bold tracking-[3px] uppercase text-s-text3 mb-[14px]">
          💀 Wall of Shame — Toilet Bowl
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-[10px]">
          {[...years].reverse().map(year => {
            const s = getShameLoser(year, state)
            return (
              <div
                key={year}
                className="bg-[#1a0000] border border-[#3a0000] rounded-[10px] p-[14px] text-center transition-transform duration-150 hover:-translate-y-[2px] animate-fade-in"
              >
                <div className="text-[28px] mb-2">🚽</div>
                <div className="text-[10px] text-s-text3 tracking-[2px] mb-[5px]">{year}</div>
                <div className="text-[15px] font-extrabold text-s-red">
                  {s.loser}
                </div>
                {(s as { seed?: number | null }).seed != null && (
                  <div className="text-[10px] text-s-text3 mt-1">
                    Seed #{(s as { seed?: number | null }).seed}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

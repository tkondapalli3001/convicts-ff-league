'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useLeague } from '@/context/LeagueContext'
import OwnerAvatar from '@/components/shared/OwnerAvatar'

export default function LeaguePulse() {
  const { state } = useLeague()
  const { allMatchups } = state
  const router = useRouter()

  const { hotOwner, hotCount, coldOwner, coldCount, allStreaks } = useMemo(() => {
    const INACTIVE = new Set(['Sangram', 'Hamza'])
    const ownerGames: Record<string, { won: boolean; year: number; week: number }[]> = {}

    for (const g of allMatchups) {
      if (!ownerGames[g.team1]) ownerGames[g.team1] = []
      if (!ownerGames[g.team2]) ownerGames[g.team2] = []
      ownerGames[g.team1].push({ won: g.pts1 >= g.pts2, year: g.year, week: g.week })
      ownerGames[g.team2].push({ won: g.pts2 >= g.pts1, year: g.year, week: g.week })
    }

    const allStreaks: Record<string, { count: number; type: 'W' | 'L' }> = {}
    let hotOwner = '', hotCount = 0, coldOwner = '', coldCount = 0

    for (const [owner, games] of Object.entries(ownerGames)) {
      if (INACTIVE.has(owner)) continue
      const sorted = [...games].sort((a, b) => b.year - a.year || b.week - a.week)
      if (!sorted.length) continue
      const type: 'W' | 'L' = sorted[0].won ? 'W' : 'L'
      let count = 0
      for (const g of sorted) {
        if (g.won === (type === 'W')) count++
        else break
      }
      allStreaks[owner] = { count, type }
      if (type === 'W' && count > hotCount) { hotCount = count; hotOwner = owner }
      if (type === 'L' && count > coldCount) { coldCount = count; coldOwner = owner }
    }

    return { hotOwner, hotCount, coldOwner, coldCount, allStreaks }
  }, [allMatchups])

  if (!hotOwner && !coldOwner) return null

  return (
    <div className="gl p-[18px] animate-fade-in">
      <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-s-text3 mb-3">
        League Pulse — Current Streaks
      </div>
      <div className="grid grid-cols-2 gap-4">
        {/* Hottest */}
        {hotOwner && (
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => router.push(`/owners/${encodeURIComponent(hotOwner)}`)}
          >
            <span className="text-[30px] leading-none flex-shrink-0">🔥</span>
            <div className="min-w-0">
              <div className="text-[9px] text-s-text3 uppercase tracking-[1.5px] mb-1">Hottest Manager</div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <OwnerAvatar name={hotOwner} size="sm" />
                <span className="text-[13px] font-bold text-s-text group-hover:text-s-green transition-colors truncate">
                  {hotOwner}
                </span>
              </div>
              <div className="text-[15px] font-extrabold text-s-green num">{hotCount}W streak</div>
            </div>
          </div>
        )}

        {/* Coldest */}
        {coldOwner && (
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => router.push(`/owners/${encodeURIComponent(coldOwner)}`)}
          >
            <span className="text-[30px] leading-none flex-shrink-0">🥶</span>
            <div className="min-w-0">
              <div className="text-[9px] text-s-text3 uppercase tracking-[1.5px] mb-1">Coldest Manager</div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <OwnerAvatar name={coldOwner} size="sm" />
                <span className="text-[13px] font-bold text-s-text group-hover:text-s-red transition-colors truncate">
                  {coldOwner}
                </span>
              </div>
              <div className="text-[15px] font-extrabold text-s-red num">{coldCount}L streak</div>
            </div>
          </div>
        )}
      </div>

      {/* Mini streak board — all owners */}
      <div className="mt-4 pt-3 border-t border-s-border/50 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[6px]">
        {Object.entries(allStreaks)
          .sort((a, b) => {
            if (a[1].type === 'W' && b[1].type !== 'W') return -1
            if (b[1].type === 'W' && a[1].type !== 'W') return 1
            return b[1].count - a[1].count
          })
          .map(([owner, { count, type }]) => (
            <div
              key={owner}
              className="flex items-center gap-1.5 px-2 py-[6px] rounded-[8px] bg-s-bg3 hover:bg-s-bg4 cursor-pointer transition-colors"
              onClick={() => router.push(`/owners/${encodeURIComponent(owner)}`)}
            >
              <OwnerAvatar name={owner} size="sm" />
              <span className="text-[11px] font-semibold text-s-text2 truncate flex-1">{owner}</span>
              <span className={`text-[11px] font-extrabold num flex-shrink-0 ${type === 'W' ? 'text-s-green' : 'text-s-red'}`}>
                {count}{type}
              </span>
            </div>
          ))}
      </div>
    </div>
  )
}

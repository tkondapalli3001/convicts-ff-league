'use client'

import { useLeague } from '@/context/LeagueContext'
import { getChampion, getShameLoser } from '@/lib/utils'

function computeSeed(rosterId: number, year: number, state: ReturnType<typeof useLeague>['state']): number | null {
  const rosters = state.rosters[year]
  if (!rosters?.length) return null
  const ranked = [...rosters]
    .map(r => ({
      roster_id: r.roster_id,
      wins: r.settings?.wins ?? 0,
      pf: (r.settings?.fpts ?? 0) + (r.settings?.fpts_decimal ?? 0) / 100,
    }))
    .sort((a, b) => b.wins - a.wins || b.pf - a.pf)
  const idx = ranked.findIndex(r => r.roster_id === rosterId)
  return idx >= 0 ? idx + 1 : null
}

function computeSeedFromOwnerSeasons(ownerName: string, year: number, state: ReturnType<typeof useLeague>['state']): number | null {
  // Use rosterUserMaps as the authoritative participant list for this year
  const rMap = state.rosterUserMaps[year] ?? {}
  const participants = [...new Set(Object.values(rMap))].filter(Boolean)
  const entries = participants
    .map(name => {
      const s = (state.ownerSeasons[name] ?? []).find(x => x.year === year)
      return s ? { name, wins: s.wins ?? 0, pf: s.pf ?? 0 } : null
    })
    .filter((x): x is { name: string; wins: number; pf: number } => x !== null)
    .sort((a, b) => b.wins - a.wins || b.pf - a.pf)
  const idx = entries.findIndex(x => x.name.toLowerCase() === ownerName.toLowerCase())
  return idx >= 0 ? idx + 1 : null
}

function findRosterId(ownerName: string, year: number, state: ReturnType<typeof useLeague>['state']): number | null {
  const rMap = state.rosterUserMaps[year] ?? {}
  const entry = Object.entries(rMap).find(([, v]) =>
    typeof v === 'string' && v.toLowerCase() === ownerName.toLowerCase()
  )
  return entry ? parseInt(entry[0]) : null
}

export default function TrophySection() {
  const { state } = useLeague()
  const { years } = state

  if (!years.length) return null

  const sortedYears = [...years].sort((a, b) => b - a)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px] mb-5">

      {/* Hall of Fame */}
      <div
        className="relative overflow-hidden rounded-[14px] border border-amber-500/15 p-[18px]"
        style={{ background: 'rgba(120, 53, 15, 0.12)', backdropFilter: 'blur(20px)' }}
      >
        {/* Corner flare */}
        <div
          className="absolute pointer-events-none top-[-20px] right-[-20px] w-[80px] h-[80px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 70%)' }}
        />
        <div className="relative z-10">
          <div className="text-[11px] font-bold tracking-[2.5px] uppercase text-amber-400/80 mb-3 flex items-center gap-2">
            <span>🏆</span> Hall of Fame — Champions
          </div>
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr>
                <th className="text-left py-[5px] pr-3 text-amber-500/40 border-b border-amber-500/10">Year</th>
                <th className="text-left py-[5px] pr-3 text-amber-500/40 border-b border-amber-500/10">Champion</th>
                <th className="text-right py-[5px] text-amber-500/40 border-b border-amber-500/10">Seed</th>
              </tr>
            </thead>
            <tbody>
              {sortedYears.map(year => {
                const c = getChampion(year, state)
                let seed: number | string | null = (c as { seed?: number | string | null }).seed ?? null
                if (seed == null && c.winner && c.winner !== '—') {
                  const rid = findRosterId(c.winner, year, state)
                  if (rid != null) seed = computeSeed(rid, year, state)
                  if (seed == null) seed = computeSeedFromOwnerSeasons(c.winner, year, state)
                }
                return (
                  <tr key={year} className="border-b border-amber-500/[0.06] last:border-0">
                    <td className="py-[7px] pr-3 text-amber-500/50 font-bold">{year}</td>
                    <td className="py-[7px] pr-3 font-extrabold text-[14px] text-amber-400">
                      {c.winner}
                      {(c as { shared?: boolean }).shared && (
                        <span className="ml-1 text-[9px] font-normal text-amber-500/40">(shared)</span>
                      )}
                    </td>
                    <td className="py-[7px] text-right text-amber-500/40 font-mono">
                      {seed != null ? `#${seed}` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Wall of Shame */}
      <div
        className="relative overflow-hidden rounded-[14px] border border-red-500/15 p-[18px]"
        style={{ background: 'rgba(127, 29, 29, 0.1)', backdropFilter: 'blur(20px)' }}
      >
        {/* Corner flare */}
        <div
          className="absolute pointer-events-none top-[-20px] right-[-20px] w-[80px] h-[80px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)' }}
        />
        <div className="relative z-10">
          <div className="text-[11px] font-bold tracking-[2.5px] uppercase text-red-400/70 mb-3 flex items-center gap-2">
            <span>🚽</span> Wall of Shame — Toilet Bowl
          </div>
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr>
                <th className="text-left py-[5px] pr-3 text-red-500/35 border-b border-red-500/10">Year</th>
                <th className="text-left py-[5px] pr-3 text-red-500/35 border-b border-red-500/10">Last Place</th>
                <th className="text-right py-[5px] text-red-500/35 border-b border-red-500/10">Seed</th>
              </tr>
            </thead>
            <tbody>
              {sortedYears.map(year => {
                const s = getShameLoser(year, state)
                let seed: number | null = (s as { seed?: number | null }).seed ?? null
                if (seed == null && s.loser && s.loser !== '—') {
                  const rid = findRosterId(s.loser, year, state)
                  if (rid != null) seed = computeSeed(rid, year, state)
                  if (seed == null) seed = computeSeedFromOwnerSeasons(s.loser, year, state)
                }
                return (
                  <tr key={year} className="border-b border-red-500/[0.06] last:border-0">
                    <td className="py-[7px] pr-3 text-red-500/40 font-bold">{year}</td>
                    <td className="py-[7px] pr-3 font-extrabold text-[14px] text-red-400">{s.loser}</td>
                    <td className="py-[7px] text-right text-red-500/35 font-mono">
                      {seed != null ? `#${seed}` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

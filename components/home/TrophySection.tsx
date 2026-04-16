'use client'

import { useLeague } from '@/context/LeagueContext'
import { getChampion, getShameLoser } from '@/lib/utils'

/** Derive a team's playoff seed by ranking all rosters in a year by wins then PF. */
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

/** Find the roster_id for a given owner name in a given year. */
function findRosterId(ownerName: string, year: number, state: ReturnType<typeof useLeague>['state']): number | null {
  const rMap = state.rosterUserMaps[year] ?? {}
  const entry = Object.entries(rMap).find(([, v]) => v === ownerName)
  return entry ? parseInt(entry[0]) : null
}

export default function TrophySection() {
  const { state } = useLeague()
  const { years } = state

  if (!years.length) return null

  const sortedYears = [...years].sort((a, b) => b - a) // latest first

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px] mb-5">

      {/* Hall of Fame */}
      <div className="bg-[#1a1000] border border-[#3a2400] rounded-[12px] p-[18px]">
        <div className="text-[10px] font-bold tracking-[3px] uppercase text-[#a37a1a] mb-3">
          🏆 Hall of Fame — Champions
        </div>
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="text-[10px] font-bold tracking-[1px] uppercase text-[#7a5a10] border-b border-[#3a2400]">
              <th className="text-left py-[5px] pr-3">Year</th>
              <th className="text-left py-[5px] pr-3">Champion</th>
              <th className="text-right py-[5px]">Seed</th>
            </tr>
          </thead>
          <tbody>
            {sortedYears.map(year => {
              const c = getChampion(year, state)
              // Use manual seed if present; otherwise compute from roster standings
              let seed: number | string | null = (c as { seed?: number | string | null }).seed ?? null
              if (seed == null && c.winner && c.winner !== '—') {
                const rid = findRosterId(c.winner, year, state)
                if (rid != null) seed = computeSeed(rid, year, state)
              }
              return (
                <tr key={year} className="border-b border-[#2a1800] last:border-0 hover:bg-[#221500] transition-colors">
                  <td className="py-[7px] pr-3 text-[#7a5a10] font-bold">{year}</td>
                  <td className="py-[7px] pr-3 font-extrabold text-s-gold">
                    {c.winner}
                    {(c as { shared?: boolean }).shared && (
                      <span className="ml-1 text-[9px] font-normal text-[#7a5a10]">(shared)</span>
                    )}
                  </td>
                  <td className="py-[7px] text-right text-[#7a5a10]">
                    {seed != null ? `#${seed}` : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Wall of Shame */}
      <div className="bg-[#1a0000] border border-[#3a0000] rounded-[12px] p-[18px]">
        <div className="text-[10px] font-bold tracking-[3px] uppercase text-[#7a1010] mb-3">
          🚽 Wall of Shame — Toilet Bowl
        </div>
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="text-[10px] font-bold tracking-[1px] uppercase text-[#5a1010] border-b border-[#3a0000]">
              <th className="text-left py-[5px] pr-3">Year</th>
              <th className="text-left py-[5px] pr-3">Last Place</th>
              <th className="text-right py-[5px]">Seed</th>
            </tr>
          </thead>
          <tbody>
            {sortedYears.map(year => {
              const s = getShameLoser(year, state)
              let seed: number | null = (s as { seed?: number | null }).seed ?? null
              if (seed == null && s.loser && s.loser !== '—') {
                const rid = findRosterId(s.loser, year, state)
                if (rid != null) {
                  // For shame losers, seed is their regular season rank (bottom = high seed number)
                  seed = computeSeed(rid, year, state)
                }
              }
              return (
                <tr key={year} className="border-b border-[#2a0000] last:border-0 hover:bg-[#220000] transition-colors">
                  <td className="py-[7px] pr-3 text-[#5a1010] font-bold">{year}</td>
                  <td className="py-[7px] pr-3 font-extrabold text-s-red">{s.loser}</td>
                  <td className="py-[7px] text-right text-[#5a1010]">
                    {seed != null ? `#${seed}` : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLeague } from '@/context/LeagueContext'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import SeasonStandings from '@/components/home/SeasonStandings'
import PlayoffBracket from '@/components/home/PlayoffBracket'
import HeroSection from '@/components/home/HeroSection'
import SparklineMini from '@/components/home/SparklineMini'
import SearchBar from '@/components/home/SearchBar'
import type { ManagerCardData } from '@/components/home/SearchBar'
import { getChampion, getShameLoser, ownerColor, avatarLetters } from '@/lib/utils'
import { MANUAL_CHAMPS, MANUAL_SHAME, EARNINGS_DATA, USER_ID_TO_OWNER } from '@/lib/constants'

// ─── Quick Stat Card ──────────────────────────────────────────────────────────

function StatChip({
  label,
  value,
  sub,
  accent,
  animClass,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: string
  animClass?: string
}) {
  return (
    <div className={`bento-card p-5 flex flex-col gap-1 ${animClass ?? ''}`}>
      <div className="text-[9px] font-bold tracking-[3px] uppercase text-s-text3 mb-1">{label}</div>
      <div
        className="text-[28px] md:text-[32px] font-black leading-none tracking-tight"
        style={accent ? { color: accent } : { color: '#e6edf3' }}
      >
        {value}
      </div>
      {sub && <div className="text-[11px] text-s-text2 font-medium mt-0.5">{sub}</div>}
    </div>
  )
}

// ─── Home Page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { state } = useLeague()
  const { loaded, error, allMatchups, ownerSeasons, years, leagueChain } = state
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [standingsOpen, setStandingsOpen] = useState(false)
  const router = useRouter()

  // All-time career stats per owner (enriched with bestSeason for SearchBar)
  const careerData = useMemo<ManagerCardData[]>(() => {
    const canonicalNames = [...new Set(Object.values(USER_ID_TO_OWNER))]
    return canonicalNames
      .filter(n => ownerSeasons[n])
      .map(name => {
        const seasons = ownerSeasons[name] || []
        const allW = seasons.reduce((a, s) => a + s.wins, 0)
        const allL = seasons.reduce((a, s) => a + s.losses, 0)
        const winpct = allW / (allW + allL || 1)
        const avgPF = seasons.length
          ? seasons.reduce((a, s) => a + s.pf, 0) / seasons.length
          : 0
        const playoffApps = seasons.filter(s => s.inPlayoffs).length
        const champs = MANUAL_CHAMPS.filter(c => c.winner?.includes(name))
          .reduce((sum, c) => sum + (c.half ? 0.5 : 1), 0)
        const shame = MANUAL_SHAME.filter(s => s.loser === name).length
        const earn = EARNINGS_DATA.find(e => e.owner === name)

        // Sparkline: win% per season, oldest → newest
        const sparkData = [...seasons]
          .sort((a, b) => a.year - b.year)
          .map(s => (s.wins / (s.wins + s.losses || 1)) * 100)

        // Best season by win%
        const eligibleSeasons = seasons.filter(s => s.wins + s.losses > 0)
        const bestSeason = eligibleSeasons.length
          ? eligibleSeasons.reduce((best, s) => {
              const pct = s.wins / (s.wins + s.losses)
              const bestPct = best.wins / (best.wins + best.losses)
              return pct > bestPct ? s : best
            })
          : null

        return {
          name,
          allW,
          allL,
          winpct,
          avgPF,
          playoffApps,
          champs,
          shame,
          numSeasons: seasons.length,
          earn: earn?.total ?? null,
          sparkData,
          bestSeasonYear: bestSeason?.year ?? null,
          bestSeasonWins: bestSeason?.wins ?? null,
          bestSeasonLosses: bestSeason?.losses ?? null,
          bestSeasonFinish: bestSeason?.finish ?? null,
        }
      })
      .sort((a, b) => b.winpct - a.winpct)
  }, [ownerSeasons])

  // All-time high score
  const { highScore, highScoreOwner } = useMemo(() => {
    let high = 0
    let owner = ''
    for (const m of allMatchups) {
      if (m.pts1 > high) { high = m.pts1; owner = m.team1 }
      if (m.pts2 > high) { high = m.pts2; owner = m.team2 }
    }
    return { highScore: high, highScoreOwner: owner }
  }, [allMatchups])

  // Derived quick stats
  const topWinPct  = careerData[0]
  const mostChamps = [...careerData].sort((a, b) => b.champs - a.champs)[0]

  // Current champion (most recent season)
  const latestYear  = years.length ? years[years.length - 1] : null
  const champRecord = latestYear ? getChampion(latestYear, state) : null
  const champName   = champRecord?.winner ?? 'TBD'
  const champHex    = ownerColor(champName)

  const sortedYears = [...years].sort((a, b) => b - a)

  if (error)   return <ErrorState error={error} />
  if (!loaded) return <LoadingSpinner />

  return (
    <div className="space-y-4">

      {/* ── SEARCH BAR ───────────────────────────────────────────── */}
      <div className="animate-fade-in">
        <SearchBar managerData={careerData} />
      </div>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <HeroSection
        highScore={highScore}
        highScoreOwner={highScoreOwner}
        highScoreOwnerColor={ownerColor(highScoreOwner)}
        champName={champName}
        champColor={champHex}
        totalSeasons={leagueChain.length}
        totalGames={allMatchups.length}
        yearRange={
          years.length >= 2
            ? `${years[0]}–${years[years.length - 1]}`
            : String(years[0] ?? '')
        }
      />

      {/* ── QUICK STAT CHIPS ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatChip
          label="Seasons"
          value={leagueChain.length}
          sub={`${years[0]}–${years[years.length - 1]}`}
          accent="#00ceb8"
          animClass="animate-fade-in-1"
        />
        <StatChip
          label="Total Matchups"
          value={allMatchups.length}
          sub={`${(allMatchups.length / leagueChain.length).toFixed(0)} avg per season`}
          accent="#f59e0b"
          animClass="animate-fade-in-2"
        />
        <StatChip
          label="Top Win Rate"
          value={topWinPct ? `${(topWinPct.winpct * 100).toFixed(1)}%` : '—'}
          sub={topWinPct?.name}
          accent={topWinPct ? ownerColor(topWinPct.name) : '#00ceb8'}
          animClass="animate-fade-in-3"
        />
        <StatChip
          label="Most Champs"
          value={mostChamps?.champs > 0 ? `${mostChamps.champs}× 🏆` : '—'}
          sub={mostChamps?.name}
          accent={mostChamps ? ownerColor(mostChamps.name) : '#f59e0b'}
          animClass="animate-fade-in-4"
        />
      </div>

      {/* ── MAIN BENTO GRID ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-in-5">

        {/* ── CAREER LEADERBOARD (2/3 width) ─────────────────────── */}
        <div className="lg:col-span-2 bento-card">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-s-border/60">
            <div className="text-[10px] font-bold tracking-[3px] uppercase text-s-text3">
              All-Time Career Standings
            </div>
            <div className="text-[9px] text-s-text3 font-medium hidden sm:block">
              Click a row to view profile
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[480px]">
              <thead>
                <tr>
                  <th className="w-10 text-center">#</th>
                  <th>Manager</th>
                  <th className="hidden sm:table-cell text-center">Trend</th>
                  <th>W–L</th>
                  <th>Win%</th>
                  <th className="hidden md:table-cell text-center">🏆</th>
                  <th className="hidden md:table-cell text-right">Net $</th>
                </tr>
              </thead>
              <tbody>
                {careerData.map((d, i) => {
                  const color = ownerColor(d.name)
                  const sparkFirst = d.sparkData[0] ?? 0
                  const sparkLast  = d.sparkData[d.sparkData.length - 1] ?? 0
                  const trendColor = sparkLast >= sparkFirst ? '#00ceb8' : '#ff395c'

                  const rankColors = [
                    'bg-[#3d2000]/80 text-s-gold border border-[#5a3000]/60',
                    'bg-[#1c2430]/80 text-[#8b949e] border border-[#3d444d]/60',
                    'bg-[#1a1200]/80 text-[#cd7f32] border border-[#3d2d00]/60',
                  ]
                  const rankCls = i < 3 ? rankColors[i] : 'bg-s-bg3/60 text-s-text3 border border-s-border/40'

                  return (
                    <tr
                      key={d.name}
                      onClick={() => router.push(`/owners/${encodeURIComponent(d.name)}`)}
                    >
                      <td className="text-center">
                        <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[10px] font-extrabold ${rankCls}`}>
                          {i + 1}
                        </span>
                      </td>

                      <td>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-[12px] font-black text-white leading-none"
                            style={{
                              background: color,
                              boxShadow: `0 0 0 2px #0e1117, 0 0 14px ${color}55`,
                            }}
                          >
                            {avatarLetters(d.name)}
                          </div>
                          <div>
                            <div className="text-[13px] font-bold text-s-text leading-none">{d.name}</div>
                            <div className="text-[10px] text-s-text3 mt-0.5">
                              {d.numSeasons} season{d.numSeasons !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="hidden sm:table-cell">
                        <div className="flex justify-center">
                          <SparklineMini data={d.sparkData} color={trendColor} />
                        </div>
                      </td>

                      <td>
                        <span className="text-s-green font-bold text-[13px]">{d.allW}</span>
                        <span className="text-s-text3 mx-1 text-[11px]">–</span>
                        <span className="text-s-red text-[13px]">{d.allL}</span>
                      </td>

                      <td>
                        <span
                          className="text-[13px] font-bold"
                          style={{
                            color:
                              d.winpct >= 0.55
                                ? '#00ceb8'
                                : d.winpct >= 0.45
                                ? '#8b949e'
                                : '#ff395c',
                          }}
                        >
                          {(d.winpct * 100).toFixed(1)}%
                        </span>
                      </td>

                      <td className="hidden md:table-cell text-center">
                        {d.champs > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#3d2000]/50 text-s-gold border border-[#5a3200]/50">
                            🏆 {d.champs % 1 === 0 ? d.champs : d.champs.toFixed(1)}×
                          </span>
                        ) : (
                          <span className="text-s-text3 text-[11px]">—</span>
                        )}
                      </td>

                      <td className="hidden md:table-cell text-right">
                        {d.earn != null ? (
                          <span
                            className="text-[12px] font-bold"
                            style={{ color: d.earn >= 0 ? '#2ea043' : '#f85149' }}
                          >
                            {d.earn >= 0 ? '+' : ''}${d.earn}
                          </span>
                        ) : (
                          <span className="text-s-text3 text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── RIGHT COLUMN: HOF + SHAME ───────────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* Hall of Fame */}
          <div className="bento-card flex-1">
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
                      <span className="text-[13px] font-extrabold text-s-gold">{c.winner}</span>
                      {(c as { shared?: boolean }).shared && (
                        <span className="text-[9px] text-[#7a5a10] font-medium">(shared)</span>
                      )}
                    </div>
                    {(c as { seed?: number | string | null }).seed != null && (
                      <span className="text-[10px] text-[#7a5a10] font-bold">
                        #{(c as { seed?: number | string | null }).seed}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Wall of Shame */}
          <div className="bento-card flex-1">
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
                      <span className="text-[13px] font-extrabold text-s-red">{s.loser}</span>
                    </div>
                    {(s as { seed?: number | null }).seed != null && (
                      <span className="text-[10px] text-[#5a1010] font-bold">
                        #{(s as { seed?: number | null }).seed}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── SEASON-BY-SEASON (collapsible) ───────────────────────── */}
      <div className="animate-fade-in-6">
        <button
          onClick={() => setStandingsOpen(o => !o)}
          className="w-full flex items-center justify-between px-5 py-4 bento-card hover:border-s-border2 transition-colors duration-150 text-left"
        >
          <span className="text-[10px] font-bold tracking-[3px] uppercase text-s-text3">
            Season-by-Season Standings
          </span>
          <span
            className="text-s-text3 text-[14px] leading-none transition-transform duration-200"
            style={{
              display: 'inline-block',
              transform: standingsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            ▾
          </span>
        </button>

        {standingsOpen && (
          <div className="mt-3 space-y-3">
            <SeasonStandings onYearChange={setSelectedYear} />
            {selectedYear !== null && <PlayoffBracket year={selectedYear} />}
          </div>
        )}
      </div>
    </div>
  )
}

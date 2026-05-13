'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useLeague } from '@/context/LeagueContext'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import HeroSection from '@/components/home/HeroSection'
import SearchBar from '@/components/home/SearchBar'
import type { ManagerCardData } from '@/components/home/SearchBar'
import { getChampion, getShameLoser, getRunnerUp, ownerColor, avatarLetters, fullNameInitials } from '@/lib/utils'
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
  const router = useRouter()

  // All-time career stats per owner (enriched for SearchBar)
  const careerData = useMemo<ManagerCardData[]>(() => {
    const canonicalNames = [...new Set(Object.values(USER_ID_TO_OWNER))]
    return canonicalNames
      .filter(n => ownerSeasons[n] && n !== 'Sangram' && n !== 'Hamza')
      .map(name => {
        const seasons = ownerSeasons[name] || []
        const allW = seasons.reduce((a, s) => a + s.wins, 0)
        const allL = seasons.reduce((a, s) => a + s.losses, 0)
        const winpct = allW / (allW + allL || 1)
        const totalPF = seasons.reduce((a, s) => a + s.pf, 0)
        const avgPF = seasons.length ? totalPF / seasons.length : 0
        const avgPFperGame = (allW + allL) > 0 ? totalPF / (allW + allL) : 0
        const playoffApps = seasons.filter(s => s.inPlayoffs).length
        const champs = MANUAL_CHAMPS.filter(c => c.winner?.includes(name))
          .reduce((sum, c) => sum + (c.half ? 0.5 : 1), 0)
        const shame = MANUAL_SHAME.filter(s => s.loser === name).length
        const earn = EARNINGS_DATA.find(e => e.owner === name)

        const sparkData = [...seasons]
          .sort((a, b) => a.year - b.year)
          .map(s => (s.wins / (s.wins + s.losses || 1)) * 100)

        const eligibleSeasons = seasons.filter(s => s.wins + s.losses > 0)
        const bestSeason = eligibleSeasons.length
          ? eligibleSeasons.reduce((best, s) => {
              const pct = s.wins / (s.wins + s.losses)
              const bestPct = best.wins / (best.wins + best.losses)
              if (pct !== bestPct) return pct > bestPct ? s : best
              const sFinish = s.finish ?? Infinity
              const bestFinish = best.finish ?? Infinity
              return sFinish < bestFinish ? s : best
            })
          : null

        // Per-owner matchup stats
        const ownerMatchups = allMatchups.filter(m => m.team1 === name || m.team2 === name)
        let singleGameHigh: number | null = null
        let singleGameLow: number | null = null
        for (const m of ownerMatchups) {
          const pts = m.team1 === name ? m.pts1 : m.pts2
          if (pts > 0) {
            if (singleGameHigh === null || pts > singleGameHigh) singleGameHigh = pts
            if (singleGameLow === null || pts < singleGameLow) singleGameLow = pts
          }
        }

        const lossesTo: Record<string, number> = {}
        for (const m of ownerMatchups) {
          if (m.loser === name && m.winner !== name) {
            lossesTo[m.winner] = (lossesTo[m.winner] ?? 0) + 1
          }
        }
        const topRivalEntry = Object.entries(lossesTo).sort((a, b) => b[1] - a[1])[0]
        const topRival = topRivalEntry ? topRivalEntry[0] : null

        return {
          name,
          allW,
          allL,
          winpct,
          avgPF,
          avgPFperGame,
          totalPF,
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
          topRival,
          singleGameHigh,
          singleGameLow,
        }
      })
      // Primary: win%, Secondary: total PF
      .sort((a, b) => {
        const diff = b.winpct - a.winpct
        if (Math.abs(diff) > 0.0001) return diff
        return b.totalPF - a.totalPF
      })
  }, [ownerSeasons, allMatchups])

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

  // Current season winner / runner-up / shame loser
  const latestYear     = years.length ? years[years.length - 1] : null
  const champRecord    = latestYear ? getChampion(latestYear, state) : null
  const runnerUpRecord = latestYear ? getRunnerUp(latestYear, state) : null
  const shameRecord    = latestYear ? getShameLoser(latestYear, state) : null

  const champName    = champRecord?.winner ?? 'TBD'
  const champColor   = ownerColor(champName)
  const runnerUpName = runnerUpRecord?.name ?? '—'
  const runnerUpColor = ownerColor(runnerUpName)
  const shameName    = shameRecord?.loser ?? '—'
  const shameColor   = ownerColor(shameName)

  const sortedYears = [...years].sort((a, b) => b - a)

  if (error)   return <ErrorState error={error} />
  if (!loaded) return <LoadingSpinner />

  return (
    <div className="space-y-4">

      {/* ── SEARCH BAR ───────────────────────────────────────────── */}
      <div className="animate-fade-in relative z-10">
        <SearchBar managerData={careerData} />
      </div>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <HeroSection
        champName={champName}
        champColor={champColor}
        runnerUpName={runnerUpName}
        runnerUpColor={runnerUpColor}
        shameName={shameName}
        shameColor={shameColor}
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
          label="All-Time High Score"
          value={highScore > 0 ? highScore.toFixed(2) : '—'}
          sub={highScoreOwner || undefined}
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
        <div className="lg:col-span-2 bento-card" style={{ overflow: 'visible' }}>
          <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-s-border/60">
            <div className="text-[10px] font-bold tracking-[3px] uppercase text-s-text3">
              All-Time Career Standings
            </div>
            <div className="text-[9px] text-s-text3 font-medium hidden sm:block">
              Click a row to view profile
            </div>
          </div>

          <div className="relative">
            <div className="overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full border-collapse min-w-[560px] ss-table">
              <thead>
                <tr>
                  <th className="w-10 text-center">#</th>
                  <th className="sticky left-0 z-10 border-r border-white/[0.06]" style={{ background: '#0d121b' }}>Manager</th>
                  <th>W–L</th>
                  <th>Win%</th>
                  <th className="text-right">Avg PPG</th>
                  <th className="text-center">🏆</th>
                  <th className="text-right">Net $</th>
                </tr>
              </thead>
              <tbody>
                {careerData.map((d, i) => {
                  const color = ownerColor(d.name)
                  const avatarUrl = state.ownerAvatarMap?.[d.name]

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
                      className="hover:bg-indigo-500/10 transition-colors"
                    >
                      <td className="text-center">
                        <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[10px] font-extrabold ${rankCls}`}>
                          {i + 1}
                        </span>
                      </td>

                      <td className="sticky-owner sticky left-0 z-[1] border-r border-white/[0.06]">
                        <div className="flex items-center gap-3">
                          {/* Avatar: Sleeper image or gradient initials */}
                          {avatarUrl ? (
                            <div
                              className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden"
                              style={{ boxShadow: `0 0 0 2px #0e1117, 0 0 14px ${color}55` }}
                            >
                              <img src={avatarUrl} alt={d.name} className="w-full h-full object-cover"
                                onError={e => {
                                  const el = e.currentTarget.parentElement!
                                  el.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;color:#fff;background:linear-gradient(135deg,${color} 0%,${color}88 100%)">${fullNameInitials(d.name)}</div>`
                                }} />
                            </div>
                          ) : (
                            <div
                              className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-[12px] font-black text-white leading-none"
                              style={{
                                background: `linear-gradient(135deg, ${color} 0%, ${color}88 100%)`,
                                boxShadow: `0 0 0 2px #0e1117, 0 0 14px ${color}55`,
                              }}
                            >
                              {fullNameInitials(d.name)}
                            </div>
                          )}
                          <div>
                            <div className="text-[13px] font-bold text-s-text leading-none">{d.name}</div>
                            <div className="text-[10px] text-s-text3 mt-0.5">
                              {d.numSeasons} season{d.numSeasons !== 1 ? 's' : ''}
                            </div>
                          </div>
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
                            color: d.winpct >= 0.55 ? '#00ceb8' : d.winpct >= 0.45 ? '#8b949e' : '#ff395c',
                          }}
                        >
                          {(d.winpct * 100).toFixed(1)}%
                        </span>
                      </td>

                      <td className="text-right">
                        <span className="text-[13px] font-bold text-s-text2 num">
                          {d.avgPFperGame.toFixed(1)}
                        </span>
                      </td>

                      <td className="text-center">
                        {d.champs > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#3d2000]/50 text-s-gold border border-[#5a3200]/50">
                            🏆 {d.champs % 1 === 0 ? d.champs : d.champs.toFixed(1)}×
                          </span>
                        ) : (
                          <span className="text-s-text3 text-[11px]">—</span>
                        )}
                      </td>

                      <td className="text-right">
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
            <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-r from-transparent to-[rgba(11,14,17,0.85)] z-10" />
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
        </div>
      </div>

    </div>
  )
}

'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useLeague } from '@/context/LeagueContext'
import { useCareerStats } from '@/hooks/useCareerStats'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import HeroSection from '@/components/home/HeroSection'
import SearchBar from '@/components/home/SearchBar'
import { getChampion, getShameLoser, getRunnerUp, ownerColor, avatarLetters, fullNameInitials } from '@/lib/utils'

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
    <div className={`bento-card relative p-5 flex flex-col gap-1 ${animClass ?? ''}`}>
      {accent && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: -32, right: -32,
            width: 110, height: 110,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${accent}28 0%, transparent 70%)`,
          }}
        />
      )}
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
  const [sortKey, setSortKey] = useState<'wins' | 'winpct' | 'avgPPG' | 'champs' | 'earn'>('winpct')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // All-time career stats per owner (shared engine — also feeds SearchBar)
  const careerData = useCareerStats()

  const displayData = useMemo(() => {
    return [...careerData].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'wins') return dir * (a.allW - b.allW)
      if (sortKey === 'winpct') return dir * (a.winpct - b.winpct)
      if (sortKey === 'avgPPG') return dir * (a.avgPFperGame - b.avgPFperGame)
      if (sortKey === 'champs') return dir * (a.champs - b.champs)
      if (a.earn === null && b.earn === null) return 0
      if (a.earn === null) return 1
      if (b.earn === null) return -1
      return dir * (a.earn - b.earn)
    })
  }, [careerData, sortKey, sortDir])

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

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }
  const icon = (key: typeof sortKey) => sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

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
                  <th onClick={() => toggleSort('wins')} className="cursor-pointer select-none hover:text-s-text2">W–L{icon('wins')}</th>
                  <th onClick={() => toggleSort('winpct')} className="cursor-pointer select-none hover:text-s-text2">Win%{icon('winpct')}</th>
                  <th onClick={() => toggleSort('avgPPG')} className="text-right cursor-pointer select-none hover:text-s-text2">Avg PPG{icon('avgPPG')}</th>
                  <th onClick={() => toggleSort('champs')} className="text-center cursor-pointer select-none hover:text-s-text2">🏆{icon('champs')}</th>
                  <th onClick={() => toggleSort('earn')} className="text-right cursor-pointer select-none hover:text-s-text2">Net ${icon('earn')}</th>
                </tr>
              </thead>
              <tbody>
                {displayData.map((d, i) => {
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

          {/* Wall of Shame */}
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
        </div>
      </div>

    </div>
  )
}

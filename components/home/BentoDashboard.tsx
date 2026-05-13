'use client'

import { useMemo } from 'react'
import {
  Trophy, TrendingUp, Zap, Flame,
  DollarSign, Swords, BarChart3, Crown, Shield,
} from 'lucide-react'
import BentoCard, { BENTO_CONFIGS, type GradientColor, type BentoConfig } from '@/components/shared/BentoCard'
import { useLeague } from '@/context/LeagueContext'
import { useRecordsData } from '@/hooks/useRecordsData'
import { MANUAL_CHAMPS, EARNINGS_DATA } from '@/lib/constants'
import { fmtPts, ownerColor } from '@/lib/utils'

// ─── Local types ──────────────────────────────────────────────────────────────

interface ChampEntry { name: string; count: number }

interface CareerStat {
  owner: string
  wins: number
  losses: number
  games: number
  pf: number
  winPct: number
  avgPf: number
  playoffCount: number
  seasonCount: number
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function CardLabel({ text }: { text: string }) {
  return (
    <span className="text-[9px] font-black tracking-[3px] uppercase select-none"
      style={{ color: 'rgba(148,163,184,0.5)' }}>
      {text}
    </span>
  )
}

function DuoIcon({ icon: Icon, cfg, size = 14 }: {
  icon: React.ElementType; cfg: BentoConfig; size?: number
}) {
  return (
    <div className="rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: cfg.iconBg, width: 34, height: 34 }}>
      <Icon size={size} style={{ color: cfg.accent }} />
    </div>
  )
}

/** Large, glowing gradient number — the visual centerpiece of each stat card. */
function GlowNum({ value, color, className = 'text-[30px]' }: {
  value: string; color: string; className?: string
}) {
  return (
    <span
      className={`${className} font-black tabular-nums leading-none`}
      style={{
        background: `linear-gradient(145deg, ${color} 20%, ${color}99 100%)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        filter: `drop-shadow(0 0 10px ${color}55)`,
      }}
    >
      {value}
    </span>
  )
}

function fmtEarnings(n: number): string {
  return (n >= 0 ? '+$' : '-$') + Math.abs(n)
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BentoDashboard() {
  const { state } = useLeague()
  const { ownerSeasons, loaded } = state
  const records = useRecordsData()

  // Championship counts
  const champData = useMemo<ChampEntry[]>(() => {
    const counts: Record<string, number> = {}
    MANUAL_CHAMPS.forEach(c => {
      counts[c.winner] = (counts[c.winner] || 0) + (c.half ? 0.5 : 1)
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }))
  }, [])

  const latestChamp = MANUAL_CHAMPS[0]

  // Aggregate career stats per owner
  const careerStats = useMemo<CareerStat[]>(() => {
    return Object.entries(ownerSeasons).map(([owner, seasons]) => {
      const wins = seasons.reduce((s, x) => s + x.wins, 0)
      const losses = seasons.reduce((s, x) => s + x.losses, 0)
      const pf = seasons.reduce((s, x) => s + x.pf, 0)
      const games = wins + losses
      return {
        owner, wins, losses, games, pf,
        winPct: games ? wins / games : 0,
        avgPf: games ? pf / games : 0,
        playoffCount: seasons.filter(s => s.inPlayoffs).length,
        seasonCount: seasons.length,
      }
    })
  }, [ownerSeasons])

  const winRateLeader = useMemo(() =>
    [...careerStats].filter(s => s.games >= 60).sort((a, b) => b.winPct - a.winPct)[0]
  , [careerStats])

  const avgPfLeader = useMemo(() =>
    [...careerStats].filter(s => s.games >= 60).sort((a, b) => b.avgPf - a.avgPf)[0]
  , [careerStats])

  const playoffLeader = useMemo(() =>
    [...careerStats].filter(s => s.games > 0).sort((a, b) => b.playoffCount - a.playoffCount)[0]
  , [careerStats])

  const earningsLeader = useMemo(() =>
    [...EARNINGS_DATA].sort((a, b) => b.total - a.total)[0]
  , [])

  const earningsPodium = useMemo(() =>
    [...EARNINGS_DATA].sort((a, b) => b.total - a.total).slice(0, 3)
  , [])

  // Head-to-head record for the top rivalry pair
  const { rv1, rv2 } = records
  const rivalryRecord = useMemo(() => {
    const games = records.filteredMatchups.filter(
      m => (m.team1 === rv1 && m.team2 === rv2) || (m.team1 === rv2 && m.team2 === rv1)
    )
    const rv1Wins = games.filter(m => m.winner === rv1).length
    const rv2Wins = games.filter(m => m.winner === rv2).length
    return { rv1Wins, rv2Wins, total: games.length }
  }, [records.filteredMatchups, rv1, rv2])

  const topStreak = records.topWinStreaks[0]
  const highScore = records.highScore

  if (!loaded || !winRateLeader || !topStreak || !highScore) return null

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen px-4 py-8 md:px-6 lg:px-8"
      style={{ background: '#0B0E11' }}>
      <div className="max-w-[1200px] mx-auto space-y-4">

        {/* Page header */}
        <div className="mb-8">
          <p className="text-[10px] font-black tracking-[3px] uppercase mb-1"
            style={{ color: 'rgba(139,92,246,0.7)' }}>
            Convicts FF · 7 Seasons
          </p>
          <h1 className="text-[28px] font-black tracking-tight leading-none"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.5) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
            League Command Center
          </h1>
        </div>

        {/* ── Row 1: Hero + Side Stack ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* HERO */}
          <BentoCard gradientColor="purple" className="lg:col-span-2 min-h-[320px]">
            {/* Stronger hero-specific gradient */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.20) 0%, rgba(59,130,246,0.09) 55%, transparent 100%)',
            }} />
            {/* Dot-grid texture */}
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)',
              backgroundSize: '22px 22px',
            }} />
            {/* Watermark trophy */}
            <Trophy size={220} strokeWidth={0.4} className="absolute -bottom-12 -right-8 pointer-events-none"
              style={{ color: '#8b5cf6', opacity: 0.045 }} />

            <div className="relative p-6 flex flex-col gap-5 h-full">
              {/* Label row */}
              <div className="flex items-center gap-2.5">
                <DuoIcon icon={Trophy} cfg={BENTO_CONFIGS.purple} />
                <CardLabel text="Reigning Champion" />
              </div>

              {/* Champion name — gradient text with glow */}
              <div>
                <div className="text-5xl lg:text-[60px] font-black tracking-tight leading-none"
                  style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, rgba(139,92,246,0.85) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter: 'drop-shadow(0 0 24px rgba(139,92,246,0.35))',
                  }}>
                  {latestChamp.winner}
                </div>
                <div className="mt-2 text-[14px] font-bold tracking-wide"
                  style={{ color: '#f59e0b', filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.4))' }}>
                  {latestChamp.year} Season Champion
                  {latestChamp.seed ? ` · Seed ${latestChamp.seed}` : ''}
                </div>
              </div>

              {/* Title leaderboard */}
              <div>
                <CardLabel text="All-Time Title Leaders" />
                <div className="mt-2.5 space-y-2">
                  {champData.slice(0, 4).map((c, i) => (
                    <div key={c.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black w-3 tabular-nums"
                          style={{ color: 'rgba(100,116,139,0.6)' }}>
                          {i + 1}
                        </span>
                        <span className="text-[13px] font-bold"
                          style={{ color: ownerColor(c.name), filter: `drop-shadow(0 0 6px ${ownerColor(c.name)}55)` }}>
                          {c.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: Math.floor(c.count) }).map((_, j) => (
                          <Crown key={j} size={10} style={{ color: '#f59e0b' }} />
                        ))}
                        {c.count % 1 !== 0 && (
                          <span className="text-[9px] font-black" style={{ color: '#92400e' }}>½</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* All-Time High Score footer strip */}
              <div className="mt-auto pt-4"
                style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <CardLabel text="All-Time High Score" />
                <div className="mt-1.5 flex items-baseline gap-3 flex-wrap">
                  <GlowNum
                    value={fmtPts(highScore.pts)}
                    color="#f43f5e"
                    className="text-[32px]"
                  />
                  <span className="text-[11px] font-semibold" style={{ color: 'rgba(148,163,184,0.5)' }}>
                    {highScore.owner} · {highScore.year} Wk{highScore.week}
                  </span>
                </div>
              </div>
            </div>
          </BentoCard>

          {/* Side stack */}
          <div className="flex flex-col gap-4">

            {/* Trophy Cabinet */}
            <BentoCard gradientColor="gold" className="flex-1">
              <Crown size={110} strokeWidth={0.4} className="absolute -top-4 -right-4 pointer-events-none"
                style={{ color: '#f59e0b', opacity: 0.05 }} />
              <div className="relative p-5 flex flex-col gap-3 h-full">
                <div className="flex items-center gap-2.5">
                  <DuoIcon icon={Crown} cfg={BENTO_CONFIGS.gold} />
                  <CardLabel text="Trophy Cabinet" />
                </div>
                <div className="space-y-1.5 mt-1">
                  {champData.map(c => (
                    <div key={c.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-[3px] h-3.5 rounded-full flex-shrink-0"
                          style={{ background: ownerColor(c.name), boxShadow: `0 0 5px ${ownerColor(c.name)}66` }} />
                        <span className="text-[12px] font-semibold" style={{ color: 'rgba(226,232,240,0.85)' }}>
                          {c.name}
                        </span>
                      </div>
                      <span className="text-[12px] font-black tabular-nums"
                        style={{ color: '#f59e0b', filter: 'drop-shadow(0 0 4px rgba(245,158,11,0.4))' }}>
                        {c.count}×
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </BentoCard>

            {/* Earnings King */}
            <BentoCard gradientColor="green" className="flex-1">
              <DollarSign size={100} strokeWidth={0.4} className="absolute -bottom-5 -right-3 pointer-events-none"
                style={{ color: '#22c55e', opacity: 0.05 }} />
              <div className="relative p-5 flex flex-col gap-3 h-full">
                <div className="flex items-center gap-2.5">
                  <DuoIcon icon={DollarSign} cfg={BENTO_CONFIGS.green} />
                  <CardLabel text="Earnings King" />
                </div>
                <div>
                  <div className="text-[22px] font-black leading-none"
                    style={{ color: ownerColor(earningsLeader.owner), filter: `drop-shadow(0 0 8px ${ownerColor(earningsLeader.owner)}55)` }}>
                    {earningsLeader.owner}
                  </div>
                  <GlowNum value={fmtEarnings(earningsLeader.total)} color="#22c55e" className="text-[26px] mt-0.5" />
                </div>
                <div className="space-y-1.5 mt-auto pt-3"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  {earningsPodium.slice(1).map(e => (
                    <div key={e.owner} className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold" style={{ color: 'rgba(148,163,184,0.65)' }}>
                        {e.owner}
                      </span>
                      <span className="text-[11px] font-black tabular-nums"
                        style={{ color: e.total >= 0 ? '#22c55e' : '#ef4444' }}>
                        {fmtEarnings(e.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </BentoCard>
          </div>
        </div>

        {/* ── Row 2: Four Stat Cards ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Win Rate Leader */}
          <BentoCard gradientColor="blue">
            <TrendingUp size={90} strokeWidth={0.4} className="absolute -bottom-4 -right-4 pointer-events-none"
              style={{ color: '#3b82f6', opacity: 0.06 }} />
            <div className="relative p-5 flex flex-col gap-2.5 h-full">
              <div className="flex items-center gap-2">
                <DuoIcon icon={TrendingUp} cfg={BENTO_CONFIGS.blue} />
                <CardLabel text="Win Rate Leader" />
              </div>
              <GlowNum
                value={`${(winRateLeader.winPct * 100).toFixed(1)}%`}
                color="#3b82f6"
                className="text-[30px] mt-1"
              />
              <div>
                <div className="text-[13px] font-bold"
                  style={{ color: ownerColor(winRateLeader.owner), filter: `drop-shadow(0 0 5px ${ownerColor(winRateLeader.owner)}55)` }}>
                  {winRateLeader.owner}
                </div>
                <div className="text-[10px] mt-0.5 font-semibold tabular-nums"
                  style={{ color: 'rgba(100,116,139,0.7)' }}>
                  {winRateLeader.wins}W – {winRateLeader.losses}L
                </div>
              </div>
            </div>
          </BentoCard>

          {/* All-Time High Score */}
          <BentoCard gradientColor="rose">
            <Zap size={90} strokeWidth={0.4} className="absolute -bottom-4 -right-4 pointer-events-none"
              style={{ color: '#f43f5e', opacity: 0.06 }} />
            <div className="relative p-5 flex flex-col gap-2.5 h-full">
              <div className="flex items-center gap-2">
                <DuoIcon icon={Zap} cfg={BENTO_CONFIGS.rose} />
                <CardLabel text="All-Time High" />
              </div>
              <GlowNum value={fmtPts(highScore.pts)} color="#f43f5e" className="text-[30px] mt-1" />
              <div>
                <div className="text-[13px] font-bold"
                  style={{ color: ownerColor(highScore.owner), filter: `drop-shadow(0 0 5px ${ownerColor(highScore.owner)}55)` }}>
                  {highScore.owner}
                </div>
                <div className="text-[10px] mt-0.5 font-semibold"
                  style={{ color: 'rgba(100,116,139,0.7)' }}>
                  {highScore.year} · Week {highScore.week}
                </div>
              </div>
            </div>
          </BentoCard>

          {/* Longest Win Streak */}
          <BentoCard gradientColor="gold">
            <Flame size={90} strokeWidth={0.4} className="absolute -bottom-4 -right-4 pointer-events-none"
              style={{ color: '#f59e0b', opacity: 0.06 }} />
            <div className="relative p-5 flex flex-col gap-2.5 h-full">
              <div className="flex items-center gap-2">
                <DuoIcon icon={Flame} cfg={BENTO_CONFIGS.gold} />
                <CardLabel text="Longest Win Streak" />
              </div>
              <GlowNum value={`${topStreak.streak}W`} color="#f59e0b" className="text-[30px] mt-1" />
              <div>
                <div className="text-[13px] font-bold"
                  style={{ color: ownerColor(topStreak.owner), filter: `drop-shadow(0 0 5px ${ownerColor(topStreak.owner)}55)` }}>
                  {topStreak.owner}
                </div>
                <div className="text-[10px] mt-0.5 font-semibold"
                  style={{ color: 'rgba(100,116,139,0.7)' }}>
                  {topStreak.startYear}–{topStreak.endYear}
                </div>
              </div>
            </div>
          </BentoCard>

          {/* Scoring Machine */}
          <BentoCard gradientColor="teal">
            <BarChart3 size={90} strokeWidth={0.4} className="absolute -bottom-4 -right-4 pointer-events-none"
              style={{ color: '#14b8a6', opacity: 0.06 }} />
            <div className="relative p-5 flex flex-col gap-2.5 h-full">
              <div className="flex items-center gap-2">
                <DuoIcon icon={BarChart3} cfg={BENTO_CONFIGS.teal} />
                <CardLabel text="Scoring Machine" />
              </div>
              <GlowNum
                value={avgPfLeader ? avgPfLeader.avgPf.toFixed(1) : '—'}
                color="#14b8a6"
                className="text-[30px] mt-1"
              />
              <div>
                <div className="text-[13px] font-bold"
                  style={{ color: avgPfLeader ? ownerColor(avgPfLeader.owner) : '#64748b', filter: avgPfLeader ? `drop-shadow(0 0 5px ${ownerColor(avgPfLeader.owner)}55)` : undefined }}>
                  {avgPfLeader?.owner ?? '—'}
                </div>
                <div className="text-[10px] mt-0.5 font-semibold"
                  style={{ color: 'rgba(100,116,139,0.7)' }}>
                  avg pts / game
                </div>
              </div>
            </div>
          </BentoCard>
        </div>

        {/* ── Row 3: Rivalry + Playoff Machine ────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Ultimate Rivalry */}
          <BentoCard gradientColor="purple" className="md:col-span-2">
            <Swords size={130} strokeWidth={0.4} className="absolute -bottom-8 -right-8 pointer-events-none"
              style={{ color: '#8b5cf6', opacity: 0.045 }} />
            <div className="relative p-5 flex flex-col gap-4 h-full">
              <div className="flex items-center gap-2.5">
                <DuoIcon icon={Swords} cfg={BENTO_CONFIGS.purple} />
                <CardLabel text="Ultimate Rivalry" />
              </div>

              {/* VS display */}
              <div className="flex items-stretch gap-0 rounded-xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex-1 flex flex-col items-center justify-center gap-1 py-5 px-4">
                  <div className="text-[17px] font-black"
                    style={{ color: ownerColor(rv1), filter: `drop-shadow(0 0 8px ${ownerColor(rv1)}55)` }}>
                    {rv1}
                  </div>
                  <GlowNum value={String(rivalryRecord.rv1Wins)} color={ownerColor(rv1)} className="text-[40px]" />
                  <span className="text-[8px] tracking-[3px] uppercase font-black"
                    style={{ color: 'rgba(100,116,139,0.5)' }}>wins</span>
                </div>

                <div className="flex flex-col items-center justify-center px-5"
                  style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-[11px] font-black tracking-[4px] uppercase"
                    style={{ color: 'rgba(100,116,139,0.5)' }}>vs</span>
                  <span className="text-[9px] font-semibold mt-1 whitespace-nowrap"
                    style={{ color: 'rgba(100,116,139,0.35)' }}>
                    {rivalryRecord.total} meetings
                  </span>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center gap-1 py-5 px-4">
                  <div className="text-[17px] font-black"
                    style={{ color: ownerColor(rv2), filter: `drop-shadow(0 0 8px ${ownerColor(rv2)}55)` }}>
                    {rv2}
                  </div>
                  <GlowNum value={String(rivalryRecord.rv2Wins)} color={ownerColor(rv2)} className="text-[40px]" />
                  <span className="text-[8px] tracking-[3px] uppercase font-black"
                    style={{ color: 'rgba(100,116,139,0.5)' }}>wins</span>
                </div>
              </div>

              {/* Gradient progress bar */}
              {rivalryRecord.total > 0 && (
                <div>
                  <div className="h-1 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(rivalryRecord.rv1Wins / rivalryRecord.total) * 100}%`,
                        background: `linear-gradient(90deg, ${ownerColor(rv1)}, ${ownerColor(rv2)})`,
                        boxShadow: `0 0 8px ${ownerColor(rv1)}55`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[9px] font-bold tabular-nums"
                      style={{ color: `${ownerColor(rv1)}88` }}>
                      {((rivalryRecord.rv1Wins / rivalryRecord.total) * 100).toFixed(0)}%
                    </span>
                    <span className="text-[9px] font-bold tabular-nums"
                      style={{ color: `${ownerColor(rv2)}88` }}>
                      {((rivalryRecord.rv2Wins / rivalryRecord.total) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </BentoCard>

          {/* Playoff Machine */}
          <BentoCard gradientColor="blue">
            <Shield size={110} strokeWidth={0.4} className="absolute -bottom-5 -right-5 pointer-events-none"
              style={{ color: '#3b82f6', opacity: 0.05 }} />
            <div className="relative p-5 flex flex-col gap-3 h-full">
              <div className="flex items-center gap-2.5">
                <DuoIcon icon={Shield} cfg={BENTO_CONFIGS.blue} />
                <CardLabel text="Playoff Machine" />
              </div>
              {playoffLeader && (
                <div className="flex-1 flex flex-col justify-center gap-1">
                  <GlowNum
                    value={`${playoffLeader.playoffCount}×`}
                    color="#3b82f6"
                    className="text-[44px]"
                  />
                  <div className="text-[15px] font-black leading-none"
                    style={{ color: ownerColor(playoffLeader.owner), filter: `drop-shadow(0 0 7px ${ownerColor(playoffLeader.owner)}55)` }}>
                    {playoffLeader.owner}
                  </div>
                  <div className="text-[10px] mt-1 font-semibold"
                    style={{ color: 'rgba(100,116,139,0.6)' }}>
                    playoff appearances
                  </div>
                  <div className="text-[10px] font-semibold"
                    style={{ color: 'rgba(100,116,139,0.4)' }}>
                    {playoffLeader.seasonCount > 0
                      ? `${((playoffLeader.playoffCount / playoffLeader.seasonCount) * 100).toFixed(0)}% appearance rate`
                      : '—'}
                  </div>
                </div>
              )}
            </div>
          </BentoCard>
        </div>
      </div>
    </div>
  )
}

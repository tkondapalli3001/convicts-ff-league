'use client'

import { useMemo } from 'react'
import { useLeague } from '@/context/LeagueContext'
import { useCareerStats } from '@/hooks/useCareerStats'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import StatChip from '@/components/shared/StatChip'
import HeroSection from '@/components/home/HeroSection'
import { openLeagueSearch } from '@/components/search/GlobalSearch'
import CareerStandingsTable from '@/components/home/CareerStandingsTable'
import HallOfFameCard from '@/components/home/HallOfFameCard'
import WallOfShameCard from '@/components/home/WallOfShameCard'
import { getChampion, getShameLoser, getRunnerUp, ownerColor } from '@/lib/utils'

export default function HomePage() {
  const { state } = useLeague()
  const { loaded, error, allMatchups, years, leagueChain } = state

  // All-time career stats per owner (shared engine)
  const careerData = useCareerStats()

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
  const runnerUpName = runnerUpRecord?.name ?? '—'
  const shameName    = shameRecord?.loser ?? '—'

  if (error)   return <ErrorState error={error} />
  if (!loaded) return <LoadingSpinner />

  return (
    <div className="space-y-4">

      {/* ── SEARCH TRIGGER ───────────────────────────────────────── */}
      <button
        onClick={openLeagueSearch}
        className="animate-fade-in w-full flex items-center gap-3 bento-card px-4 py-3.5 text-left hover:border-s-teal/50 transition-colors"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="flex-shrink-0" style={{ color: '#6e7681' }}>
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.2" />
          <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
        <span className="flex-1 text-[14px] text-s-text3">
          Ask anything — &ldquo;Teja vs Nathan&rdquo;, &ldquo;Who won in 2022?&rdquo;, &ldquo;Longest streak&rdquo;…
        </span>
        <span className="hidden md:flex items-center gap-0.5 flex-shrink-0">
          <kbd className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-s-bg3 border border-s-border text-s-text3">⌘</kbd>
          <kbd className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-s-bg3 border border-s-border text-s-text3">K</kbd>
        </span>
      </button>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <HeroSection
        champName={champName}
        champColor={ownerColor(champName)}
        runnerUpName={runnerUpName}
        runnerUpColor={ownerColor(runnerUpName)}
        shameName={shameName}
        shameColor={ownerColor(shameName)}
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
        <CareerStandingsTable data={careerData} />
        <div className="flex flex-col gap-4">
          <HallOfFameCard years={years} />
          <WallOfShameCard years={years} />
        </div>
      </div>

    </div>
  )
}

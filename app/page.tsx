'use client'

import { useMemo } from 'react'
import { useLeague } from '@/context/LeagueContext'
import { useCareerStats } from '@/hooks/useCareerStats'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import StatChip from '@/components/shared/StatChip'
import HeroSection from '@/components/home/HeroSection'
import SearchBar from '@/components/home/SearchBar'
import CareerStandingsTable from '@/components/home/CareerStandingsTable'
import HallOfFameCard from '@/components/home/HallOfFameCard'
import WallOfShameCard from '@/components/home/WallOfShameCard'
import { getChampion, getShameLoser, getRunnerUp, ownerColor } from '@/lib/utils'

export default function HomePage() {
  const { state } = useLeague()
  const { loaded, error, allMatchups, years, leagueChain } = state

  // All-time career stats per owner (shared engine — also feeds SearchBar)
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

      {/* ── SEARCH BAR ───────────────────────────────────────────── */}
      <div className="animate-fade-in relative z-10">
        <SearchBar managerData={careerData} />
      </div>

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

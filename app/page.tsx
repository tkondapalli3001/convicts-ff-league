'use client'

import { useMemo } from 'react'
import { useLeague } from '@/context/LeagueContext'
import { useCareerStats } from '@/hooks/useCareerStats'
import { useRecordsData } from '@/hooks/useRecordsData'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import StatChip from '@/components/shared/StatChip'
import HeroSection from '@/components/home/HeroSection'
import SearchStrip from '@/components/layout/SearchStrip'
import CareerStandingsTable from '@/components/home/CareerStandingsTable'
import HallOfFameCard from '@/components/home/HallOfFameCard'
import WallOfShameCard from '@/components/home/WallOfShameCard'
import { getChampion, getShameLoser, getRunnerUp } from '@/lib/utils'

export default function HomePage() {
  const { state } = useLeague()
  const { loaded, error, allMatchups, years, leagueChain } = state

  // All-time career stats per owner (shared engine)
  const careerData = useCareerStats()
  const records = useRecordsData()

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
  const topWinPct   = careerData[0]
  const mostChamps  = [...careerData].sort((a, b) => b.champs - a.champs)[0]
  const topStreak   = records.topWinStreaks?.[0]

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

  const yearRange =
    years.length >= 2 ? `${years[0]}–${years[years.length - 1]}` : String(years[0] ?? '')

  return (
    // Full-bleed Midnight Prime card — seamless stack under the sticky navbar.
    <div
      className="-mx-4 -mt-6 overflow-hidden border-x border-b"
      style={{ borderColor: 'rgba(var(--gold-rgb), 0.12)' }}
    >
      {/* Search strip */}
      <div className="animate-fade-in">
        <SearchStrip />
      </div>

      {/* Hero + runner-up/toilet (mobile band lives inside HeroSection) */}
      <HeroSection
        champName={champName}
        runnerUpName={runnerUpName}
        shameName={shameName}
        seasonCount={leagueChain.length}
        latestYear={latestYear}
        totalGames={allMatchups.length}
        managerCount={careerData.length}
        yearRange={yearRange}
      />

      {/* Stat band — 4-cell hairline grid (2×2 on mobile) */}
      <div
        className="mt-4 grid grid-cols-2 border-t sm:mt-0 sm:grid-cols-4 sm:border-t-0"
        style={{ borderColor: 'rgba(var(--gold-rgb), 0.12)' }}
      >
        <StatChip
          label="Most Champs"
          value={mostChamps?.champs > 0 ? `${mostChamps.champs % 1 === 0 ? mostChamps.champs : mostChamps.champs.toFixed(1)}×` : '—'}
          sub={mostChamps?.champs > 0 ? mostChamps.name : undefined}
          animClass="animate-fade-in-1"
        />
        <StatChip
          label="All-Time High Score"
          value={highScore > 0 ? highScore.toFixed(2) : '—'}
          sub={highScoreOwner || undefined}
          animClass="animate-fade-in-2"
        />
        <StatChip
          label="Top Win Rate"
          value={topWinPct ? `${(topWinPct.winpct * 100).toFixed(1)}%` : '—'}
          sub={topWinPct?.name}
          animClass="animate-fade-in-3"
        />
        <StatChip
          label="Longest Win Streak"
          value={topStreak ? `${topStreak.streak}W` : '—'}
          sub={topStreak?.owner}
          animClass="animate-fade-in-4"
        />
      </div>

      {/* Standings + Hall of Fame / Wall of Shame */}
      <div className="grid grid-cols-1 gap-6 px-5 py-6 animate-fade-in-5 sm:px-8 sm:py-7 lg:grid-cols-3">
        <CareerStandingsTable data={careerData} />
        <div className="flex flex-col gap-6">
          <HallOfFameCard years={years} />
          <WallOfShameCard years={years} />
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useLeague } from '@/context/LeagueContext'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import SeasonStandings from '@/components/home/SeasonStandings'
import PlayoffBracket from '@/components/home/PlayoffBracket'
import AvgScoreChart from '@/components/trends/AvgScoreChart'

export default function SeasonsPage() {
  const { state } = useLeague()
  const { loaded, error, years } = state
  const [bracketYear, setBracketYear] = useState<number | null>(null)

  if (error) return <ErrorState error={error} />
  if (!loaded) return <LoadingSpinner />

  const sortedYears = [...years].sort((a, b) => b - a)
  const selectedYear = bracketYear ?? sortedYears[0]

  return (
    <div className="animate-fade-in">
      <h1 className="text-[26px] font-extrabold text-s-text mb-1">Seasons</h1>
      <p className="text-[13px] text-s-text2 mb-6">Year-by-year standings and scoring trends</p>

      <SeasonStandings />

      <div className="mt-6">
        <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-s-text3 mb-3">Playoff Bracket</div>
        <div className="flex gap-[6px] flex-wrap mb-4">
          {sortedYears.map(y => (
            <button
              key={y}
              onClick={() => setBracketYear(y)}
              className={[
                'px-3 py-[4px] rounded-full border text-[11px] font-semibold cursor-pointer transition-all duration-150',
                selectedYear === y
                  ? 'bg-[#1a2e4a] border-s-blue text-[#93c5fd]'
                  : 'bg-s-bg3 border-s-border text-s-text3 hover:border-s-border2 hover:text-s-text2',
              ].join(' ')}
            >
              {y}
            </button>
          ))}
        </div>
        <PlayoffBracket year={selectedYear} />
      </div>

      <div className="mt-6">
        <AvgScoreChart />
      </div>
    </div>
  )
}

'use client'

import { useMemo, useState, useEffect } from 'react'
import { useLeague } from '@/context/LeagueContext'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import LuckTable from '@/components/luck/LuckTable'
import { computeLuckIndex } from '@/lib/luck'

export default function LuckPage() {
  const { state } = useLeague()
  const { loaded, error, matchups, rosterUserMaps, ownerSeasons, years } = state

  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  // Default to most recent year once data loads
  useEffect(() => {
    if (years.length && selectedYear === null) {
      setSelectedYear(Math.max(...years))
    }
  }, [years.length]) // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <ErrorState error={error} />
  if (!loaded) return <LoadingSpinner />

  const activeYear = selectedYear ?? Math.max(...years)

  const entries = useMemo(
    () => computeLuckIndex(matchups, rosterUserMaps, ownerSeasons, activeYear),
    [matchups, rosterUserMaps, ownerSeasons, activeYear]
  )

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6 animate-fade-in">
      <h1 className="text-[26px] font-extrabold text-s-text mb-1">Luck Index</h1>
      <p className="text-[13px] text-s-text3 mb-4">
        All-play expected wins vs actual wins — who got robbed?
      </p>

      {/* Year filter */}
      <div className="flex gap-[6px] flex-wrap mb-5">
        {[...years].sort((a, b) => b - a).map(y => (
          <button
            key={y}
            onClick={() => setSelectedYear(y)}
            className={[
              'px-3 py-[5px] rounded-full border text-[11px] font-semibold cursor-pointer transition-all duration-150 whitespace-nowrap',
              activeYear === y
                ? 'bg-[#1a2e4a] border-s-blue text-[#93c5fd]'
                : 'bg-s-bg3 border-s-border text-s-text3 hover:border-s-border2 hover:text-s-text2',
            ].join(' ')}
          >
            {y}
          </button>
        ))}
      </div>

      <LuckTable entries={entries} year={activeYear} />
    </div>
  )
}

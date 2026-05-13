'use client'

import { useState } from 'react'
import { useLeague } from '@/context/LeagueContext'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import SeasonStandings from '@/components/home/SeasonStandings'
import PlayoffBracket from '@/components/home/PlayoffBracket'
import AvgScoreChart from '@/components/trends/AvgScoreChart'
import FinishTracker from '@/components/trends/FinishTracker'

type Tab = 'standings' | 'finish' | 'avgscore'

const TABS: { id: Tab; label: string }[] = [
  { id: 'standings', label: 'Standings'      },
  { id: 'finish',    label: 'Finish Tracker' },
  { id: 'avgscore',  label: 'Scoring Trend'  },
]

export default function SeasonsPage() {
  const { state } = useLeague()
  const { loaded, error, years } = state
  const [activeTab, setActiveTab] = useState<Tab>('standings')
  const [standingsYear, setStandingsYear] = useState<number | null>(null)

  if (error) return <ErrorState error={error} />
  if (!loaded) return <LoadingSpinner />

  const sortedYears = [...years].sort((a, b) => b - a)
  const selectedYear = standingsYear ?? sortedYears[0]

  return (
    <div className="animate-fade-in">
      <h1 className="text-[26px] font-extrabold text-s-text mb-1">Seasons</h1>
      <p className="text-[13px] text-s-text2 mb-5">Year-by-year standings and scoring trends</p>

      {/* Tab nav */}
      <div className="flex gap-[6px] mb-5 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              'px-4 py-[7px] rounded-[8px] border text-[12px] font-bold transition-all duration-150 cursor-pointer',
              activeTab === tab.id
                ? 'bg-s-gold text-[#000] border-s-gold'
                : 'bg-s-bg2 border-s-border text-s-text2 hover:border-s-border2 hover:text-s-text',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── STANDINGS TAB ─────────────────────────────────────────── */}
      {activeTab === 'standings' && (
        <>
          <SeasonStandings onYearChange={setStandingsYear} />
          <div className="mt-6">
            <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-s-text3 mb-3">
              Playoff Bracket · {selectedYear}
            </div>
            <PlayoffBracket year={selectedYear} />
          </div>
        </>
      )}

      {/* ── FINISH TRACKER TAB ────────────────────────────────────── */}
      {activeTab === 'finish' && <FinishTracker />}

      {/* ── AVG SCORE TAB ─────────────────────────────────────────── */}
      {activeTab === 'avgscore' && <AvgScoreChart />}
    </div>
  )
}

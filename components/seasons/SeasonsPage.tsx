'use client'

import { useUrlParam } from '@/hooks/useUrlParam'
import { useMemo, useState } from 'react'
import { useLeague } from '@/context/LeagueContext'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import PillTabs from '@/components/shared/PillTabs'
import PageHeader from '@/components/shared/PageHeader'
import SeasonStandings from '@/components/seasons/SeasonStandings'
import PlayoffBracket from '@/components/seasons/PlayoffBracket'
import AvgScoreChart from '@/components/seasons/AvgScoreChart'
import ScoringStrengthChart from '@/components/seasons/ScoringStrengthChart'
import FinishTracker from '@/components/seasons/FinishTracker'
import GameLog from '@/components/seasons/GameLog'
import { BuiltAvatars } from '@/components/shared/OwnerAvatar'
import { seasonStandings, type StandingsData } from '@/lib/stats'

/** Standings worked out from the snapshot at build time (app/seasons/page.tsx), so the tab is in the HTML. */
export interface BuiltStandings {
  avatars: Record<string, string>
  standings: StandingsData
}

type Tab = 'standings' | 'gamelog' | 'finish' | 'avgscore'

const TABS: { id: Tab; label: string }[] = [
  { id: 'standings', label: 'Standings'      },
  { id: 'gamelog',   label: 'Game Log'       },
  { id: 'finish',    label: 'Finish Tracker' },
  { id: 'avgscore',  label: 'Scoring Trend'  },
]
const TAB_IDS = TABS.map(t => t.id)
const NO_AVATARS: Record<string, string> = {}

export default function SeasonsPage({ built }: { built: BuiltStandings | null }) {
  const { state } = useLeague()
  const { loaded, error, years } = state
  const [activeTab, setActiveTab] = useUrlParam<Tab>('tab', 'standings', TAB_IDS)
  const [standingsYear, setStandingsYear] = useState<number | null>(null)
  const standings = useMemo(() => (loaded ? seasonStandings(state) : built?.standings), [loaded, state, built])

  if (error) return <ErrorState error={error} />

  // The title and tabs paint at once; only what's under them waits for data
  const shell = (
    <>
      <PageHeader kicker="The Season Archive" title="Seasons" subtitle="Year-by-year standings, every game, and scoring trends" />
      <PillTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
    </>
  )
  // Standings is baked into the HTML from the build; every other tab waits on the spinner
  if (!loaded && !(standings && activeTab === 'standings')) return <div className="animate-fade-in">{shell}<LoadingSpinner /></div>

  const sortedYears = [...years].sort((a, b) => b - a)
  const selectedYear = standingsYear ?? sortedYears[0]

  return (
    <div className="animate-fade-in">
      {shell}

      {/* ── STANDINGS TAB ─────────────────────────────────────────── */}
      {/* Same elements before and after the load (only their values update), so nothing repaints.
          data-baked lets a deep link hide this until the page takes over (globals.css). The bracket
          sits below the fold and arrives with the data. */}
      {activeTab === 'standings' && standings && (
        <div data-baked={loaded ? undefined : ''}>
          <BuiltAvatars.Provider value={built?.avatars ?? NO_AVATARS}>
            <SeasonStandings data={standings} onYearChange={setStandingsYear} />
          </BuiltAvatars.Provider>
          {loaded && (
            <div className="mt-6">
              <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-s-text3 mb-3">
                Playoff Bracket · {selectedYear}
              </div>
              <PlayoffBracket year={selectedYear} />
            </div>
          )}
        </div>
      )}
      {!loaded && <div data-baked-fallback><LoadingSpinner /></div>}

      {/* ── GAME LOG TAB ──────────────────────────────────────────── */}
      {activeTab === 'gamelog' && <GameLog />}

      {/* ── FINISH TRACKER TAB ────────────────────────────────────── */}
      {activeTab === 'finish' && <FinishTracker />}

      {/* ── AVG SCORE TAB ─────────────────────────────────────────── */}
      {activeTab === 'avgscore' && (
        <>
          <AvgScoreChart />
          <ScoringStrengthChart />
        </>
      )}
    </div>
  )
}

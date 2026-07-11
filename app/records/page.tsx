'use client'

import { useState } from 'react'
import { useLeague } from '@/context/LeagueContext'
import { useRecordsData } from '@/hooks/useRecordsData'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import RecordItem from '@/components/shared/RecordItem'
import SectionCard from '@/components/shared/SectionCard'
import PillTabs from '@/components/shared/PillTabs'
import PageHeader from '@/components/shared/PageHeader'
import ScoreLeaderboard from '@/components/records/ScoreLeaderboard'
import StreakList from '@/components/records/StreakList'
import TrashTalkCard from '@/components/trends/TrashTalkCard'
import FunFacts from '@/components/records/FunFacts'
import { TRASH_TALK } from '@/lib/constants'

type Tab = 'extremes' | 'records' | 'streaks' | 'trashtalk' | 'funfacts'

const TABS: { id: Tab; label: string }[] = [
  { id: 'extremes',  label: 'Extremes'   },
  { id: 'records',   label: 'Records'    },
  { id: 'streaks',   label: 'Streaks'    },
  { id: 'funfacts',  label: 'Fun Facts'  },
  { id: 'trashtalk', label: 'Trash Talk' },
]

export default function RecordsPage() {
  const { state } = useLeague()
  const { loaded, error, years } = state
  const {
    highScore, lowScore, maxMargin, minMargin,
    bestWinPct, worstWinPct, highPF, lowPF,
    bestMarginSeason, worstMarginSeason, biggestPlayoffBlowout,
    high140, low80, countByOwner,
    topRivalry, rv1, rv2,
    topWinStreaks, topLossStreaks,
  } = useRecordsData()

  const [activeTab, setActiveTab] = useState<Tab>('extremes')

  if (error) return <ErrorState error={error} />
  if (!loaded) return <LoadingSpinner />

  return (
    <div className="animate-fade-in">
      <PageHeader
        kicker={`The Record Book · ${years.length} Seasons`}
        title="League Records"
        subtitle={`All-time milestones, extremes & fun stats across ${years.length} seasons`}
      />

      <PillTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {/* ── EXTREMES TAB ─────────────────────────────────────────── */}
      {activeTab === 'extremes' && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <SectionCard title="Scoring Extremes">
              <RecordItem label="Highest Single Game" value={highScore?.pts.toFixed(2) || '—'} context={`${highScore?.owner} · ${highScore?.year} Wk${highScore?.week} vs ${highScore?.opp}`} />
              <RecordItem label="Lowest Single Game" value={lowScore?.pts.toFixed(2) || '—'} context={`${lowScore?.owner} · ${lowScore?.year} Wk${lowScore?.week} vs ${lowScore?.opp}`} />
              <RecordItem label="Highest Season PF" value={highPF?.pf.toFixed(1) || '—'} context={`${highPF?.name} · ${highPF?.year} · ${highPF ? (highPF.pf / 14).toFixed(1) : '—'} pts/wk avg`} />
              <RecordItem label="Lowest Season PF" value={lowPF?.pf.toFixed(1) || '—'} context={`${lowPF?.name} · ${lowPF?.year}`} />
            </SectionCard>
            <SectionCard title="Matchup Records">
              <RecordItem label="Largest Margin of Victory" value={`${maxMargin?.margin.toFixed(2)} pts`} context={`${maxMargin?.winner} def. ${maxMargin?.loser} · ${maxMargin?.year} Wk${maxMargin?.week}`} />
              <RecordItem label="Narrowest Victory" value={`${minMargin?.margin.toFixed(2)} pts`} context={`${minMargin?.winner} def. ${minMargin?.loser} · ${minMargin?.year} Wk${minMargin?.week}`} />
              {biggestPlayoffBlowout && (
                <RecordItem label="Biggest Playoff Blowout" value={`${biggestPlayoffBlowout.margin.toFixed(2)} pts`} context={`${biggestPlayoffBlowout.winner} def. ${biggestPlayoffBlowout.loser} · ${biggestPlayoffBlowout.year} Wk${biggestPlayoffBlowout.week}`} />
              )}
              <RecordItem label="Most Played Rivalry" value={`${topRivalry?.[1] || 0} games`} context={`${rv1} vs ${rv2}`} />
            </SectionCard>
          </div>

          <ScoreLeaderboard title="140+" scores={high140} variant="high" countByOwner={countByOwner(high140)} />
          <ScoreLeaderboard title="Sub-80" scores={low80} variant="low" countByOwner={countByOwner(low80)} />
        </>
      )}

      {/* ── RECORDS TAB ──────────────────────────────────────────── */}
      {activeTab === 'records' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <SectionCard title="Season Records">
            {bestWinPct && <RecordItem label="Best Single-Season Win%" value={`${(bestWinPct.wins / (bestWinPct.wins + bestWinPct.losses) * 100).toFixed(1)}%`} context={`${bestWinPct.name} · ${bestWinPct.year} (${bestWinPct.wins}-${bestWinPct.losses})`} />}
            {worstWinPct && <RecordItem label="Worst Single-Season Win%" value={`${(worstWinPct.wins / (worstWinPct.wins + worstWinPct.losses) * 100).toFixed(1)}%`} context={`${worstWinPct.name} · ${worstWinPct.year} (${worstWinPct.wins}-${worstWinPct.losses})`} />}
            <RecordItem label="Best Season PF Margin" value={`+${(bestMarginSeason.pf - bestMarginSeason.pa).toFixed(1)}`} context={`${bestMarginSeason.name} · ${bestMarginSeason.year}`} />
            <RecordItem label="Worst Season PF Margin" value={`${(worstMarginSeason.pf - worstMarginSeason.pa).toFixed(1)}`} context={`${worstMarginSeason.name} · ${worstMarginSeason.year}`} />
          </SectionCard>
          <SectionCard title="Career Milestones">
            <RecordItem label="All-Time Most Money Won" value="+$450" context="Kerry — won 2025 for +$675 in biggest single-year payout" />
            <RecordItem label="All-Time Most Money Lost" value="−$410" context="Teja — 7 seasons, 0 rings, 1x toilet bowl (2021)" />
            <RecordItem label="Most Championships" value="2×" context="Daniyaal · 2020 & 2023" />
            <RecordItem label="Most Toilet Bowls" value="2×" context="Nathan · 2020 & 2022" />
          </SectionCard>
        </div>
      )}

      {/* ── STREAKS TAB ──────────────────────────────────────────── */}
      {activeTab === 'streaks' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <StreakList title="Longest Win Streaks" streaks={topWinStreaks} variant="win" />
          <StreakList title="Longest Losing Streaks" streaks={topLossStreaks} variant="loss" />
        </div>
      )}

      {/* ── TRASH TALK TAB ───────────────────────────────────────── */}
      {activeTab === 'trashtalk' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {TRASH_TALK.map(t => (
            <TrashTalkCard key={t.owner} {...t} />
          ))}
        </div>
      )}

      {/* ── FUN FACTS TAB ────────────────────────────────────────── */}
      {activeTab === 'funfacts' && <FunFacts />}
    </div>
  )
}

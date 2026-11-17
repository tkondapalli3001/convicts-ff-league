'use client'

import { useUrlParam } from '@/hooks/useUrlParam'
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
import TrashTalkCard from '@/components/records/TrashTalkCard'
import FunFacts from '@/components/records/FunFacts'
import { TRASH_TALK } from '@/lib/league'
import { BuiltAvatars } from '@/components/shared/OwnerAvatar'
import { careerMilestones, countByOwner, type RecordsData } from '@/lib/stats'

type ExtremesData = Pick<RecordsData,
  'highScore' | 'lowScore' | 'highPF' | 'lowPF' | 'maxMargin' | 'minMargin' | 'biggestPlayoffBlowout' |
  'topRivalry' | 'rv1' | 'rv2' | 'high140' | 'low80'>

/** Extremes worked out from the snapshot at build time (app/records/page.tsx), so the tab is in the HTML. */
export interface BuiltExtremes {
  seasonCount: number
  avatars: Record<string, string>
  records: ExtremesData
}

type Tab = 'extremes' | 'records' | 'streaks' | 'trashtalk' | 'funfacts'

// Built from the league's history files alone — the same on every visit
const milestones = careerMilestones()

const TABS: { id: Tab; label: string }[] = [
  { id: 'extremes',  label: 'Extremes'   },
  { id: 'records',   label: 'Records'    },
  { id: 'streaks',   label: 'Streaks'    },
  { id: 'funfacts',  label: 'Fun Facts'  },
  { id: 'trashtalk', label: 'Trash Talk' },
]
const TAB_IDS = TABS.map(t => t.id)

function extremes({ highScore, lowScore, maxMargin, minMargin, highPF, lowPF, biggestPlayoffBlowout, topRivalry, rv1, rv2, high140, low80 }: ExtremesData) {
  return (
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
  )
}

export default function RecordsPage({ built }: { built: BuiltExtremes | null }) {
  const { state } = useLeague()
  const { loaded, error } = state
  const recs = useRecordsData()
  const {
    bestWinPct, worstWinPct,
    bestMarginSeason, worstMarginSeason,
    topWinStreaks, topLossStreaks,
  } = recs
  // Until the store loads, the season count comes from the build
  const seasonCount = loaded ? state.years.length : built?.seasonCount

  const [activeTab, setActiveTab] = useUrlParam<Tab>('tab', 'extremes', TAB_IDS)

  if (error) return <ErrorState error={error} />

  // The title and tabs paint at once; only what's under them waits for data
  const shell = (
    <>
      <PageHeader
        kicker={seasonCount ? `The Record Book · ${seasonCount} Seasons` : 'The Record Book'}
        title="League Records"
        subtitle={seasonCount ? `All-time milestones, extremes & fun stats across ${seasonCount} seasons` : 'All-time milestones, extremes & fun stats'}
      />
      <PillTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
    </>
  )
  if (!loaded) {
    // Extremes is baked into the HTML; another tab (or a deep link to one) waits on the spinner
    const baked = built && activeTab === 'extremes'
    return (
      <div className="animate-fade-in">
        {shell}
        {baked ? (
          <>
            <div data-baked><BuiltAvatars.Provider value={built.avatars}>{extremes(built.records)}</BuiltAvatars.Provider></div>
            <div data-baked-fallback><LoadingSpinner /></div>
          </>
        ) : <LoadingSpinner />}
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {shell}

      {activeTab === 'extremes' && extremes(recs)}

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
            <RecordItem label="All-Time Most Money Won" {...milestones.mostWon} />
            <RecordItem label="All-Time Most Money Lost" {...milestones.mostLost} />
            <RecordItem label="Most Championships" {...milestones.mostTitles} />
            <RecordItem label="Most Toilet Bowls" {...milestones.mostToilets} />
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
        <>
          <div className="mb-4 flex flex-wrap gap-2 md:hidden">
            {TRASH_TALK.map(t => (
              <button
                key={t.owner}
                type="button"
                onClick={() => document.getElementById(`talk-${t.owner}`)?.scrollIntoView({ behavior: 'smooth' })}
                className="min-h-[32px] border px-3 text-[10px] font-bold uppercase tracking-[1.5px] text-s-text2"
                style={{ borderColor: 'rgba(var(--gold-rgb), 0.16)' }}
              >
                {t.owner}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {TRASH_TALK.map(t => (
              <TrashTalkCard key={t.owner} {...t} />
            ))}
          </div>
        </>
      )}

      {/* ── FUN FACTS TAB ────────────────────────────────────────── */}
      {activeTab === 'funfacts' && <FunFacts />}
    </div>
  )
}

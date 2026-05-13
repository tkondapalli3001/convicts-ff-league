'use client'

import { useState } from 'react'
import { useLeague } from '@/context/LeagueContext'
import { useRecordsData } from '@/hooks/useRecordsData'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import RecordItem from '@/components/shared/RecordItem'
import ScoreLeaderboard from '@/components/records/ScoreLeaderboard'
import StreakList from '@/components/records/StreakList'
import TrashTalkCard from '@/components/trends/TrashTalkCard'
import { TRASH_TALK } from '@/lib/constants'

type Tab = 'extremes' | 'records' | 'streaks' | 'trashtalk'

const TABS: { id: Tab; label: string }[] = [
  { id: 'extremes',  label: 'Extremes'   },
  { id: 'records',   label: 'Records'    },
  { id: 'streaks',   label: 'Streaks'    },
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
      <h1 className="text-[26px] font-extrabold text-s-text mb-1">League Records</h1>
      <p className="text-[13px] text-s-text3 mb-5">All-time milestones, extremes & fun stats across {years.length} seasons</p>

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

      {/* ── EXTREMES TAB ─────────────────────────────────────────── */}
      {activeTab === 'extremes' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px] mb-4">
            <div>
              <div className="text-[10px] font-bold tracking-[3px] uppercase text-s-text3 mb-2">Scoring Extremes</div>
              <RecordItem icon="🔥" label="Highest Single Game"     value={highScore?.pts.toFixed(2) || '—'}   context={`${highScore?.owner} · ${highScore?.year} Wk${highScore?.week} vs ${highScore?.opp}`} />
              <RecordItem icon="🥶" label="Lowest Single Game"      value={lowScore?.pts.toFixed(2)  || '—'}   context={`${lowScore?.owner} · ${lowScore?.year} Wk${lowScore?.week} vs ${lowScore?.opp}`} />
              <RecordItem icon="📈" label="Highest Season PF"       value={highPF?.pf.toFixed(1)     || '—'}   context={`${highPF?.name} · ${highPF?.year} · ${highPF ? (highPF.pf/14).toFixed(1) : '—'} pts/wk avg`} />
              <RecordItem icon="📉" label="Lowest Season PF"        value={lowPF?.pf.toFixed(1)      || '—'}   context={`${lowPF?.name} · ${lowPF?.year}`} />
            </div>
            <div>
              <div className="text-[10px] font-bold tracking-[3px] uppercase text-s-text3 mb-2">Matchup Records</div>
              <RecordItem icon="💥" label="Largest Margin of Victory" value={`${maxMargin?.margin.toFixed(2)} pts`} context={`${maxMargin?.winner} def. ${maxMargin?.loser} · ${maxMargin?.year} Wk${maxMargin?.week}`} />
              <RecordItem icon="⚖️" label="Narrowest Victory"         value={`${minMargin?.margin.toFixed(2)} pts`} context={`${minMargin?.winner} def. ${minMargin?.loser} · ${minMargin?.year} Wk${minMargin?.week}`} />
              {biggestPlayoffBlowout && (
                <RecordItem icon="🎯" label="Biggest Playoff Blowout" value={`${biggestPlayoffBlowout.margin.toFixed(2)} pts`} context={`${biggestPlayoffBlowout.winner} def. ${biggestPlayoffBlowout.loser} · ${biggestPlayoffBlowout.year} Wk${biggestPlayoffBlowout.week}`} />
              )}
              <RecordItem icon="🔄" label="Most Played Rivalry"       value={`${topRivalry?.[1] || 0} games`}   context={`${rv1} vs ${rv2}`} />
            </div>
          </div>

          <div className="text-[10px] font-bold tracking-[3px] uppercase text-s-text3 mb-2">
            🔥 140+ Point Explosions ({high140.length} total)
          </div>
          <ScoreLeaderboard title="140+" scores={high140} variant="high" countByOwner={countByOwner(high140)} />

          <div className="text-[10px] font-bold tracking-[3px] uppercase text-s-text3 mb-2 mt-4">
            🥶 Sub-80 Stinkers ({low80.length} total)
          </div>
          <ScoreLeaderboard title="Sub-80" scores={low80} variant="low" countByOwner={countByOwner(low80)} />
        </>
      )}

      {/* ── RECORDS TAB ──────────────────────────────────────────── */}
      {activeTab === 'records' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px]">
          <div>
            <div className="text-[10px] font-bold tracking-[3px] uppercase text-s-text3 mb-2">Season Records</div>
            {bestWinPct  && <RecordItem icon="🏆" label="Best Single-Season Win%"   value={`${(bestWinPct.wins /(bestWinPct.wins +bestWinPct.losses )*100).toFixed(1)}%`} context={`${bestWinPct.name} · ${bestWinPct.year} (${bestWinPct.wins}-${bestWinPct.losses})`} />}
            {worstWinPct && <RecordItem icon="💀" label="Worst Single-Season Win%"  value={`${(worstWinPct.wins/(worstWinPct.wins+worstWinPct.losses)*100).toFixed(1)}%`} context={`${worstWinPct.name} · ${worstWinPct.year} (${worstWinPct.wins}-${worstWinPct.losses})`} />}
            <RecordItem icon="📊" label="Best Season PF Margin"    value={`+${(bestMarginSeason.pf -bestMarginSeason.pa).toFixed(1)}`}  context={`${bestMarginSeason.name} · ${bestMarginSeason.year}`} />
            <RecordItem icon="🩸" label="Worst Season PF Margin"   value={`${(worstMarginSeason.pf-worstMarginSeason.pa).toFixed(1)}`} context={`${worstMarginSeason.name} · ${worstMarginSeason.year}`} />
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-[3px] uppercase text-s-text3 mb-2">Career Milestones</div>
            <RecordItem icon="💰" label="All-Time Most Money Won"   value="+$450"  context="Kerry — won 2025 for +$675 in biggest single-year payout" />
            <RecordItem icon="🩸" label="All-Time Most Money Lost"  value="-$410"  context="Teja — 7 seasons, 0 rings, 1x toilet bowl (2021) 💔" />
            <RecordItem icon="👑" label="Most Championships"        value="2x — Daniyaal" context="2020 & 2023 · Armaan & Dustin share 0.5x (2022 co-champs)" />
            <RecordItem icon="🚽" label="Most Toilet Bowls"         value="2x — Nathan" context="Nathan: 2020 & 2022 · Teja: 2021 · Kerry: 2023 · Dustin: 2024 · Sonu: 2025" />
          </div>
        </div>
      )}

      {/* ── STREAKS TAB ──────────────────────────────────────────── */}
      {activeTab === 'streaks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px]">
          <StreakList title="Longest Win Streaks"    streaks={topWinStreaks}  variant="win" />
          <StreakList title="Longest Losing Streaks" streaks={topLossStreaks} variant="loss" />
        </div>
      )}

      {/* ── TRASH TALK TAB ───────────────────────────────────────── */}
      {activeTab === 'trashtalk' && (
        <div>
          {TRASH_TALK.map(t => (
            <TrashTalkCard key={t.owner} {...t} />
          ))}
        </div>
      )}
    </div>
  )
}

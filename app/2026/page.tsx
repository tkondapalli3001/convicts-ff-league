'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useLeague } from '@/context/LeagueContext'
import { useLiveSeason } from '@/hooks/useLiveSeason'
import { usePreviewData } from '@/hooks/usePreviewData'
import { usePowerRankings } from '@/hooks/usePowerRankings'
import { useTeamRosters } from '@/hooks/useTeamRosters'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import PageHeader from '@/components/shared/PageHeader'
import PillTabs from '@/components/shared/PillTabs'
import MatchupRow from '@/components/preview/MatchupRow'
import MatchupModal from '@/components/preview/MatchupModal'
import MatchupOfTheWeek from '@/components/preview/MatchupOfTheWeek'
import FlairLegend from '@/components/preview/FlairLegend'
import PowerRankingsTable from '@/components/preview/PowerRankingsTable'
import RosterView from '@/components/preview/RosterView'
import SyncStatus from '@/components/preview/SyncStatus'

type Tab = 'rankings' | 'matchups' | 'rosters'

const TABS: { id: Tab; label: string }[] = [
  { id: 'rankings', label: 'Power Rankings' },
  { id: 'matchups', label: 'Matchups'       },
  { id: 'rosters',  label: 'Rosters'        },
]

const STATUS_LABEL = { final: 'Final', live: 'In progress', upcoming: 'Regular season' } as const

export default function SeasonPage() {
  const { state } = useLeague()
  const live = useLiveSeason()
  const [tab, setTab] = useState<Tab>('rankings')
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const { weeks, week, previews, motw } = usePreviewData(live, selectedWeek)
  const rankings = usePowerRankings(live)
  const rosters = useTeamRosters(live)

  if (state.error) return <ErrorState error={state.error} />
  if (!state.loaded) return <LoadingSpinner />

  // The newest league in the chain — the tab's season, even before its draft
  const latestSeason = Math.max(...Object.keys(state.leagues).map(Number))
  const { season } = live
  if (!season) return <ErrorState error="No matchup data available yet" />

  const idx = weeks.indexOf(week)
  const isPlayoff = previews[0]?.isPlayoff ?? false
  const status = previews[0]?.status ?? 'upcoming'

  // Before the newest season has pairings, the tab falls back to the last
  // completed season. Say so, or the page reads as if a finished playoff game
  // were this week's matchup.
  const preseason = Number.isFinite(latestSeason) && latestSeason > season

  return (
    <div className="animate-fade-in">
      <PageHeader
        kicker={preseason ? `The ${latestSeason} Preseason` : live.live ? `Week ${live.week} · Live from Sleeper` : `The ${season} Season`}
        title={String(Number.isFinite(latestSeason) ? latestSeason : season)}
        subtitle="Matchups, power rankings, and every roster — synced with Sleeper"
      />

      <PillTabs tabs={TABS} active={tab} onChange={setTab} />

      {preseason && (
        <div
          className="mb-5 rounded-[6px] px-4 py-3"
          style={{ background: '#0B0B0D', border: '1px solid rgba(var(--gold-rgb), 0.16)' }}
        >
          <div className="text-[10px] font-bold uppercase tracking-[2px] text-gold-soft">
            {latestSeason} Preseason
          </div>
          <p className="mt-1 text-[12px] leading-snug text-s-text2">
            The {latestSeason} season hasn&apos;t kicked off yet — everything below is the{' '}
            {season} archive. Live matchups and rosters return in Week 1.
          </p>
        </div>
      )}

      {live.live && (
        <SyncStatus
          label={`Week ${live.week} · ${STATUS_LABEL[rosters.status]}`}
          syncedAt={live.syncedAt}
          syncing={live.syncing}
          stale={live.stale}
          onRefresh={live.refresh}
        />
      )}

      {/* ── MATCHUPS ─────────────────────────────────────────────── */}
      {tab === 'matchups' && (
        <>
          {/* Week selector */}
          <div className="mb-6 flex items-center justify-center gap-4">
            <button
              onClick={() => setSelectedWeek(weeks[idx - 1])}
              disabled={idx <= 0}
              className="rounded-full border border-white/[0.07] bg-white/[0.04] p-2.5 text-s-text3 transition-all hover:border-white/20 hover:text-s-text active:scale-[0.98] disabled:pointer-events-none disabled:opacity-30"
              aria-label="Previous week"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="min-w-[150px] text-center">
              <div className="font-display text-[24px] font-bold uppercase leading-none tracking-[1px] text-s-text sm:text-[30px]">
                Week {week}
              </div>
              <div className="mt-1 text-[11px] font-bold uppercase tracking-[2px] text-s-text3 sm:text-[12px]">
                {isPlayoff
                  ? <span className="text-s-gold">Playoffs</span>
                  : status === 'live'
                    ? <span className="text-win">In progress</span>
                    : 'Regular season'}
              </div>
            </div>

            <button
              onClick={() => setSelectedWeek(weeks[idx + 1])}
              disabled={idx >= weeks.length - 1}
              className="rounded-full border border-white/[0.07] bg-white/[0.04] p-2.5 text-s-text3 transition-all hover:border-white/20 hover:text-s-text active:scale-[0.98] disabled:pointer-events-none disabled:opacity-30"
              aria-label="Next week"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {previews.length > 0 ? (
            <>
              {motw && previews[motw.index] && (
                <MatchupOfTheWeek
                  p={previews[motw.index]}
                  reasons={motw.reasons}
                  ammo={motw.ammo}
                  onOpen={() => setOpenIdx(motw.index)}
                />
              )}
              {previews.length > 1 && (
                <div
                  className="overflow-hidden rounded-[6px]"
                  style={{ background: '#0B0B0D', border: '1px solid rgba(var(--gold-rgb), 0.12)' }}
                >
                  {previews.map((p, i) => i === motw?.index ? null : (
                    <MatchupRow key={`${p.teamA.name}-${p.teamB.name}`} p={p} onClick={() => setOpenIdx(i)} />
                  ))}
                </div>
              )}
              <p className="mt-3 text-center text-[11px] uppercase tracking-[1px] text-s-text3 sm:text-[12px]">
                Tap a matchup for head-to-head history, flair &amp; group-chat ammo
              </p>
              <FlairLegend badges={previews.flatMap(p => [...p.badgesA, ...p.badgesB])} />
            </>
          ) : (
            <div
              className="rounded-[6px] px-4 py-8 text-center text-[13px] text-s-text3"
              style={{ background: '#0B0B0D', border: '1px solid rgba(var(--gold-rgb), 0.12)' }}
            >
              No matchups for week {week}
            </div>
          )}

          {openIdx != null && previews[openIdx] && (
            <MatchupModal p={previews[openIdx]} onClose={() => setOpenIdx(null)} />
          )}
        </>
      )}

      {/* ── POWER RANKINGS ───────────────────────────────────────── */}
      {tab === 'rankings' && (
        <PowerRankingsTable rows={rankings.rows} throughWeek={rankings.throughWeek} badges={rankings.badges} />
      )}

      {/* ── ROSTERS ──────────────────────────────────────────────── */}
      {tab === 'rosters' && (
        <RosterView rosters={rosters.rosters} moves={rosters.moves} week={rosters.week} status={rosters.status} />
      )}
    </div>
  )
}

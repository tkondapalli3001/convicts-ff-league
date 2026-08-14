'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useLeague } from '@/context/LeagueContext'
import { usePreviewData } from '@/hooks/usePreviewData'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import PageHeader from '@/components/shared/PageHeader'
import MatchupRow from '@/components/preview/MatchupRow'
import MatchupModal from '@/components/preview/MatchupModal'

export default function ThisWeekPage() {
  const { state } = useLeague()
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const { season, weeks, week, previews, projectionsLoading } = usePreviewData(selectedWeek)

  if (state.error) return <ErrorState error={state.error} />
  if (!state.loaded) return <LoadingSpinner />
  if (!season) return <ErrorState error="No matchup data available yet" />

  const idx = weeks.indexOf(week)
  const isPlayoff = previews[0]?.isPlayoff ?? false

  // The newest league in the chain has no pairings until rosters are drafted, so
  // the preview falls back to the last completed season. Say so, or the page
  // reads as if a finished playoff game were this week's matchup.
  const latestSeason = Math.max(...Object.keys(state.leagues).map(Number))
  const preseason = Number.isFinite(latestSeason) && latestSeason > season

  return (
    <div className="animate-fade-in">
      <PageHeader
        kicker="The Week Ahead"
        title="This Week"
        subtitle={`Matchup previews, head-to-head history, and group-chat ammo · ${season} season`}
      />

      {preseason && (
        <div
          className="mb-5 rounded-[6px] px-4 py-3"
          style={{ background: '#0B0B0D', border: '1px solid rgba(var(--gold-rgb), 0.16)' }}
        >
          <div className="text-[10px] font-bold uppercase tracking-[2px] text-gold-soft">
            {latestSeason} Preseason
          </div>
          <p className="mt-1 text-[12px] leading-snug text-s-text2">
            The {latestSeason} season hasn&apos;t kicked off yet — previews below are the{' '}
            {season} archive. Live matchups return in Week 1.
          </p>
        </div>
      )}

      {/* Week selector */}
      <div className="flex items-center justify-center gap-3 mb-5">
        <button
          onClick={() => setSelectedWeek(weeks[idx - 1])}
          disabled={idx <= 0}
          className="p-2 rounded-full border border-white/[0.07] bg-white/[0.04] text-s-text3 hover:text-s-text hover:border-white/20 disabled:opacity-30 disabled:pointer-events-none active:scale-[0.98] transition-all"
          aria-label="Previous week"
        >
          <ChevronLeft size={15} />
        </button>

        <div className="min-w-[130px] text-center">
          <div className="text-[16px] font-extrabold text-s-text">Week {week}</div>
          <div className="text-[10px] font-bold tracking-[2px] uppercase text-s-text3">
            {isPlayoff ? <span className="text-s-gold">Playoffs</span> : 'Regular season'}
          </div>
        </div>

        <button
          onClick={() => setSelectedWeek(weeks[idx + 1])}
          disabled={idx >= weeks.length - 1}
          className="p-2 rounded-full border border-white/[0.07] bg-white/[0.04] text-s-text3 hover:text-s-text hover:border-white/20 disabled:opacity-30 disabled:pointer-events-none active:scale-[0.98] transition-all"
          aria-label="Next week"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {projectionsLoading && (
        <div className="text-center text-[10px] text-s-text3 mb-3">Loading projections…</div>
      )}

      {previews.length > 0 ? (
        <>
          <div
            className="overflow-hidden rounded-[6px]"
            style={{ background: '#0B0B0D', border: '1px solid rgba(var(--gold-rgb), 0.12)' }}
          >
            {previews.map((p, i) => (
              <MatchupRow key={`${p.teamA.name}-${p.teamB.name}`} p={p} onClick={() => setOpenIdx(i)} />
            ))}
          </div>
          <p className="mt-3 text-center text-[10px] uppercase tracking-[1px] text-s-text3">
            Tap a matchup for head-to-head history &amp; group-chat ammo
          </p>
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
    </div>
  )
}

'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useLeague } from '@/context/LeagueContext'
import { usePreviewData } from '@/hooks/usePreviewData'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'
import PageHeader from '@/components/shared/PageHeader'
import MatchupPreviewCard from '@/components/preview/MatchupPreviewCard'

export default function ThisWeekPage() {
  const { state } = useLeague()
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
  const { season, weeks, week, previews, projectionsLoading } = usePreviewData(selectedWeek)

  if (state.error) return <ErrorState error={state.error} />
  if (!state.loaded) return <LoadingSpinner />
  if (!season) return <ErrorState error="No matchup data available yet" />

  const idx = weeks.indexOf(week)
  const isPlayoff = previews[0]?.isPlayoff ?? false

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="This Week"
        subtitle={`Matchup previews, head-to-head history, and group-chat ammo · ${season} season`}
      />

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {previews.map(p => (
            <MatchupPreviewCard key={`${p.teamA.name}-${p.teamB.name}`} p={p} />
          ))}
        </div>
      ) : (
        <div className="bento-card px-4 py-8 text-center text-[13px] text-s-text3">
          No matchups for week {week}
        </div>
      )}
    </div>
  )
}

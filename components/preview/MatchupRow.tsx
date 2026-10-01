'use client'

import { ChevronRight } from 'lucide-react'
import OwnerAvatar from '@/components/shared/OwnerAvatar'
import FlairBadges from '@/components/preview/FlairBadges'
import { ownerColor, fmtPts } from '@/lib/utils'
import { ordinal } from '@/lib/preview'
import type { Badge, TeamPreview } from '@/lib/preview'
import type { EnrichedPreview } from '@/hooks/usePreviewData'

/** Record · seed · short streak. On phones the flair rides here, out of the name's way. */
function TeamMeta({ team, badges, align }: { team: TeamPreview; badges: Badge[]; align: 'start' | 'end' }) {
  return (
    <div className={`flex items-center gap-1.5 text-[11px] uppercase tracking-[0.5px] text-s-text3 sm:text-[13px] ${align === 'end' ? 'justify-end' : ''}`}>
      <span>
        {team.wins}–{team.losses}
        {team.seed > 0 && <> · {ordinal(team.seed)}</>}
        {team.streak && team.streak.len >= 2 && (
          <span style={{ color: team.streak.type === 'W' ? '#7FA886' : '#B4636B' }}>
            {' '}· {team.streak.type}{team.streak.len}
          </span>
        )}
      </span>
      <FlairBadges badges={badges} className="text-[12px] sm:hidden" />
    </div>
  )
}

/**
 * One clickable matchup row (2026 tab): two teams with quick stats, flair, and a
 * final/live/pre-game center readout. Opens the head-to-head + ammo modal on click.
 */
export default function MatchupRow({ p, onClick }: { p: EnrichedPreview; onClick: () => void }) {
  const winnerIsA = p.ptsA >= p.ptsB
  const h2hTotal = p.h2h.winsA + p.h2h.winsB
  // Winner colours only once the week is final — mid-week they'd crown a leader
  const played = p.status === 'final'
  const scored = p.status !== 'upcoming'
  const nameColor = (isA: boolean) =>
    played && (isA ? winnerIsA : !winnerIsA) ? ownerColor(isA ? p.teamA.name : p.teamB.name) : played ? '#5C6270' : '#EDE9E0'

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 border-b px-3 py-4 text-left transition-colors last:border-b-0 hover:bg-[rgba(201,150,46,0.05)] sm:gap-4 sm:px-6 sm:py-5"
      style={{ borderColor: 'rgba(255,255,255,0.04)' }}
    >
      {/* Team A (right-aligned toward the center) */}
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2 text-right sm:gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center justify-end gap-1.5">
            <FlairBadges badges={p.badgesA} className="hidden text-[16px] sm:inline-flex" />
            <span className="truncate text-[14px] font-bold sm:text-[19px]" style={{ color: nameColor(true) }}>
              {p.teamA.name}
            </span>
          </div>
          <TeamMeta team={p.teamA} badges={p.badgesA} align="end" />
        </div>
        <OwnerAvatar name={p.teamA.name} size="sm-md" />
      </div>

      {/* Center readout */}
      <div className="flex min-w-[80px] flex-shrink-0 flex-col items-center sm:min-w-[168px]">
        {scored ? (
          <div className="flex items-baseline gap-1 whitespace-nowrap font-display font-bold leading-none sm:gap-1.5">
            <span className="text-[18px] sm:text-[28px]" style={{ color: !played || winnerIsA ? '#EDE9E0' : '#5C6270' }}>{fmtPts(p.ptsA)}</span>
            <span className="text-[12px] text-[#3A4150] sm:text-[16px]">–</span>
            <span className="text-[18px] sm:text-[28px]" style={{ color: !played || !winnerIsA ? '#EDE9E0' : '#5C6270' }}>{fmtPts(p.ptsB)}</span>
          </div>
        ) : (
          <span className="font-display text-[18px] font-bold tracking-[2px] text-gold-dim sm:text-[26px]">VS</span>
        )}
        <div className="mt-1 text-[10px] font-semibold uppercase tracking-[1px] text-gold-dim sm:text-[12px]">
          {h2hTotal > 0 ? `H2H ${p.h2h.winsA}-${p.h2h.winsB}` : '1st mtg'}
        </div>
        {!played && p.projA != null && p.projB != null && (
          <div className="whitespace-nowrap text-[10px] uppercase tracking-[0.5px] text-s-text3 sm:text-[12px]">
            <span className="hidden sm:inline">Proj </span>{p.projA.toFixed(1)}–{p.projB.toFixed(1)}
          </div>
        )}
      </div>

      {/* Team B */}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <OwnerAvatar name={p.teamB.name} size="sm-md" />
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-[14px] font-bold sm:text-[19px]" style={{ color: nameColor(false) }}>
              {p.teamB.name}
            </span>
            <FlairBadges badges={p.badgesB} className="hidden text-[16px] sm:inline-flex" />
          </div>
          <TeamMeta team={p.teamB} badges={p.badgesB} align="start" />
        </div>
      </div>

      {/* Rows are plainly tappable on phones — the chevron gives the names its width back */}
      <ChevronRight size={16} className="hidden flex-shrink-0 text-s-text3 sm:block" />
    </button>
  )
}

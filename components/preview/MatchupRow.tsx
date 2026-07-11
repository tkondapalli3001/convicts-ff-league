'use client'

import { ChevronRight } from 'lucide-react'
import OwnerAvatar from '@/components/shared/OwnerAvatar'
import { ownerColor, fmtPts } from '@/lib/utils'
import { ordinal } from '@/lib/preview'
import type { EnrichedPreview } from '@/hooks/usePreviewData'
import type { TeamPreview } from '@/lib/preview'

function TeamMeta({ team }: { team: TeamPreview }) {
  return (
    <div className="text-[10px] uppercase tracking-[0.5px] text-s-text3">
      {team.wins}–{team.losses}
      {team.seed > 0 && <> · {ordinal(team.seed)}</>}
      {team.streak && team.streak.len >= 2 && (
        <span style={{ color: team.streak.type === 'W' ? '#7FA886' : '#B4636B' }}>
          {' '}· {team.streak.type}{team.streak.len}
        </span>
      )}
    </div>
  )
}

/**
 * One clickable matchup row (This Week): two teams with quick stats and a live/pre-game
 * center readout. Opens the head-to-head history + group-chat ammo modal on click.
 */
export default function MatchupRow({ p, onClick }: { p: EnrichedPreview; onClick: () => void }) {
  const winnerIsA = p.ptsA >= p.ptsB
  const h2hTotal = p.h2h.winsA + p.h2h.winsB

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 border-b px-3 py-3.5 text-left transition-colors last:border-b-0 hover:bg-[rgba(201,150,46,0.05)] sm:gap-3 sm:px-5"
      style={{ borderColor: 'rgba(255,255,255,0.04)' }}
    >
      {/* Team A (right-aligned toward the center) */}
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2.5 text-right">
        <div className="min-w-0">
          <div
            className="truncate text-[14px] font-bold"
            style={{ color: p.played && winnerIsA ? ownerColor(p.teamA.name) : p.played ? '#5C6270' : '#EDE9E0' }}
          >
            {p.teamA.name}
          </div>
          <TeamMeta team={p.teamA} />
        </div>
        <OwnerAvatar name={p.teamA.name} size="sm" />
      </div>

      {/* Center readout */}
      <div className="flex w-[86px] flex-shrink-0 flex-col items-center sm:w-[104px]">
        {p.played ? (
          <div className="flex items-baseline gap-1 whitespace-nowrap font-display font-bold leading-none">
            <span className="text-[20px]" style={{ color: winnerIsA ? '#EDE9E0' : '#5C6270' }}>{fmtPts(p.ptsA)}</span>
            <span className="text-[12px] text-[#3A4150]">–</span>
            <span className="text-[20px]" style={{ color: winnerIsA ? '#5C6270' : '#EDE9E0' }}>{fmtPts(p.ptsB)}</span>
          </div>
        ) : (
          <span className="font-display text-[16px] font-bold tracking-[2px] text-gold-dim">VS</span>
        )}
        <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[1px] text-gold-dim">
          {h2hTotal > 0 ? `H2H ${p.h2h.winsA}-${p.h2h.winsB}` : '1st mtg'}
        </div>
        {!p.played && p.projA != null && p.projB != null && (
          <div className="text-[9px] uppercase tracking-[0.5px] text-s-text3">
            {fmtPts(p.projA)}–{fmtPts(p.projB)}
          </div>
        )}
      </div>

      {/* Team B */}
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <OwnerAvatar name={p.teamB.name} size="sm" />
        <div className="min-w-0">
          <div
            className="truncate text-[14px] font-bold"
            style={{ color: p.played && !winnerIsA ? ownerColor(p.teamB.name) : p.played ? '#5C6270' : '#EDE9E0' }}
          >
            {p.teamB.name}
          </div>
          <TeamMeta team={p.teamB} />
        </div>
      </div>

      <ChevronRight size={15} className="flex-shrink-0 text-s-text3" />
    </button>
  )
}

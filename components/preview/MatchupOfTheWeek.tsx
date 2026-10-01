'use client'

import OwnerAvatar from '@/components/shared/OwnerAvatar'
import FlairBadges from '@/components/preview/FlairBadges'
import SmackLine from '@/components/preview/SmackLine'
import { ownerColor, fmtPts } from '@/lib/utils'
import { ordinal } from '@/lib/preview'
import type { Badge, TeamPreview } from '@/lib/preview'
import type { EnrichedPreview } from '@/hooks/usePreviewData'

function Side({ team, badges, proj, score, p, isWinner, align }: {
  team: TeamPreview
  badges: Badge[]
  proj: number | null
  score: number
  p: EnrichedPreview
  isWinner: boolean
  align: 'start' | 'end'
}) {
  const end = align === 'end'
  const played = p.status === 'final'
  return (
    <div className={`flex min-w-0 flex-col gap-2 ${end ? 'items-end text-right' : 'items-start text-left'}`}>
      <OwnerAvatar name={team.name} size="lg" />
      {/* Badges sit on the outer edge so the names face each other; on phones
          they drop to their own line so the name keeps its full width */}
      <div className={`flex max-w-full items-center gap-1.5 ${end ? 'flex-row-reverse' : ''}`}>
        <span
          className="truncate font-display text-[22px] font-bold uppercase leading-none tracking-[0.5px] sm:text-[38px]"
          style={{ color: played && isWinner ? ownerColor(team.name) : '#EDE9E0' }}
        >
          {team.name}
        </span>
        <FlairBadges badges={badges} className="hidden text-[22px] sm:inline-flex" />
      </div>
      <FlairBadges badges={badges} className="text-[16px] sm:hidden" />
      <div className="text-[11px] uppercase tracking-[1px] text-s-text3 sm:text-[13px]">
        {team.wins}–{team.losses}
        {team.seed > 0 && <> · {ordinal(team.seed)}</>}
      </div>
      {p.status !== 'upcoming' ? (
        <div className="font-display text-[26px] font-bold leading-none text-s-text sm:text-[36px]">{fmtPts(score)}</div>
      ) : proj != null && (
        <div className="text-[11px] uppercase tracking-[1px] text-gold-soft sm:text-[13px]">
          Proj <span className="font-display text-[18px] font-bold sm:text-[22px]">{proj.toFixed(1)}</span>
        </div>
      )}
    </div>
  )
}

/**
 * The week's featured matchup — the pairing with the most on the line — with
 * the reasons it was picked and one line of ammo. Opens the full breakdown.
 */
export default function MatchupOfTheWeek({ p, reasons, ammo, onOpen }: {
  p: EnrichedPreview
  reasons: string[]
  /** One ammo line on a topic the reasons don't already cover. */
  ammo: string | null
  onOpen: () => void
}) {
  const winnerIsA = p.ptsA >= p.ptsB
  const meetings = p.h2h.winsA + p.h2h.winsB
  const series = meetings === 0
    ? 'First meeting'
    : p.h2h.winsA === p.h2h.winsB
      ? `Series tied ${p.h2h.winsA}–${p.h2h.winsB}`
      : `${p.h2h.winsA > p.h2h.winsB ? p.teamA.name : p.teamB.name} leads ${Math.max(p.h2h.winsA, p.h2h.winsB)}–${Math.min(p.h2h.winsA, p.h2h.winsB)}`

  return (
    <section
      aria-label="Matchup of the Week"
      className="mb-6 overflow-hidden rounded-[6px]"
      style={{
        background: 'radial-gradient(ellipse 80% 130% at 50% -40%, rgba(var(--gold2-rgb), 0.16) 0%, transparent 62%), #0B0B0D',
        border: '1px solid rgba(var(--gold-rgb), 0.30)',
      }}
    >
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-7" style={{ borderColor: 'rgba(var(--gold-rgb), 0.16)' }}>
        <div className="flex items-center gap-2.5">
          <span className="h-px w-5 bg-gold" />
          <span className="text-[11px] font-bold uppercase tracking-[3px] text-gold-soft sm:text-[13px] sm:tracking-[4px]">
            ★ Matchup of the Week
          </span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[2px] text-s-text3 sm:text-[12px]">
          Week {p.week}{p.status === 'live' ? ' · Live' : p.status === 'final' ? ' · Final' : ''}
        </span>
      </div>

      <button
        onClick={onOpen}
        className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-4 py-6 transition-colors hover:bg-[rgba(201,150,46,0.04)] sm:gap-8 sm:px-10 sm:py-9"
        aria-label={`Open ${p.teamA.name} vs ${p.teamB.name}`}
      >
        <Side team={p.teamA} badges={p.badgesA} proj={p.projA} score={p.ptsA} p={p} isWinner={winnerIsA} align="end" />
        <div className="flex flex-col items-center gap-1.5">
          <span className="font-display text-[22px] font-bold tracking-[3px] text-gold sm:text-[34px]">
            {p.status === 'final' ? 'FINAL' : 'VS'}
          </span>
          <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[1px] text-gold-dim sm:text-[12px]">
            {series}
          </span>
          {/* Live: the sides show the score, so projections move here */}
          {p.status === 'live' && p.projA != null && p.projB != null && (
            <span className="whitespace-nowrap text-[10px] uppercase tracking-[0.5px] text-s-text3 sm:text-[12px]">
              Proj {p.projA.toFixed(1)}–{p.projB.toFixed(1)}
            </span>
          )}
        </div>
        <Side team={p.teamB} badges={p.badgesB} proj={p.projB} score={p.ptsB} p={p} isWinner={!winnerIsA} align="start" />
      </button>

      {reasons.length > 0 && (
        <div className="border-t px-4 py-4 sm:px-7 sm:py-5" style={{ borderColor: 'rgba(var(--gold-rgb), 0.12)' }}>
          <div className="mb-2.5 text-[10px] font-bold uppercase tracking-[2.5px] text-s-text3 sm:text-[12px]">Why it matters</div>
          <ul className="space-y-2">
            {reasons.map(r => (
              <li key={r} className="flex gap-2.5 text-[13px] leading-snug text-s-text2 sm:text-[16px]">
                <span className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold sm:mt-[9px]" aria-hidden />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {ammo && (
        <div className="border-t px-4 py-4 sm:px-7" style={{ borderColor: 'rgba(var(--gold-rgb), 0.12)' }}>
          <SmackLine line={ammo} />
        </div>
      )}
    </section>
  )
}

'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { X } from 'lucide-react'
import OwnerAvatar from '@/components/shared/OwnerAvatar'
import FlairBadges from '@/components/preview/FlairBadges'
import SmackLine from '@/components/preview/SmackLine'
import { useModalClose } from '@/hooks/useModalClose'
import { ownerColor, fmtPts } from '@/lib/utils'
import { ordinal } from '@/lib/preview'
import type { Badge, TeamPreview } from '@/lib/preview'
import type { EnrichedPreview } from '@/hooks/usePreviewData'

/** Ammo lines shown at once; the reroll button steps to the next batch. */
const AMMO_PER_ROLL = 3

/** One side of the modal header: avatar, name, flair, record, seed, score/proj. */
function TeamColumn({ team, badges, score, proj, status, isWinner }: {
  team: TeamPreview
  badges: Badge[]
  score: number
  proj: number | null
  status: EnrichedPreview['status']
  isWinner: boolean
}) {
  const color = ownerColor(team.name)
  const played = status === 'final'
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2 p-4 text-center sm:p-5">
      <div
        className="rounded-full"
        style={played && isWinner ? { boxShadow: '0 0 0 1.5px #C9962E, 0 0 10px rgba(201,150,46,0.35)' } : undefined}
      >
        <OwnerAvatar name={team.name} size="lg" />
      </div>
      <Link href={`/owners/${team.name}`} className="min-w-0 max-w-full">
        <div
          className="truncate font-display text-[26px] font-bold uppercase leading-none tracking-[0.5px] hover:underline sm:text-[30px]"
          style={{ color: played && isWinner ? color : '#EDE9E0' }}
        >
          {team.name}
        </div>
      </Link>
      <FlairBadges badges={badges} className="text-[17px]" />
      <div className="text-[11px] uppercase tracking-[1px] text-s-text3 sm:text-[12px]">
        {team.wins}–{team.losses}
        {team.seed > 0 && <> · {ordinal(team.seed)} seed</>}
      </div>
      {status !== 'upcoming' ? (
        <>
          <div
            className="font-display text-[36px] font-bold leading-none sm:text-[42px]"
            style={{ color: !played ? '#EDE9E0' : isWinner ? '#E8CE8A' : '#9AA0AC' }}
          >
            {fmtPts(score)}
          </div>
          {!played && proj != null && (
            <div className="text-[11px] uppercase tracking-[1px] text-gold-soft">
              Proj <span className="font-display text-[15px] font-bold">{proj.toFixed(1)}</span>
            </div>
          )}
        </>
      ) : proj != null ? (
        <div className="text-[11px] uppercase tracking-[1px] text-gold-soft">
          Proj <span className="font-display text-[18px] font-bold">{fmtPts(proj)}</span>
        </div>
      ) : (
        team.avgPts > 0 && (
          <div className="text-[11px] uppercase tracking-[1px] text-s-text3">{fmtPts(team.avgPts)} avg</div>
        )
      )}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="h-px w-5 bg-gold" />
      <span className="text-[11px] font-bold uppercase tracking-[3px] text-gold-soft sm:text-[12px]">{children}</span>
    </div>
  )
}

export default function MatchupModal({ p, onClose }: { p: EnrichedPreview; onClose: () => void }) {
  useModalClose(onClose)
  const [roll, setRoll] = useState(0)

  const winnerIsA = p.ptsA >= p.ptsB
  const h2hTotal = p.h2h.winsA + p.h2h.winsB
  const leadLine =
    h2hTotal === 0
      ? 'First career meeting'
      : p.h2h.winsA === p.h2h.winsB
        ? `Series tied ${p.h2h.winsA}–${p.h2h.winsB}`
        : p.h2h.winsA > p.h2h.winsB
          ? `${p.teamA.name} leads ${p.h2h.winsA}–${p.h2h.winsB}`
          : `${p.teamB.name} leads ${p.h2h.winsB}–${p.h2h.winsA}`

  const last = p.h2h.lastGame
  const lastLine = last
    ? `${last.winner} won ${fmtPts(last.winner === last.team1 ? last.pts1 : last.pts2)}–${fmtPts(last.winner === last.team1 ? last.pts2 : last.pts1)} · ${last.year} Week ${last.week}`
    : null

  const implications = [
    { team: p.teamA, imp: p.implicationA },
    { team: p.teamB, imp: p.implicationB },
  ].filter(({ imp }) => imp && (imp.line || imp.playoffNote))

  const flair = [
    ...p.badgesA.map(b => ({ team: p.teamA.name, b })),
    ...p.badgesB.map(b => ({ team: p.teamB.name, b })),
  ]

  // Page through today's ammo a few lines at a time, wrapping around
  const rolls = Math.max(1, Math.ceil(p.smack.length / AMMO_PER_ROLL))
  const ammo = p.smack.slice((roll % rolls) * AMMO_PER_ROLL, (roll % rolls) * AMMO_PER_ROLL + AMMO_PER_ROLL)

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${p.teamA.name} vs ${p.teamB.name}, week ${p.week}`}
      className="fixed inset-0 z-[500] flex items-center justify-center p-4"
      style={{ background: 'rgba(3,3,4,0.8)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="max-h-[88vh] w-full max-w-[640px] overflow-y-auto rounded-[6px]"
        style={{ background: '#0B0B0D', border: '1px solid rgba(var(--gold-rgb), 0.16)' }}
      >
        {/* Header — two teams */}
        <div className="relative border-b" style={{ borderColor: 'rgba(var(--gold-rgb), 0.12)' }}>
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-10 p-1.5 text-s-text3 transition-colors hover:text-gold-soft"
            aria-label="Close"
          >
            <X size={18} />
          </button>
          <div className="flex items-stretch">
            <TeamColumn team={p.teamA} badges={p.badgesA} score={p.ptsA} proj={p.projA} status={p.status} isWinner={winnerIsA} />
            <div className="flex flex-col items-center justify-center px-2">
              <span className="font-display text-[16px] font-bold tracking-[2px] text-gold-dim">
                {p.status === 'final' ? 'FINAL' : p.status === 'live' ? 'LIVE' : 'VS'}
              </span>
            </div>
            <TeamColumn team={p.teamB} badges={p.badgesB} score={p.ptsB} proj={p.projB} status={p.status} isWinner={!winnerIsA} />
          </div>
        </div>

        {/* All-time series */}
        <div className="border-b px-5 py-4 sm:px-6" style={{ borderColor: 'rgba(var(--gold-rgb), 0.10)' }}>
          <SectionLabel>All-Time Series</SectionLabel>
          <div className="font-display text-[24px] font-bold uppercase leading-none text-gold-bright sm:text-[28px]">{leadLine}</div>
          {lastLine && (
            <div className="mt-2 text-[12px] uppercase tracking-[0.5px] text-s-text3 sm:text-[13px]">Last meeting — {lastLine}</div>
          )}
        </div>

        {/* Flair, spelled out */}
        {flair.length > 0 && (
          <div className="border-b px-5 py-4 sm:px-6" style={{ borderColor: 'rgba(var(--gold-rgb), 0.10)' }}>
            <SectionLabel>Flair</SectionLabel>
            <ul className="space-y-1.5">
              {flair.map(({ team, b }) => (
                <li key={`${team}-${b.label}`} className="text-[13px] leading-snug text-s-text2 sm:text-[14px]">
                  <span className="mr-1.5">{b.emoji}</span>
                  <span className="font-semibold text-s-text">{b.label}</span> — {b.detail.startsWith(team) ? b.detail : `${team}: ${b.detail}`}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Playoff implications */}
        {implications.length > 0 && (
          <div className="border-b px-5 py-4 sm:px-6" style={{ borderColor: 'rgba(var(--gold-rgb), 0.10)' }}>
            <SectionLabel>Stakes</SectionLabel>
            <div className="space-y-1.5">
              {implications.map(({ team, imp }) => (
                <div key={team.name} className="text-[13px] text-s-text2 sm:text-[14px]">
                  <span className="font-semibold text-s-text">{team.name}</span>
                  {imp!.line && <> — {imp!.line}</>}
                  {imp!.playoffNote && <span className="text-gold-soft"> {imp!.line ? '·' : '—'} {imp!.playoffNote}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Group-chat ammo — rotates daily; the dice deal the next batch */}
        {ammo.length > 0 && (
          <div className="px-5 py-4 sm:px-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="h-px w-5 bg-gold" />
                <span className="text-[11px] font-bold uppercase tracking-[3px] text-gold-soft sm:text-[12px]">Group-Chat Ammo</span>
              </div>
              {rolls > 1 && (
                <button
                  onClick={() => setRoll(r => r + 1)}
                  className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[1px] text-s-text2 transition-colors hover:border-gold hover:text-gold-soft active:scale-[0.98]"
                  style={{ borderColor: 'rgba(var(--gold-rgb), 0.20)' }}
                  aria-label="Deal new ammo"
                >
                  <span aria-hidden>🎲</span> Reroll
                  <span className="font-normal text-s-text3">{(roll % rolls) + 1}/{rolls}</span>
                </button>
              )}
            </div>
            <div className="space-y-2">
              {ammo.map(line => <SmackLine key={line} line={line} />)}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

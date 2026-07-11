'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { X, Copy, Check } from 'lucide-react'
import OwnerAvatar from '@/components/shared/OwnerAvatar'
import { ownerColor, fmtPts } from '@/lib/utils'
import { ordinal } from '@/lib/preview'
import type { EnrichedPreview } from '@/hooks/usePreviewData'
import type { TeamPreview } from '@/lib/preview'

/** One roast line with a copy-for-the-group-chat button. */
function SmackLine({ line }: { line: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(line)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = line
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy') } finally { ta.remove() }
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div
      className="flex items-center gap-2 rounded-[6px] border px-3 py-2"
      style={{ borderColor: 'rgba(var(--gold-rgb), 0.10)', background: '#0B0B0D' }}
    >
      <span className="flex-1 text-[12px] leading-snug text-s-text2">{line}</span>
      <button
        onClick={copy}
        className="flex-shrink-0 rounded-[4px] p-1.5 text-s-text3 transition-colors hover:text-gold-soft active:scale-[0.98]"
        aria-label="Copy to clipboard"
        title="Copy for the group chat"
      >
        {copied ? <Check size={13} className="text-win" /> : <Copy size={13} />}
      </button>
    </div>
  )
}

/** One side of the modal header: avatar, name, record, seed, streak, avg, score/proj. */
function TeamColumn({ team, score, proj, played, isWinner }: {
  team: TeamPreview
  score: number
  proj: number | null
  played: boolean
  isWinner: boolean
}) {
  const color = ownerColor(team.name)
  return (
    <div className="flex flex-1 flex-col items-center gap-2 p-4 text-center">
      <div
        className="rounded-full"
        style={played && isWinner ? { boxShadow: '0 0 0 1.5px #C9962E, 0 0 10px rgba(201,150,46,0.35)' } : undefined}
      >
        <OwnerAvatar name={team.name} size="lg" />
      </div>
      <Link href={`/owners/${team.name}`} className="min-w-0 max-w-full">
        <div
          className="truncate font-display text-[24px] font-bold uppercase leading-none tracking-[0.5px] hover:underline"
          style={{ color: played && isWinner ? color : '#EDE9E0' }}
        >
          {team.name}
        </div>
      </Link>
      <div className="text-[10px] uppercase tracking-[1px] text-s-text3">
        {team.wins}–{team.losses}
        {team.seed > 0 && <> · {ordinal(team.seed)} seed</>}
      </div>
      {played ? (
        <div className="font-display text-[36px] font-bold leading-none" style={{ color: isWinner ? '#E8CE8A' : '#9AA0AC' }}>
          {fmtPts(score)}
        </div>
      ) : proj != null ? (
        <div className="text-[10px] uppercase tracking-[1px] text-gold-soft">
          Proj <span className="font-display text-[16px] font-bold">{fmtPts(proj)}</span>
        </div>
      ) : (
        team.avgPts > 0 && (
          <div className="text-[10px] uppercase tracking-[1px] text-s-text3">{fmtPts(team.avgPts)} avg</div>
        )
      )}
    </div>
  )
}

export default function MatchupModal({ p, onClose }: { p: EnrichedPreview; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

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

  return createPortal(
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-4"
      style={{ background: 'rgba(3,3,4,0.8)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="max-h-[88vh] w-full max-w-[560px] overflow-y-auto rounded-[6px]"
        style={{ background: '#0B0B0D', border: '1px solid rgba(var(--gold-rgb), 0.16)' }}
      >
        {/* Header — two teams */}
        <div className="relative border-b" style={{ borderColor: 'rgba(var(--gold-rgb), 0.12)' }}>
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-10 p-1.5 text-s-text3 transition-colors hover:text-gold-soft"
            aria-label="Close"
          >
            <X size={16} />
          </button>
          <div className="flex items-stretch">
            <TeamColumn team={p.teamA} score={p.ptsA} proj={p.projA} played={p.played} isWinner={winnerIsA} />
            <div className="flex flex-col items-center justify-center px-2">
              <span className="font-display text-[14px] font-bold tracking-[2px] text-gold-dim">
                {p.played ? 'FINAL' : 'VS'}
              </span>
            </div>
            <TeamColumn team={p.teamB} score={p.ptsB} proj={p.projB} played={p.played} isWinner={!winnerIsA} />
          </div>
        </div>

        {/* All-time series */}
        <div className="border-b px-5 py-4" style={{ borderColor: 'rgba(var(--gold-rgb), 0.10)' }}>
          <div className="mb-2.5 flex items-center gap-2.5">
            <span className="h-px w-5 bg-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[3px] text-gold-soft">All-Time Series</span>
          </div>
          <div className="font-display text-[22px] font-bold uppercase leading-none text-gold-bright">{leadLine}</div>
          {lastLine && (
            <div className="mt-2 text-[11px] uppercase tracking-[0.5px] text-s-text3">Last meeting — {lastLine}</div>
          )}
        </div>

        {/* Playoff implications */}
        {implications.length > 0 && (
          <div className="border-b px-5 py-4" style={{ borderColor: 'rgba(var(--gold-rgb), 0.10)' }}>
            <div className="mb-2.5 flex items-center gap-2.5">
              <span className="h-px w-5 bg-gold" />
              <span className="text-[10px] font-bold uppercase tracking-[3px] text-gold-soft">Stakes</span>
            </div>
            <div className="space-y-1.5">
              {implications.map(({ team, imp }) => (
                <div key={team.name} className="text-[12px] text-s-text2">
                  <span className="font-semibold text-s-text">{team.name}</span>
                  {imp!.line && <> — {imp!.line}</>}
                  {imp!.playoffNote && <span className="text-gold-soft"> {imp!.line ? '·' : '—'} {imp!.playoffNote}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disses */}
        {p.smack.length > 0 && (
          <div className="px-5 py-4">
            <div className="mb-2.5 flex items-center gap-2.5">
              <span className="h-px w-5 bg-gold" />
              <span className="text-[10px] font-bold uppercase tracking-[3px] text-gold-soft">Group-Chat Ammo</span>
            </div>
            <div className="space-y-2">
              {p.smack.map(line => <SmackLine key={line} line={line} />)}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

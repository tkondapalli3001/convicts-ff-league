'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Copy, Check } from 'lucide-react'
import OwnerAvatar from '@/components/shared/OwnerAvatar'
import { ownerColor, fmtPts } from '@/lib/utils'
import { ordinal } from '@/lib/preview'
import type { EnrichedPreview } from '@/hooks/usePreviewData'
import type { TeamPreview } from '@/lib/preview'

function TeamSide({ team, isWinner, played }: { team: TeamPreview; isWinner: boolean; played: boolean }) {
  const color = ownerColor(team.name)
  return (
    <Link
      href={`/owners/${team.name}`}
      className="flex flex-col items-center gap-2 text-center group flex-1 min-w-0"
    >
      <OwnerAvatar name={team.name} size="lg" />
      <div className="min-w-0">
        <div
          className={[
            'text-[15px] font-extrabold truncate group-hover:underline',
            played && !isWinner ? 'text-s-text3' : 'text-s-text',
          ].join(' ')}
          style={played && isWinner ? { color } : undefined}
        >
          {team.name}
        </div>
        <div className="text-[11px] text-s-text3 mt-0.5">
          {team.wins}–{team.losses}
          {team.seed > 0 && <> · {ordinal(team.seed)}</>}
          {team.streak && team.streak.len >= 2 && (
            <span className={team.streak.type === 'W' ? 'text-s-green' : 'text-s-red'}>
              {' '}· {team.streak.type}{team.streak.len}
            </span>
          )}
        </div>
        {team.avgPts > 0 && (
          <div className="text-[10px] text-s-text3">{fmtPts(team.avgPts)} avg</div>
        )}
      </div>
    </Link>
  )
}

function SmackLine({ line }: { line: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(line)
    } catch {
      // Older browsers / restricted contexts: textarea + execCommand fallback
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
    <div className="flex items-center gap-2 rounded-[10px] bg-white/[0.03] border border-white/[0.05] px-3 py-2">
      <span className="flex-1 text-[12px] text-slate-300 leading-snug">{line}</span>
      <button
        onClick={copy}
        className="flex-shrink-0 p-1.5 rounded-[8px] text-s-text3 hover:text-s-text hover:bg-white/[0.06] active:scale-[0.98] transition-all"
        aria-label="Copy to clipboard"
        title="Copy for the group chat"
      >
        {copied ? <Check size={13} className="text-s-green" /> : <Copy size={13} />}
      </button>
    </div>
  )
}

export default function MatchupPreviewCard({ p }: { p: EnrichedPreview }) {
  const winnerIsA = p.ptsA >= p.ptsB
  const h2hTotal = p.h2h.winsA + p.h2h.winsB
  const h2hLine = p.h2h.winsA === p.h2h.winsB
    ? `Series tied ${p.h2h.winsA}–${p.h2h.winsB}`
    : p.h2h.winsA > p.h2h.winsB
      ? `${p.teamA.name} leads ${p.h2h.winsA}–${p.h2h.winsB}`
      : `${p.teamB.name} leads ${p.h2h.winsB}–${p.h2h.winsA}`
  const projFavA = p.projA != null && p.projB != null && p.projA >= p.projB

  const implications = [
    { team: p.teamA, imp: p.implicationA },
    { team: p.teamB, imp: p.implicationB },
  ].filter(({ imp }) => imp && (imp.line || imp.playoffNote))

  return (
    <div className="bento-card p-5">
      {/* Score / matchup row */}
      <div className="flex items-start gap-2">
        <TeamSide team={p.teamA} isWinner={winnerIsA} played={p.played} />

        <div className="flex flex-col items-center justify-center pt-3 px-1 flex-shrink-0 min-w-[110px]">
          {p.played ? (
            <div className="flex items-baseline gap-1.5 whitespace-nowrap">
              <span className={`text-[22px] font-black ${winnerIsA ? 'text-s-text' : 'text-s-text3'}`}>
                {fmtPts(p.ptsA)}
              </span>
              <span className="text-[12px] text-s-text3">–</span>
              <span className={`text-[22px] font-black ${winnerIsA ? 'text-s-text3' : 'text-s-text'}`}>
                {fmtPts(p.ptsB)}
              </span>
            </div>
          ) : (
            <div className="text-[18px] font-black tracking-[2px] text-s-text3">VS</div>
          )}

          {p.projA != null && p.projB != null && (
            <div className="text-[10px] text-s-text3 mt-1 whitespace-nowrap">
              Proj:{' '}
              <span className={projFavA ? 'text-s-text font-semibold' : ''}>{fmtPts(p.projA)}</span>
              {' – '}
              <span className={!projFavA ? 'text-s-text font-semibold' : ''}>{fmtPts(p.projB)}</span>
            </div>
          )}
        </div>

        <TeamSide team={p.teamB} isWinner={!winnerIsA} played={p.played} />
      </div>

      {/* H2H strip */}
      <div className="mt-4 pt-3 border-t border-white/[0.05] text-[11px] text-s-text3 text-center">
        {h2hTotal > 0 ? (
          <>
            All-time: <span className="text-slate-300 font-semibold">{h2hLine}</span>
            {p.h2h.lastGame && (
              <>
                {' '}· Last: {p.h2h.lastGame.winner} {fmtPts(
                  p.h2h.lastGame.winner === p.h2h.lastGame.team1 ? p.h2h.lastGame.pts1 : p.h2h.lastGame.pts2
                )}–{fmtPts(
                  p.h2h.lastGame.winner === p.h2h.lastGame.team1 ? p.h2h.lastGame.pts2 : p.h2h.lastGame.pts1
                )} ({p.h2h.lastGame.year} W{p.h2h.lastGame.week})
              </>
            )}
          </>
        ) : (
          'First career meeting'
        )}
      </div>

      {/* Playoff implications */}
      {implications.length > 0 && (
        <div className="mt-2 space-y-1">
          {implications.map(({ team, imp }) => (
            <div key={team.name} className="text-[11px] text-s-text3 text-center">
              <span className="font-semibold text-slate-300">{team.name}</span>
              {imp!.line && <> — {imp!.line}</>}
              {imp!.playoffNote && (
                <span className="text-s-gold"> {imp!.line ? '·' : '—'} {imp!.playoffNote}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Smack talk */}
      {p.smack.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {p.smack.map(line => <SmackLine key={line} line={line} />)}
        </div>
      )}
    </div>
  )
}

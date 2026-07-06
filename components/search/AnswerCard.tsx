'use client'

import { useRouter } from 'next/navigation'
import { ownerColor, fullNameInitials } from '@/lib/utils'
import OwnerAvatar from '@/components/shared/OwnerAvatar'
import type { Answer } from '@/lib/search'

/** Renders 'stat', 'list', and 'h2h' answers. Manager/player kinds render their own cards. */
export default function AnswerCard({ answer }: { answer: Exclude<Answer, { kind: 'manager' } | { kind: 'player' }> }) {
  const router = useRouter()

  if (answer.kind === 'stat') {
    const accent = answer.owner ? ownerColor(answer.owner) : '#f59e0b'
    return (
      <div className="bento-card relative p-6 animate-fade-in overflow-hidden">
        <div
          className="absolute pointer-events-none"
          style={{
            top: -40, right: -40, width: 160, height: 160, borderRadius: '50%',
            background: `radial-gradient(circle, ${accent}26 0%, transparent 70%)`,
          }}
        />
        <div className="text-[10px] font-bold tracking-[3px] uppercase text-s-text3 mb-2">
          {answer.headline}
        </div>
        <div className="flex items-center gap-4">
          {answer.owner && (
            <button onClick={() => router.push(`/owners/${encodeURIComponent(answer.owner!)}`)}>
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-[14px] font-black text-white"
                style={{ background: `linear-gradient(135deg, ${accent} 0%, ${accent}88 100%)`, boxShadow: `0 0 16px ${accent}44` }}
              >
                {fullNameInitials(answer.owner)}
              </div>
            </button>
          )}
          <div
            className="text-[34px] md:text-[42px] font-black leading-none tracking-tight"
            style={{ color: accent }}
          >
            {answer.value}
          </div>
        </div>
        {answer.detail && (
          <div className="text-[12px] text-s-text2 font-medium mt-3">{answer.detail}</div>
        )}
      </div>
    )
  }

  if (answer.kind === 'list') {
    return (
      <div className="bento-card p-5 animate-fade-in">
        <div className="text-[10px] font-bold tracking-[3px] uppercase text-s-text3 mb-3">
          {answer.title}
        </div>
        <div className="flex flex-col">
          {answer.rows.map((row, i) => (
            <div
              key={`${row.label}-${i}`}
              className={[
                'flex items-center gap-3 py-2',
                i > 0 ? 'border-t border-s-border/40' : '',
                row.owner ? 'cursor-pointer hover:bg-s-bg3/40 rounded-[6px] px-2 -mx-2 transition-colors' : '',
              ].join(' ')}
              onClick={row.owner ? () => router.push(`/owners/${encodeURIComponent(row.owner!)}`) : undefined}
            >
              {row.owner && <OwnerAvatar name={row.owner} size="sm" />}
              <div className="flex-1 min-w-0">
                <span className="text-[13px] font-bold text-s-text">{row.label}</span>
                {row.sub && <span className="text-[10px] text-s-text3 ml-2">{row.sub}</span>}
              </div>
              <span
                className="text-[14px] font-black tabular-nums"
                style={{ color: row.owner ? ownerColor(row.owner) : '#e6edf3' }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // h2h scoreboard
  const { a, b, record } = answer
  const colorA = ownerColor(a)
  const colorB = ownerColor(b)
  return (
    <div className="bento-card p-5 animate-fade-in">
      <div className="text-[10px] font-bold tracking-[3px] uppercase text-s-text3 mb-4 text-center">
        All-Time Head-to-Head · {record.games.length} games
      </div>
      <div className="flex items-center justify-between gap-4">
        <button
          className="text-center flex-1 group"
          onClick={() => router.push(`/owners/${encodeURIComponent(a)}`)}
        >
          <div
            className="w-11 h-11 mx-auto mb-2 rounded-full flex items-center justify-center text-[13px] font-black text-white"
            style={{ background: `linear-gradient(135deg, ${colorA} 0%, ${colorA}88 100%)`, boxShadow: `0 0 14px ${colorA}44` }}
          >
            {fullNameInitials(a)}
          </div>
          <div className="text-[12px] font-bold text-s-text group-hover:underline">{a}</div>
          <div className={`text-[36px] font-black leading-none mt-1 tabular-nums ${record.winsA >= record.winsB ? 'text-s-green' : 'text-s-text3'}`}>
            {record.winsA}
          </div>
          <div className="text-[10px] text-s-text3 mt-1">avg {record.avgA.toFixed(1)} · high {record.highA.toFixed(1)}</div>
        </button>

        <div className="text-center flex-shrink-0 text-[20px]">⚔️</div>

        <button
          className="text-center flex-1 group"
          onClick={() => router.push(`/owners/${encodeURIComponent(b)}`)}
        >
          <div
            className="w-11 h-11 mx-auto mb-2 rounded-full flex items-center justify-center text-[13px] font-black text-white"
            style={{ background: `linear-gradient(135deg, ${colorB} 0%, ${colorB}88 100%)`, boxShadow: `0 0 14px ${colorB}44` }}
          >
            {fullNameInitials(b)}
          </div>
          <div className="text-[12px] font-bold text-s-text group-hover:underline">{b}</div>
          <div className={`text-[36px] font-black leading-none mt-1 tabular-nums ${record.winsB >= record.winsA ? 'text-s-green' : 'text-s-text3'}`}>
            {record.winsB}
          </div>
          <div className="text-[10px] text-s-text3 mt-1">avg {record.avgB.toFixed(1)} · high {record.highB.toFixed(1)}</div>
        </button>
      </div>

      {record.lastGame && (
        <div className="text-[11px] text-s-text3 text-center mt-4 pt-3 border-t border-s-border/40">
          Last meeting: {record.lastGame.year} Wk{record.lastGame.week} —{' '}
          <span className="text-s-text2 font-semibold">
            {record.lastGame.winner} won {Math.max(record.lastGame.pts1, record.lastGame.pts2).toFixed(1)}–{Math.min(record.lastGame.pts1, record.lastGame.pts2).toFixed(1)}
          </span>
        </div>
      )}
    </div>
  )
}

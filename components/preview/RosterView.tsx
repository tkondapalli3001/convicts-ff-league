'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import OwnerAvatar from '@/components/shared/OwnerAvatar'
import SectionCard from '@/components/shared/SectionCard'
import { fmtPts, timeAgo } from '@/lib/utils'
import { ordinal } from '@/lib/preview'
import { POS_TEXT_CLASSES } from '@/lib/constants'
import type { TeamRoster, RosterPlayer, RosterMove, WeekStatus } from '@/lib/preview'

const STORAGE_KEY = 'convicts:roster-team'
const MOVES_SHOWN = 8

const INJURY_LABELS: Record<string, string> = {
  Questionable: 'Q', Doubtful: 'D', Out: 'O', IR: 'IR', PUP: 'PUP', Sus: 'SUS', NA: 'NA', DNR: 'DNR', COV: 'COV',
}

const STATUS_LABEL: Record<WeekStatus, string> = { final: 'Final', live: 'In progress', upcoming: 'Upcoming' }

function fmtProj(n: number | null): string {
  return n == null ? '—' : n.toFixed(1)
}

function InjuryTag({ status }: { status: string | null }) {
  if (!status) return null
  const label = INJURY_LABELS[status] ?? status.slice(0, 3).toUpperCase()
  const mild = label === 'Q'
  return (
    <span
      className="flex-shrink-0 rounded-[2px] border px-1 py-px text-[8px] font-bold tracking-[0.5px]"
      style={mild
        ? { color: '#C9A24B', borderColor: 'rgba(var(--gold-rgb), 0.3)' }
        : { color: '#B4636B', borderColor: 'rgba(180,99,107,0.35)' }}
      title={status}
    >
      {label}
    </span>
  )
}

function slotClass(slot: string): string {
  if (slot === 'BN') return 'text-s-muted'
  if (slot === 'IR') return 'text-loss'
  return POS_TEXT_CLASSES[slot] ?? 'text-s-text3'
}

function PlayerRow({ slot, p, showPts }: { slot: string; p: RosterPlayer | null; showPts: boolean }) {
  const cols = showPts ? 'grid-cols-[38px_minmax(0,1fr)_44px_52px]' : 'grid-cols-[38px_minmax(0,1fr)_48px]'
  const sub = p ? [p.position !== slot ? p.position : null, p.team, p.game].filter(Boolean).join(' · ') : ''
  return (
    <li className={`grid ${cols} items-center gap-2 border-b px-4 py-2 last:border-b-0 sm:px-5`} style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
      <span className={`text-[10px] font-bold uppercase tracking-[1px] ${slotClass(slot)}`}>{slot}</span>
      {p ? (
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-[13px] font-semibold text-s-text">{p.name}</span>
            <InjuryTag status={p.injury} />
          </div>
          {sub && <div className="truncate text-[10px] uppercase tracking-[0.5px] text-s-text3">{sub}</div>}
        </div>
      ) : (
        <span className="text-[12px] italic text-s-muted">Empty</span>
      )}
      <span className="text-right font-display text-[15px] font-semibold text-s-text2 num">{fmtProj(p?.proj ?? null)}</span>
      {showPts && (
        <span className="text-right font-display text-[15px] font-bold text-s-text num">
          {p?.pts != null ? fmtPts(p.pts) : '—'}
        </span>
      )}
    </li>
  )
}

function GroupHeader({ label, showPts }: { label: string; showPts: boolean }) {
  const cols = showPts ? 'grid-cols-[38px_minmax(0,1fr)_44px_52px]' : 'grid-cols-[38px_minmax(0,1fr)_48px]'
  return (
    <div
      className={`grid ${cols} gap-2 border-b px-4 pb-1.5 pt-3 text-[9px] font-bold uppercase tracking-[2px] text-s-text3 sm:px-5`}
      style={{ borderColor: 'rgba(var(--gold-rgb), 0.08)' }}
    >
      <span className="col-span-2">{label}</span>
      <span className="text-right">Proj</span>
      {showPts && <span className="text-right">Pts</span>}
    </div>
  )
}

function MoveLine({ move, now }: { move: RosterMove; now: number }) {
  const trade = move.type === 'trade'
  return (
    <li className="border-b px-5 py-2.5 last:border-b-0" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-[12px] font-bold text-s-text">
          {trade ? `Trade · ${move.owners.join(' ⇄ ')}` : move.owners[0]}
        </span>
        <span className="flex-shrink-0 text-[10px] uppercase tracking-[0.5px] text-s-text3">
          {move.bid ? `$${move.bid} · ` : ''}{timeAgo(now - move.at)}
        </span>
      </div>
      <div className="mt-0.5 text-[11px] leading-snug">
        {move.adds.map(a => (
          <span key={`a-${a.player}`} className="mr-2 inline-block" style={{ color: '#7FA886' }}>
            + {a.player}{trade && <span className="text-s-text3"> → {a.owner}</span>}
          </span>
        ))}
        {!trade && move.drops.map(d => (
          <span key={`d-${d.player}`} className="mr-2 inline-block" style={{ color: '#B4636B' }}>− {d.player}</span>
        ))}
      </div>
    </li>
  )
}

/**
 * Rosters tab: pick a team to see its lineup, bench, and IR for the current
 * week with projections (and live points once games start), plus the league's
 * roster moves this week. The last team viewed is remembered per device.
 */
export default function RosterView({ rosters, moves, week, status }: {
  rosters: TeamRoster[]
  moves: RosterMove[]
  week: number
  status: WeekStatus
}) {
  const [picked, setPicked] = useState<string | null>(() => {
    try { return typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null } catch { return null }
  })
  const [showAllMoves, setShowAllMoves] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  if (!rosters.length) {
    return (
      <div
        className="rounded-[6px] px-4 py-8 text-center text-[13px] text-s-text3"
        style={{ background: '#0B0B0D', border: '1px solid rgba(var(--gold-rgb), 0.12)' }}
      >
        Rosters appear once the draft is done.
      </div>
    )
  }

  const ordered = [...rosters].sort((a, b) => a.standing - b.standing)
  const team = ordered.find(t => t.owner === picked) ?? ordered[0]
  const showPts = status !== 'upcoming'
  const shownMoves = showAllMoves ? moves : moves.slice(0, MOVES_SHOWN)

  function pick(owner: string) {
    setPicked(owner)
    try { window.localStorage.setItem(STORAGE_KEY, owner) } catch { /* private mode — fine */ }
  }

  return (
    <div>
      {/* Team picker — standings order */}
      <div className="-mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Team">
        {ordered.map(t => (
          <button
            key={t.owner}
            aria-pressed={t.owner === team.owner}
            onClick={() => pick(t.owner)}
            className={[
              'whitespace-nowrap rounded-full border px-3 py-[5px] text-[11px] font-semibold transition-all duration-150',
              t.owner === team.owner
                ? 'border-gold bg-[rgba(201,150,46,0.10)] text-gold-soft'
                : 'border-[rgba(230,190,90,0.14)] text-s-text3 hover:text-gold-soft',
            ].join(' ')}
          >
            {t.owner}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Selected roster */}
        <div
          className="overflow-hidden rounded-[6px] lg:col-span-2"
          style={{ background: '#0B0B0D', border: '1px solid rgba(var(--gold-rgb), 0.14)' }}
        >
          <div
            className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-4 sm:px-5"
            style={{ borderColor: 'rgba(var(--gold-rgb), 0.16)' }}
          >
            <Link href={`/owners/${encodeURIComponent(team.owner)}`} className="flex min-w-0 items-center gap-3">
              <OwnerAvatar name={team.owner} size="md" />
              <div className="min-w-0">
                <div className="truncate font-display text-[24px] font-bold uppercase leading-none tracking-[0.5px] text-s-text hover:text-gold-soft">
                  {team.owner}
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-[1px] text-s-text3">
                  {team.wins}–{team.losses}{team.ties ? `–${team.ties}` : ''} · {ordinal(team.standing)} in standings
                </div>
              </div>
            </Link>
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-s-text3">
                Week {week}{team.opponent ? ` vs ${team.opponent}` : ''} · {STATUS_LABEL[status]}
              </div>
              <div className="mt-1 flex items-baseline justify-end gap-3">
                {team.projTotal != null && (
                  <span className="text-[10px] uppercase tracking-[1px] text-gold-soft">
                    Proj <span className="font-display text-[18px] font-bold num">{team.projTotal.toFixed(1)}</span>
                  </span>
                )}
                {showPts && team.ptsTotal != null && (
                  <span className="font-display text-[26px] font-bold leading-none text-gold-bright num">{fmtPts(team.ptsTotal)}</span>
                )}
              </div>
            </div>
          </div>

          <GroupHeader label="Starters" showPts={showPts} />
          <ul>
            {team.starters.map((s, i) => <PlayerRow key={`${s.slot}-${i}`} slot={s.slot} p={s.player} showPts={showPts} />)}
          </ul>

          {team.bench.length > 0 && (
            <>
              <GroupHeader label="Bench" showPts={showPts} />
              <ul>{team.bench.map(p => <PlayerRow key={p.id} slot="BN" p={p} showPts={showPts} />)}</ul>
            </>
          )}

          {team.reserve.length > 0 && (
            <>
              <GroupHeader label="Injured Reserve" showPts={showPts} />
              <ul>{team.reserve.map(p => <PlayerRow key={p.id} slot="IR" p={p} showPts={showPts} />)}</ul>
            </>
          )}

          {team.taxi.length > 0 && (
            <>
              <GroupHeader label="Taxi" showPts={showPts} />
              <ul>{team.taxi.map(p => <PlayerRow key={p.id} slot="TX" p={p} showPts={showPts} />)}</ul>
            </>
          )}
        </div>

        {/* League-wide moves this week */}
        <SectionCard
          title="Moves This Week"
          className="self-start"
          action={<span className="text-[10px] font-bold uppercase tracking-[2px] text-s-text3">{moves.length}</span>}
        >
          {moves.length === 0 ? (
            <div className="px-5 py-6 text-center text-[12px] text-s-text3">No adds, drops, or trades yet this week.</div>
          ) : (
            <>
              <ul>{shownMoves.map(m => <MoveLine key={m.id} move={m} now={now} />)}</ul>
              {moves.length > MOVES_SHOWN && (
                <button
                  onClick={() => setShowAllMoves(v => !v)}
                  className="w-full border-t px-5 py-2.5 text-[10px] font-bold uppercase tracking-[1.5px] text-s-text3 transition-colors hover:text-gold-soft"
                  style={{ borderColor: 'rgba(var(--gold-rgb), 0.10)' }}
                >
                  {showAllMoves ? 'Show fewer' : `Show all ${moves.length}`}
                </button>
              )}
            </>
          )}
        </SectionCard>
      </div>

      <p className="mt-3 text-center text-[10px] uppercase tracking-[1px] text-s-text3">
        Projections use Sleeper&apos;s projected stats scored with league settings · refreshes automatically
      </p>
    </div>
  )
}

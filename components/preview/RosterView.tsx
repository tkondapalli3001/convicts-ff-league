'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import OwnerAvatar from '@/components/shared/OwnerAvatar'
import SectionCard from '@/components/shared/SectionCard'
import InfoTip from '@/components/shared/InfoTip'
import { ordinal } from '@/lib/preview'
import { POS_COLORS } from '@/lib/constants'
import type { TeamRoster, RosterPlayer, PlayerSeason, ScheduleRow, WeekStatus } from '@/lib/preview'
import type { OwnerHeader, TeamRostersData } from '@/hooks/useTeamRosters'

const STORAGE_KEY = 'convicts:roster-team'
const NEUTRAL = '#6e7681'
const ROW_RULE = 'rgba(255,255,255,0.04)'

const INJURY_LABELS: Record<string, string> = {
  Questionable: 'Q', Doubtful: 'D', Out: 'O', IR: 'IR', PUP: 'PUP', Sus: 'SUS', NA: 'NA', DNR: 'DNR', COV: 'COV',
}

const STATUS_LABEL: Record<WeekStatus, string> = { final: 'Final', live: 'In progress', upcoming: 'Upcoming' }

function record(w: number, l: number, t: number): string {
  return t ? `${w}–${l}–${t}` : `${w}–${l}`
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

/** NFL team logo from Sleeper's CDN; a background image, so a missing logo just shows nothing. */
function TeamLogo({ team }: { team: string | null }) {
  if (!team) return null
  return (
    <span
      aria-hidden
      className="h-4 w-4 flex-shrink-0 bg-contain bg-center bg-no-repeat"
      style={{ backgroundImage: `url(https://sleepercdn.com/images/team_logos/nfl/${team.toLowerCase()}.png)` }}
    />
  )
}

// ── Header ───────────────────────────────────────────────────────────────────

function Value({ children }: { children: React.ReactNode }) {
  return <span className="font-display text-[15px] font-bold normal-case tracking-normal text-s-text sm:text-[17px]">{children}</span>
}

/** name · PR · record · all-play · PF · PA — each rank across the league, most first. */
function StatLine({ owner, h, showName }: { owner: string; h: OwnerHeader | undefined; showName: boolean }) {
  const items: React.ReactNode[] = []
  if (showName) {
    items.push(
      <Link key="name" href={`/owners/${encodeURIComponent(owner)}`} className="font-semibold normal-case tracking-normal text-s-text2 transition-colors hover:text-gold-soft">
        {owner}
      </Link>,
    )
  }
  items.push(<span key="pr">PR <Value>{h?.powerRank ? ordinal(h.powerRank) : '—'}</Value></span>)
  items.push(<Value key="rec">{h ? record(h.wins, h.losses, h.ties) : '—'}</Value>)
  if (h?.allPlay) {
    items.push(
      <span key="ap">
        <Value>{record(h.allPlay.wins, h.allPlay.losses, h.allPlay.ties)}</Value> All-Play ({ordinal(h.allPlay.rank)})
      </span>,
    )
  }
  if (h?.pf) items.push(<span key="pf"><Value>{h.pf.value.toFixed(2)}</Value> PF ({ordinal(h.pf.rank)})</span>)
  if (h?.pa) items.push(<span key="pa"><Value>{h.pa.value.toFixed(2)}</Value> PA ({ordinal(h.pa.rank)})</span>)
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] font-bold uppercase tracking-[1px] text-s-text3 sm:text-[11px]">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2.5">
          {i > 0 && <span aria-hidden className="h-3.5 w-px bg-white/[0.12]" />}
          {item}
        </span>
      ))}
    </div>
  )
}

function WeekPicker({ week, weeks, status, onWeek }: {
  week: number
  weeks: number[]
  status: WeekStatus
  onWeek: (w: number) => void
}) {
  const idx = weeks.indexOf(week)
  const arrow = 'rounded-full border border-white/[0.07] bg-white/[0.04] p-2 text-s-text3 transition-all hover:border-white/20 hover:text-s-text active:scale-[0.98] disabled:pointer-events-none disabled:opacity-30'
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => onWeek(weeks[idx - 1])} disabled={idx <= 0} className={arrow} aria-label="Previous week">
        <ChevronLeft size={16} />
      </button>
      <div className="min-w-[92px] text-center">
        <div className="font-display text-[20px] font-bold uppercase leading-none tracking-[1px] text-s-text sm:text-[22px]">Week {week}</div>
        <div className="mt-1 text-[9px] font-bold uppercase tracking-[1.5px] text-s-text3 sm:text-[10px]">{STATUS_LABEL[status]}</div>
      </div>
      <button onClick={() => onWeek(weeks[idx + 1])} disabled={idx < 0 || idx >= weeks.length - 1} className={arrow} aria-label="Next week">
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

// ── Lineup table ─────────────────────────────────────────────────────────────

function PlayerRow({ slot, p, stat, current }: { slot: string | null; p: RosterPlayer | null; stat: PlayerSeason | undefined; current: boolean }) {
  const color = p ? POS_COLORS[p.position] ?? NEUTRAL : NEUTRAL
  // Starters show their lineup slot (FLEX); everyone else their position
  const label = slot ?? p?.position ?? '—'
  const actual = p?.pts != null
  const num = 'text-center font-display text-[16px] font-semibold text-s-text2 num sm:text-[17px]'
  return (
    <tr className="cursor-default">
      <td className="sticky left-0 z-[1] p-0" style={{ background: '#0B0B0D' }}>
        <div className="flex min-h-[52px] items-stretch">
          <span
            className="flex w-11 flex-shrink-0 items-center justify-center text-[10px] font-bold tracking-[0.5px]"
            style={p
              ? { background: `${color}26`, color, boxShadow: `inset 3px 0 0 ${color}` }
              : { color: '#5C6270' }}
          >
            {label}
          </span>
          {p ? (
            <div className="min-w-0 max-w-[168px] py-2 pl-3 pr-2 sm:max-w-[260px]">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="truncate text-[13px] font-bold text-s-text sm:text-[14px]">{p.name}</span>
                <TeamLogo team={p.team} />
                {/* Injury designations are today's — they'd mislabel a past week */}
                {current && <InjuryTag status={p.injury} />}
              </div>
              <div className="truncate text-[10px] uppercase tracking-[0.5px] text-s-text3 sm:text-[11px]">
                {p.game ?? [p.position, p.team].filter(Boolean).join(' · ')}
              </div>
            </div>
          ) : (
            <span className="self-center pl-3 text-[12px] italic text-s-muted">Empty</span>
          )}
        </div>
      </td>
      <td className="text-center">
        <div className="font-display text-[16px] font-bold leading-none text-s-text num sm:text-[18px]">
          {actual ? p!.pts!.toFixed(2) : p?.proj != null ? p.proj.toFixed(1) : '—'}
        </div>
        {p && (actual || p.proj != null) && (
          <div className="mt-1 text-[8px] font-bold uppercase tracking-[1.5px] text-s-text3">{actual ? 'Pts' : 'Proj'}</div>
        )}
      </td>
      <td className={num}>{stat?.rank ? `${stat.position}${stat.rank}` : '—'}</td>
      <td className={num}>{stat ? stat.gp : '—'}</td>
      <td className={num}>{stat ? stat.fpts.toFixed(2) : '—'}</td>
      <td className={num}>{stat?.gp ? (stat.fpts / stat.gp).toFixed(2) : '—'}</td>
    </tr>
  )
}

function GroupHeader({ label, valueLabel, total, first }: {
  label: string
  valueLabel: string
  total?: React.ReactNode
  /** The first group's header carries the column definitions. */
  first: boolean
}) {
  const th = 'cursor-default text-center hover:text-s-text3'
  return (
    <tr className="cursor-default">
      <th className="sticky left-0 z-[2] cursor-default hover:text-s-text3" style={{ background: '#0B0B0D' }}>
        <span className="flex items-center gap-2.5 text-[11px] tracking-[2px] text-s-text sm:text-[12px]">
          {label}
          {total}
        </span>
      </th>
      <th className={th}>
        {valueLabel}
        {first && (
          <InfoTip term={valueLabel}>
            {valueLabel === 'Pts'
              ? 'points scored this week — or Sleeper’s projection (PROJ), scored with our league settings, for players who haven’t played yet.'
              : 'Sleeper’s projected stats for the week, scored with our league settings. Turns into actual points (PTS) once the player’s game kicks off.'}
          </InfoTip>
        )}
      </th>
      <th className={th}>Season Rank</th>
      <th className={th}>GP</th>
      <th className={th}>
        FPTS
        {first && (
          <InfoTip term="FPTS">
            season fantasy points — Sleeper’s season stats scored with our league settings. Season Rank ranks them at
            the position; PPG divides them by games played (GP).
          </InfoTip>
        )}
      </th>
      <th className={th}>PPG</th>
    </tr>
  )
}

function RosterTable({ team, stats, status, current }: {
  team: TeamRoster
  stats: Record<string, PlayerSeason> | null
  status: WeekStatus
  current: boolean
}) {
  const started = status !== 'upcoming'
  const valueLabel = started ? 'Pts' : 'Proj'
  const total = started ? team.ptsTotal : team.projTotal
  const groups: { label: string; rows: { slot: string | null; p: RosterPlayer | null }[] }[] = [
    { label: 'Starters', rows: team.starters.map(s => ({ slot: s.slot, p: s.player })) },
    { label: 'Bench', rows: team.bench.map(p => ({ slot: null, p })) },
    // IR and taxi are today's roster — they don't describe another week
    ...(current ? [
      { label: 'Injured Reserve', rows: team.reserve.map(p => ({ slot: null, p })) },
      { label: 'Taxi', rows: team.taxi.map(p => ({ slot: null, p })) },
    ] : []),
  ].filter(g => g.rows.length)

  return (
    <div className="relative">
      <div className="ss-table overflow-x-auto scrollbar-hide">
        <table className="w-full min-w-[600px] border-collapse">
          {groups.map((g, gi) => (
            <tbody key={g.label}>
              <GroupHeader
                first={gi === 0}
                label={g.label}
                valueLabel={valueLabel}
                total={gi === 0 && total != null && (
                  <span
                    className="rounded-[2px] border px-1.5 py-px font-display text-[13px] normal-case tracking-normal text-gold-bright"
                    style={{ borderColor: 'rgba(var(--gold-rgb), 0.24)' }}
                    title={started ? 'Points this week' : 'Projected points'}
                  >
                    {started ? total.toFixed(2) : total.toFixed(1)}
                  </span>
                )}
              />
              {g.rows.map((r, i) => (
                <PlayerRow key={r.p?.id ?? `${g.label}-${i}`} slot={r.slot} p={r.p} stat={r.p ? stats?.[r.p.id] : undefined} current={current} />
              ))}
            </tbody>
          ))}
        </table>
      </div>
      {/* Right-edge fade — signals more columns on narrow screens */}
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-r from-transparent to-[rgba(11,14,17,0.85)] sm:hidden" />
    </div>
  )
}

// ── Season schedule ──────────────────────────────────────────────────────────

function ResultBox({ row }: { row: ScheduleRow }) {
  const base = 'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-[2px] text-[10px] font-bold'
  if (row.result === 'W') return <span className={`${base} border border-win text-win`} style={{ background: 'rgba(127,168,134,0.14)' }}>W</span>
  if (row.result === 'L') return <span className={`${base} border border-loss text-loss`} style={{ background: 'rgba(180,99,107,0.14)' }}>L</span>
  if (row.result === 'T') return <span className={`${base} border border-white/20 text-s-text2`}>T</span>
  if (row.status === 'live') return <span className="flex-shrink-0 text-[8px] font-bold uppercase tracking-[1px] text-win">Live</span>
  return <span className={`${base} border border-dashed border-white/15 text-s-text3`}>–</span>
}

function SchedulePanel({ rows, liveWeek, matchupWeeks, onOpen }: {
  rows: ScheduleRow[]
  liveWeek: number
  matchupWeeks: number[]
  onOpen: (week: number) => void
}) {
  const played = rows.filter(r => r.result).length
  return (
    <SectionCard
      title="Season Schedule"
      className="self-start"
      action={<span className="text-[10px] font-bold uppercase tracking-[2px] text-s-text3">{played} played</span>}
    >
      {rows.length === 0 ? (
        <div className="px-5 py-6 text-center text-[12px] text-s-text3">The schedule shows up once Sleeper publishes it.</div>
      ) : (
        <ul>
          {rows.map(r => {
            const now = r.week === liveWeek
            return (
              <li
                key={r.week}
                className="flex min-h-[44px] items-center gap-1.5 border-b px-4 py-2 last:border-b-0 sm:gap-2"
                style={{ borderColor: ROW_RULE, background: now ? 'rgba(var(--gold2-rgb), 0.06)' : undefined }}
              >
                <span className={`w-9 flex-shrink-0 text-[10px] font-bold uppercase tracking-[1px] ${now ? 'text-gold-soft' : 'text-s-text3'}`}>
                  Wk {r.week}
                </span>
                <ResultBox row={r} />
                {r.pts != null && r.oppPts != null && (
                  <span className="whitespace-nowrap font-display text-[15px] font-bold text-s-text num">
                    {r.pts.toFixed(1)}–{r.oppPts.toFixed(1)}
                  </span>
                )}
                <span className="text-[10px] uppercase text-s-text3">vs</span>
                <span title={r.opponent} className="flex-shrink-0"><OwnerAvatar name={r.opponent} size="xs" /></span>
                {r.record
                  ? <span className="whitespace-nowrap text-[11px] font-semibold text-s-text3">({r.record})</span>
                  : <span className="min-w-0 truncate text-[12px] font-semibold text-s-text2">{r.opponent}</span>}
                {r.mark && (
                  <span
                    className={`flex-shrink-0 rounded-[2px] border px-1 py-px text-[8px] font-bold tracking-[1px] ${r.mark === 'high' ? 'border-win text-win' : 'border-loss text-loss'}`}
                    title={r.mark === 'high' ? 'Season-high score' : 'Season-low score'}
                  >
                    {r.mark === 'high' ? 'HIGH' : 'LOW'}
                  </span>
                )}
                {matchupWeeks.includes(r.week) && (
                  <button
                    onClick={() => onOpen(r.week)}
                    className="ml-auto flex-shrink-0 whitespace-nowrap text-[10px] font-bold uppercase tracking-[1px] text-gold-soft transition-colors hover:text-gold-bright"
                    aria-label={`Week ${r.week} matchup vs ${r.opponent}`}
                  >
                    <span className="hidden sm:inline">Matchup </span>→
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </SectionCard>
  )
}

// ── The tab ──────────────────────────────────────────────────────────────────

/**
 * Rosters tab: pick a manager to see their lineup for any week — projections
 * (or points once games kick off) beside each player's season line under
 * league scoring — with their season header and schedule. The last manager
 * viewed is remembered per device.
 */
export default function RosterView({ data, liveWeek, matchupWeeks, onWeek, onOpenMatchup }: {
  data: TeamRostersData
  liveWeek: number
  /** Weeks the Matchups tab can open. */
  matchupWeeks: number[]
  onWeek: (week: number) => void
  onOpenMatchup: (week: number, owner: string) => void
}) {
  const { rosters, week, weeks, status, current, stats, headers, schedules } = data
  const [picked, setPicked] = useState<string | null>(() => {
    try { return typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null } catch { return null }
  })

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
  const h = headers[team.owner]

  function pick(owner: string) {
    setPicked(owner)
    try { window.localStorage.setItem(STORAGE_KEY, owner) } catch { /* private mode — fine */ }
  }

  return (
    <div>
      {/* Manager picker — standings order */}
      <div className="-mx-4 mb-4 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0" role="group" aria-label="Team">
        <div
          className="flex min-w-max overflow-hidden rounded-[6px] sm:min-w-0"
          style={{ background: '#0B0B0D', border: '1px solid rgba(var(--gold-rgb), 0.14)' }}
        >
          {ordered.map(t => {
            const on = t.owner === team.owner
            return (
              <button
                key={t.owner}
                aria-pressed={on}
                onClick={() => pick(t.owner)}
                className={`flex flex-1 flex-col items-center gap-1.5 px-3 py-2.5 transition-colors ${on ? 'bg-[rgba(201,150,46,0.10)]' : 'hover:bg-[rgba(201,150,46,0.05)]'}`}
                style={on ? { boxShadow: 'inset 0 -2px 0 #C9962E' } : undefined}
              >
                <OwnerAvatar name={t.owner} size="sm" />
                <span className={`text-[10px] font-bold uppercase tracking-[1px] ${on ? 'text-gold-soft' : 'text-s-text3'}`}>{t.owner}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Selected roster */}
        <div
          className="overflow-hidden rounded-[6px] lg:col-span-2"
          style={{ background: '#0B0B0D', border: '1px solid rgba(var(--gold-rgb), 0.14)' }}
        >
          <div
            className="flex flex-wrap items-center justify-between gap-4 border-b px-4 py-4 sm:px-6 sm:py-5"
            style={{ borderColor: 'rgba(var(--gold-rgb), 0.16)' }}
          >
            <div className="flex min-w-[240px] flex-1 items-center gap-3 sm:gap-4">
              <OwnerAvatar name={team.owner} size="lg" />
              <div className="min-w-0">
                <div className="break-words font-display text-[24px] font-bold uppercase leading-[0.95] tracking-[0.5px] text-s-text sm:text-[32px]">
                  {h?.teamName ?? team.owner}
                </div>
                <StatLine owner={team.owner} h={h} showName={!!h?.teamName} />
              </div>
            </div>
            <WeekPicker week={week} weeks={weeks} status={status} onWeek={onWeek} />
          </div>

          <RosterTable team={team} stats={stats} status={status} current={current} />
        </div>

        <SchedulePanel
          rows={schedules[team.owner] ?? []}
          liveWeek={liveWeek}
          matchupWeeks={matchupWeeks}
          onOpen={w => onOpenMatchup(w, team.owner)}
        />
      </div>

    </div>
  )
}

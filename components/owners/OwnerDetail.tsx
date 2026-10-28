'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useLeague } from '@/context/LeagueContext'
import { fmtPts, fmtMoney, ownerColor, fullNameInitials } from '@/lib/utils'
import { ownerProfile } from '@/lib/stats'
import FinishBadge from '@/components/shared/FinishBadge'
import WinPctBadge from '@/components/shared/WinPctBadge'
import H2HGrid from './H2HGrid'
import WinsBridge from './WinsBridge'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorState from '@/components/shared/ErrorState'

type Tab = 'seasons' | 'bridge' | 'h2h' | 'gamelog'

export default function OwnerDetail({ ownerName }: { ownerName: string }) {
  const { state } = useLeague()
  const { loaded, error, ownerSeasons, allMatchups, brackets, rosterUserMaps, leagues, draftData, matchups } = state
  const [tab, setTab] = useState<Tab>('seasons')

  // Must be before early returns (React hook rules)
  const profile = useMemo(
    () => ownerProfile({ ownerSeasons, allMatchups, brackets, rosterUserMaps, leagues, draftData, matchups }, ownerName),
    [ownerSeasons, allMatchups, brackets, rosterUserMaps, leagues, draftData, matchups, ownerName],
  )

  if (error) return <ErrorState error={error} />
  if (!loaded) return <LoadingSpinner />

  if (!profile) {
    return (
      <div className="text-center py-16 text-s-text3">
        <div className="text-[48px] mb-4">🤷</div>
        <p>No data found for {ownerName}</p>
        <Link href="/owners" className="mt-4 inline-block text-gold-soft hover:underline">← Back to Owners</Link>
      </div>
    )
  }

  const { seasons, finals, bestSeason, worstSeason, topRival, bestGame, worstGame, winStreak, earnings } = profile
  const pct = (profile.winpct * 100).toFixed(1)

  const TABS: { id: Tab; label: string }[] = [
    { id: 'seasons', label: 'Season Log' },
    { id: 'bridge',  label: 'Wins Bridge' },
    { id: 'h2h',     label: 'H2H Records' },
    { id: 'gamelog', label: `Game Log (${profile.games.length})` },
  ]

  // ── Owner stat grid (design 4a) — 12 cells, semantically coloured Barlow values ──────
  const SAGE = '#7FA886', BRICK = '#B4636B', GOLD = '#C9A24B'
  const finalsGames = finals.wins + finals.losses

  const statCells: { label: string; value: string; sub?: string; color?: string }[] = [
    { label: 'Career Record', value: `${profile.wins}–${profile.losses}`, sub: `${pct}% win rate` },
    { label: 'Avg PF / Game', value: profile.pfPerGame.toFixed(1), sub: `${profile.pfPerSeason.toFixed(0)} pts/season` },
    { label: 'Avg PA / Game', value: profile.paPerGame.toFixed(1), sub: `${profile.paPerSeason.toFixed(0)} allowed/season`, color: BRICK },
    { label: 'Net Earnings', value: earnings != null ? fmtMoney(earnings) : 'N/A', color: earnings != null ? (earnings >= 0 ? SAGE : BRICK) : undefined },
    { label: 'Finals Record', value: finalsGames > 0 ? `${finals.wins}–${finals.losses}` : '—', sub: finalsGames > 0 ? `${finalsGames} Finals appearance${finalsGames !== 1 ? 's' : ''}` : 'Never reached Finals', color: finals.wins > 0 ? GOLD : undefined },
    { label: 'Playoff Byes', value: profile.byes > 0 ? String(profile.byes) : '—', sub: profile.byes > 0 ? `first-round bye${profile.byes !== 1 ? 's' : ''}` : 'No byes earned', color: profile.byes > 0 ? GOLD : undefined },
    { label: 'Best Season', value: String(bestSeason.year), sub: `${bestSeason.wins}–${bestSeason.losses} record`, color: SAGE },
    { label: 'Worst Season', value: String(worstSeason.year), sub: `${worstSeason.wins}–${worstSeason.losses} record`, color: BRICK },
    { label: 'Top Rival', value: topRival?.name ?? '—', sub: topRival ? `${topRival.wins}–${topRival.losses} vs them` : undefined },
    { label: 'Best Game', value: bestGame ? fmtPts(bestGame.pts) : '—', sub: bestGame ? `${bestGame.year} W${bestGame.week} vs ${bestGame.opp}` : undefined, color: SAGE },
    { label: 'Worst Game', value: worstGame ? fmtPts(worstGame.pts) : '—', sub: worstGame ? `${worstGame.year} W${worstGame.week} vs ${worstGame.opp}` : undefined, color: BRICK },
    { label: 'Longest Win Streak', value: winStreak.length > 0 ? `${winStreak.length}W` : '—', sub: winStreak.length > 0 && winStreak.start && winStreak.end ? `${winStreak.start.year} W${winStreak.start.week}–W${winStreak.end.week}` : undefined, color: GOLD },
  ]

  return (
    <div className="animate-fade-in">
      {/* ── Profile header band (design 4a) ─────────────────────────── */}
      <div
        className="-mx-4 -mt-6 overflow-hidden border-b px-4 pb-8 pt-8 sm:px-8"
        style={{
          borderColor: 'rgba(var(--gold-rgb), 0.12)',
          background:
            'radial-gradient(ellipse 70% 90% at 50% -20%, rgba(var(--gold2-rgb), 0.10) 0%, transparent 60%), #050506',
        }}
      >
        <Link
          href="/owners"
          className="mb-6 inline-flex items-center gap-2 border px-3.5 py-[7px] text-[9px] font-bold uppercase tracking-[2px] text-s-text2 transition-colors hover:text-gold-soft"
          style={{ borderColor: 'rgba(var(--gold-rgb), 0.20)' }}
        >
          ← All Owners
        </Link>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-5 sm:gap-6">
            <div
              className="flex h-[76px] w-[76px] flex-shrink-0 items-center justify-center rounded-full font-display text-[28px] font-extrabold text-white"
              style={{
                background: ownerColor(ownerName),
                boxShadow: '0 0 0 2px #050506, 0 0 0 3.5px #C9962E, 0 0 24px rgba(201,150,46,0.35)',
              }}
            >
              {fullNameInitials(ownerName)}
            </div>
            <div>
              <div className="mb-2 flex items-center gap-3.5">
                <span className="h-px w-8" style={{ background: 'linear-gradient(to right, transparent, #C9962E)' }} />
                <span className="text-[9px] font-bold uppercase tracking-[5px] text-gold-soft">Manager Profile</span>
              </div>
              <h1 className="text-hero-gold font-display text-[44px] font-extrabold uppercase leading-[0.95] tracking-[1px] sm:text-[64px] sm:tracking-[2px]">
                {ownerName}
              </h1>
              <div className="mt-2.5 text-[11px] font-medium uppercase tracking-[1.5px] text-s-text2">
                {seasons.length} Seasons · {profile.wins}W–{profile.losses}L · {pct}% Win Rate
              </div>
            </div>
          </div>

          {/* Badge chips */}
          <div className="flex flex-wrap gap-2.5 sm:justify-end">
            {profile.titles.map(c => (
              <span key={c.year} className="border px-4 py-2 text-[10px] font-bold uppercase tracking-[2px] text-gold-soft" style={{ borderColor: 'rgba(var(--gold-rgb), 0.35)' }}>
                {c.year}{c.half ? ' ½' : ''} Champ
              </span>
            ))}
            {profile.toiletBowls.map(s => (
              <span key={s.year} className="border px-4 py-2 text-[10px] font-bold uppercase tracking-[2px] text-loss" style={{ borderColor: 'rgba(180,90,90,0.35)' }}>
                {s.year} Shame
              </span>
            ))}
            {earnings != null && (
              <span className="border px-4 py-2 text-[10px] font-bold uppercase tracking-[2px]" style={{ color: earnings >= 0 ? '#7FA886' : '#B4636B', borderColor: earnings >= 0 ? 'rgba(127,168,134,0.35)' : 'rgba(180,90,90,0.35)' }}>
                {fmtMoney(earnings)} Net
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Stat grid — 12 hairline cells (4-col desktop / 2-col mobile) ─── */}
      <div className="-mx-4 grid grid-cols-2 sm:grid-cols-4">
        {statCells.map((c, i) => (
          <div
            key={i}
            className="flex flex-col gap-1.5 border-b border-r px-5 py-[22px] transition-colors hover:bg-[rgba(201,150,46,0.04)] sm:px-8"
            style={{ borderColor: 'rgba(var(--gold-rgb), 0.08)' }}
          >
            <div className="text-[9px] font-bold uppercase tracking-[3px] text-s-text3">{c.label}</div>
            <div className="font-display text-[28px] font-bold leading-none sm:text-[34px]" style={{ color: c.color ?? '#EDE9E0' }}>
              {c.value}
            </div>
            {c.sub && <div className="truncate text-[10px] font-semibold uppercase tracking-[1px] text-gold-soft">{c.sub}</div>}
          </div>
        ))}
      </div>

      {/* ── Top scorers band ─────────────────────────────────────────── */}
      {profile.topScorers.length > 0 && (
        <div className="-mx-4 flex flex-wrap items-center gap-4 border-b bg-panel-2 px-4 py-[18px] sm:px-8" style={{ borderColor: 'rgba(var(--gold-rgb), 0.12)' }}>
          <div className="flex flex-shrink-0 items-center gap-2.5">
            <span className="h-px w-4 bg-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[3px] text-gold-soft">Top Scorers</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.topScorers.map(p => (
              <span
                key={p.name}
                className="inline-flex items-center gap-2 border px-3.5 py-1.5 text-[11px]"
                style={{ borderColor: 'rgba(var(--gold-rgb), 0.16)', background: '#0B0B0D' }}
              >
                <span className="font-bold text-s-text">{p.name}</span>
                <span className="text-s-text3">{p.pos}</span>
                <span className="font-display text-[14px] font-bold text-gold-soft">{p.pts.toFixed(1)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Tabs (underline) ─────────────────────────────────────────── */}
      <div className="-mx-4 mb-6 flex overflow-x-auto border-b bg-panel-2 px-4 scrollbar-none sm:px-8" style={{ borderColor: 'rgba(var(--gold-rgb), 0.12)' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={[
              '-mb-px whitespace-nowrap border-b-2 px-3.5 py-3.5 text-[10px] font-bold uppercase tracking-[2px] transition-colors duration-150',
              tab === t.id ? 'border-gold text-s-text' : 'border-transparent text-s-text3 hover:text-gold-soft',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Season Log */}
      {tab === 'seasons' && (
        <div className="overflow-x-auto gl">
          <table className="w-full border-collapse min-w-[500px]">
            <thead>
              <tr>
                <th>Year</th><th>Finish</th><th>W</th><th>L</th><th>Win%</th>
                <th>PF/Gm</th><th>PA/Gm</th><th>+/−</th><th>Playoffs</th>
              </tr>
            </thead>
            <tbody>
              {seasons.map(s => {
                const margin = s.pf - s.pa
                const spct = (s.wins / (s.wins + s.losses || 1) * 100).toFixed(1)
                return (
                  <tr key={s.year}>
                    <td className="font-display text-[17px] font-bold text-s-text2">{s.year}</td>
                    <td><FinishBadge finish={s.finish} /></td>
                    <td className="font-display text-[17px] font-bold" style={{ color: '#7FA886' }}>{s.wins}</td>
                    <td className="font-display text-[17px] font-bold" style={{ color: '#B4636B' }}>{s.losses}</td>
                    <td><WinPctBadge pct={spct} /></td>
                    <td className="text-right font-display text-[17px] font-semibold text-s-text2 num">{s.wins + s.losses > 0 ? (s.pf / (s.wins + s.losses)).toFixed(1) : '—'}</td>
                    <td className="text-right font-display text-[17px] font-semibold num" style={{ color: '#B4636B' }}>{s.wins + s.losses > 0 ? (s.pa / (s.wins + s.losses)).toFixed(1) : '—'}</td>
                    <td className="text-right font-display text-[17px] font-bold num" style={{ color: margin >= 0 ? '#7FA886' : '#B4636B' }}>
                      {margin >= 0 ? '+' : ''}{margin.toFixed(1)}
                    </td>
                    <td className="text-right">
                      {s.inPlayoffs
                        ? <span className="inline-flex items-center gap-1 rounded-[2px] px-2 py-[3px] text-[9px] font-bold uppercase tracking-[1px]" style={{ color: '#7FA886', background: 'rgba(127,168,134,0.12)' }}>● Clinched</span>
                        : <span className="inline-flex items-center gap-1 rounded-[2px] px-2 py-[3px] text-[9px] font-bold uppercase tracking-[1px]" style={{ color: '#B4636B', background: 'rgba(180,99,107,0.12)' }}>✕ Elim.</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Wins Bridge (loads its own file on first open) */}
      {tab === 'bridge' && <WinsBridge ownerName={ownerName} />}

      {/* H2H Records */}
      {tab === 'h2h' && (
        <H2HGrid ownerName={ownerName} allMatchups={profile.h2hGames} allOwnerNames={profile.h2hOwners} />
      )}

      {/* Game Log */}
      {tab === 'gamelog' && (
        <div
          className="max-h-[500px] overflow-y-auto rounded-[6px]"
          style={{ background: '#0B0B0D', border: '1px solid rgba(var(--gold-rgb), 0.12)' }}
        >
          {profile.games.map(g => {
            const myPts  = g.team1 === ownerName ? g.pts1 : g.pts2
            const oppPts = g.team1 === ownerName ? g.pts2 : g.pts1
            const opp    = g.team1 === ownerName ? g.team2 : g.team1
            const won    = myPts >= oppPts
            const margin = myPts - oppPts
            return (
              <div
                key={`${g.year}-${g.week}-${g.team1}`}
                className="flex items-center gap-2 border-b px-4 py-2.5 text-[12px] transition-colors last:border-b-0 hover:bg-[rgba(201,150,46,0.05)]"
                style={{ borderColor: 'rgba(255,255,255,0.04)' }}
              >
                <span className="w-[54px] flex-shrink-0 text-[10px] uppercase tracking-[0.5px] text-s-text3">{g.year} W{g.week}</span>
                <span className="w-[70px] flex-shrink-0 truncate font-bold text-s-text">{ownerName}</span>
                <span className="w-[52px] flex-shrink-0 font-display text-[16px] font-bold text-gold-bright">{fmtPts(myPts)}</span>
                <span className="flex-shrink-0 text-[10px] text-s-text3">vs</span>
                <span className="w-[70px] flex-shrink-0 truncate font-bold text-s-text2">{opp}</span>
                <span className="w-[52px] flex-shrink-0 font-display text-[16px] font-semibold text-s-text3">{fmtPts(oppPts)}</span>
                <span
                  className="flex-shrink-0 rounded-[2px] px-[6px] py-[1px] text-[10px] font-extrabold"
                  style={won ? { color: '#7FA886', background: 'rgba(127,168,134,0.12)' } : { color: '#B4636B', background: 'rgba(180,99,107,0.12)' }}
                >
                  {won ? 'W' : 'L'}
                </span>
                <span
                  className="flex-shrink-0 rounded-[2px] border px-2 py-[1px] text-[9px] font-bold uppercase tracking-[1px] text-s-text3"
                  style={{ borderColor: 'rgba(var(--gold-rgb), 0.14)' }}
                >
                  {g.type === 'R' ? 'REG' : 'PLY'}
                </span>
                <span className="ml-auto flex-shrink-0 font-display text-[16px] font-bold num" style={{ color: margin >= 0 ? '#7FA886' : '#B4636B' }}>
                  {margin >= 0 ? '+' : ''}{margin.toFixed(1)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

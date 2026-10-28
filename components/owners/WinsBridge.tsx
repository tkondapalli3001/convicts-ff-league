'use client'

import { useEffect, useMemo, useState } from 'react'
import { loadBridges } from '@/lib/sources'
import {
  BRIDGE_PARTS, careerTotals, stepRange,
  type BridgeFile, type BridgePart, type BridgeTotals, type Channel, type OwnerSeasonBridge,
} from '@/lib/stats'
import SectionCard from '@/components/shared/SectionCard'
import InfoTip from '@/components/shared/InfoTip'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

type View = 'career' | number
type Step = BridgePart | 'luck'

const SAGE = '#7FA886', BRICK = '#B4636B'
const HAIRLINE = 'rgba(var(--gold-rgb), 0.10)'

const LABEL: Record<Step, string> = { draft: 'Draft', pickups: 'Pickups', trades: 'Trades', lineup: 'Lineup calls', luck: 'Luck' }
const DEFINE: Record<Step, string> = {
  draft: 'Points above replacement from players you drafted (keepers included), in the weeks Sleeper’s projections would have started them, measured against the league’s average team and converted to wins.',
  pickups: 'Points above replacement from players you added off waivers or free agency, the same way. An empty lineup slot counts here too: a replacement-level player was free to add.',
  trades: 'Points above replacement from players you traded for, the same way.',
  lineup: 'What you scored minus what the lineup Sleeper’s projections picked from your roster would have scored, against the league’s average. Graded on Sleeper’s final projection for each week, since no copy from before kickoff was saved.',
  luck: 'Actual wins minus all-play expected wins: the site’s Luck Index.',
}

const signed = (n: number, digits = 1) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(digits)}`
const wins = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))

export default function WinsBridge({ ownerName }: { ownerName: string }) {
  const [file, setFile] = useState<BridgeFile | null | undefined>(undefined)
  const [view, setView] = useState<View>('career')
  const [open, setOpen] = useState<Step | null>(null)

  useEffect(() => {
    let live = true
    loadBridges().then(f => { if (live) setFile(f) })
    return () => { live = false }
  }, [])

  const seasons = useMemo(
    () => (file?.bridges ?? []).filter(b => b.owner === ownerName).sort((a, b) => b.season - a.season),
    [file, ownerName],
  )
  const shown = useMemo(() => (view === 'career' ? seasons : seasons.filter(s => s.season === view)), [seasons, view])
  const totals = useMemo<BridgeTotals | null>(
    () => (shown.length === 0 ? null : view === 'career' ? careerTotals(shown) : shown[0]),
    [shown, view],
  )

  if (file === undefined) return <LoadingSpinner />
  if (!file) return <p className="py-10 text-center text-[13px] text-s-text3">The wins bridge didn’t load. Try again in a moment.</p>
  if (!totals) return <p className="py-10 text-center text-[13px] text-s-text3">No completed seasons yet.</p>

  // ── waterfall steps: running total from the average team to the record ──
  type Row = { key: string; label: string; from: number; to: number; step?: Step; total?: boolean; define?: string }
  const rows: Row[] = [{ key: 'average', label: 'Average team', from: 0, to: totals.baseline, total: true, define: 'All-play wins of a team that scored the league’s average every week.' }]
  let running = totals.baseline
  for (const k of BRIDGE_PARTS) {
    rows.push({ key: k, label: LABEL[k], from: running, to: running + totals.parts[k].wins, step: k })
    running += totals.parts[k].wins
  }
  rows.push({ key: 'expected', label: 'Expected wins', from: 0, to: totals.expected, total: true, define: 'All-play expected wins: what these points were worth against every team, every week.' })
  rows.push({ key: 'luck', label: LABEL.luck, from: totals.expected, to: totals.actual, step: 'luck' })
  rows.push({ key: 'actual', label: 'Actual wins', from: 0, to: totals.actual, total: true, define: 'Head-to-head wins in the regular season, a tie counting ½.' })
  // The axis covers only the range the bridge moves through, so each part reads at its size;
  // totals are markers at their value, not bars from zero
  const values = rows.flatMap(r => (r.total ? [r.to] : [r.from, r.to]))
  const pad = Math.max((Math.max(...values) - Math.min(...values)) * 0.08, 0.25)
  const lo = Math.min(...values) - pad, span = Math.max(...values) + pad - lo
  const at = (v: number) => ((v - lo) / span) * 100

  const rep = file.repeatability
  const viewTabs: { id: View; label: string }[] = [{ id: 'career', label: 'Career' }, ...seasons.map(s => ({ id: s.season as View, label: String(s.season) }))]

  return (
    <SectionCard
      title="Wins Bridge"
      action={
        <InfoTip term="Wins bridge">
          Where the wins came from: an average team’s wins, plus what the draft, pickups, trades and lineup calls added,
          gives expected wins; luck takes it to the record. The parts describe what happened, not skill. In this
          league none of them repeats from one season to the next (correlation draft {signed(rep.draft.r, 2)}, pickups{' '}
          {signed(rep.pickups.r, 2)}, trades {signed(rep.trades.r, 2)}, lineup calls {signed(rep.lineup.r, 2)}, luck{' '}
          {signed(rep.luck.r, 2)}, over {rep.draft.pairs} pairs of seasons).
        </InfoTip>
      }
    >
      <div className="flex flex-wrap gap-2 border-b px-5 py-3" style={{ borderColor: HAIRLINE }}>
        {viewTabs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setView(t.id); setOpen(null) }}
            className={`min-h-[30px] border px-3 text-[10px] font-bold uppercase tracking-[2px] transition-colors ${view === t.id ? 'text-s-text' : 'text-s-text3 hover:text-gold-soft'}`}
            style={{ borderColor: view === t.id ? 'rgba(var(--gold-rgb), 0.55)' : 'rgba(var(--gold-rgb), 0.16)' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {rows.map(r => {
          const delta = r.to - r.from
          const left = r.total ? at(r.to) : at(Math.min(r.from, r.to))
          const width = r.total ? 0 : at(Math.max(r.from, r.to)) - left
          const part = r.step && r.step !== 'luck' ? totals.parts[r.step] : null
          const range = part ? stepRange(part) : null
          const isOpen = r.step != null && open === r.step
          const bar = (
            <>
              <div className="relative h-3.5 flex-1" style={{ background: 'rgba(255,255,255,0.025)' }}>
                {r.total
                  ? <div className="absolute -inset-y-1 w-[3px] -translate-x-1/2 bg-gold" style={{ left: `${left}%` }} />
                  : <div className="absolute inset-y-0" style={{ left: `${left}%`, width: `max(${width}%, 2px)`, background: delta >= 0 ? SAGE : BRICK }} />}
              </div>
              <div className="w-[62px] flex-shrink-0 text-right sm:w-[76px]">
                <div className="font-display text-[18px] font-bold leading-none num" style={{ color: r.total ? '#E8CE8A' : delta >= 0 ? SAGE : BRICK }}>
                  {r.total ? wins(Math.round(r.to * 10) / 10) : signed(delta)}
                </div>
                {range && <div className="mt-1 text-[9px] font-semibold tracking-[0.5px] text-s-text3 num">{signed(range[0])} to {signed(range[1])}</div>}
              </div>
            </>
          )
          return (
            <div key={r.key} className="border-b last:border-b-0" style={{ borderColor: HAIRLINE, background: r.total ? 'rgba(var(--gold2-rgb), 0.03)' : undefined }}>
              <div className="flex items-center gap-2 pl-4 pr-3 sm:gap-3 sm:px-5">
                <div className="flex w-[88px] flex-shrink-0 items-center gap-1 py-3 sm:w-[140px]">
                  <span className={`text-[10px] font-bold uppercase tracking-[1px] sm:tracking-[1.5px] ${r.total ? 'text-gold-soft' : 'text-s-text2'}`}>{r.label}</span>
                  <InfoTip term={r.label}>{r.define ?? (r.step ? DEFINE[r.step] : '')}</InfoTip>
                </div>
                {r.step ? (
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : r.step!)}
                    className="flex min-h-[44px] flex-1 items-center gap-2 py-2 text-left transition-colors sm:gap-3 hover:bg-[rgba(var(--gold2-rgb),0.04)]"
                  >
                    {bar}
                    <span className={`w-3 flex-shrink-0 text-[10px] text-s-text3 transition-transform ${isOpen ? 'rotate-90' : ''}`} aria-hidden>›</span>
                  </button>
                ) : (
                  <div className="flex min-h-[44px] flex-1 items-center gap-2 py-2 sm:gap-3">{bar}<span className="w-3 flex-shrink-0" /></div>
                )}
              </div>
              {isOpen && r.step && <Detail step={r.step} seasons={shown} career={view === 'career'} totals={totals} replacement={view === 'career' ? null : file.replacement[String(view)]} />}
            </div>
          )
        })}
      </div>

      <p className="border-t px-5 py-3 text-[10px] leading-relaxed text-s-text3" style={{ borderColor: HAIRLINE }}>
        Completed seasons through {seasons[0].season}. Tap a step for the rows behind it.
      </p>
    </SectionCard>
  )
}

/** The rows behind one step. */
function Detail({ step, seasons, career, totals, replacement }: {
  step: Step
  seasons: OwnerSeasonBridge[]
  career: boolean
  totals: BridgeTotals
  replacement: Record<string, number> | null
}) {
  const sum = (f: (s: OwnerSeasonBridge) => number) => seasons.reduce((a, s) => a + f(s), 0)
  const shell = 'border-t px-5 pb-4 pt-3 text-[12px] text-s-text2'
  const list = 'mt-3 max-h-[320px] overflow-y-auto'
  const row = 'flex items-baseline gap-3 border-b py-1.5 last:border-b-0'

  if (step === 'luck') {
    return (
      <div className={shell} style={{ borderColor: HAIRLINE }}>
        <p>{wins(totals.actual)} actual wins against {totals.expected.toFixed(1)} all-play expected wins.</p>
        <div className={list}>
          {career
            ? seasons.map(s => (
                <div key={s.season} className={row} style={{ borderColor: HAIRLINE }}>
                  <span className="w-12 flex-shrink-0 font-display text-[15px] font-bold text-s-text3">{s.season}</span>
                  <span className="flex-1">{wins(s.actual)} wins, {s.expected.toFixed(1)} expected</span>
                  <Num n={s.luck} />
                </div>
              ))
            : seasons[0].luckWeeks.map(w => (
                <div key={w.week} className={row} style={{ borderColor: HAIRLINE }}>
                  <span className="w-12 flex-shrink-0 font-display text-[15px] font-bold text-s-text3">W{w.week}</span>
                  <span className="flex-1">{w.result === 'W' ? 'Won' : w.result === 'L' ? 'Lost' : w.result === 'T' ? 'Tied' : 'No game'}, {w.expected.toFixed(2)} all-play</span>
                  <Num n={(w.result === 'W' ? 1 : w.result === 'T' ? 0.5 : 0) - w.expected} digits={2} />
                </div>
              ))}
        </div>
      </div>
    )
  }

  const raw = sum(s => s.raw[step]), average = sum(s => s.leagueAverage[step]), points = totals.parts[step].points

  if (step === 'lineup') {
    const weeks = seasons.flatMap(s => s.lineupWeeks.map(w => ({ ...w, season: s.season })))
      .sort((a, b) => Math.abs(b.points - b.planned) - Math.abs(a.points - a.planned))
    return (
      <div className={shell} style={{ borderColor: HAIRLINE }}>
        <p>
          Your lineups scored {signed(raw, 0)} points against the projected ones; the league’s average team, {signed(average, 0)}.
          That’s {signed(points, 0)} points, {signed(totals.parts.lineup.wins)} wins. Every week you started someone the projections didn’t, biggest swings first:
        </p>
        <div className={list}>
          {weeks.length === 0 && <p className="text-s-text3">You started the projected lineup every week.</p>}
          {weeks.map(w => (
            <div key={`${w.season}-${w.week}`} className={row} style={{ borderColor: HAIRLINE }}>
              <span className="w-[52px] flex-shrink-0 font-display text-[15px] font-bold text-s-text3">{career ? `’${w.season % 100} ` : ''}W{w.week}</span>
              <span className="flex-1">
                {w.started.length ? <>Started <span className="text-s-text">{w.started.join(', ')}</span></> : 'Left a slot empty'}
                {w.benched.length > 0 && <> over {w.benched.join(', ')}</>}
              </span>
              <Num n={w.points - w.planned} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const channel: Channel = step
  const players = new Map<string, { name: string; position: string; starts: number; par: number; seasons: number }>()
  for (const s of seasons) {
    for (const p of s.players) {
      if (p.channel !== channel) continue
      const key = `${p.name}:${p.position}`
      const r = players.get(key) ?? { name: p.name, position: p.position, starts: 0, par: 0, seasons: 0 }
      r.starts += p.starts
      r.par += p.par
      r.seasons++
      players.set(key, r)
    }
  }
  const sorted = [...players.values()].sort((a, b) => b.par - a.par)
  return (
    <div className={shell} style={{ borderColor: HAIRLINE }}>
      <p>
        Your {LABEL[step].toLowerCase()} scored {signed(raw, 0)} points above replacement in the projected lineups; the league’s average
        team, {signed(average, 0)}. That’s {signed(points, 0)} points, {signed(totals.parts[step].wins)} wins.
      </p>
      {replacement && (
        <p className="mt-2 text-[11px] text-s-text3">
          Replacement, points a game: {Object.entries(replacement).filter(([slot]) => slot !== 'FLEX').map(([slot, v]) => `${slot} ${v.toFixed(1)}`).join(' · ')}
        </p>
      )}
      <div className={list}>
        {sorted.length === 0 && <p className="text-s-text3">None started in the projected lineups.</p>}
        {sorted.map(p => (
          <div key={`${p.name}:${p.position}`} className={row} style={{ borderColor: HAIRLINE }}>
            <span className="w-8 flex-shrink-0 text-[10px] font-bold text-s-text3">{p.position}</span>
            <span className="flex-1 text-s-text">{p.name}</span>
            <span className="flex-shrink-0 text-[10px] text-s-text3">{p.starts} {p.starts === 1 ? 'start' : 'starts'}</span>
            <Num n={p.par} />
          </div>
        ))}
      </div>
    </div>
  )
}

function Num({ n, digits = 1 }: { n: number; digits?: number }) {
  return (
    <span className="w-[54px] flex-shrink-0 text-right font-display text-[15px] font-bold num" style={{ color: n >= 0 ? SAGE : BRICK }}>
      {signed(n, digits)}
    </span>
  )
}

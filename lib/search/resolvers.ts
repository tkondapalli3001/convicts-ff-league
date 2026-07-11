import { getChampion, getShameLoser } from '@/lib/utils'
import { h2hRecord, buildChampPathGameKeys, gameKey } from '@/lib/stats'
import { computeLuckIndex } from '@/lib/luck'
import { EARNINGS_DATA } from '@/lib/constants'
import type { Answer, ParsedQuery, QueryContext } from './types'

const fmtMoney = (n: number) => `${n >= 0 ? '+' : '−'}$${Math.abs(n)}`

type Resolver = (p: ParsedQuery, ctx: QueryContext) => Answer | null

/** Played games scoped by the query's owners (pairing or single) and year. */
function marginPool(p: ParsedQuery, ctx: QueryContext) {
  let games = ctx.records.filteredMatchups.filter(g => g.pts1 > 0 || g.pts2 > 0)
  if (p.owners.length === 2) {
    const [a, b] = p.owners
    games = games.filter(g =>
      (g.team1 === a && g.team2 === b) || (g.team1 === b && g.team2 === a)
    )
  } else if (p.owners.length === 1) {
    const a = p.owners[0]
    games = games.filter(g => g.team1 === a || g.team2 === a)
  }
  if (p.year != null) games = games.filter(g => g.year === p.year)
  return games
}

function marginScope(p: ParsedQuery): string {
  return [
    p.owners.length === 2 ? `${p.owners[0]} vs ${p.owners[1]}` : p.owners[0],
    p.year != null ? String(p.year) : 'All-Time',
  ].filter(Boolean).join(' · ')
}

const scoreline = (g: { winner: string; loser: string; team1: string; pts1: number; pts2: number; year: number; week: number }) => {
  const winPts = g.winner === g.team1 ? g.pts1 : g.pts2
  const losPts = g.winner === g.team1 ? g.pts2 : g.pts1
  return `${g.winner} ${winPts.toFixed(2)} – ${losPts.toFixed(2)} ${g.loser} · ${g.year} Wk${g.week}`
}

const resolvers: Record<NonNullable<ParsedQuery['intent']>, Resolver> = {

  champion(p, ctx) {
    if (p.year != null) {
      const c = getChampion(p.year, ctx.state)
      if (!c.winner || c.winner === '—') return null
      const bits: string[] = []
      if ((c as { shared?: boolean }).shared) bits.push('shared title')
      if (c.seed != null) bits.push(`Seed #${c.seed}`)
      return {
        kind: 'stat',
        headline: `${p.year} Champion`,
        value: c.winner,
        detail: bits.join(' · ') || undefined,
        owner: c.winner,
      }
    }
    const years = [...ctx.state.years].sort((a, b) => b - a)
    return {
      kind: 'list',
      title: 'League Champions',
      rows: years.map(y => {
        const c = getChampion(y, ctx.state)
        return {
          label: String(y),
          value: c.winner,
          sub: (c as { shared?: boolean }).shared ? 'shared' : undefined,
          owner: c.winner,
        }
      }),
    }
  },

  'most-champs'(p, ctx) {
    const ranked = ctx.career.filter(c => c.champs > 0).sort((a, b) => b.champs - a.champs)
    if (!ranked.length) return null
    return {
      kind: 'list',
      title: 'Most Championships',
      rows: ranked.map(c => ({
        label: c.name,
        value: `${c.champs % 1 === 0 ? c.champs : c.champs.toFixed(1)}× 🏆`,
        owner: c.name,
      })),
    }
  },

  blowout(p, ctx) {
    const games = marginPool(p, ctx)
    if (!games.length) return null
    if (p.owners.length || p.year != null) {
      const top = games.reduce((m, g) => (g.margin > m.margin ? g : m), games[0])
      return {
        kind: 'stat',
        headline: `Biggest Blowout — ${marginScope(p)}`,
        value: top.margin.toFixed(2),
        detail: scoreline(top),
        owner: top.winner,
      }
    }
    const ranked = [...games].sort((a, b) => b.margin - a.margin).slice(0, 5)
    return {
      kind: 'list',
      title: 'Biggest Blowouts',
      rows: ranked.map(g => ({
        label: `${g.winner} over ${g.loser}`,
        value: `+${g.margin.toFixed(2)}`,
        sub: scoreline(g),
        owner: g.winner,
      })),
    }
  },

  'closest-game'(p, ctx) {
    const games = marginPool(p, ctx)
    if (!games.length) return null
    if (p.owners.length || p.year != null) {
      const top = games.reduce((m, g) => (g.margin < m.margin ? g : m), games[0])
      return {
        kind: 'stat',
        headline: `Closest Game — ${marginScope(p)}`,
        value: top.margin.toFixed(2),
        detail: scoreline(top),
        owner: top.winner,
      }
    }
    const ranked = [...games].sort((a, b) => a.margin - b.margin).slice(0, 5)
    return {
      kind: 'list',
      title: 'Closest Games',
      rows: ranked.map(g => ({
        label: `${g.winner} over ${g.loser}`,
        value: `±${g.margin.toFixed(2)}`,
        sub: scoreline(g),
        owner: g.winner,
      })),
    }
  },

  drafted(p, ctx) {
    // ownership is empty until the players cache lazy-loads — null falls back
    // to the overlay's plain name-match cards, same as player-stats
    if (!p.player) return null
    const entry = ctx.ownership.find(o => o.player_id === p.player!.id)
    if (!entry?.picks.length) return null
    let picks = [...entry.picks].sort((a, b) => b.year - a.year || a.pickNo - b.pickNo)
    if (p.year != null) picks = picks.filter(x => x.year === p.year)
    if (!picks.length) return null
    if (picks.length === 1) {
      const pick = picks[0]
      return {
        kind: 'stat',
        headline: `Who Drafted ${entry.name}${p.year != null ? ` — ${p.year}` : ''}`,
        value: pick.owner,
        detail: `${pick.year} · Round ${pick.round}, Pick ${pick.pickNo}`,
        owner: pick.owner,
      }
    }
    return {
      kind: 'list',
      title: `Draft History — ${entry.name}`,
      rows: picks.map(x => ({
        label: String(x.year),
        value: x.owner,
        sub: `Rd ${x.round} · Pick ${x.pickNo}`,
        owner: x.owner,
      })),
    }
  },

  shame(p, ctx) {
    if (p.year != null) {
      const s = getShameLoser(p.year, ctx.state)
      if (!s.loser || s.loser === '—') return null
      return {
        kind: 'stat',
        headline: `${p.year} Toilet Bowl Loser`,
        value: s.loser,
        detail: s.seed != null ? `Seed #${s.seed}` : undefined,
        owner: s.loser,
      }
    }
    const years = [...ctx.state.years].sort((a, b) => b - a)
    return {
      kind: 'list',
      title: 'Wall of Shame',
      rows: years.map(y => {
        const s = getShameLoser(y, ctx.state)
        return { label: String(y), value: s.loser, owner: s.loser }
      }),
    }
  },

  'high-score'(p, ctx) {
    let scores = ctx.records.validScores
    if (p.owners.length) scores = scores.filter(s => s.owner === p.owners[0])
    if (p.year != null) scores = scores.filter(s => s.year === p.year)
    if (!scores.length) return null
    const top = scores.reduce((m, s) => (s.pts > m.pts ? s : m), scores[0])
    const scope = [p.owners[0], p.year != null ? String(p.year) : 'All-Time'].filter(Boolean).join(' · ')
    return {
      kind: 'stat',
      headline: `Highest Score — ${scope}`,
      value: top.pts.toFixed(2),
      detail: `${top.owner} · ${top.year} Wk${top.week} vs ${top.opp}`,
      owner: top.owner,
    }
  },

  'low-score'(p, ctx) {
    let scores = ctx.records.validScores
    if (p.owners.length) scores = scores.filter(s => s.owner === p.owners[0])
    if (p.year != null) scores = scores.filter(s => s.year === p.year)
    if (!scores.length) return null
    const bottom = scores.reduce((m, s) => (s.pts < m.pts ? s : m), scores[0])
    const scope = [p.owners[0], p.year != null ? String(p.year) : 'All-Time'].filter(Boolean).join(' · ')
    return {
      kind: 'stat',
      headline: `Lowest Score — ${scope}`,
      value: bottom.pts.toFixed(2),
      detail: `${bottom.owner} · ${bottom.year} Wk${bottom.week} vs ${bottom.opp}`,
      owner: bottom.owner,
    }
  },

  'win-streak'(p, ctx) {
    if (p.owners.length) {
      const owner = p.owners[0]
      const st = ctx.records.streaks[owner]
      if (!st || st.maxWin === 0) return null
      return {
        kind: 'stat',
        headline: `${owner}'s Longest Win Streak`,
        value: `${st.maxWin} games`,
        detail: `${st.winStart.year} Wk${st.winStart.week} → ${st.winEnd.year} Wk${st.winEnd.week}`,
        owner,
      }
    }
    return {
      kind: 'list',
      title: 'Longest Win Streaks',
      rows: ctx.records.topWinStreaks.map(s => ({
        label: s.owner,
        value: `${s.streak}W`,
        sub: `${s.startYear} Wk${s.startWeek} → ${s.endYear} Wk${s.endWeek}`,
        owner: s.owner,
      })),
    }
  },

  'loss-streak'(p, ctx) {
    if (p.owners.length) {
      const owner = p.owners[0]
      const st = ctx.records.streaks[owner]
      if (!st || st.maxLoss === 0) return null
      return {
        kind: 'stat',
        headline: `${owner}'s Longest Losing Streak`,
        value: `${st.maxLoss} games`,
        detail: `${st.lossStart.year} Wk${st.lossStart.week} → ${st.lossEnd.year} Wk${st.lossEnd.week}`,
        owner,
      }
    }
    return {
      kind: 'list',
      title: 'Longest Losing Streaks',
      rows: ctx.records.topLossStreaks.map(s => ({
        label: s.owner,
        value: `${s.streak}L`,
        sub: `${s.startYear} Wk${s.startWeek} → ${s.endYear} Wk${s.endWeek}`,
        owner: s.owner,
      })),
    }
  },

  luck(p, ctx) {
    const entries = computeLuckIndex(
      ctx.state.matchups,
      ctx.state.rosterUserMaps,
      ctx.state.ownerSeasons,
      p.year ?? undefined,
    )
    if (!entries.length) return null
    if (p.owners.length) {
      const e = entries.find(x => x.owner === p.owners[0])
      if (!e) return null
      const label = e.luckIndex > 0 ? 'lucky' : 'unlucky'
      return {
        kind: 'stat',
        headline: `${e.owner}'s Luck Index${p.year != null ? ` — ${p.year}` : ''}`,
        value: `${e.luckIndex > 0 ? '+' : ''}${e.luckIndex.toFixed(1)} wins`,
        detail: `${e.actualWins} actual vs ${e.expectedWins.toFixed(1)} expected — ${label}${e.narrative ? ` · "${e.narrative}"` : ''}`,
        owner: e.owner,
      }
    }
    const luckiest = entries.slice(0, 3)
    const unluckiest = entries.slice(-3).reverse()
    return {
      kind: 'list',
      title: `Luck Index${p.year != null ? ` — ${p.year}` : ''} (actual − expected wins)`,
      rows: [
        ...luckiest.map(e => ({ label: e.owner, value: `+${e.luckIndex.toFixed(1)}`, sub: 'lucky', owner: e.owner })),
        ...unluckiest.map(e => ({ label: e.owner, value: e.luckIndex.toFixed(1), sub: 'unlucky', owner: e.owner })),
      ],
    }
  },

  earnings(p, ctx) {
    if (p.owners.length) {
      const e = EARNINGS_DATA.find(x => x.owner === p.owners[0])
      if (!e) return null
      return {
        kind: 'stat',
        headline: `${e.owner}'s Net Earnings`,
        value: fmtMoney(e.total),
        detail: 'All-time payouts minus buy-ins',
        owner: e.owner,
      }
    }
    const ranked = [...EARNINGS_DATA].sort((a, b) => b.total - a.total)
    return {
      kind: 'list',
      title: 'All-Time Net Earnings',
      rows: ranked.map(e => ({ label: e.owner, value: fmtMoney(e.total), owner: e.owner })),
    }
  },

  playoffs(p, ctx) {
    const champPathKeys = buildChampPathGameKeys(ctx.state)
    const playoffRecord = (owner: string) => {
      const games = ctx.state.allMatchups.filter(g =>
        g.type === 'P' &&
        (g.team1 === owner || g.team2 === owner) &&
        champPathKeys.has(gameKey(g.year, g.week, g.team1, g.team2))
      )
      const w = games.filter(g => g.winner === owner).length
      const l = games.filter(g => g.loser === owner).length
      return { w, l, games: games.length }
    }
    if (p.owners.length) {
      const owner = p.owners[0]
      const r = playoffRecord(owner)
      const apps = ctx.career.find(c => c.name === owner)?.playoffApps ?? 0
      if (!r.games && !apps) return null
      return {
        kind: 'stat',
        headline: `${owner}'s Playoff Record`,
        value: `${r.w}–${r.l}`,
        detail: `${apps} playoff appearance${apps !== 1 ? 's' : ''} · championship-path games only`,
        owner,
      }
    }
    const rows = ctx.career
      .map(c => ({ name: c.name, ...playoffRecord(c.name), apps: c.playoffApps }))
      .filter(r => r.games > 0)
      .sort((a, b) => b.w - a.w || a.l - b.l)
    if (!rows.length) return null
    return {
      kind: 'list',
      title: 'Playoff Records (championship path)',
      rows: rows.map(r => ({ label: r.name, value: `${r.w}–${r.l}`, sub: `${r.apps} apps`, owner: r.name })),
    }
  },

  career(p) {
    if (!p.owners.length) return null
    return { kind: 'manager', name: p.owners[0] }
  },

  'player-stats'(p) {
    if (!p.player) return null
    return { kind: 'player', playerId: p.player.id }
  },

  h2h(p, ctx) {
    if (p.owners.length < 2) return null
    const [a, b] = p.owners
    const pool = p.year != null
      ? ctx.state.allMatchups.filter(g => g.year === p.year)
      : ctx.state.allMatchups
    const record = h2hRecord(pool, a, b)
    if (!record.games.length) return null
    return { kind: 'h2h', a, b, record }
  },
}

export function resolveAnswer(p: ParsedQuery, ctx: QueryContext): Answer | null {
  if (!p.intent) return null
  return resolvers[p.intent](p, ctx)
}

import type { LeagueState, OwnerSeason, SleeperLeague } from '@/types'
import { getFinishFromBracket } from './bracket-finish'
import { MANUAL_CHAMPS, MANUAL_SHAME, MANUAL_PLAYOFF_OVERRIDES } from '@/lib/league-history'

/**
 * Historical stats only count completed seasons. A live season awards no
 * records, byes, finishes, or any other accolade until Sleeper marks it
 * complete — until then it exists only for live features (This Week, drafts).
 */
export function isSeasonComplete(league: SleeperLeague | undefined): boolean {
  return (league?.status ?? 'complete') === 'complete'
}

export function buildOwnerSeasons(state: LeagueState): Record<string, OwnerSeason[]> {
  // Collect all canonical names seen across completed years — an in-progress
  // season would otherwise emit partial records and provisional finishes
  const allNames = new Set<string>()
  const loadedYears = Object.keys(state.rosterUserMaps)
    .map(Number)
    .filter(year => isSeasonComplete(state.leagues[year]))
    .sort((a, b) => a - b)
  for (const year of loadedYears) {
    Object.values(state.rosterUserMaps[year] || {}).forEach(n => allNames.add(n))
  }

  const ownerSeasons: Record<string, OwnerSeason[]> = {}

  allNames.forEach(name => {
    const seasons: OwnerSeason[] = []

    for (const year of loadedYears) {
      const rMap = state.rosterUserMaps[year] || {}
      // Find roster_id for this owner in this year
      const entry = Object.entries(rMap).find(([, v]) => v === name)
      if (!entry) continue
      const roster_id = parseInt(entry[0])

      // Compute H2H wins/losses/PF/PA from matchup data (correctly excludes 2024 median games,
      // since those produce groups of size ≠ 2 and are filtered out by the group.length !== 2 check)
      let wins = 0, losses = 0, ties = 0, pf = 0, pa = 0
      for (const [, { matchups: weekMatchups, isPlayoff }] of Object.entries(state.matchups[year] || {})) {
        if (isPlayoff) continue
        const groups: Record<number, typeof weekMatchups> = {}
        weekMatchups.forEach(m => {
          if (!groups[m.matchup_id]) groups[m.matchup_id] = []
          groups[m.matchup_id].push(m)
        })
        for (const group of Object.values(groups)) {
          if (group.length !== 2) continue
          const mine = group.find(m => m.roster_id === roster_id)
          if (!mine) continue
          const opp = group.find(m => m.roster_id !== roster_id)!
          if (!opp) continue
          const myPts = mine.points || 0
          const oppPts = opp.points || 0
          pf += myPts
          pa += oppPts
          if (myPts > oppPts) wins++
          else if (myPts < oppPts) losses++
          else ties++
        }
      }

      const bracket = state.brackets[year]
      const lgSettings = state.leagues[year]?.settings || {}
      const totalRosters = lgSettings.num_teams || 10
      const playoffStart = lgSettings.playoff_week_start || 15

      let finish: number | null = null
      if (bracket) {
        finish = getFinishFromBracket(bracket, roster_id, totalRosters)
      }

      // Mark as playoff team if roster_id appears in winners bracket seedings
      const winnerIds = new Set<number>()
      ;(bracket?.winners || []).forEach(g => {
        if (g.t1) winnerIds.add(g.t1)
        if (g.t2) winnerIds.add(g.t2)
      })
      let inPlayoffs = winnerIds.has(roster_id)

      // ── Manual overrides: correct bracket data inconsistencies ──────────────
      const manualShame   = MANUAL_SHAME.find(s => s.year === year && s.loser === name)
      const manualChamp   = MANUAL_CHAMPS.find(c => c.year === year && c.winner?.includes(name))
      const manualPlayoff = MANUAL_PLAYOFF_OVERRIDES.find(p => p.year === year && p.owner === name)

      if (manualShame) {
        // Confirmed toilet-bowl loser for this year
        finish    = totalRosters
        inPlayoffs = false
      } else if (manualChamp) {
        // Confirmed champion for this year
        finish    = 1
        inPlayoffs = true
      } else if (manualPlayoff) {
        // Confirmed playoff participant whose bracket data may be wrong
        inPlayoffs = true
        if (finish != null && finish >= totalRosters - 1) {
          finish = manualPlayoff.finish ?? 5
        }
      } else {
        // Generic safeguard: if another owner is the confirmed shame loser for this year
        // but this owner incorrectly received last place from the bracket, clear the finish
        const yearShame = MANUAL_SHAME.find(s => s.year === year)
        if (yearShame && finish === totalRosters) {
          finish = null
        }
      }

      seasons.push({ year, wins, losses, ties, pf, pa, finish, inPlayoffs, roster_id, playoffStart, totalRosters })
    }

    if (seasons.length > 0) ownerSeasons[name] = seasons
  })

  // Post-processing: assign 9th-place finish (toilet bowl winner) for each year.
  // Sleeper bracket data often omits g.p on losers-bracket games, so we cross-reference
  // with MANUAL_SHAME (confirmed last-place losers) and the bracket/matchup data.
  for (const year of loadedYears) {
    const shameEntry = MANUAL_SHAME.find(s => s.year === year)
    if (!shameEntry) continue
    const shameSeason = ownerSeasons[shameEntry.loser]?.find(s => s.year === year)
    if (!shameSeason) continue

    const shameRosterId = shameSeason.roster_id
    const totalRosters = shameSeason.totalRosters
    const ninthPlace = totalRosters - 1

    let ninthRosterId: number | null = null

    // First try: find toilet bowl game in losers bracket (g.l === shame loser's roster_id)
    const bracket = state.brackets[year]
    if (bracket?.losers?.length) {
      const maxR = Math.max(...bracket.losers.map(g => g.r))
      const tbGame = bracket.losers.find(g => g.r === maxR && g.l === shameRosterId)
      if (tbGame?.w) ninthRosterId = tbGame.w
    }

    // Second try: scan playoff matchups for the shame loser's last losing game (= toilet bowl)
    if (!ninthRosterId) {
      const yearMUs = state.matchups[year]
      if (yearMUs) {
        const playoffWks = Object.entries(yearMUs)
          .filter(([, w]) => w.isPlayoff)
          .sort(([a], [b]) => +b - +a)  // latest week first
        outer: for (const [, { matchups: mups }] of playoffWks) {
          const grps: Record<number, typeof mups> = {}
          mups.forEach(m => { if (!grps[m.matchup_id]) grps[m.matchup_id] = []; grps[m.matchup_id].push(m) })
          for (const grp of Object.values(grps)) {
            if (grp.length !== 2) continue
            const mine = grp.find(m => m.roster_id === shameRosterId)
            if (!mine) continue
            const opp = grp.find(m => m.roster_id !== shameRosterId)!
            if ((mine.points || 0) < (opp.points || 0)) {
              ninthRosterId = opp.roster_id
              break outer
            }
          }
        }
      }
    }

    if (!ninthRosterId) continue
    const rMap = state.rosterUserMaps[year] ?? {}
    const ninthName = rMap[String(ninthRosterId)]
    const ninthSeason = ownerSeasons[ninthName]?.find(s => s.year === year)
    if (ninthSeason && (ninthSeason.finish == null || ninthSeason.finish > ninthPlace)) {
      ninthSeason.finish = ninthPlace
    }
  }

  return ownerSeasons
}

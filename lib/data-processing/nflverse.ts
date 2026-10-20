// nflverse's weekly box scores mapped onto Sleeper's stat keys, so the
// league's scoring_settings score them the way Sleeper does: players from
// stats_player_week_<season>.csv, team defenses from stats_team_week_<season>.csv
// with the schedule's final scores. The independent source behind the
// player and team-defense tie-outs.

/** One row of nflverse's weekly player stats, as read from its CSV. */
export type NflverseRow = Record<string, string>

/**
 * The nflverse columns kept in data/player_weeks.csv: everything the league's
 * scoring reads, plus fumble recoveries, which it can't (see nflverseStatLine).
 */
export const NFLVERSE_SCORING_COLUMNS = [
  'passing_yards', 'passing_tds', 'passing_interceptions', 'passing_2pt_conversions',
  'rushing_yards', 'rushing_tds', 'rushing_2pt_conversions',
  'receptions', 'receiving_yards', 'receiving_tds', 'receiving_2pt_conversions',
  'fumbles_lost_total', 'special_teams_tds', 'fumble_recovery_tds', 'fumble_recovery_own', 'fumble_recovery_opp',
  'fg_made_0_19', 'fg_made_20_29', 'fg_made_30_39', 'fg_made_40_49', 'fg_made_50_59', 'fg_made_60_',
  'fg_made_list', 'fg_missed', 'fg_blocked', 'pat_made', 'pat_missed', 'pat_blocked',
] as const

const num = (v: string | undefined) => (v && v !== 'NA' ? Number(v) : 0)

/**
 * An nflverse box-score row as a Sleeper stat line. Fumble recoveries stay
 * out: Sleeper scores one on special teams (st_fum_rec) but files the rest
 * as unscored defensive stats, and nflverse doesn't say which play it was.
 */
export function nflverseStatLine(row: NflverseRow): Record<string, number> {
  const madeDistances = (row.fg_made_list ?? '').split(';').map(Number).filter(d => d > 0)
  return {
    pass_yd: num(row.passing_yards),
    pass_td: num(row.passing_tds),
    pass_int: num(row.passing_interceptions),
    pass_2pt: num(row.passing_2pt_conversions),
    rush_yd: num(row.rushing_yards),
    rush_td: num(row.rushing_tds),
    rush_2pt: num(row.rushing_2pt_conversions),
    rec: num(row.receptions),
    rec_yd: num(row.receiving_yards),
    rec_td: num(row.receiving_tds),
    rec_2pt: num(row.receiving_2pt_conversions),
    fum_lost: num(row.fumbles_lost_total),
    st_td: num(row.special_teams_tds),
    fum_rec_td: num(row.fumble_recovery_tds),
    fgm_0_19: num(row.fg_made_0_19),
    fgm_20_29: num(row.fg_made_20_29),
    fgm_30_39: num(row.fg_made_30_39),
    fgm_40_49: num(row.fg_made_40_49),
    fgm_50p: num(row.fg_made_50_59) + num(row.fg_made_60_),
    fgm_yds_over_30: madeDistances.reduce((sum, d) => sum + Math.max(0, d - 30), 0),
    // Sleeper counts a blocked kick as a miss
    fgmiss: num(row.fg_missed) + num(row.fg_blocked),
    xpm: num(row.pat_made),
    xpmiss: num(row.pat_missed) + num(row.pat_blocked),
  }
}

/**
 * The data/defense_weeks.csv columns a team defense's week is scored from:
 * nflverse's team box-score columns, the same columns of the opponent's row
 * (opponent_), the opponent's final score, and fumble-recovery touchdowns
 * scored on the other team's fumbles (from the player box scores).
 */
export const NFLVERSE_DEFENSE_COLUMNS = [
  'def_interceptions', 'fumble_recovery_opp', 'def_safeties', 'def_tds', 'fumble_return_tds', 'special_teams_tds',
  'def_punt_blocks', 'def_fg_blocks', 'def_pat_blocks',
  'opponent_points', 'opponent_def_tds', 'opponent_fumble_return_tds', 'opponent_def_safeties',
  'opponent_sacks_suffered', 'opponent_passing_yards', 'opponent_sack_yards_lost', 'opponent_rushing_yards',
] as const

/**
 * Points allowed as Sleeper counts them: the opponent's score less its
 * defense's touchdowns (interception and fumble returns) and safeties. A kick
 * or punt return touchdown still counts against the D/ST.
 */
export function defensePointsAllowed(row: NflverseRow): number {
  return num(row.opponent_points) - 6 * (num(row.opponent_def_tds) + num(row.opponent_fumble_return_tds)) - 2 * num(row.opponent_def_safeties)
}

/** Yards allowed: the opponent's total net yards (nflverse stores sack yards as negative). */
export function defenseYardsAllowed(row: NflverseRow): number {
  return num(row.opponent_passing_yards) + num(row.opponent_sack_yards_lost) + num(row.opponent_rushing_yards)
}

/** Sleeper's tier keys, each with its top value; anything higher takes the last key. */
const POINTS_ALLOWED_TIERS: [number, string][] = [
  [0, 'pts_allow_0'], [6, 'pts_allow_1_6'], [13, 'pts_allow_7_13'], [20, 'pts_allow_14_20'], [27, 'pts_allow_21_27'], [34, 'pts_allow_28_34'], [Infinity, 'pts_allow_35p'],
]
const YARDS_ALLOWED_TIERS: [number, string][] = [
  [99, 'yds_allow_0_100'], [199, 'yds_allow_100_199'], [299, 'yds_allow_200_299'], [349, 'yds_allow_300_349'], [399, 'yds_allow_350_399'],
  [449, 'yds_allow_400_449'], [499, 'yds_allow_450_499'], [549, 'yds_allow_500_549'], [Infinity, 'yds_allow_550p'],
]
const tier = (value: number, tiers: [number, string][]) => tiers.find(([top]) => value <= top)![1]

/**
 * A team defense's week (a data/defense_weeks.csv row) as a Sleeper DEF stat
 * line. Sacks are the ones the opponent took, so a sack credited to no
 * defender still counts. Every opponent fumble recovered is fum_rec, which
 * the league scores the same as Sleeper's special-teams recoveries.
 */
export function nflverseDefenseStatLine(row: NflverseRow): Record<string, number> {
  return {
    sack: num(row.opponent_sacks_suffered),
    int: num(row.def_interceptions),
    fum_rec: num(row.fumble_recovery_opp),
    safe: num(row.def_safeties),
    def_td: num(row.def_tds) + num(row.fumble_return_tds),
    def_st_td: num(row.special_teams_tds),
    blk_kick: num(row.def_punt_blocks) + num(row.def_fg_blocks) + num(row.def_pat_blocks),
    [tier(defensePointsAllowed(row), POINTS_ALLOWED_TIERS)]: 1,
    [tier(defenseYardsAllowed(row), YARDS_ALLOWED_TIERS)]: 1,
  }
}

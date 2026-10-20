// nflverse's weekly player box scores (stats_player_week_<season>.csv) mapped
// onto Sleeper's stat keys, so the league's scoring_settings score them the
// way Sleeper does. The independent source behind the player-points tie-out.

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

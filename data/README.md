# data/ — the league's history as tidy tables

One fact per row, plain CSV: it opens in Excel and queries in DuckDB or pandas. The
site never reads this folder (it isn't deployed). Two things do:

- `npm run dataset` writes it, from the committed snapshots in `public/data/`,
  Sleeper's player list and weekly projections, nflverse's weekly box scores and
  schedule, and the DynastyProcess player-ID crosswalk, through the site's own code. Add `-- --cache <dir>` to keep
  and reuse the downloads.
- The control-totals test (`lib/stats/__tests__/control-totals.test.ts`) reads
  `players.csv` and `player_weeks.csv` on every deploy.

Rebuild it whenever `public/data/` changes, then commit both.

## The tables

**players.csv**, one row per player who ever appears in league data.
`player_id` is Sleeper's id. `fantasy_positions` lists every position the player may
fill, `|`-separated (Travis Hunter is `DB|WR`). `gsis_id` is the NFL's id and
`gsis_source` says where it came from: Sleeper's own list, or DynastyProcess when
Sleeper's is blank.

**owner_weeks.csv**, one row per team per week.
`game` is `regular` or `playoffs`. `result` is the head-to-head result, and
`median_result` the extra result against the league median (2024 only).
`best_lineup_points` is the best lineup that roster could have set
(`lib/stats/lineups.ts`); `bench_points_left` is that minus what it scored.
`custom_points` would show a commissioner override (there are none).

**lineups.csv**, one row per rostered player per week.
`slot` is the starting slot the player filled, or `BN`. `best_lineup_slot` is where
the best possible lineup would have used him. An unfilled starting slot appears as
player `(empty)`.

**transactions.csv**, one row per player moved.
Failed waiver claims are included (`status` = `failed`), with their FAAB bids, so it
shows who wanted whom and what they bid. Times are UTC: `created_utc` is when the
move was placed and `processed_utc` when it went through.

**draft_picks.csv**, one row per pick.
`slot_owner` is the slot's pre-trade owner (`draftSlotOwners`), `picked_by` whoever
made the pick, and `traded_pick` marks the two differing.

**projections.csv**, one row per rostered player per week: Sleeper's projection,
scored with the season's settings. `kickoff_utc` is the player's game (nflverse
schedule). `before_kickoff` compares it with `projection_updated_utc`, Sleeper's
last-change time. Caution: no past projection is provably what managers saw before
kickoff. 2019-2022 rows carry no update time at all, and where 2023-2025 rows do,
it's after kickoff (about 90% of 2024-2025). Treat these as Sleeper's final
projection for the week. True pre-kickoff projections need the weekly archive.

**player_weeks.csv**, one row per NFL player per regular-season week, 2019-2025:
every QB, RB, WR, TE, FB, and K with a box score, rostered or not. Columns are
nflverse's own. A blank stat means 0. `points` is that line scored with the season's
`scoring_settings`. For a player on a league roster that week, `rostered_by`,
`sleeper_points`, and `diff` (points minus Sleeper's) are filled in.

**control_totals.csv**, four rows per owner-season: `record`, `pf`, `pa`, and `ppts`
(potential points, Sleeper's best-lineup total).
`ours` comes from the site's code and `sleeper` from the totals Sleeper stores on the
roster. `cause` explains every row that doesn't tie.

## What ties out (2019-2025)

- **Records: all 70 owner-seasons.** 2024 counts the league-median games, as Sleeper does.
- **Points for/against and potential points:** 2022-2025 tie completely, except one
  2024 potential-points total. That one comes from Taysom Hill's week 11 and is
  unexplained.
  - 2019-2021 have documented gaps where Sleeper's frozen season totals don't add up
    from its own weekly scores.
  - In 2019 the leftover pattern points at a defense scoring change.
- **Weekly player points:** 14,684 of 14,691 rostered player-weeks (offense and
  kickers) match the rescored NFL box scores to the cent. The other seven are
  documented, including two Sleeper kicker errors in 2019.
- **Not yet checked:** team defenses (they need team-level box scores).

Every difference and its cause lives in `KNOWN_GAPS` and `KNOWN_PLAYER_GAPS` in
`lib/stats/control-totals.ts`. A new difference fails the tests.

# data/ — the league's history as tidy tables

One fact per row, plain CSV: it opens in Excel and queries in DuckDB or pandas. The
site never reads this folder (it isn't deployed). Two things do:

- `npm run dataset` writes it, from the committed snapshots in `public/data/`,
  Sleeper's player list, projections and ADP, Fantasy Football Calculator's ADP,
  nflverse's weekly player and team box scores and schedule, and the DynastyProcess
  player-ID crosswalk, through the site's own code. Add `-- --cache <dir>` to keep and reuse
  the downloads.
- The control-totals test (`lib/stats/__tests__/control-totals.test.ts`) reads
  `players.csv`, `player_weeks.csv`, `defense_weeks.csv`, and `draft_picks.csv` on
  every deploy.

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
made the pick, and `traded_pick` marks the two differing. `keeper` marks a player
kept and placed in that round (nine each in 2024 and 2025).

Each pick's market price is its half-PPR ADP (average draft position), in `adp`.
`adp_source` names the market:

- `sleeper` (2021-2025): Sleeper's ADP across its users' real drafts.
- `ffc` (2019-2020): Fantasy Football Calculator's 12-team mock drafts. Sleeper's
  ADP for those seasons can't be used. 2019's is all placeholders, and 2020's is a
  whole-number ranking that puts McCaffrey, the consensus first pick, at 999.

`adp_ffc` is FFC's price in every season, kept as a cross-check. For 2021-2025 the
two markets rank the league's picks almost alike (rank correlation 0.94-0.98), but a
typical player's two prices sit 3-10 picks apart, so treat any one ADP as good to
about a round. `picks_after_adp` is `pick_no` minus `adp`: positive means the player
went later than his price, negative earlier. A blank `adp` means the market rarely
or never drafted him (six picks in all).

Cautions:

- Neither price comes from the league's draft day. Sleeper's is one preseason number
  per season. FFC's covers only the last two to four days before each season, about
  two weeks after the 2019 and 2020 drafts. That's why Andrew Luck, who retired
  within a week of the 2019 draft, has no price. The 2024 draft (July 27) came a
  month before the others.
- Keepers come off the board first. For a keeper, `picks_after_adp` is the keeper's
  discount, not a draft call. They shift everyone else too: in 2024 and 2025 the
  median pick runs about 7 picks ahead of ADP. Counting only the non-keepers priced
  ahead of each player brings that back to about 1, so grade picks on that count.

**projections.csv**, one row per rostered player per week: Sleeper's projection,
scored with the season's settings. `nfl_team` is the player's team that week by
nflverse's box scores (the nearest week he played). Sleeper's own label can be the
team he plays for today, even on a 2019 row, so it's used only for the few players
nflverse never lists that season. `kickoff_utc` is that team's game (nflverse
schedule), blank on a bye. `before_kickoff` compares it with `projection_updated_utc`, Sleeper's
last-change time. Caution: no past projection is provably what managers saw before
kickoff. 2019-2022 rows carry no update time at all, and where 2023-2025 rows do,
it's after kickoff (about 90% of 2024-2025). Treat these as Sleeper's final
projection for the week. True pre-kickoff projections need the weekly archive.

**player_weeks.csv**, one row per NFL player per regular-season week, 2019-2025:
every QB, RB, WR, TE, FB, and K with a box score, rostered or not. Columns are
nflverse's own. A blank stat means 0. `points` is that line scored with the season's
`scoring_settings`. For a player on a league roster that week, `rostered_by`,
`sleeper_points`, and `diff` (points minus Sleeper's) are filled in.

**defense_weeks.csv**, one row per team defense per regular-season week, 2019-2025,
all 32 teams. The columns are nflverse's team box score (`def_interceptions` through
`def_pat_blocks`), the same columns from the opponent's row (`opponent_`), the
opponent's final score from the schedule, and `fumble_return_tds`: fumble-recovery
touchdowns scored by a defender, from the player box scores. A blank means 0.
`points_allowed` and `yards_allowed` follow Sleeper's definitions. Points allowed is
the opponent's score less its defense's touchdowns and safeties; a kick or punt return
touchdown still counts against the D/ST. Yards allowed is the opponent's total net
yards. `points` is the week scored with the season's settings. For a defense on a
league roster, `rostered_by`, `sleeper_points`, `diff`, and `cause` are filled in.
`team` uses Sleeper's ids: LAR for the Rams, OAK for the 2019 Raiders.

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
  - 2019's are explained. Sleeper's stored totals match the NFL's box scores; its
    weekly 2019 scores were changed after the season, in team-defense weeks and two
    kicker errors. What's left is a few tenths of a point and three totals off by
    2 to 3 points.
- **Weekly player points:** 14,684 of 14,691 rostered player-weeks (offense and
  kickers) match the rescored NFL box scores to the cent. The other seven are
  documented, including two Sleeper kicker errors in 2019.
- **Draft prices:** every season prices at least 97% of its picks, and every season
  priced by Sleeper agrees with FFC. The tests fail if a season prices under 90%,
  or if a Sleeper season looks like a ranking (mostly whole numbers) or its rank
  correlation with FFC drops under 0.9.
- **Weekly team-defense points:** 1,747 of 1,798 rostered defense-weeks match the
  rescored box scores. The other 51, and the suspended 2022 Bills-Bengals game, are
  documented. Most (37) are special-teams fumble recoveries Sleeper credits and the
  NFL's box score doesn't count, such as muffed punts. 41 of the 52 are from
  2019.

Every difference and its cause lives in `KNOWN_GAPS`, `KNOWN_PLAYER_GAPS`, and
`KNOWN_DEFENSE_GAPS` in `lib/stats/control-totals.ts`. A new difference fails the
tests.

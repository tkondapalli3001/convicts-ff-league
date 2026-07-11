import { normalize, tokens, extractYear } from './tokenize'
import { matchOwners, matchPlayer } from './entities'
import type { EntityIndex, Intent, ParsedQuery } from './types'

/**
 * Keyword table, checked in order — first hit wins. Kept deliberately boring:
 * plain regexes over the normalized query, no scoring model.
 */
const INTENT_RULES: { intent: Intent; test: (n: string) => boolean }[] = [
  { intent: 'drafted',      test: n => /\bdraft(ed)?\b/.test(n) },
  // "biggest win streak" belongs to win-streak, so blowout bows out on "streak"
  { intent: 'blowout',      test: n => !/\bstreak\b/.test(n) && /\b(blow ?outs?|beat ?downs?|biggest (win|victory|margin)|largest margin|margin of victory|(most )?lopsided)\b/.test(n) },
  { intent: 'closest-game', test: n => /\b(closest|narrowest|slimmest|nail ?biters?|photo finish|smallest margin)\b/.test(n) },
  { intent: 'h2h',         test: n => /\b(vs|versus|against|head to head|h2h|rivalry)\b/.test(n) },
  { intent: 'most-champs', test: n => /\bmost\b.*\b(champ|champion|championships|rings?|titles?)\b/.test(n) || /\b(champ|champion|championships|rings?|titles?)\b.*\bmost\b/.test(n) },
  { intent: 'champion',    test: n => /\b(champion|champ|title|ring|who won|won (the )?(league|it|championship)|winner)\b/.test(n) },
  { intent: 'shame',       test: n => /\b(shame|toilet|last place|sacko|loser of|worst finish)\b/.test(n) },
  { intent: 'high-score',  test: n => /\b(most points|highest|best game|top score|biggest score|record score|high score)\b/.test(n) },
  { intent: 'low-score',   test: n => /\b(lowest|fewest points|worst game|stinker|low score)\b/.test(n) },
  { intent: 'loss-streak', test: n => /\b(los(s|ing|ses)|cold|skid)\b.*\bstreak\b/.test(n) || /\bstreak\b.*\blos(s|ing|ses)\b/.test(n) },
  { intent: 'win-streak',  test: n => /\bstreak\b/.test(n) },
  { intent: 'luck',        test: n => /\b(luck|lucky|luckiest|unlucky|unluckiest|martyr)\b/.test(n) },
  { intent: 'earnings',    test: n => /\b(money|earnings?|earned|paid|payout|winnings|cash|dollars?|net)\b/.test(n) },
  { intent: 'playoffs',    test: n => /\bplayoffs?\b/.test(n) },
  { intent: 'career',      test: n => /\b(career|record|stats?|profile|history|how (good|bad))\b/.test(n) },
]

export function parseQuery(raw: string, index: EntityIndex, years: number[]): ParsedQuery {
  const n = normalize(raw)
  const toks = tokens(raw)
  const year = extractYear(raw, years)
  const owners = matchOwners(toks, index)
  const player = matchPlayer(toks, index, owners)

  let intent: Intent | null = null
  for (const rule of INTENT_RULES) {
    if (rule.test(n)) { intent = rule.intent; break }
  }

  // h2h needs two owners; with fewer it degrades to career/player lookup
  if (intent === 'h2h' && owners.length < 2) intent = owners.length === 1 ? 'career' : null

  // drafted needs a player; without one it degrades the same way
  if (intent === 'drafted' && !player) intent = owners.length === 1 ? 'career' : null

  // No keyword hit but we recognized an entity → show its card
  if (!intent) {
    if (player && owners.length === 0) intent = 'player-stats'
    else if (owners.length === 1) intent = 'career'
    else if (owners.length === 2) intent = 'h2h'
  }

  // A player mention beats a generic career intent ("justin jefferson stats")
  if (player && owners.length === 0 && (intent === 'career' || intent === 'high-score')) {
    intent = 'player-stats'
  }

  return {
    raw,
    intent,
    owners,
    player: player ? { id: player.id, name: player.name } : null,
    year,
  }
}

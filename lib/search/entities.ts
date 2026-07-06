import { OWNER_FULL_NAMES } from '@/lib/constants'
import { levenshtein, normalize } from './tokenize'
import type { EntityIndex, OwnerEntity, PlayerEntity } from './types'

/**
 * Build the entity dictionary. Owners come from the canonical name list
 * (first name + full-name parts as aliases); players from the win-rate stats,
 * i.e. only players who actually started a game in this league.
 */
export function buildEntityIndex(
  ownerNames: string[],
  players: { player_id: string; name: string; games: number }[],
): EntityIndex {
  const owners: OwnerEntity[] = ownerNames.map(name => {
    const aliases = new Set<string>([name.toLowerCase()])
    const full = OWNER_FULL_NAMES[name]
    if (full) full.toLowerCase().split(' ').forEach(part => { if (part.length >= 3) aliases.add(part) })
    return { name, aliases: [...aliases] }
  })

  const playerEntities: PlayerEntity[] = players.map(p => ({
    id: p.player_id,
    name: p.name,
    tokens: normalize(p.name).split(' ').filter(Boolean),
    games: p.games,
  }))

  return { owners, players: playerEntities }
}

/**
 * Find owners mentioned in the query, in order of appearance, max 2.
 * A token matches an owner alias exactly, or by edit distance 1 for tokens
 * of length ≥ 4 (typo tolerance: "tejaa", "kerri").
 */
export function matchOwners(queryTokens: string[], index: EntityIndex): string[] {
  const found: string[] = []
  for (const tok of queryTokens) {
    for (const owner of index.owners) {
      if (found.includes(owner.name)) continue
      // Fuzzy match requires the same first letter, so "justin" can't drift
      // into "Dustin" — only genuine typos like "kerri"/"tejaa" pass.
      const hit = owner.aliases.some(a =>
        a === tok ||
        (tok.length >= 4 && a.length >= 4 && a[0] === tok[0] && levenshtein(a, tok) <= 1)
      )
      if (hit) {
        found.push(owner.name)
        break
      }
    }
    if (found.length >= 2) break
  }
  return found
}

/**
 * Find an NFL player in the query. Bare first names always prefer owners, so
 * a player only matches when:
 *   - at least 2 of their name tokens appear in the query, OR
 *   - a query token uniquely matches one player's surname.
 * Ties break toward more games started.
 */
export function matchPlayer(
  queryTokens: string[],
  index: EntityIndex,
  ownerMatches: string[],
): PlayerEntity | null {
  if (!index.players.length) return null
  // Tokens already claimed by owner matches don't count toward players
  const ownerTokens = new Set(
    index.owners
      .filter(o => ownerMatches.includes(o.name))
      .flatMap(o => o.aliases)
  )
  const usable = queryTokens.filter(t => !ownerTokens.has(t) && t.length >= 3)
  if (!usable.length) return null

  let best: { player: PlayerEntity; matches: number } | null = null
  for (const player of index.players) {
    let matches = 0
    for (const ptok of player.tokens) {
      if (usable.some(t => t === ptok)) matches++
    }
    if (matches >= 2) {
      if (!best || matches > best.matches ||
          (matches === best.matches && player.games > best.player.games)) {
        best = { player, matches }
      }
    }
  }
  if (best) return best.player

  // Unique-surname match: one query token equals exactly one player's last name
  for (const tok of usable) {
    const surnameHits = index.players.filter(p => p.tokens[p.tokens.length - 1] === tok)
    if (surnameHits.length === 1) return surnameHits[0]
    if (surnameHits.length > 1) {
      // Ambiguous surname ("smith") — take the clear volume leader if one exists
      const sorted = [...surnameHits].sort((a, b) => b.games - a.games)
      if (sorted[0].games >= sorted[1].games * 3 && sorted[0].games >= 10) return sorted[0]
    }
  }
  return null
}

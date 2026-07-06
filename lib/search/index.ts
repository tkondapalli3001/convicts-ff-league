// Barrel — import from '@/lib/search', not the individual files.
import { buildEntityIndex } from './entities'
import { parseQuery } from './parse'
import { resolveAnswer } from './resolvers'
import type { Answer, EntityIndex, ParsedQuery, QueryContext } from './types'

export { buildEntityIndex } from './entities'
export { matchOwners, matchPlayer } from './entities'
export { parseQuery } from './parse'
export { resolveAnswer } from './resolvers'
export { normalize, tokens, extractYear, levenshtein } from './tokenize'
export type { Answer, EntityIndex, Intent, ParsedQuery, QueryContext, OwnerEntity, PlayerEntity } from './types'

/** One-shot convenience: parse a question and resolve it against the data. */
export function answerQuery(
  raw: string,
  index: EntityIndex,
  ctx: QueryContext,
): { parsed: ParsedQuery; answer: Answer | null } {
  const parsed = parseQuery(raw, index, ctx.state.years)
  const answer = resolveAnswer(parsed, ctx)
  return { parsed, answer }
}

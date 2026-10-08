import type { EnrichedTransaction, Transaction } from '@/types'

/** A Sleeper transaction with owner and player names attached. */
export function enrichTransaction(
  tx: Transaction,
  year: number,
  rMap: Record<string, string>,
  playerName: (id: string) => string,
): EnrichedTransaction {
  const owner = (rid: number) => rMap[String(rid)] ?? `Team${rid}`
  const players = (moves: Record<string, number> | null | undefined) =>
    Object.entries(moves ?? {}).map(([pid, rid]) => ({ playerId: pid, name: playerName(pid), owner: owner(rid) }))
  return {
    ...tx,
    year,
    ownerNames: tx.roster_ids.map(owner),
    addedPlayers: players(tx.adds),
    droppedPlayers: players(tx.drops),
  }
}

import { describe, it, expect } from 'vitest'
import { yourMatchup, type EnrichedPreview } from '@/hooks/usePreviewData'

const preview = {
  week: 9, status: 'live', teamA: { name: 'Sonu' }, teamB: { name: 'Teja' }, ptsA: 88.5, ptsB: 91.2, projA: 120, projB: 110,
  stakesA: { odds: 0.4 }, stakesB: { odds: 0.7 },
} as unknown as EnrichedPreview

describe('yourMatchup', () => {
  it('reads the game from your side, whichever side the league listed you on', () => {
    expect(yourMatchup([preview], 'Teja')).toMatchObject({ you: 'Teja', opp: 'Sonu', ptsYou: 91.2, ptsOpp: 88.5, projYou: 110, projOpp: 120, stakes: { odds: 0.7 } })
    expect(yourMatchup([preview], 'Sonu')).toMatchObject({ you: 'Sonu', opp: 'Teja', ptsYou: 88.5, ptsOpp: 91.2, stakes: { odds: 0.4 } })
  })

  it('finds your game among the week', () => {
    const other = { ...preview, teamA: { name: 'Eric' }, teamB: { name: 'Manu' } } as EnrichedPreview
    expect(yourMatchup([other, preview], 'Teja')?.opp).toBe('Sonu')
  })

  it("is null when you aren't playing", () => {
    expect(yourMatchup([preview], 'Eric')).toBeNull()
  })
})

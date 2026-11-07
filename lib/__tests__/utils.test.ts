import { describe, it, expect } from 'vitest'
import { withSearchParams } from '@/lib/utils'

describe('withSearchParams', () => {
  it('sets, replaces, and keeps other params', () => {
    expect(withSearchParams('', { tab: 'matchups' })).toBe('?tab=matchups')
    expect(withSearchParams('?tab=rosters&week=9', { tab: 'matchups' })).toBe('?tab=matchups&week=9')
  })

  it('removes a param on null or empty, leaving a clean URL', () => {
    expect(withSearchParams('?tab=matchups', { tab: null })).toBe('')
    expect(withSearchParams('?tab=matchups&week=9', { week: '' })).toBe('?tab=matchups')
  })

  it('encodes values', () => {
    expect(withSearchParams('', { owner: 'A B' })).toBe('?owner=A+B')
  })
})

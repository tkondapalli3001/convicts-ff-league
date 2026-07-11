import { describe, it, expect } from 'vitest'
import { normalize, extractYear, levenshtein } from '../tokenize'
import { buildEntityIndex, matchOwners, matchPlayer } from '../entities'
import { parseQuery } from '../parse'
import { tokens } from '../tokenize'

const YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025]

const OWNERS = ['Teja', 'Nathan', 'Kerry', 'Eric', 'Daniyaal', 'Manu', 'Dustin', 'Armaan', 'Sonu', 'Raghav']

const PLAYERS = [
  { player_id: '4034', name: 'Justin Jefferson', games: 60 },
  { player_id: '6794', name: 'Justin Herbert', games: 40 },
  { player_id: '4046', name: 'Patrick Mahomes', games: 80 },
  { player_id: '9999', name: 'Eric Ebron', games: 12 },
]

const index = buildEntityIndex(OWNERS, PLAYERS)

describe('tokenize', () => {
  it('normalizes punctuation and case', () => {
    expect(normalize("Who's Eric's rival?!")).toBe('whos erics rival')
  })

  it('extracts explicit years within range', () => {
    expect(extractYear('who won in 2022', YEARS)).toBe(2022)
    expect(extractYear('champion 2018', YEARS)).toBeNull()
  })

  it('resolves relative year phrases to the latest season', () => {
    expect(extractYear('who won last year', YEARS)).toBe(2025)
    expect(extractYear('this season champion', YEARS)).toBe(2025)
  })

  it('computes edit distance', () => {
    expect(levenshtein('kerry', 'kerri')).toBe(1)
    expect(levenshtein('teja', 'teja')).toBe(0)
  })
})

describe('entities', () => {
  it('matches owners by first name', () => {
    expect(matchOwners(tokens('teja vs nathan'), index)).toEqual(['Teja', 'Nathan'])
  })

  it('matches owners by full-name parts', () => {
    // OWNER_FULL_NAMES maps Kerry → 'Kerry Yan'
    expect(matchOwners(tokens('how good is yan'), index)).toEqual(['Kerry'])
  })

  it('tolerates one typo on names of length ≥ 4', () => {
    expect(matchOwners(tokens('kerri earnings'), index)).toEqual(['Kerry'])
  })

  it('caps at two owners', () => {
    expect(matchOwners(tokens('teja nathan kerry'), index)).toHaveLength(2)
  })

  it('bare first names prefer owners over NFL players', () => {
    // "eric" alone must match the owner Eric, not Eric Ebron
    const owners = matchOwners(tokens('eric'), index)
    expect(owners).toEqual(['Eric'])
    expect(matchPlayer(tokens('eric'), index, owners)).toBeNull()
  })

  it('matches a player on two name tokens', () => {
    const p = matchPlayer(tokens('justin jefferson stats'), index, [])
    expect(p?.name).toBe('Justin Jefferson')
  })

  it('matches a player on a unique surname', () => {
    const p = matchPlayer(tokens('how did mahomes do'), index, [])
    expect(p?.name).toBe('Patrick Mahomes')
  })

  it('disambiguates shared first names by full name', () => {
    expect(matchPlayer(tokens('justin herbert'), index, [])?.name).toBe('Justin Herbert')
  })
})

describe('parseQuery intents', () => {
  const parse = (q: string) => parseQuery(q, index, YEARS)

  it('h2h with two owners', () => {
    const p = parse('Teja vs Nathan all time')
    expect(p.intent).toBe('h2h')
    expect(p.owners).toEqual(['Teja', 'Nathan'])
  })

  it('champion with year', () => {
    const p = parse('Who won in 2022?')
    expect(p.intent).toBe('champion')
    expect(p.year).toBe(2022)
  })

  it('most championships ranking', () => {
    expect(parse('who has the most championships').intent).toBe('most-champs')
  })

  it('toilet bowl', () => {
    const p = parse('who lost the toilet bowl in 2021')
    expect(p.intent).toBe('shame')
    expect(p.year).toBe(2021)
  })

  it('high score, optionally scoped', () => {
    expect(parse('most points ever').intent).toBe('high-score')
    const scoped = parse('highest score by Kerry in 2022')
    expect(scoped.intent).toBe('high-score')
    expect(scoped.owners).toEqual(['Kerry'])
    expect(scoped.year).toBe(2022)
  })

  it('win vs losing streaks', () => {
    expect(parse('longest win streak').intent).toBe('win-streak')
    expect(parse('longest losing streak').intent).toBe('loss-streak')
  })

  it('luck', () => {
    expect(parse("who's the luckiest?").intent).toBe('luck')
    expect(parse('is Teja unlucky').owners).toEqual(['Teja'])
  })

  it('earnings', () => {
    const p = parse('Kerry earnings')
    expect(p.intent).toBe('earnings')
    expect(p.owners).toEqual(['Kerry'])
  })

  it('playoffs', () => {
    const p = parse("Daniyaal's playoff record")
    expect(p.intent).toBe('playoffs')
    expect(p.owners).toEqual(['Daniyaal'])
  })

  it('blowouts, scoped and unscoped', () => {
    expect(parse('biggest blowout ever').intent).toBe('blowout')
    expect(parse('largest margin of victory').intent).toBe('blowout')
    const scoped = parse('biggest blowout between Teja and Nathan')
    expect(scoped.intent).toBe('blowout')
    expect(scoped.owners).toEqual(['Teja', 'Nathan'])
  })

  it('"biggest win streak" stays a streak, not a blowout', () => {
    expect(parse('biggest win streak').intent).toBe('win-streak')
  })

  it('closest games', () => {
    expect(parse('closest game ever').intent).toBe('closest-game')
    expect(parse('closest game in 2023').year).toBe(2023)
    const p = parse('nail biter between kerry and eric')
    expect(p.intent).toBe('closest-game')
    expect(p.owners).toEqual(['Kerry', 'Eric'])
  })

  it('who drafted a player, optionally by year', () => {
    const p = parse('who drafted justin jefferson in 2023')
    expect(p.intent).toBe('drafted')
    expect(p.player?.name).toBe('Justin Jefferson')
    expect(p.year).toBe(2023)
  })

  it('draft mention without a player degrades to career / nothing', () => {
    expect(parse('teja draft').intent).toBe('career')
    expect(parse('the 2023 draft').intent).toBeNull()
  })

  it('bare owner name falls through to career card', () => {
    expect(parse('teja').intent).toBe('career')
  })

  it('bare player name falls through to player card', () => {
    const p = parse('justin jefferson')
    expect(p.intent).toBe('player-stats')
    expect(p.player?.name).toBe('Justin Jefferson')
  })

  it('h2h degrades to career with a single owner', () => {
    expect(parse('record against teja').intent).toBe('career')
  })

  it('gibberish parses to no intent (falls back to name search)', () => {
    expect(parse('asdf qwerty').intent).toBeNull()
  })
})

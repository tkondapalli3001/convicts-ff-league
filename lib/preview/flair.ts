// Emoji flair for the 2026 tab. Every badge is a true, checkable stat — the
// legend under the matchups spells out each rule.

import type { DaddyStatus, InjuryReport, SeasonHonors } from './facts'

export interface Badge {
  emoji: string
  /** Legend name, e.g. 'Daddy'. */
  label: string
  /** Legend rule — the same text for every team that earns it. */
  rule: string
  /** Why this team has it, e.g. 'Kerry is 4–1 all-time vs Sonu (80%)'. */
  detail: string
}

/** Win or loss streak length that earns 🔥 / 🧊. */
export const STREAK_BADGE_LEN = 3

type Streak = { type: 'W' | 'L'; len: number } | null

/** Badges that don't depend on the opponent: streaks and last season's honors. */
export function standingBadges(name: string, streak: Streak, honors: SeasonHonors): Badge[] {
  const out: Badge[] = []
  if (streak && streak.len >= STREAK_BADGE_LEN) {
    out.push(streak.type === 'W'
      ? { emoji: '🔥', label: 'Heater', rule: `${STREAK_BADGE_LEN}+ straight wins`, detail: `${streak.len} straight wins` }
      : { emoji: '🧊', label: 'Ice cold', rule: `${STREAK_BADGE_LEN}+ straight losses`, detail: `${streak.len} straight losses` })
  }
  if (honors.champs.includes(name)) {
    out.push({ emoji: '🏆', label: 'Defending champ', rule: `Won the ${honors.year} title`, detail: `${honors.year} champion` })
  }
  if (honors.toilet === name) {
    out.push({ emoji: '🚽', label: 'Toilet bowl', rule: `Lost the ${honors.year} toilet bowl`, detail: `Lost the ${honors.year} toilet bowl` })
  }
  return out
}

/** Every badge for one side of a matchup, most important first. */
export function matchupBadges(opts: {
  name: string
  opponent: string
  streak: Streak
  daddy: DaddyStatus | null
  /** Power rank entering the week. */
  powerRank: number | null
  honors: SeasonHonors
  injuries: InjuryReport | null
}): Badge[] {
  const { name, daddy, injuries } = opts
  const out: Badge[] = []
  if (daddy?.daddy === name) {
    out.push({
      emoji: '💦',
      label: 'Daddy',
      rule: 'Wins 75%+ of all-time meetings (5+ games) vs this opponent',
      detail: `${name} is ${daddy.wins}–${daddy.losses} all-time vs ${opts.opponent} (${Math.round(daddy.rate * 100)}%)`,
    })
  }
  out.push(...standingBadges(name, opts.streak, opts.honors).filter(b => b.emoji === '🔥' || b.emoji === '🧊'))
  if (opts.powerRank === 1) {
    out.push({ emoji: '👑', label: 'No. 1', rule: 'Top of the power rankings', detail: 'No. 1 in the power rankings' })
  }
  out.push(...standingBadges(name, null, opts.honors))
  if (injuries?.sidelined.length) {
    out.push({
      emoji: '🚑',
      label: 'Banged up',
      rule: 'Starting a player listed out or doubtful',
      detail: `Starting ${injuries.sidelined.map(s => `${s.name} (${s.status})`).join(', ')}`,
    })
  }
  return out
}

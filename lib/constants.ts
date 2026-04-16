import type { EarningsEntry, Champion, ShameLoser } from '@/types'

// ─── League Config ─────────────────────────────────────────────────────────────
// 2025 league — chain walks backward via previous_league_id to find all prior seasons
export const LEAGUE_ID = '1253186296067657729'
export const SLEEPER_API = 'https://api.sleeper.app/v1'

// ─── Buy-ins per Season ────────────────────────────────────────────────────────
export const BUY_INS: Record<number, number> = {
  2019: 20,
  2020: 30,
  2021: 40,
  2022: 50,
  2023: 75,
  2024: 100,
  2025: 125,
}

// ─── Earnings — fully verified from Sleeper bracket data ─────────────────────
// 2024 payouts: 1st $700, 2nd $200, 3rd $100 (10 active players, $1000 pot)
//   1st: Sonu (+600)  2nd: Armaan (+100)  3rd: Nathan (0)   Others: -100
//   Toilet bowl loser: Dustin
// 2025 payouts: 1st $800, 2nd $325, 3rd $125 (10 active players, $1250 pot)
//   1st: Kerry (+675)  2nd: Nathan (+200)  3rd: Armaan (0)  Others: -125
//   Toilet bowl loser: Sonu
export const EARNINGS_DATA: EarningsEntry[] = [
  { owner: 'Kerry',    total: 450,  y2019: null, y2020: null, y2021: null, y2022: -50,  y2023: -75,  y2024: -100, y2025: 675  },
  { owner: 'Armaan',   total: 350,  y2019: -20,  y2020: -30,  y2021: 0,    y2022: 200,  y2023: 100,  y2024: 100,  y2025: 0    },
  { owner: 'Daniyaal', total: 330,  y2019: -20,  y2020: 240,  y2021: -40,  y2022: -50,  y2023: 425,  y2024: -100, y2025: -125 },
  { owner: 'Sonu',     total: 260,  y2019: -20,  y2020: -30,  y2021: -40,  y2022: -50,  y2023: -75,  y2024: 600,  y2025: -125 },
  { owner: 'Nathan',   total: 5,    y2019: 0,    y2020: -30,  y2021: -40,  y2022: -50,  y2023: -75,  y2024: 0,    y2025: 200  },
  { owner: 'Sangram',  total: -20,  y2019: -20,  y2020: null, y2021: null, y2022: null, y2023: null, y2024: null, y2025: null },
  { owner: 'Manu',     total: -80,  y2019: -20,  y2020: -30,  y2021: 320,  y2022: -50,  y2023: -75,  y2024: -100, y2025: -125 },
  { owner: 'Hamza',    total: -90,  y2019: -20,  y2020: -30,  y2021: -40,  y2022: null, y2023: null, y2024: null, y2025: null },
  { owner: 'Dustin',   total: -190, y2019: -20,  y2020: -30,  y2021: -40,  y2022: 200,  y2023: -75,  y2024: -100, y2025: -125 },
  { owner: 'Raghav',   total: -260, y2019: 160,  y2020: -30,  y2021: -40,  y2022: -50,  y2023: -75,  y2024: -100, y2025: -125 },
  { owner: 'Eric',     total: -345, y2019: null, y2020: -30,  y2021: -40,  y2022: -50,  y2023: 0,    y2024: -100, y2025: -125 },
  { owner: 'Teja',     total: -410, y2019: -20,  y2020: 0,    y2021: -40,  y2022: -50,  y2023: -75,  y2024: -100, y2025: -125 },
]

// ─── Champions — fully verified from Sleeper bracket data ─────────────────────
export const MANUAL_CHAMPS: Champion[] = [
  { year: 2025, winner: 'Kerry',           seed: null,  note: 'yanabana, roster 8'   },
  { year: 2024, winner: 'Sonu',            seed: null,  note: 'Sonu319, roster 2'    },
  { year: 2023, winner: 'Daniyaal',        seed: 1                                    },
  { year: 2022, winner: 'Armaan & Dustin', seed: '4/2', shared: true, half: true      },
  { year: 2021, winner: 'Manu',            seed: 4                                    },
  { year: 2020, winner: 'Daniyaal',        seed: 4                                    },
  { year: 2019, winner: 'Raghav',          seed: 5                                    },
]

// ─── Shame (Toilet Bowl Losers) ────────────────────────────────────────────────
export const MANUAL_SHAME: ShameLoser[] = [
  { year: 2025, loser: 'Sonu',    seed: null, note: 'Sonu319, roster 2 lost toilet bowl'          },
  { year: 2024, loser: 'Dustin',  seed: null, note: 'Dustin13Cai, roster 1 lost toilet bowl'      },
  { year: 2023, loser: 'Kerry',   seed: 7                                                           },
  { year: 2022, loser: 'Nathan',  seed: 10                                                          },
  { year: 2021, loser: 'Teja',    seed: 9                                                           },
  { year: 2020, loser: 'Nathan',  seed: 9                                                           },
  { year: 2019, loser: 'Sangram', seed: 7                                                           },
]

// ─── Sleeper user_id → canonical owner first name ─────────────────────────────
// Permanent mapping — owner names never change even if Sleeper usernames do
export const USER_ID_TO_OWNER: Record<string, string> = {
  '462855610933702656': 'Raghav',   // rkappa / KappaG
  '464968477967380480': 'Dustin',   // Dustin13Cai
  '464969295542087680': 'Sonu',     // Sonu319
  '464977262542843904': 'Nathan',   // nbiyani
  '465179905080946688': 'Teja',     // tejakondapalli
  '465389492648275968': 'Armaan',   // ArMoney864
  '465613023554301952': 'Sangram',  // sangrak
  '465613782995955712': 'Hamza',    // dumz
  '465733924878807040': 'Daniyaal', // Dmalik / DMD23
  '465749760062517248': 'Manu',     // OperationHope / ManuBudidi / YE4PRESIDENT
  '595477561165807616': 'Eric',     // edoan96
  '850553294580465664': 'Kerry',    // yanabana
}

// ─── Sleeper display_name → canonical owner name (fallback lookup) ─────────────
export const DISPLAY_NAME_TO_OWNER: Record<string, string> = {
  'rkappa': 'Raghav', 'KappaG': 'Raghav',
  'Dustin13Cai': 'Dustin',
  'Sonu319': 'Sonu',
  'nbiyani': 'Nathan',
  'tejakondapalli': 'Teja',
  'ArMoney864': 'Armaan',
  'sangrak': 'Sangram',
  'dumz': 'Hamza',
  'Dmalik': 'Daniyaal', 'DMD23': 'Daniyaal',
  'OperationHope': 'Manu', 'ManuBudidi': 'Manu',
  'FREEPALEST1NE': 'Manu', 'YE4PRESIDENT': 'Manu',
  'edoan96': 'Eric',
  'yanabana': 'Kerry',
}

// ─── Avatar colors per canonical owner name ────────────────────────────────────
export const OWNER_COLORS: Record<string, string> = {
  'Teja':    '#3b82f6',
  'Daniyaal':'#8b5cf6',
  'Nathan':  '#06b6d4',
  'Dustin':  '#f59e0b',
  'Manu':    '#ec4899',
  'Raghav':  '#22c55e',
  'Sonu':    '#ef4444',
  'Armaan':  '#f97316',
  'Hamza':   '#a78bfa',
  'Sangram': '#0ea5e9',
  'Eric':    '#14b8a6',
  'Kerry':   '#d946ef',
  'default': '#64748b',
}

// ─── Manual playoff overrides ─────────────────────────────────────────────────
// For owners confirmed to be in playoffs for a specific year when Sleeper bracket
// data is inconsistent (e.g., roster_id mapping issues).
export const MANUAL_PLAYOFF_OVERRIDES: { year: number; owner: string; finish?: number }[] = [
  { year: 2024, owner: 'Teja', finish: 5 }, // Was in playoffs; bracket data may misplace him
]

// ─── Trash Talk Narratives ────────────────────────────────────────────────────
export const TRASH_TALK = [
  { emoji: '👑', owner: 'Daniyaal',        title: 'The Dynasty',               color: '#8b5cf6', body: `2x champion (2020 & 2023), +$330 all-time. In 2023 he went 13-3 with a 132.6 pts/wk average — the single most dominant season in league history. The rest of you are competing for 2nd place.` },
  { emoji: '🚽', owner: 'Nathan',          title: 'The Toilet Bowl Specialist', color: '#06b6d4', body: `2x Toilet Bowl loser (2020 & 2022), net +$5 all-time somehow. Nathan has mastered the art of being terrible. At least he's consistent? Runner-up in 2019 but has lived in the basement ever since.` },
  { emoji: '⚖️', owner: 'Armaan & Dustin', title: 'The 2022 Co-Champs (One Fell Far)', color: '#f59e0b', body: `The only shared championship in league history in 2022. Since then their paths diverged completely — Armaan made the 2023 championship game and won +$100 in 2024, while Dustin hit the 2024 toilet bowl at -$190 all-time. Same year, same trophy, very different endings.` },
  { emoji: '🎰', owner: 'Manu',            title: 'The Villain Arc',            color: '#ec4899', body: `Went 2-10 in his 2019 debut, then won the entire league in 2021. The ultimate villain arc. Also has the distinction of posting the league's lowest score ever in year 1. Currently -$80 net.` },
  { emoji: '📈', owner: 'Kerry',           title: 'The Redemption Arc',         color: '#d946ef', body: `Joined in 2022, scored the most points in league history, then crashed to last in 2023. Everyone wrote him off. Then he won the whole thing in 2025 for +$675 — the biggest single-year payout ever. Redemption arc complete.` },
  { emoji: '🎯', owner: 'Sonu',            title: 'The Full Circle',            color: '#ef4444', body: `Posted the league's highest single-game score in 2019. Multiple near-misses. Finally broke through to win the 2024 championship for +$600. Then immediately became the 2025 toilet bowl loser at -$125. That's a $725 swing in two seasons. Peak Sonu energy.` },
  { emoji: '🌅', owner: 'Raghav',          title: 'The Silent Threat',          color: '#22c55e', body: `2019 Champion — +$160 that year but -$260 net overall due to later buy-in increases. Quietly one of the most consistent midfield performers. Never repeated his 2019 glory but never embarrassed himself either.` },
  { emoji: '👋', owner: 'Hamza & Sangram', title: 'The Departed',               color: '#64748b', body: `Both exited before 2022. Hamza went 2-12 in his final 2021 season. Sangram lasted only 2019. The league's OGs who couldn't hack it long-term. Rumor has it they're still crying about their exits.` },
  { emoji: '📊', owner: 'Teja',            title: 'Mr. Median',                 color: '#3b82f6', body: `7 seasons, 0 championships, 1x toilet bowl loser (2021). The platonic ideal of mediocrity. His win% never strays far from 50%, except when he's actively losing. -$410 all-time. Teja is a living null hypothesis.` },
  { emoji: '⚡', owner: 'Eric',            title: 'The Late Bloomer',           color: '#14b8a6', body: `Missed 2019, quietly improved each year. Best finish was 3rd in 2023 with a +$0 earnings year (somehow broke even on shame). Building toward a championship run — or maybe not.` },
]

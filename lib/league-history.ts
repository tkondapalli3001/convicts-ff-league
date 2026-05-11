import type { Champion, ShameLoser } from '@/types'

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

// ─── Manual playoff overrides ─────────────────────────────────────────────────
// For owners confirmed to be in playoffs for a specific year when Sleeper bracket
// data is inconsistent (e.g., roster_id mapping issues).
export const MANUAL_PLAYOFF_OVERRIDES: { year: number; owner: string; finish?: number }[] = [
  { year: 2024, owner: 'Teja', finish: 5 }, // Was in playoffs; bracket data may misplace him
]

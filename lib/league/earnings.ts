import type { EarningsEntry } from '@/types'

// ─── Earnings — fully verified from Sleeper bracket data ─────────────────────
// 2024 payouts: 1st $700, 2nd $200, 3rd $100 (10 active players, $1000 pot)
//   1st: Sonu (+600)  2nd: Armaan (+100)  3rd: Nathan (0)   Others: -100
//   Toilet bowl loser: Dustin
// 2025 payouts: 1st $800, 2nd $325, 3rd $125 (10 active players, $1250 pot)
//   1st: Kerry (+675)  2nd: Nathan (+200)  3rd: Armaan (0)  Others: -125
//   Toilet bowl loser: Sonu
//
// Each owner's net result per season (payout minus buy-in); a season they
// didn't play is left out. Add each new season's line after the title game —
// totals and the ranking are computed, never typed.
const NET_BY_YEAR: Record<string, Record<number, number>> = {
  Kerry:    {                                    2022: -50, 2023: -75, 2024: -100, 2025: 675  },
  Armaan:   { 2019: -20, 2020: -30, 2021: 0,   2022: 200, 2023: 100, 2024: 100,  2025: 0    },
  Daniyaal: { 2019: -20, 2020: 240, 2021: -40, 2022: -50, 2023: 425, 2024: -100, 2025: -125 },
  Sonu:     { 2019: -20, 2020: -30, 2021: -40, 2022: -50, 2023: -75, 2024: 600,  2025: -125 },
  Nathan:   { 2019: 0,   2020: -30, 2021: -40, 2022: -50, 2023: -75, 2024: 0,    2025: 200  },
  Sangram:  { 2019: -20                                                                     },
  Manu:     { 2019: -20, 2020: -30, 2021: 320, 2022: -50, 2023: -75, 2024: -100, 2025: -125 },
  Hamza:    { 2019: -20, 2020: -30, 2021: -40                                               },
  Dustin:   { 2019: -20, 2020: -30, 2021: -40, 2022: 200, 2023: -75, 2024: -100, 2025: -125 },
  Raghav:   { 2019: 160, 2020: -30, 2021: -40, 2022: -50, 2023: -75, 2024: -100, 2025: -125 },
  Eric:     {            2020: -30, 2021: -40, 2022: -50, 2023: 0,   2024: -100, 2025: -125 },
  Teja:     { 2019: -20, 2020: 0,   2021: -40, 2022: -50, 2023: -75, 2024: -100, 2025: -125 },
}

/** Every owner's earnings, biggest net winner first. */
export const EARNINGS_DATA: EarningsEntry[] = Object.entries(NET_BY_YEAR)
  .map(([owner, byYear]) => ({ owner, byYear, total: Object.values(byYear).reduce((a, b) => a + b, 0) }))
  .sort((a, b) => b.total - a.total)

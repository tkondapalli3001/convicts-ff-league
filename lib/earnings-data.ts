import type { EarningsEntry } from '@/types'

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

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

// ─── Full names (first → first + last) for avatar initials ────────────────────
export const OWNER_FULL_NAMES: Record<string, string> = {
  'Armaan':   'Armaan Ahmed',
  'Dustin':   'Dustin Cai',
  'Nathan':   'Nathan Biyani',
  'Raghav':   'Raghav Kappagantula',
  'Teja':     'Teja Kondapalli',
  'Daniyaal': 'Daniyaal Malik',
  'Manu':     'Manu Budidi',
  'Eric':     'Eric Doan',
  'Kerry':    'Kerry Yan',
  'Sonu':     'Anurag Khandavalli',
}

// ─── Position badge colors (QB/RB/WR/TE…) ──────────────────────────────────────
export const POS_COLORS: Record<string, string> = {
  QB: '#f59e0b',
  RB: '#2ea043',
  WR: '#58a6ff',
  TE: '#a371f7',
  K: '#6e7681',
  DEF: '#6e7681',
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

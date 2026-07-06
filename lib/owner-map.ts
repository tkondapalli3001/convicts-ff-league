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

// ─── Position colors (QB/RB/WR/TE…) — three flavors, one source of truth ──────
/** Raw hex values, for inline styles (search cards). */
export const POS_COLORS: Record<string, string> = {
  QB: '#f59e0b',
  RB: '#2ea043',
  WR: '#58a6ff',
  TE: '#a371f7',
  K: '#6e7681',
  DEF: '#6e7681',
}

/** Tailwind text-color classes, for position labels in tables. */
export const POS_TEXT_CLASSES: Record<string, string> = {
  QB:  'text-[#f59e0b]',
  RB:  'text-[#22c55e]',
  WR:  'text-[#60a5fa]',
  TE:  'text-[#a78bfa]',
  K:   'text-[#94a3b8]',
  DEF: 'text-[#94a3b8]',
}

/** Tailwind badge classes (bg + text + border), for position pills. */
export const POS_BADGE_CLASSES: Record<string, string> = {
  QB:  'bg-amber-500/20 text-amber-400 border-amber-500/30',
  RB:  'bg-green-500/20 text-green-400 border-green-500/30',
  WR:  'bg-blue-500/20 text-blue-400 border-blue-500/30',
  TE:  'bg-purple-500/20 text-purple-400 border-purple-500/30',
  K:   'bg-slate-500/20 text-slate-400 border-slate-500/30',
  DEF: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
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

// NFL position palettes — functional colors (they mean QB/RB/WR/…), never theme-swapped.

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

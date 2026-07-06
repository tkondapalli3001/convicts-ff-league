/** Lowercase, strip punctuation (keep letters/digits/spaces), collapse whitespace. */
export function normalize(q: string): string {
  return q
    .toLowerCase()
    .replace(/[’']/g, '')       // "eric's" → "erics"
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function tokens(q: string): string[] {
  const n = normalize(q)
  return n ? n.split(' ') : []
}

/**
 * Pull a season year out of the query. Understands explicit years within the
 * league's range plus "last year" / "this year" relative phrases.
 */
export function extractYear(q: string, years: number[]): number | null {
  const n = normalize(q)
  const m = n.match(/\b(20[12][0-9])\b/)
  if (m) {
    const y = Number(m[1])
    return years.includes(y) ? y : null
  }
  if (!years.length) return null
  const latest = years[years.length - 1]
  if (/\b(last|this|latest|current|final) (year|season)\b/.test(n)) return latest
  return null
}

/** Damerau-free Levenshtein distance, early-exit friendly for short names. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  const m = a.length, n = b.length
  if (!m) return n
  if (!n) return m
  let prev = Array.from({ length: n + 1 }, (_, i) => i)
  for (let i = 1; i <= m; i++) {
    const cur = [i]
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
    }
    prev = cur
  }
  return prev[n]
}

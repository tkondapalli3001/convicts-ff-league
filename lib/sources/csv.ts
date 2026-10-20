// CSV in: nflverse's box scores, the DynastyProcess ID crosswalk, and the
// data/ tables all arrive as RFC 4180 CSV.

/** CSV text into rows of strings: quoted fields, doubled quotes, CRLF line ends. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = [], cell = '', quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch !== '"') cell += ch
      else if (text[i + 1] === '"') { cell += '"'; i++ }
      else quoted = false
    } else if (ch === '"') quoted = true
    else if (ch === ',') { row.push(cell); cell = '' }
    else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = '' }
    else if (ch !== '\r') cell += ch
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows
}

/** CSV text as records keyed by the header row. */
export function csvRecords(text: string): Record<string, string>[] {
  const [header, ...rows] = parseCsv(text)
  return rows.map(r => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])))
}

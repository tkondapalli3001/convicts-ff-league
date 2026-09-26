'use client'

interface Props<K extends string> {
  k: K
  label: string
  sortKey: K
  sortDir: 1 | -1
  onSort: (k: K) => void
  className?: string
  style?: React.CSSProperties
}

/**
 * Sortable table header cell: gold-soft with a direction arrow while active.
 * Module-level on purpose — defined inside a table's render it would remount
 * on every render.
 */
export default function SortHeader<K extends string>({ k, label, sortKey, sortDir, onSort, className, style }: Props<K>) {
  const active = sortKey === k
  return (
    <th
      onClick={() => onSort(k)}
      aria-sort={active ? (sortDir === 1 ? 'ascending' : 'descending') : undefined}
      className={className}
      style={{ ...style, color: active ? '#C9A24B' : style?.color }}
    >
      {label} {active ? (sortDir === 1 ? '↑' : '↓') : ''}
    </th>
  )
}

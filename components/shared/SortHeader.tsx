'use client'

import InfoTip from '@/components/shared/InfoTip'

interface Props<K extends string> {
  k: K
  label: string
  sortKey: K
  sortDir: 1 | -1
  onSort: (k: K) => void
  className?: string
  style?: React.CSSProperties
  /** A definition behind a ? beside the label (tapping it doesn't sort). */
  tip?: { term: string; text: React.ReactNode }
}

/**
 * Sortable table header cell: gold-soft with a direction arrow while active.
 * Module-level on purpose — defined inside a table's render it would remount
 * on every render.
 */
export default function SortHeader<K extends string>({ k, label, sortKey, sortDir, onSort, className, style, tip }: Props<K>) {
  const active = sortKey === k
  return (
    <th
      onClick={() => onSort(k)}
      aria-sort={active ? (sortDir === 1 ? 'ascending' : 'descending') : undefined}
      className={className}
      style={{ ...style, color: active ? '#C9A24B' : style?.color }}
    >
      {label}
      {tip && <InfoTip term={tip.term}>{tip.text}</InfoTip>}
      {active ? ` ${sortDir === 1 ? '↑' : '↓'}` : ''}
    </th>
  )
}

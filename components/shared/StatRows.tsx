'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import InfoTip from '@/components/shared/InfoTip'
import { useMe } from '@/hooks/useMe'

export interface StatField<T, K extends string = string> {
  label: string
  value: (row: T) => React.ReactNode
  /** A definition behind a ? beside the label. */
  tip?: { term: string; text: React.ReactNode }
  /** Tapping the column's label sorts by this. */
  sortKey?: K
  /** Other sorts this column already shows (a record shows wins and losses). */
  covers?: K[]
  /** A note on this row's number, behind a ? in the row's details (a button can't sit inside the row's button). */
  rowTip?: (row: T) => React.ReactNode
}

export interface StatRowsSort<K extends string> {
  key: K
  /** 1 = ascending (↑), -1 = descending (↓), like SortHeader. */
  dir: 1 | -1
  onSort: (key: K) => void
  /** Everything the table can sort by, so phones keep every sort the desktop headers have. */
  options: { key: K; label: string }[]
}

const COLUMN_WIDTH = 52
const LABEL = 'text-[9px] font-bold uppercase tracking-[1px] text-s-text3'

/**
 * A wide table on a phone: name and a few numbers per row, tap for the rest.
 * The first `columns` fields are the numbers; the others wait in the row's
 * details. Sorting by a field that's off screen brings it in as the last column,
 * so the order always has its reason in view. Sits next to the desktop table
 * (`hidden sm:block`) and hides itself from the sm breakpoint up.
 */
export default function StatRows<T, K extends string = string>({ rows, rowKey, owner, lead, fields, columns = 3, leadLabel = 'Manager', sort, className = '' }: {
  rows: T[]
  rowKey: (row: T) => string
  /** The row's owner, for the profile link and your own row's tint; null for a row that isn't anyone's. */
  owner: (row: T) => string | null
  lead: (row: T, index: number) => React.ReactNode
  fields: StatField<T, K>[]
  columns?: number
  leadLabel?: string
  sort?: StatRowsSort<K>
  className?: string
}) {
  const { me } = useMe()
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set())

  function toggle(key: string) {
    setOpen(prev => {
      const next = new Set(prev)
      if (!next.delete(key)) next.add(key)
      return next
    })
  }

  const primary = fields.slice(0, columns)
  const shows = (f: StatField<T, K>) => !!sort && (f.sortKey === sort.key || !!f.covers?.includes(sort.key))
  const sortedField = sort && !primary.some(shows) ? fields.find(f => f.sortKey === sort.key) : undefined
  const visible = sortedField ? [...primary.slice(0, -1), sortedField] : primary
  const details = fields.filter(f => !visible.includes(f) || f.rowTip)
  // Name, the numbers, then the chevron
  const grid = { gridTemplateColumns: `minmax(0, 1fr) repeat(${visible.length}, ${COLUMN_WIDTH}px) 12px` }

  return (
    <div className={`sm:hidden ${className}`}>
      {sort && (
        <div className="flex items-center justify-end gap-2 px-3 pb-2 pt-3">
          <label className="flex items-center gap-2">
            <span className={LABEL}>Sort</span>
            <select
              value={sort.key}
              onChange={e => sort.onSort(e.target.value as K)}
              className="min-h-[32px] rounded-[2px] border bg-transparent px-2 font-display text-[16px] font-semibold uppercase text-gold-soft"
              style={{ borderColor: 'rgba(var(--gold-rgb), 0.24)', colorScheme: 'dark' }}
            >
              {sort.options.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          </label>
          <button
            type="button"
            onClick={() => sort.onSort(sort.key)}
            aria-label={sort.dir === 1 ? 'Sorted low to high; switch to high to low' : 'Sorted high to low; switch to low to high'}
            className="flex h-8 w-8 items-center justify-center rounded-[2px] border text-[14px] font-bold text-gold-soft"
            style={{ borderColor: 'rgba(var(--gold-rgb), 0.24)' }}
          >
            {sort.dir === 1 ? '↑' : '↓'}
          </button>
        </div>
      )}

      {/* Column labels */}
      <div className="grid items-center gap-x-1 border-b px-3 pb-1 pt-1" style={{ ...grid, borderColor: 'rgba(var(--gold-rgb), 0.14)' }}>
        <span className={LABEL}>{leadLabel}</span>
        {visible.map(f => {
          const active = shows(f)
          return (
            <span key={f.label} className="text-right leading-tight">
              {sort && f.sortKey ? (
                <button
                  type="button"
                  onClick={() => sort.onSort(f.sortKey as K)}
                  className={`min-h-[28px] text-right ${LABEL}`}
                  style={active ? { color: '#C9A24B' } : undefined}
                >
                  {f.label}
                </button>
              ) : (
                <span className={LABEL}>{f.label}</span>
              )}
              {f.tip && <InfoTip term={f.tip.term}>{f.tip.text}</InfoTip>}
            </span>
          )
        })}
        <span />
      </div>

      {rows.map((row, i) => {
        const key = rowKey(row)
        const isOpen = open.has(key)
        const name = owner(row)
        return (
          <div
            key={key}
            className="border-b last:border-b-0"
            style={{ borderColor: 'rgba(var(--gold-rgb), 0.08)', background: name && name === me ? 'rgba(var(--gold2-rgb), 0.06)' : undefined }}
          >
            <button
              type="button"
              onClick={() => toggle(key)}
              aria-expanded={isOpen}
              className="grid min-h-[48px] w-full items-center gap-x-1 px-3 py-2 text-left"
              style={grid}
            >
              <span className="min-w-0">{lead(row, i)}</span>
              {visible.map(f => (
                <span key={f.label} className="text-right font-display text-[17px] font-semibold leading-tight text-s-text2 num">
                  {f.value(row)}
                </span>
              ))}
              <ChevronDown size={12} aria-hidden className={`justify-self-end text-s-text3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
              <div className="px-3 pb-3 pt-0.5">
                <div className="grid grid-cols-3 gap-x-3 gap-y-2.5">
                  {details.map(f => (
                    <div key={f.label} className="min-w-0">
                      <div className={`leading-tight ${LABEL}`}>
                        {f.label}
                        {f.tip && <InfoTip term={f.tip.term}>{f.tip.text}</InfoTip>}
                      </div>
                      <div className="mt-0.5 font-display text-[16px] font-semibold leading-tight text-s-text2 num">
                        {f.value(row)}
                        {f.rowTip?.(row)}
                      </div>
                    </div>
                  ))}
                </div>
                {name && (
                  <Link
                    href={`/owners/${encodeURIComponent(name)}`}
                    className="mt-2 inline-flex min-h-[32px] items-center text-[10px] font-bold uppercase tracking-[1.5px] text-gold-soft"
                  >
                    {name}’s profile →
                  </Link>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

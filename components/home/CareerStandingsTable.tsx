'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useLeague } from '@/context/LeagueContext'
import StatRows, { type StatField } from '@/components/shared/StatRows'
import { ownerColor, fullNameInitials, winPctColor, fmtMoney, fmtRecord } from '@/lib/utils'
import type { CareerStats } from '@/lib/stats'

type SortKey = 'wins' | 'winpct' | 'avgPPG' | 'champs' | 'earn'

/** Champion avatars get a gold ring + glow; everyone else a hairline inset. */
function ringShadow(isChamp: boolean): string {
  return isChamp
    ? '0 0 0 1.5px #C9962E, 0 0 10px rgba(201,150,46,0.35)'
    : 'inset 0 0 0 1px rgba(255,255,255,0.14)'
}

/** The career table's avatar: a fixed pixel size and a champion ring, which OwnerAvatar doesn't do. */
function CareerAvatar({ name, isChamp, url, size }: { name: string; isChamp: boolean; url: string | undefined; size: number }) {
  const [imgError, setImgError] = useState(false)
  const shadow = ringShadow(isChamp)
  if (url && !imgError) {
    return (
      <div className="flex-shrink-0 overflow-hidden rounded-full" style={{ width: size, height: size, boxShadow: shadow }}>
        <img src={url} alt={name} className="h-full w-full object-cover" onError={() => setImgError(true)} />
      </div>
    )
  }
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-full font-extrabold leading-none text-white"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.32), background: ownerColor(name), boxShadow: shadow }}
    >
      {fullNameInitials(name)}
    </div>
  )
}

function fmtChamps(n: number): string {
  return n % 1 === 0 ? String(n) : n.toFixed(1)
}

const PHONE_FIELDS: StatField<CareerStats, SortKey>[] = [
  { label: 'W–L', sortKey: 'wins', value: d => <span className="font-bold text-s-text">{fmtRecord(d.allW, d.allL)}</span> },
  { label: 'Win%', sortKey: 'winpct', value: d => <span className="font-bold" style={{ color: winPctColor(d.winpct) }}>{(d.winpct * 100).toFixed(1)}%</span> },
  { label: 'Titles', sortKey: 'champs', value: d => (d.champs > 0 ? <span className="font-bold text-gold-soft">{fmtChamps(d.champs)}×</span> : <span className="text-[#3A4150]">—</span>) },
  { label: 'Avg PPG', sortKey: 'avgPPG', value: d => d.avgPFperGame.toFixed(1) },
  { label: 'Net', sortKey: 'earn', value: d => (d.earn != null ? <span className="font-bold" style={{ color: d.earn >= 0 ? '#C9A24B' : '#B4636B' }}>{fmtMoney(d.earn)}</span> : <span className="text-[#3A4150]">—</span>) },
  { label: 'Seasons', value: d => d.numSeasons },
]
const PHONE_SORTS: { key: SortKey; label: string }[] = [
  { key: 'winpct', label: 'Win%' },
  { key: 'wins', label: 'Wins' },
  { key: 'champs', label: 'Titles' },
  { key: 'avgPPG', label: 'Avg PPG' },
  { key: 'earn', label: 'Net' },
]

export default function CareerStandingsTable({ data }: { data: CareerStats[] }) {
  const { state } = useLeague()
  const router = useRouter()
  const [sortKey, setSortKey] = useState<SortKey>('winpct')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const displayData = useMemo(() => {
    return [...data].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'wins') return dir * (a.allW - b.allW)
      if (sortKey === 'winpct') return dir * (a.winpct - b.winpct)
      if (sortKey === 'avgPPG') return dir * (a.avgPFperGame - b.avgPFperGame)
      if (sortKey === 'champs') return dir * (a.champs - b.champs)
      if (a.earn === null && b.earn === null) return 0
      if (a.earn === null) return 1
      if (b.earn === null) return -1
      return dir * (a.earn - b.earn)
    })
  }, [data, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('desc')
    }
  }
  const arrow = (key: SortKey) => (sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '')

  /** Active-sort headers glow gold-soft with a gold underline (design). */
  function sortHeadStyle(key: SortKey): React.CSSProperties {
    return sortKey === key
      ? { color: '#C9A24B', borderBottom: '1px solid rgba(var(--gold2-rgb), 0.5)' }
      : {}
  }

  function goToOwner(name: string) {
    router.push(`/owners/${encodeURIComponent(name)}`)
  }

  return (
    <div
      className="overflow-hidden rounded-[6px] lg:col-span-2"
      style={{ background: '#0B0B0D', border: '1px solid rgba(var(--gold-rgb), 0.12)' }}
    >
      {/* Header */}
      <div
        className="flex items-baseline justify-between border-b px-5 pb-3.5 pt-5 sm:px-6"
        style={{ borderColor: 'rgba(var(--gold-rgb), 0.14)' }}
      >
        <div className="text-[11px] font-bold uppercase tracking-[3px] text-gold-soft sm:text-[13px] sm:tracking-[4px]">
          All-Time Career Standings
        </div>
        <div className="hidden text-[11px] uppercase tracking-[1.5px] text-s-text3 sm:block">
          Select a manager for profile
        </div>
      </div>

      <StatRows
        rows={displayData}
        rowKey={d => d.name}
        owner={d => d.name}
        fields={PHONE_FIELDS}
        sort={{ key: sortKey, dir: sortDir === 'asc' ? 1 : -1, onSort: toggleSort, options: PHONE_SORTS }}
        lead={(d, i) => (
          <span className="flex items-center gap-1.5">
            <span className="w-4 flex-shrink-0 text-center font-display text-[15px] font-bold" style={{ color: i < 3 ? '#C9A24B' : '#5C6270' }}>
              {i + 1}
            </span>
            <CareerAvatar name={d.name} isChamp={d.champs > 0} url={state.ownerAvatarMap?.[d.name]} size={24} />
            <span className="min-w-0 break-words text-[13px] font-bold leading-tight text-s-text">{d.name}</span>
          </span>
        )}
      />

      {/* ── TABLE (wider screens) ─────────────── */}
      <div className="relative hidden sm:block">
      <div className="overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr>
              <th className="!text-center" style={{ width: 48 }}>No.</th>
              <th>Manager</th>
              <th onClick={() => toggleSort('wins')} style={sortHeadStyle('wins')}>
                W–L{arrow('wins')}
              </th>
              <th onClick={() => toggleSort('winpct')} style={sortHeadStyle('winpct')}>
                Win%{arrow('winpct')}
              </th>
              <th onClick={() => toggleSort('avgPPG')} className="!text-right" style={sortHeadStyle('avgPPG')}>
                Avg PPG{arrow('avgPPG')}
              </th>
              <th onClick={() => toggleSort('champs')} className="!text-center" style={sortHeadStyle('champs')}>
                Titles{arrow('champs')}
              </th>
              <th onClick={() => toggleSort('earn')} className="!text-right" style={sortHeadStyle('earn')}>
                Net{arrow('earn')}
              </th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((d, i) => (
              <tr key={d.name} onClick={() => goToOwner(d.name)}>
                <td className="text-center font-display text-[17px] font-bold" style={{ color: i < 3 ? '#C9A24B' : '#3A4150' }}>
                  {String(i + 1).padStart(2, '0')}
                </td>
                <td>
                  <div className="flex items-center gap-3">
                    <CareerAvatar name={d.name} isChamp={d.champs > 0} url={state.ownerAvatarMap?.[d.name]} size={34} />
                    <div>
                      <div className="text-[13px] font-bold leading-none text-s-text">{d.name}</div>
                      <div className="mt-[3px] text-[9px] uppercase tracking-[1px] text-s-text3">
                        {d.numSeasons} season{d.numSeasons !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="font-display text-[17px] font-bold">
                  <span className="text-s-text">{d.allW}</span>
                  <span className="mx-[3px] text-[#3A4150]">–</span>
                  <span className="text-[#7A828F]">{d.allL}</span>
                </td>
                <td className="font-display text-[17px] font-bold" style={{ color: winPctColor(d.winpct) }}>
                  {(d.winpct * 100).toFixed(1)}%
                </td>
                <td className="text-right font-display text-[17px] font-semibold text-s-text2 num">
                  {d.avgPFperGame.toFixed(1)}
                </td>
                <td className="text-center font-display text-[16px] font-bold">
                  {d.champs > 0 ? (
                    <span className="text-gold-soft">{fmtChamps(d.champs)}×</span>
                  ) : (
                    <span className="text-[#3A4150]">—</span>
                  )}
                </td>
                <td className="text-right font-display text-[17px] font-bold num">
                  {d.earn != null ? (
                    <span style={{ color: d.earn >= 0 ? '#C9A24B' : '#B4636B' }}>
                      {d.earn >= 0 ? '+' : '−'}${Math.abs(d.earn)}
                    </span>
                  ) : (
                    <span className="text-[#3A4150]">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  )
}

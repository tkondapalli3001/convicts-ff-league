'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { usePlayersData } from '@/hooks/usePlayersData'
import { ownerColor, fullNameInitials } from '@/lib/utils'
import { OWNER_FULL_NAMES } from '@/lib/constants'
import { useLeague } from '@/context/LeagueContext'
import type { OwnershipEntry } from '@/lib/data-processing'
import type { PlayerStat } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ManagerCardData {
  name: string
  allW: number
  allL: number
  winpct: number
  avgPF: number
  avgPFperGame: number
  totalPF: number
  playoffApps: number
  champs: number
  shame: number
  numSeasons: number
  earn: number | null
  sparkData: number[]
  bestSeasonYear: number | null
  bestSeasonWins: number | null
  bestSeasonLosses: number | null
  bestSeasonFinish: number | null
  topRival: string | null
  singleGameHigh: number | null
  singleGameLow: number | null
}

const POS_COLORS: Record<string, string> = {
  QB: '#f59e0b',
  RB: '#2ea043',
  WR: '#58a6ff',
  TE: '#a371f7',
  K: '#6e7681',
  DEF: '#6e7681',
}

// ─── Manager Card ─────────────────────────────────────────────────────────────

function ManagerCard({ data, onClose }: { data: ManagerCardData; onClose: () => void }) {
  const router = useRouter()
  const { state } = useLeague()
  const [imgError, setImgError] = useState(false)
  const color = ownerColor(data.name)
  const winpctColor = data.winpct >= 0.55 ? '#00ceb8' : data.winpct >= 0.45 ? '#8b949e' : '#ff395c'
  const avatarUrl = state.ownerAvatarMap?.[data.name]
  const initials = fullNameInitials(data.name)
  const fullDisplayName = OWNER_FULL_NAMES[data.name] || data.name

  return (
    <div className="bento-card animate-fade-in">
      {/* Header */}
      <div
        className="relative p-6 pb-5 overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${color}18 0%, transparent 60%)` }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-s-bg3/80 flex items-center justify-center text-s-text3 hover:text-s-text text-[16px] leading-none transition-colors"
        >
          ×
        </button>

        <div className="flex items-start gap-4">
          {/* Avatar */}
          {avatarUrl && !imgError ? (
            <div
              className="w-14 h-14 rounded-full flex-shrink-0 overflow-hidden"
              style={{ boxShadow: `0 0 0 3px #1a1d23, 0 0 24px ${color}55` }}
            >
              <img src={avatarUrl} alt={data.name} className="w-full h-full object-cover"
                onError={() => setImgError(true)} />
            </div>
          ) : (
            <div
              className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center text-[18px] font-black text-white"
              style={{
                background: `linear-gradient(135deg, ${color} 0%, ${color}88 100%)`,
                boxShadow: `0 0 0 3px #1a1d23, 0 0 24px ${color}55`,
              }}
            >
              {initials}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="text-[22px] font-black text-s-text tracking-tight leading-none">
                {fullDisplayName}
              </span>
              {data.champs > 0 && <span className="text-base">🏆</span>}
              {data.shame > 0 && <span className="text-base">🚽</span>}
            </div>
            <div className="text-[11px] text-s-text3 font-medium mt-1">
              {data.numSeasons} season{data.numSeasons !== 1 ? 's' : ''} &middot;{' '}
              {data.playoffApps}/{data.numSeasons} playoffs
            </div>
          </div>

          {/* Big win% */}
          <div className="hidden sm:block text-right flex-shrink-0">
            <div className="text-[9px] tracking-[3px] uppercase text-s-text3 mb-1">Win%</div>
            <div className="text-[38px] font-black leading-none tabular-nums" style={{ color: winpctColor }}>
              {(data.winpct * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid — 4 columns */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-s-border/60">
        {(
          [
            { label: 'W – L', value: `${data.allW} – ${data.allL}` },
            { label: 'Avg PPG', value: data.avgPFperGame > 0 ? data.avgPFperGame.toFixed(1) : '—' },
            {
              label: 'Championships',
              value: data.champs > 0 ? `${data.champs % 1 === 0 ? data.champs : data.champs.toFixed(1)}× 🏆` : '—',
            },
            {
              label: 'Net Earnings',
              value: data.earn != null ? `${data.earn >= 0 ? '+' : ''}$${data.earn}` : '—',
              color: data.earn != null ? (data.earn >= 0 ? '#2ea043' : '#f85149') : undefined,
            },
          ] as { label: string; value: string; color?: string }[]
        ).map((s, i) => (
          <div
            key={s.label}
            className={[
              'p-4',
              i > 0 ? 'border-l border-s-border/60' : '',
              i >= 2 ? 'border-t border-s-border/60' : '',
            ].join(' ')}
          >
            <div className="text-[9px] tracking-[2px] uppercase text-s-text3 mb-1">{s.label}</div>
            <div className="text-[17px] font-bold" style={{ color: s.color ?? '#e6edf3' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Best season */}
      <div className="px-5 py-4 border-t border-s-border/60">
        <div className="text-[9px] tracking-[2px] uppercase text-s-text3 mb-1.5">Best Season</div>
        {data.bestSeasonYear ? (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[16px] font-bold text-s-text">{data.bestSeasonYear}</span>
            <span className="text-[12px] font-semibold text-s-green">
              {data.bestSeasonWins}W–{data.bestSeasonLosses}L
            </span>
            {data.bestSeasonFinish != null && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-s-gold/10 text-s-gold border border-s-gold/20 font-bold">
                #{data.bestSeasonFinish} Finish
              </span>
            )}
          </div>
        ) : (
          <span className="text-s-text3 text-[12px]">—</span>
        )}
      </div>

      {/* Extended stats — Top Rival / High / Low */}
      <div className="grid grid-cols-3 border-t border-s-border/60">
        {(
          [
            {
              label: 'Top Rival',
              value: data.topRival ?? '—',
              color: data.topRival ? ownerColor(data.topRival) : undefined,
            },
            {
              label: 'Single Game High',
              value: data.singleGameHigh != null ? data.singleGameHigh.toFixed(2) : '—',
              color: '#00ceb8',
            },
            {
              label: 'Single Game Low',
              value: data.singleGameLow != null ? data.singleGameLow.toFixed(2) : '—',
              color: '#ff395c',
            },
          ] as { label: string; value: string; color?: string }[]
        ).map((s, i) => (
          <div
            key={s.label}
            className={['p-4', i > 0 ? 'border-l border-s-border/60' : ''].join(' ')}
          >
            <div className="text-[9px] tracking-[2px] uppercase text-s-text3 mb-1">{s.label}</div>
            <div className="text-[14px] font-bold num" style={{ color: s.color ?? '#e6edf3' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="px-5 pb-5 pt-3">
        <button
          onClick={() => router.push(`/owners/${encodeURIComponent(data.name)}`)}
          className="text-[11px] font-bold text-s-teal hover:opacity-70 transition-opacity flex items-center gap-1"
        >
          View Full Profile →
        </button>
      </div>
    </div>
  )
}

// ─── Player Card ─────────────────────────────────────────────────────────────

function PlayerCard({
  stat,
  ownership,
  onClose,
}: {
  stat: PlayerStat
  ownership: OwnershipEntry | null
  onClose: () => void
}) {
  const posColor = POS_COLORS[stat.position] ?? '#6e7681'
  const winRateColor = stat.winRate >= 0.60 ? '#00ceb8' : stat.winRate >= 0.45 ? '#8b949e' : '#ff395c'

  const byOwner = useMemo(() => {
    if (!ownership) return null
    return ownership.picks.reduce<Record<string, number>>((acc, p) => {
      acc[p.owner] = (acc[p.owner] ?? 0) + 1
      return acc
    }, {})
  }, [ownership])

  const ownerList = byOwner
    ? Object.entries(byOwner)
        .sort((a, b) => b[1] - a[1])
        .map(([o, c]) => (c > 1 ? `${o} (${c}×)` : o))
        .join(' · ')
    : null

  return (
    <div className="bento-card animate-fade-in">
      {/* Header */}
      <div
        className="relative p-6 pb-5 overflow-hidden"
        style={{ background: `${posColor}14` }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-s-bg3/80 flex items-center justify-center text-s-text3 hover:text-s-text text-[16px] leading-none transition-colors"
        >
          ×
        </button>

        <div className="flex items-start gap-3">
          {/* Position badge */}
          <div
            className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-[13px] font-black"
            style={{
              background: `${posColor}22`,
              color: posColor,
              border: `1px solid ${posColor}50`,
            }}
          >
            {stat.position}
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-[20px] font-black text-s-text tracking-tight leading-tight">
              {stat.name}
            </div>
            {stat.team && (
              <div className="text-[11px] text-s-text3 mt-0.5">{stat.team}</div>
            )}
          </div>

          <div className="hidden sm:block text-right flex-shrink-0">
            <div className="text-[9px] tracking-[3px] uppercase text-s-text3 mb-1">Win Rate</div>
            <div className="text-[34px] font-black leading-none tabular-nums" style={{ color: winRateColor }}>
              {(stat.winRate * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-s-border/60">
        {(
          [
            { label: 'Games Started', value: stat.games },
            { label: 'Wins', value: stat.wins },
            { label: 'Top Owner', value: stat.topOwner || '—' },
            {
              label: 'Avg Draft Pick',
              value: ownership ? `#${ownership.avgPickNo.toFixed(1)}` : '—',
            },
          ] as { label: string; value: string | number }[]
        ).map((s, i) => (
          <div
            key={s.label}
            className={[
              'p-4',
              i > 0 ? 'border-l border-s-border/60' : '',
              i >= 2 ? 'border-t border-s-border/60' : '',
            ].join(' ')}
          >
            <div className="text-[9px] tracking-[2px] uppercase text-s-text3 mb-1">{s.label}</div>
            <div className="text-[17px] font-bold text-s-text">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Draft history */}
      {ownerList && (
        <div className="px-5 py-4 border-t border-s-border/60">
          <div className="text-[9px] tracking-[2px] uppercase text-s-text3 mb-1.5">
            Draft History &mdash; {ownership!.picks.length}× drafted
          </div>
          <div className="text-[12px] text-s-text2 leading-relaxed">{ownerList}</div>
        </div>
      )}

      {!ownership && (
        <div className="px-5 pb-4 text-[10px] text-s-text3">
          Draft history loads from the Players page.
        </div>
      )}
    </div>
  )
}

// ─── Main SearchBar ────────────────────────────────────────────────────────────

interface Props {
  managerData: ManagerCardData[]
}

export default function SearchBar({ managerData }: Props) {
  const [query, setQuery] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [selected, setSelected] = useState<{ type: 'manager' | 'player'; id: string } | null>(null)
  const [focusIdx, setFocusIdx] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { playerWinRates, ownership, loading: playersLoading } = usePlayersData(enabled)

  const playerList = useMemo(() => {
    const map = new Map<string, { stat: PlayerStat; ownership: OwnershipEntry | null }>()
    playerWinRates.forEach(s => map.set(s.player_id, { stat: s, ownership: null }))
    ownership.forEach(o => {
      const entry = map.get(o.player_id)
      if (entry) entry.ownership = o
    })
    return [...map.values()]
  }, [playerWinRates, ownership])

  const { managerResults, playerResults } = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return { managerResults: [], playerResults: [] }
    return {
      managerResults: managerData.filter(m => m.name.toLowerCase().includes(q)).slice(0, 4),
      playerResults: playerList
        .filter(({ stat }) => stat.name.toLowerCase().includes(q))
        .sort((a, b) => b.stat.games - a.stat.games)
        .slice(0, 6),
    }
  }, [query, managerData, playerList])

  type DropdownEntry =
    | { kind: 'manager'; data: ManagerCardData }
    | { kind: 'player'; data: { stat: PlayerStat; ownership: OwnershipEntry | null } }

  const flatResults = useMemo<DropdownEntry[]>(() => [
    ...managerResults.map(m => ({ kind: 'manager' as const, data: m })),
    ...playerResults.map(p => ({ kind: 'player' as const, data: p })),
  ], [managerResults, playerResults])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
        setFocusIdx(-1)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setEnabled(true)
        setDropdownOpen(true)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  function handleFocus() {
    setEnabled(true)
    if (query.trim()) setDropdownOpen(true)
  }

  function handleChange(val: string) {
    setQuery(val)
    setDropdownOpen(true)
    setFocusIdx(-1)
    if (!val.trim()) setSelected(null)
  }

  function selectEntry(entry: DropdownEntry) {
    if (entry.kind === 'manager') {
      setSelected({ type: 'manager', id: entry.data.name })
      setQuery(entry.data.name)
    } else {
      setSelected({ type: 'player', id: entry.data.stat.player_id })
      setQuery(entry.data.stat.name)
    }
    setDropdownOpen(false)
    setFocusIdx(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      if (dropdownOpen) { setDropdownOpen(false); setFocusIdx(-1) }
      else { setQuery(''); setSelected(null) }
      return
    }
    if (!dropdownOpen || flatResults.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusIdx(i => Math.min(i + 1, flatResults.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && focusIdx >= 0) { e.preventDefault(); selectEntry(flatResults[focusIdx]) }
  }

  function clearSearch() {
    setQuery('')
    setSelected(null)
    setDropdownOpen(false)
    setFocusIdx(-1)
    inputRef.current?.focus()
  }

  const selectedManager = selected?.type === 'manager'
    ? managerData.find(m => m.name === selected.id) ?? null
    : null

  const selectedPlayerEntry = selected?.type === 'player'
    ? playerList.find(({ stat }) => stat.player_id === selected.id) ?? null
    : null

  const showEmpty = query.trim() && flatResults.length === 0 && !playersLoading
  const showDropdown = dropdownOpen && query.trim().length > 0

  return (
    <div ref={containerRef} className="relative w-full">
      {/* ── Search Input ─────────────────────────────────────────── */}
      <div
        className={[
          'flex items-center gap-3 bento-card px-4 py-3.5 transition-all duration-200',
          showDropdown ? 'border-s-teal/60 rounded-b-none' : '',
        ].join(' ')}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="flex-shrink-0" style={{ color: '#6e7681' }}>
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.2" />
          <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>

        <input
          ref={inputRef}
          value={query}
          onChange={e => handleChange(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder="Search managers or players… (⌘K)"
          className="flex-1 bg-transparent text-[14px] text-s-text placeholder:text-s-text3 outline-none"
          autoComplete="off"
          spellCheck={false}
        />

        {enabled && playersLoading && (
          <div className="flex items-center gap-1.5 flex-shrink-0 text-[10px] text-s-text3">
            <div className="w-3 h-3 border border-s-border2 border-t-s-teal rounded-full animate-spin" />
            <span className="hidden sm:block">Loading players…</span>
          </div>
        )}

        {query && (
          <button onClick={clearSearch}
            className="flex-shrink-0 w-5 h-5 rounded-full bg-s-bg3 flex items-center justify-center text-s-text3 hover:text-s-text hover:bg-s-bg4 text-[12px] leading-none transition-colors">
            ×
          </button>
        )}

        {!query && (
          <div className="hidden md:flex items-center gap-0.5 flex-shrink-0">
            <kbd className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-s-bg3 border border-s-border text-s-text3">⌘</kbd>
            <kbd className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-s-bg3 border border-s-border text-s-text3">K</kbd>
          </div>
        )}
      </div>

      {/* ── Dropdown ─────────────────────────────────────────────── */}
      {showDropdown && (
        <div
          className="absolute top-full left-0 right-0 bg-s-surface border border-s-teal/40 border-t-0 rounded-b-[16px] z-[9999] overflow-hidden shadow-2xl shadow-black/70"
          style={{ maxHeight: '340px', overflowY: 'auto' }}
        >
          {managerResults.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-1 text-[9px] font-bold tracking-[3px] uppercase text-s-text3">Managers</div>
              {managerResults.map((m, i) => {
                const color = ownerColor(m.name)
                const isFocused = focusIdx === i
                return (
                  <button key={m.name}
                    onMouseDown={e => { e.preventDefault(); selectEntry({ kind: 'manager', data: m }) }}
                    className={['w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                      isFocused ? 'bg-s-bg3' : 'hover:bg-s-bg3/60'].join(' ')}>
                    <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-black text-white"
                      style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}88 100%)` }}>
                      {fullNameInitials(m.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold text-s-text">{OWNER_FULL_NAMES[m.name] || m.name}</div>
                      <div className="text-[10px] text-s-text3">
                        {m.numSeasons} seasons &middot; {(m.winpct * 100).toFixed(1)}% win &middot; {m.playoffApps}/{m.numSeasons} playoffs
                      </div>
                    </div>
                    {m.champs > 0 && <span className="text-[12px] flex-shrink-0" title={`${m.champs}× champion`}>🏆</span>}
                  </button>
                )
              })}
            </div>
          )}

          {playerResults.length > 0 && (
            <div className={managerResults.length > 0 ? 'border-t border-s-border/60' : ''}>
              <div className="px-4 pt-3 pb-1 text-[9px] font-bold tracking-[3px] uppercase text-s-text3">Players</div>
              {playerResults.map(({ stat, ownership: own }, i) => {
                const posColor = POS_COLORS[stat.position] ?? '#6e7681'
                const globalIdx = managerResults.length + i
                const isFocused = focusIdx === globalIdx
                return (
                  <button key={stat.player_id}
                    onMouseDown={e => { e.preventDefault(); selectEntry({ kind: 'player', data: { stat, ownership: own } }) }}
                    className={['w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                      isFocused ? 'bg-s-bg3' : 'hover:bg-s-bg3/60'].join(' ')}>
                    <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-black"
                      style={{ background: `${posColor}20`, color: posColor, border: `1px solid ${posColor}40` }}>
                      {stat.position}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-s-text truncate">{stat.name}</div>
                      <div className="text-[10px] text-s-text3">
                        {stat.team ? `${stat.team} · ` : ''}{stat.games}G · Top owner: {stat.topOwner || '—'}
                      </div>
                    </div>
                    <div className="text-[12px] font-bold flex-shrink-0"
                      style={{ color: stat.winRate >= 0.6 ? '#00ceb8' : stat.winRate >= 0.45 ? '#8b949e' : '#ff395c' }}>
                      {(stat.winRate * 100).toFixed(0)}%
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {playersLoading && flatResults.length === 0 && (
            <div className="flex items-center gap-3 px-4 py-5 text-[12px] text-s-text3">
              <div className="w-4 h-4 border border-s-border2 border-t-s-teal rounded-full animate-spin flex-shrink-0" />
              Loading player database…
            </div>
          )}

          {showEmpty && (
            <div className="px-4 py-5 text-[12px] text-s-text3 text-center">
              No managers or players matching &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      )}

      {/* ── Selected Result Card ──────────────────────────────────── */}
      {selected && !dropdownOpen && (
        <div className="mt-3">
          {selectedManager && (
            <ManagerCard data={selectedManager} onClose={() => { setSelected(null); setQuery('') }} />
          )}
          {selectedPlayerEntry && (
            <PlayerCard stat={selectedPlayerEntry.stat} ownership={selectedPlayerEntry.ownership}
              onClose={() => { setSelected(null); setQuery('') }} />
          )}
        </div>
      )}
    </div>
  )
}

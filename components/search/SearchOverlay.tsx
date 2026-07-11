'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useLeague } from '@/context/LeagueContext'
import { useCareerStats } from '@/hooks/useCareerStats'
import { useRecordsData } from '@/hooks/useRecordsData'
import { usePlayersData } from '@/hooks/usePlayersData'
import { ownerColor, fullNameInitials } from '@/lib/utils'
import { OWNER_FULL_NAMES, USER_ID_TO_OWNER } from '@/lib/constants'
import { buildEntityIndex, answerQuery } from '@/lib/search'
import type { Answer } from '@/lib/search'
import type { PlayerStat } from '@/types'
import type { OwnershipEntry } from '@/lib/data-processing'
import AnswerCard from './AnswerCard'
import ManagerCard from './ManagerCard'
import PlayerCard from './PlayerCard'
import PlayerHeadshot from '@/components/shared/PlayerHeadshot'

const EXAMPLE_CHIPS = [
  'Teja vs Nathan all time',
  'Who won in 2022?',
  'Longest win streak',
  "Who's the luckiest?",
  'Kerry earnings',
  'Most points ever',
]

interface Props {
  onClose: () => void
}

export default function SearchOverlay({ onClose }: Props) {
  const { state } = useLeague()
  const career = useCareerStats()
  const records = useRecordsData()
  const { playerWinRates, ownership, loading: playersLoading } = usePlayersData(true)

  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<{ type: 'manager' | 'player'; id: string } | null>(null)
  const [focusIdx, setFocusIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  // Lock page scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const playerList = useMemo(() => {
    const map = new Map<string, { stat: PlayerStat; ownership: OwnershipEntry | null }>()
    playerWinRates.forEach(s => map.set(s.player_id, { stat: s, ownership: null }))
    ownership.forEach(o => {
      const entry = map.get(o.player_id)
      if (entry) entry.ownership = o
    })
    return [...map.values()]
  }, [playerWinRates, ownership])

  // Entity index: every owner with data (incl. inactive, so "Hamza vs Teja" works)
  const entityIndex = useMemo(() => {
    const canonicalNames = [...new Set(Object.values(USER_ID_TO_OWNER))]
      .filter(n => state.ownerSeasons[n])
    return buildEntityIndex(canonicalNames, playerWinRates)
  }, [state.ownerSeasons, playerWinRates])

  const ctx = useMemo(
    () => ({ state, career, records, players: playerWinRates, ownership }),
    [state, career, records, playerWinRates, ownership]
  )

  // Live answer for the current question
  const answer: Answer | null = useMemo(() => {
    const q = query.trim()
    if (q.length < 3 || selected) return null
    return answerQuery(q, entityIndex, ctx).answer
  }, [query, selected, entityIndex, ctx])

  // Fallback name-match results (always computed; shown when no smart answer)
  const { managerResults, playerResults } = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return { managerResults: [], playerResults: [] }
    return {
      managerResults: career.filter(m => m.name.toLowerCase().includes(q)).slice(0, 4),
      playerResults: playerList
        .filter(({ stat }) => stat.name.toLowerCase().includes(q))
        .sort((a, b) => b.stat.games - a.stat.games)
        .slice(0, 6),
    }
  }, [query, career, playerList])

  type FlatEntry =
    | { kind: 'manager'; name: string }
    | { kind: 'player'; id: string }

  const flatResults = useMemo<FlatEntry[]>(() => [
    ...managerResults.map(m => ({ kind: 'manager' as const, name: m.name })),
    ...playerResults.map(p => ({ kind: 'player' as const, id: p.stat.player_id })),
  ], [managerResults, playerResults])

  const selectedManager = selected?.type === 'manager'
    ? career.find(m => m.name === selected.id) ?? null
    : null
  const selectedPlayerEntry = selected?.type === 'player'
    ? playerList.find(({ stat }) => stat.player_id === selected.id) ?? null
    : null

  // Answer of kind manager/player renders the full card directly
  const answerManager = answer?.kind === 'manager'
    ? career.find(m => m.name === answer.name) ?? null
    : null
  const answerPlayerEntry = answer?.kind === 'player'
    ? playerList.find(({ stat }) => stat.player_id === answer.playerId) ?? null
    : null

  const statAnswer = answer && answer.kind !== 'manager' && answer.kind !== 'player' ? answer : null
  const showCardAnswer = Boolean(answerManager || answerPlayerEntry)
  const showFallback = query.trim().length > 0 && !selected && !showCardAnswer && !statAnswer
  const showEmptyState = !query.trim() && !selected

  function runChip(text: string) {
    setSelected(null)
    setQuery(text)
    inputRef.current?.focus()
  }

  function selectEntry(entry: FlatEntry) {
    setSelected(entry.kind === 'manager'
      ? { type: 'manager', id: entry.name }
      : { type: 'player', id: entry.id })
    setFocusIdx(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.stopPropagation()
      if (selected) { setSelected(null); return }
      if (query) { setQuery(''); return }
      onClose()
      return
    }
    if (!showFallback || flatResults.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusIdx(i => Math.min(i + 1, flatResults.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && focusIdx >= 0) { e.preventDefault(); selectEntry(flatResults[focusIdx]) }
  }

  // Rendered through a portal: the navbar's backdrop-filter would otherwise
  // become the containing block for this fixed overlay and clip it to the nav.
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center px-3 pt-3 pb-[calc(32px+env(safe-area-inset-bottom))] sm:px-4 sm:pt-[10vh] sm:pb-8 overflow-y-auto animate-fade-in"
      style={{ background: 'rgba(2, 6, 23, 0.75)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-[640px]">
        {/* ── Input ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 bento-card px-4 py-3.5 border-gold/40">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="flex-shrink-0" style={{ color: '#6e7681' }}>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.2" />
            <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(null); setFocusIdx(-1) }}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about the league…"
            className="flex-1 bg-transparent text-[15px] text-s-text placeholder:text-s-text3 outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          {playersLoading && (
            <div className="flex items-center gap-1.5 flex-shrink-0 text-[10px] text-s-text3">
              <div className="w-3 h-3 border border-s-border2 border-t-gold rounded-full animate-spin" />
              <span className="hidden sm:block">Players…</span>
            </div>
          )}
          <button
            onClick={onClose}
            className="hidden sm:block flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-mono bg-s-bg3 border border-s-border text-s-text3 hover:text-s-text transition-colors"
            aria-label="Close search"
          >
            ESC
          </button>
          <button
            onClick={onClose}
            className="sm:hidden flex-shrink-0 p-1.5 -mr-1 rounded-full text-s-text3 hover:text-s-text active:bg-s-bg3 transition-colors"
            aria-label="Close search"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Content ───────────────────────────────────────────── */}
        <div className="mt-3 space-y-3">

          {/* Empty state: example chips */}
          {showEmptyState && (
            <div className="bento-card p-5">
              <div className="text-[10px] font-bold tracking-[3px] uppercase text-s-text3 mb-3">
                Try asking
              </div>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_CHIPS.map(chip => (
                  <button
                    key={chip}
                    onClick={() => runChip(chip)}
                    className="px-3 py-[6px] rounded-full border border-white/10 bg-white/5 text-[12px] font-semibold text-s-text2 hover:text-white hover:border-gold/50 transition-all"
                  >
                    {chip}
                  </button>
                ))}
              </div>
              <div className="text-[10px] text-s-text3 mt-4">
                Records, head-to-head, champions, streaks, luck, earnings, playoffs — managers and NFL players.
              </div>
            </div>
          )}

          {/* Selected entity card (from fallback list) */}
          {selectedManager && (
            <ManagerCard data={selectedManager} playerWinRates={playerWinRates} onClose={() => setSelected(null)} />
          )}
          {selectedPlayerEntry && (
            <PlayerCard stat={selectedPlayerEntry.stat} ownership={selectedPlayerEntry.ownership} onClose={() => setSelected(null)} />
          )}

          {/* Smart answer */}
          {statAnswer && !showCardAnswer && <AnswerCard answer={statAnswer} />}
          {answerManager && (
            <ManagerCard data={answerManager} playerWinRates={playerWinRates} onClose={() => setQuery('')} />
          )}
          {answerPlayerEntry && (
            <PlayerCard stat={answerPlayerEntry.stat} ownership={answerPlayerEntry.ownership} onClose={() => setQuery('')} />
          )}

          {/* Fallback: name-match results */}
          {showFallback && (managerResults.length > 0 || playerResults.length > 0) && (
            <div className="bento-card overflow-hidden">
              {managerResults.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1 text-[9px] font-bold tracking-[3px] uppercase text-s-text3">Managers</div>
                  {managerResults.map((m, i) => {
                    const color = ownerColor(m.name)
                    const isFocused = focusIdx === i
                    return (
                      <button key={m.name}
                        onMouseDown={e => { e.preventDefault(); selectEntry({ kind: 'manager', name: m.name }) }}
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
                  {playerResults.map(({ stat }, i) => {
                    const globalIdx = managerResults.length + i
                    const isFocused = focusIdx === globalIdx
                    return (
                      <button key={stat.player_id}
                        onMouseDown={e => { e.preventDefault(); selectEntry({ kind: 'player', id: stat.player_id }) }}
                        className={['w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                          isFocused ? 'bg-s-bg3' : 'hover:bg-s-bg3/60'].join(' ')}>
                        <PlayerHeadshot playerId={stat.player_id} position={stat.position} size={32} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-semibold text-s-text truncate">{stat.name}</div>
                          <div className="text-[10px] text-s-text3">
                            {stat.team ? `${stat.team} · ` : ''}{stat.games}G · Top owner: {stat.topOwner || '—'}
                          </div>
                        </div>
                        <div className="text-[12px] font-bold flex-shrink-0"
                          style={{ color: stat.winRate >= 0.6 ? '#E8CE8A' : stat.winRate >= 0.45 ? '#9AA0AC' : '#B4636B' }}>
                          {(stat.winRate * 100).toFixed(0)}%
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Loading players notice while typing a player name */}
          {showFallback && flatResults.length === 0 && playersLoading && (
            <div className="bento-card flex items-center gap-3 px-4 py-5 text-[12px] text-s-text3">
              <div className="w-4 h-4 border border-s-border2 border-t-gold rounded-full animate-spin flex-shrink-0" />
              Loading player database…
            </div>
          )}

          {/* True empty */}
          {showFallback && flatResults.length === 0 && !playersLoading && (
            <div className="bento-card px-4 py-5 text-[12px] text-s-text3 text-center">
              Nothing matching &ldquo;{query}&rdquo; — try a manager, an NFL player, or a question like &ldquo;{EXAMPLE_CHIPS[1]}&rdquo;
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

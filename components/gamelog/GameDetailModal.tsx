'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { SLEEPER_API } from '@/lib/constants'
import type { Matchup, SleeperMatchup, LeagueState } from '@/types'

// Module-level cache so it persists across re-renders without being in state
let _playersCache: Record<string, { full_name?: string; first_name?: string; last_name?: string; team?: string }> | null = null

async function ensurePlayersCache() {
  if (_playersCache) return _playersCache
  try {
    const res = await fetch(`${SLEEPER_API}/players/nfl`, { headers: { Accept: 'application/json' } })
    _playersCache = await res.json()
  } catch {
    _playersCache = {}
  }
  return _playersCache!
}

interface ModalState {
  title: string
  body: ReactNode
}

function StarterRows({ entry, rosterPositions, players }: {
  entry: SleeperMatchup
  rosterPositions: string[]
  players: NonNullable<typeof _playersCache>
}) {
  const starters = entry.starters ?? []
  const starterPts = entry.starters_points ?? []
  return (
    <>
      {starters.map((pid, i) => {
        const pts = typeof starterPts[i] === 'number' ? starterPts[i] : (entry.players_points?.[pid] ?? 0)
        const pos = rosterPositions[i] ?? '?'
        const p = players[pid]
        const name = p ? (p.full_name || `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || pid) : `#${pid}`
        const nflTeam = p?.team ?? ''
        const ptColor = pts >= 20 ? 'text-s-green' : pts >= 10 ? 'text-s-text2' : 'text-s-text3'
        return (
          <div key={`${pid}-${i}`} className="flex items-center gap-2 py-[5px] border-b border-s-bg3">
            <span className="w-8 text-[9px] font-bold uppercase tracking-[1px] text-s-text3 flex-shrink-0">{pos}</span>
            <span className="flex-1 text-[12px] font-semibold text-s-text truncate">
              {name}
              {nflTeam && <span className="ml-1 text-[10px] font-normal text-s-text3">{nflTeam}</span>}
            </span>
            <span className={`font-mono text-[12px] font-bold flex-shrink-0 ${ptColor}`}>{pts.toFixed(2)}</span>
          </div>
        )
      })}
    </>
  )
}

interface Props {
  triggerGame: Matchup | null
  onClose: () => void
  rawMatchups: LeagueState['matchups']
  leagues: LeagueState['leagues']
}

export default function GameDetailModal({ triggerGame, onClose, rawMatchups, leagues }: Props) {
  const [modal, setModal] = useState<ModalState | null>(null)

  useEffect(() => {
    if (!triggerGame) { setModal(null); return }

    const { year, week, roster1, roster2, team1, team2 } = triggerGame
    const typeLabel = rawMatchups[year]?.[week]?.isPlayoff ? 'Playoff' : 'Reg Season'

    setModal({
      title: `${team1} vs ${team2} · ${year} Wk${week}`,
      body: (
        <div className="flex flex-col items-center gap-3 py-8 text-s-text3">
          <div className="w-8 h-8 border-2 border-s-border2 border-t-s-gold rounded-full animate-spin" />
          <span className="text-[12px] tracking-[1px]">Loading player data…</span>
        </div>
      ),
    })

    ;(async () => {
      const weekMatchups = rawMatchups[year]?.[week]?.matchups ?? []
      const m1 = weekMatchups.find(m => m.roster_id === roster1)
      const m2 = weekMatchups.find(m => m.roster_id === roster2)

      if (!m1 || !m2) {
        setModal({ title: `${team1} vs ${team2} · ${year} Wk${week}`, body: <p className="text-s-text3 text-center py-6">Roster data not available for this game.</p> })
        return
      }

      const players = await ensurePlayersCache()
      const rosterPositions = ((leagues[year]?.settings as unknown) as { roster_positions?: string[] } | undefined)?.roster_positions?.filter(p => p !== 'BN') ?? []

      const pts1 = m1.points ?? 0
      const pts2 = m2.points ?? 0

      setModal({
        title: `${team1} vs ${team2} · ${year} Wk${week}`,
        body: (
          <div>
            {/* Score header */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-s-border">
              <div className="flex-1 text-center">
                <div className="text-[13px] font-extrabold text-s-text mb-1">{team1}</div>
                <div className={`text-[30px] font-extrabold leading-none ${pts1 >= pts2 ? 'text-s-green' : 'text-s-red'}`}>{pts1.toFixed(2)}</div>
              </div>
              <div className="text-center flex-shrink-0">
                <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-s-text3">{typeLabel}</div>
                <div className="text-[11px] text-s-text3 mt-1">Week {week}</div>
                <div className="text-[13px] font-bold text-s-text3 mt-1">vs</div>
              </div>
              <div className="flex-1 text-center">
                <div className="text-[13px] font-extrabold text-s-text mb-1">{team2}</div>
                <div className={`text-[30px] font-extrabold leading-none ${pts2 >= pts1 ? 'text-s-green' : 'text-s-red'}`}>{pts2.toFixed(2)}</div>
              </div>
            </div>

            {/* Lineup columns */}
            <div className="grid grid-cols-2 gap-4 items-start">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-s-text2 mb-2">{team1}</div>
                <StarterRows entry={m1} rosterPositions={rosterPositions} players={players!} />
                <div className="pt-2 text-[11px] font-bold text-s-text2 text-right">Total: <span className="text-s-text">{pts1.toFixed(2)}</span></div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-s-text2 mb-2">{team2}</div>
                <StarterRows entry={m2} rosterPositions={rosterPositions} players={players!} />
                <div className="pt-2 text-[11px] font-bold text-s-text2 text-right">Total: <span className="text-s-text">{pts2.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        ),
      })
    })()
  }, [triggerGame])  // eslint-disable-line react-hooks/exhaustive-deps

  function handleClose() {
    setModal(null)
    onClose()
  }

  if (!modal) return null

  return (
    <div
      className="fixed inset-0 bg-black/80 z-[500] flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div className="bg-s-bg2 border border-s-border2 rounded-[18px] p-5 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[15px] font-extrabold text-s-text">{modal.title}</span>
          <button
            onClick={handleClose}
            className="text-[20px] text-s-text3 bg-transparent border-0 cursor-pointer hover:text-s-text transition-colors leading-none"
          >
            ✕
          </button>
        </div>
        {modal.body}
      </div>
    </div>
  )
}

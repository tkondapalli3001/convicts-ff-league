'use client'

import { HeartCrack, Zap, Activity, Crown, Trash2, Clover, Armchair } from 'lucide-react'
// Midnight Prime semantic accents (see design 3a Fun Facts): brick loss, gold emphasis, sage luck.
import { useFunFacts } from '@/hooks/useFunFacts'
import OwnerAvatar from '@/components/shared/OwnerAvatar'

export default function FunFacts() {
  const { heartbreak, perfectStorm, boomBust, theOwner, lowestWins, luckDuo, byeKings } = useFunFacts()

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      {/* ── Heartbreak Hotel (col-span-2) ──────────────────────────────────── */}
      <div className="md:col-span-2 bento-card p-[18px]">
        <div className="flex items-center gap-2 mb-4">
          <HeartCrack className="w-4 h-4 text-loss" />
          <span className="text-[10px] font-bold tracking-[2.5px] uppercase text-s-text3">
            Heartbreak Hotel
          </span>
          <span className="ml-auto text-[10px] text-s-text3">Highest score in a loss</span>
        </div>
        {heartbreak.length === 0 ? (
          <div className="text-center py-6 text-s-text3 text-[12px]">No data available</div>
        ) : heartbreak.map((entry, i) => (
          <div
            key={`${entry.owner}-${entry.year}-${entry.week}`}
            className="flex items-center gap-2 py-[6px] border-b border-white/[0.04] text-[12px] last:border-b-0"
          >
            <span className="w-5 text-s-text3 text-[10px] num flex-shrink-0">{i + 1}</span>
            <OwnerAvatar name={entry.owner} size="sm" />
            <span className="font-bold text-s-text w-[62px] flex-shrink-0">{entry.owner}</span>
            <span className="whitespace-nowrap text-[12px]">
              <span className="text-loss font-bold num">{entry.pts.toFixed(2)}</span>
              <span className="text-s-text3 mx-1">lost to</span>
              <span className="text-s-text2 font-semibold">{entry.opp}</span>
              <span className="text-s-text3 num ml-1">{entry.oppPts.toFixed(2)}</span>
            </span>
            <span className="text-s-text3 text-[10px] ml-auto whitespace-nowrap">
              {entry.year} Wk{entry.week}
            </span>
          </div>
        ))}
      </div>

      {/* ── The Perfect Storm ──────────────────────────────────────────────── */}
      <div className="bento-card p-[18px]">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-gold-bright" />
          <span className="text-[10px] font-bold tracking-[2.5px] uppercase text-s-text3">
            The Perfect Storm
          </span>
          <span className="ml-auto text-[10px] text-s-text3">Highest Player Scores</span>
        </div>
        {perfectStorm.length === 0 ? (
          <div className="text-center py-6 text-s-text3 text-[12px]">No data available</div>
        ) : perfectStorm.map((entry, i) => (
          <div
            key={`${entry.owner}-${entry.year}-${entry.week}-${i}`}
            className="flex items-center gap-2 py-[6px] border-b border-white/[0.04] text-[12px] last:border-b-0"
          >
            <span className="w-5 text-s-text3 text-[10px] num flex-shrink-0">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="text-s-text font-bold truncate">{entry.playerName}</div>
              <div className="text-[10px] text-s-text3">
                {entry.owner} · {entry.year} Wk{entry.week}
              </div>
            </div>
            <span className="text-gold-bright font-bold num text-[14px] flex-shrink-0">
              {entry.pts.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* ── Dumpster Divers (col-span-2) ──────────────────────────────────── */}
      <div className="md:col-span-2 bento-card p-[18px]">
        <div className="flex items-center gap-2 mb-4">
          <Trash2 className="w-4 h-4 text-gold-bright" />
          <span className="text-[10px] font-bold tracking-[2.5px] uppercase text-s-text3">
            Dumpster Divers
          </span>
          <span className="ml-auto text-[10px] text-s-text3">Lowest score in a win</span>
        </div>
        {lowestWins.length === 0 ? (
          <div className="text-center py-6 text-s-text3 text-[12px]">No data available</div>
        ) : lowestWins.map((entry, i) => (
          <div
            key={`${entry.owner}-${entry.year}-${entry.week}`}
            className="flex items-center gap-2 py-[6px] border-b border-white/[0.04] text-[12px] last:border-b-0"
          >
            <span className="w-5 text-s-text3 text-[10px] num flex-shrink-0">{i + 1}</span>
            <OwnerAvatar name={entry.owner} size="sm" />
            <span className="font-bold text-s-text w-[62px] flex-shrink-0">{entry.owner}</span>
            <span className="whitespace-nowrap text-[12px]">
              <span className="text-gold-bright font-bold num">{entry.pts.toFixed(2)}</span>
              <span className="text-s-text3 mx-1">beat</span>
              <span className="text-s-text2 font-semibold">{entry.opp}</span>
              <span className="text-s-text3 num ml-1">{entry.oppPts.toFixed(2)}</span>
            </span>
            <span className="text-s-text3 text-[10px] ml-auto whitespace-nowrap">
              {entry.year} Wk{entry.week}
            </span>
          </div>
        ))}
      </div>

      {/* ── Boom-Bust Specialist ───────────────────────────────────────────── */}
      <div className="bento-card p-[18px]">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-gold-soft" />
          <span className="text-[10px] font-bold tracking-[2.5px] uppercase text-s-text3">
            Boom-Bust Specialist
          </span>
          <span className="ml-auto text-[10px] text-s-text3">All-time</span>
        </div>
        {boomBust.length === 0 ? (
          <div className="text-center py-6 text-s-text3 text-[12px]">Insufficient data</div>
        ) : boomBust.map((entry, i) => (
          <div
            key={entry.owner}
            className="flex items-center gap-2 py-[6px] border-b border-white/[0.04] text-[12px] last:border-b-0"
          >
            <span className="w-5 text-s-text3 text-[10px] num flex-shrink-0">{i + 1}</span>
            <OwnerAvatar name={entry.owner} size="sm" />
            <div className="flex-1">
              <div className="text-s-text font-bold">{entry.owner}</div>
              <div className="text-[10px] text-s-text3 num">Avg {entry.avg.toFixed(1)}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-gold-soft font-bold num text-[14px]">
                ±{entry.stdDev.toFixed(1)}
              </div>
              <div className="text-[9px] text-s-text3">pts/game</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── The Owner (col-span-2) ─────────────────────────────────────────── */}
      <div className="md:col-span-2 bento-card p-[18px]">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="w-4 h-4 text-s-gold" />
          <span className="text-[10px] font-bold tracking-[2.5px] uppercase text-s-text3">
            Who&apos;s Your Daddy? 🍆
          </span>
          <span className="ml-auto text-[10px] text-s-text3">All-time · ≥75% win rate · min 4 games</span>
        </div>
        {theOwner.length === 0 ? (
          <div className="py-6 text-s-text3 text-[12px] text-center">
            No dominant rivalries found all-time
          </div>
        ) : theOwner.map(entry => (
          <div
            key={`${entry.dominant}-${entry.victim}`}
            className="flex items-center gap-2 py-[6px] border-b border-white/[0.04] text-[12px] last:border-b-0"
          >
            <OwnerAvatar name={entry.dominant} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-s-text font-bold truncate">{entry.dominant}</span>
                <Crown className="w-3 h-3 text-s-gold flex-shrink-0" />
              </div>
              <div className="text-[10px] text-s-text3 whitespace-nowrap">
                owns <span className="text-s-red">{entry.victim}</span>
                {' · '}{entry.wins}–{entry.losses}
              </div>
            </div>
            <span className="text-gold-bright font-bold num flex-shrink-0">
              {(entry.winPct * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>

      {/* ── Lucky Charm / Cosmic Punching Bag ─────────────────────────────── */}
      <div className="bento-card p-[18px]">
        <div className="flex items-center gap-2 mb-4">
          <Clover className="w-4 h-4 text-win" />
          <span className="text-[10px] font-bold tracking-[2.5px] uppercase text-s-text3">
            Luck of the Draw
          </span>
          <span className="ml-auto text-[10px] text-s-text3">Career luck index</span>
        </div>
        {!luckDuo ? (
          <div className="text-center py-6 text-s-text3 text-[12px]">No data available</div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 py-[8px] border-b border-white/[0.04]">
              <OwnerAvatar name={luckDuo.luckiest.owner} size="sm" />
              <div className="flex-1">
                <div className="text-s-text font-bold text-[12px]">{luckDuo.luckiest.owner}</div>
                <div className="text-[10px] text-s-text3">Lucky Charm 🍀</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-win font-bold num text-[14px]">
                  +{luckDuo.luckiest.luckIndex.toFixed(2)}
                </div>
                <div className="text-[9px] text-s-text3">wins</div>
              </div>
            </div>
            <div className="flex items-center gap-2 py-[8px]">
              <OwnerAvatar name={luckDuo.unluckiest.owner} size="sm" />
              <div className="flex-1">
                <div className="text-s-text font-bold text-[12px]">{luckDuo.unluckiest.owner}</div>
                <div className="text-[10px] text-s-text3">Cosmic Punching Bag 💀</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-loss font-bold num text-[14px]">
                  {luckDuo.unluckiest.luckIndex.toFixed(2)}
                </div>
                <div className="text-[9px] text-s-text3">wins</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Rest for the Wicked (col-span-3) ──────────────────────────────── */}
      <div className="md:col-span-3 bento-card p-[18px]">
        <div className="flex items-center gap-2 mb-4">
          <Armchair className="w-4 h-4 text-s-gold" />
          <span className="text-[10px] font-bold tracking-[2.5px] uppercase text-s-text3">
            Rest for the Wicked
          </span>
          <span className="ml-auto text-[10px] text-s-text3">Most first-round byes earned</span>
        </div>
        {byeKings.length === 0 ? (
          <div className="text-center py-6 text-s-text3 text-[12px]">No data available</div>
        ) : byeKings.map((entry, i) => (
          <div
            key={entry.owner}
            className="flex items-center gap-2 py-[6px] border-b border-white/[0.04] text-[12px] last:border-b-0"
          >
            <span className="w-5 text-s-text3 text-[10px] num flex-shrink-0">{i + 1}</span>
            <OwnerAvatar name={entry.owner} size="sm" />
            <span className="font-bold text-s-text w-[62px] flex-shrink-0">{entry.owner}</span>
            <span className="text-s-text3 text-[10px] truncate">{entry.years.join(' · ')}</span>
            <span className="text-gold-bright font-bold num text-[14px] ml-auto flex-shrink-0">
              {entry.count}
            </span>
          </div>
        ))}
      </div>

    </div>
  )
}

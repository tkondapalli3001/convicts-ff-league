'use client'

import { shrinkRate, type UncertaintySummary } from '@/lib/stats'
import InfoTip from '@/components/shared/InfoTip'
import uncertainty from '@/public/data/uncertainty.json'

const { h2hK } = uncertainty as UncertaintySummary
const pct = (x: number) => Math.round(x * 100)

/** A head-to-head series' record pulled toward even by how far the league's series spread beyond coin flips. */
export default function SeriesEdgeTip({ a, b, winsA, winsB }: { a: string; b: string; winsA: number; winsB: number }) {
  const n = winsA + winsB
  if (n === 0) return null
  const aLeads = winsA >= winsB
  const leader = aLeads ? a : b, w = aLeads ? winsA : winsB
  const edge = shrinkRate(w, n, h2hK)
  return (
    <InfoTip term="True edge">
      {winsA === winsB ? `The series is tied at ${w}–${w}.` : `${leader} leads ${w}–${n - w}.`} After pulling the record toward even, as much as the
      league’s series say to, the best estimate is {pct(edge.rate)}% for {leader} (range {pct(edge.low)}–{pct(edge.high)}%). Chance the
      edge is real: {pct(edge.pAboveHalf)}%.
    </InfoTip>
  )
}

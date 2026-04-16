'use client'

import { useLeague } from '@/context/LeagueContext'

export default function LoadingSpinner() {
  const { state } = useLeague()
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-11 h-11 border-[3px] border-s-border border-t-s-gold rounded-full animate-spin" />
      <div className="text-s-text3 text-[13px] tracking-[1px]">{state.loadingText}</div>
    </div>
  )
}

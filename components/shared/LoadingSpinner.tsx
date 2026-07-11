'use client'

import { useLeague } from '@/context/LeagueContext'

export default function LoadingSpinner() {
  const { state } = useLeague()
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative">
        <div className="w-11 h-11 border-[2px] border-white/10 rounded-full" />
        <div className="absolute inset-0 w-11 h-11 border-[2px] border-transparent border-t-[#C9962E] rounded-full animate-spin" />
      </div>
      <div className="text-s-text3 text-[12px] tracking-[1.5px] uppercase font-semibold">
        {state.loadingText}
      </div>
    </div>
  )
}

interface Props {
  error: string
}

export default function ErrorState({ error }: Props) {
  const isCors = error === 'CORS_BLOCKED' || error.includes('CORS') || error.includes('Failed to fetch')
  const isTimeout = error.includes('timed out')

  return (
    <div className="max-w-[560px] mx-auto mt-10 p-7 bg-s-bg2 border border-[#2a1a1a] rounded-[14px]">
      <div className="text-[36px] mb-4">⚠️</div>
      <div className="text-[18px] font-extrabold text-s-text mb-[10px]">
        {isCors ? 'Sleeper API blocked by browser (CORS)' : isTimeout ? 'Sleeper API timed out' : 'Failed to load league data'}
      </div>
      <p className="text-[13px] text-s-text2 leading-[1.65] mb-4">
        {isCors
          ? 'Your browser is blocking requests to api.sleeper.app. Try opening the site in a different browser or check your network connection.'
          : isTimeout
          ? 'The request to Sleeper took longer than 10 seconds. Check your internet connection and retry.'
          : error}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-[10px] bg-[#1e3a5f] border border-s-blue rounded-[8px] text-[#93c5fd] text-[13px] font-semibold cursor-pointer hover:bg-[#1e4a6f] transition-colors"
      >
        ↺ Retry
      </button>
      <div className="mt-5 pt-4 border-t border-s-border">
        <div className="text-[10px] text-s-text3 tracking-[1px] uppercase mb-2">Diagnostics</div>
        <div className="font-mono text-[11px] text-s-text3">{error}</div>
      </div>
    </div>
  )
}

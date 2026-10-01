'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

/** One roast line with a copy-for-the-group-chat button. */
export default function SmackLine({ line }: { line: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(line)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = line
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy') } finally { ta.remove() }
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div
      className="flex items-center gap-2 rounded-[6px] border px-3 py-2.5 sm:px-4"
      style={{ borderColor: 'rgba(var(--gold-rgb), 0.10)', background: '#0B0B0D' }}
    >
      <span className="flex-1 text-[13px] leading-snug text-s-text2 sm:text-[15px]">{line}</span>
      <button
        onClick={copy}
        className="flex-shrink-0 rounded-[4px] p-1.5 text-s-text3 transition-colors hover:text-gold-soft active:scale-[0.98]"
        aria-label="Copy to clipboard"
        title="Copy for the group chat"
      >
        {copied ? <Check size={14} className="text-win" /> : <Copy size={14} />}
      </button>
    </div>
  )
}

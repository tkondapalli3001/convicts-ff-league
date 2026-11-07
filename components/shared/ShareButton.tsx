'use client'

import { useState } from 'react'
import { Check, Share2 } from 'lucide-react'

/** Shares this exact view: the phone's share sheet, else copies the link. */
export default function ShareButton({ title, className }: { title: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  async function share() {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // Cancelled the share sheet, or no clipboard access: nothing to report
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label={copied ? 'Link copied' : 'Share this'}
      className={`p-2 transition-colors hover:text-gold-soft ${copied ? 'text-win' : 'text-s-text3'} ${className ?? ''}`}
    >
      {copied ? <Check size={17} /> : <Share2 size={17} />}
    </button>
  )
}

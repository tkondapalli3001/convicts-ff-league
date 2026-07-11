'use client'

import { useEffect } from 'react'

/**
 * Escape-to-close + body scroll lock for modal overlays — the same effect
 * MatchupModal uses, shared so every modal dismisses consistently.
 */
export function useModalClose(onClose: () => void) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])
}

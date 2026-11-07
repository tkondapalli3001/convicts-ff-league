'use client'

import { useEffect, useRef } from 'react'

/**
 * How every popup closes: Escape, the page locked behind it, and the Back
 * button, which is what a phone reaches for. Opening adds a history stop, and
 * Back closes the popup instead of leaving the page. A popup that keeps its
 * own stop in the URL (useUrlModal) passes `backButton: false`.
 */
export function useModalClose(onClose: () => void, { backButton = true }: { backButton?: boolean } = {}) {
  const close = useRef(onClose)
  useEffect(() => { close.current = onClose })

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') close.current() }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  useEffect(() => {
    if (!backButton) return
    let closedByBack = false
    const onPop = () => { closedByBack = true; close.current() }
    // Deferred so a mount that's immediately undone (React's dev double-run) leaves no stop behind
    const timer = window.setTimeout(() => {
      window.history.pushState({ modalStop: true }, '', window.location.href)
      window.addEventListener('popstate', onPop)
    }, 0)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('popstate', onPop)
      // Closed with the X or Escape: take our stop back off, unless a link in the popup already moved on
      if (!closedByBack && (window.history.state as { modalStop?: boolean } | null)?.modalStop) window.history.back()
    }
  }, [backButton])
}

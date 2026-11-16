'use client'

import { useEffect, useRef } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** The popup on top: overlays portal to the end of <body>, so it's the last dialog in the page. */
function topDialog(): HTMLElement | null {
  const dialogs = document.querySelectorAll<HTMLElement>('[role="dialog"]')
  return dialogs[dialogs.length - 1] ?? null
}

/**
 * Keyboard focus for a popup: it moves in when the popup opens, Tab stays
 * inside it, and closing hands focus back to whatever opened it. Finds the
 * popup by its `role="dialog"`, so every overlay needs one.
 */
export function useFocusTrap() {
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null

    // After paint, so a popup that focuses its own field (search) keeps that focus
    const frame = window.requestAnimationFrame(() => {
      const dialog = topDialog()
      if (!dialog || dialog.contains(document.activeElement)) return
      if (!dialog.hasAttribute('tabindex')) dialog.tabIndex = -1
      dialog.style.outline = 'none'
      dialog.focus({ preventScroll: true })
    })

    function onTab(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      const dialog = topDialog()
      if (!dialog) return
      const items = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(el => el.offsetParent !== null)
      if (!items.length) { e.preventDefault(); return }
      const first = items[0], last = items[items.length - 1]
      const active = document.activeElement
      if (!dialog.contains(active)) { e.preventDefault(); first.focus() }
      else if (e.shiftKey && (active === first || active === dialog)) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus() }
    }

    document.addEventListener('keydown', onTab)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onTab)
      if (opener?.isConnected) opener.focus({ preventScroll: true })
    }
  }, [])
}

/**
 * How every popup closes: Escape, the page locked behind it, and the Back
 * button, which is what a phone reaches for. Opening adds a history stop, and
 * Back closes the popup instead of leaving the page. A popup that keeps its
 * own stop in the URL (useUrlModal) passes `backButton: false`. Keyboard
 * focus stays inside the popup while it's open (useFocusTrap).
 */
export function useModalClose(onClose: () => void, { backButton = true }: { backButton?: boolean } = {}) {
  const close = useRef(onClose)
  useEffect(() => { close.current = onClose })

  useFocusTrap()

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

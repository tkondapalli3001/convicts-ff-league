'use client'

import { useEffect } from 'react'

/**
 * Enter or Space on anything marked `data-press` (a sortable header, a row
 * that opens a profile) presses it, so tables work from the keyboard. One
 * listener for the whole site; renders nothing.
 */
export default function PressKeys() {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target
      if ((e.key === 'Enter' || e.key === ' ') && el instanceof HTMLElement && el.matches('[data-press]')) {
        e.preventDefault()
        el.click()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])
  return null
}

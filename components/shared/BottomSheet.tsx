'use client'

import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useModalClose } from '@/hooks/useModalClose'

/**
 * A phone sheet that rises from the bottom: the bottom bar's More menu and the
 * Filters button use it. Portaled like every overlay; Escape, Back and a tap
 * outside close it.
 */
export default function BottomSheet({ title, onClose, children }: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  useModalClose(onClose)

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[100] flex items-end sm:hidden"
      style={{ background: 'rgba(3,3,4,0.7)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="max-h-[85vh] w-full overflow-y-auto border-t animate-fade-in"
        style={{ background: '#0B0B0D', borderColor: 'rgba(var(--gold-rgb), 0.24)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: 'rgba(var(--gold-rgb), 0.12)' }}>
          <span className="text-[11px] font-bold uppercase tracking-[2.5px] text-gold-soft">{title}</span>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 p-2 text-s-text3 hover:text-gold-soft">
            <X size={17} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}

// Midnight Prime footer strip — rendered globally on every page. The season
// count is the completed seasons in the snapshot, fixed at build time.
import snapshot from '@/public/data/manifest.json'

export default function Footer() {
  return (
    <footer
      className="flex items-center justify-center gap-4 px-4 py-6 border-t"
      style={{ borderColor: 'rgba(var(--gold-rgb), 0.08)' }}
    >
      <span
        className="w-8 h-px flex-shrink-0"
        style={{ background: 'linear-gradient(to right, transparent, rgba(var(--gold2-rgb), 0.5))' }}
      />
      <span className="text-[9px] font-bold tracking-[4px] uppercase text-s-text3 whitespace-nowrap sm:tracking-[5px]">
        Convicts FF – {snapshot.years.length} Seasons
      </span>
      <span
        className="w-8 h-px flex-shrink-0"
        style={{ background: 'linear-gradient(to left, transparent, rgba(var(--gold2-rgb), 0.5))' }}
      />
    </footer>
  )
}

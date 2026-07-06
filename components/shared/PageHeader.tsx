'use client'

/** Standard page title + subtitle pair used at the top of every page. */
export default function PageHeader({ title, subtitle }: { title: string; subtitle: React.ReactNode }) {
  return (
    <>
      <h1 className="text-[26px] font-extrabold text-s-text mb-1">{title}</h1>
      <p className="text-[13px] text-s-text3 mb-5">{subtitle}</p>
    </>
  )
}

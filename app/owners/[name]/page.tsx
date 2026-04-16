import { USER_ID_TO_OWNER } from '@/lib/constants'
import OwnerDetail from '@/components/owners/OwnerDetail'

// Generate static paths for all owner names at build time
export function generateStaticParams() {
  const names = [...new Set(Object.values(USER_ID_TO_OWNER))]
  return names.map(name => ({ name: encodeURIComponent(name) }))
}

export default async function OwnerPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  const ownerName = decodeURIComponent(name)
  return <OwnerDetail ownerName={ownerName} />
}

import { USER_ID_TO_OWNER } from '@/lib/league'
import OwnerDetail from '@/components/owners/OwnerDetail'
import { pageMeta } from '../../page-meta'

// Generate static paths for all owner names at build time
export function generateStaticParams() {
  const names = [...new Set(Object.values(USER_ID_TO_OWNER))]
  return names.map(name => ({ name: encodeURIComponent(name) }))
}

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  const owner = decodeURIComponent(name)
  return pageMeta(owner, `${owner}'s career: record, wins bridge, head-to-head, and every game.`, `/owners/${name}/`)
}

export default async function OwnerPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  const ownerName = decodeURIComponent(name)
  return <OwnerDetail ownerName={ownerName} />
}

import { pageMeta } from '../page-meta'

// The page itself is a client component, so its preview card lives here
export const metadata = pageMeta('Owners', 'The career leaderboard, the earnings ledger, and head-to-head records.', '/owners/')

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

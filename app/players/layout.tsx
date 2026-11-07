import { pageMeta } from '../page-meta'

// The page itself is a client component, so its preview card lives here
export const metadata = pageMeta('Players', 'Top scorers, win rates, draft ownership, and every transaction.', '/players/')

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

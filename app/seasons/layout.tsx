import { pageMeta } from '../page-meta'

// The page itself is a client component, so its preview card lives here
export const metadata = pageMeta('Seasons', 'Standings, playoff brackets, and every game since 2019.', '/seasons/')

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

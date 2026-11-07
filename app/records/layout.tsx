import { pageMeta } from '../page-meta'

// The page itself is a client component, so its preview card lives here
export const metadata = pageMeta('Records', 'The record book, streaks, fun facts, and trash talk.', '/records/')

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

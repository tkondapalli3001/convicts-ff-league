import { pageMeta } from '../page-meta'

// The page itself is a client component, so its preview card lives here
export const metadata = pageMeta('Draft', 'The draft order, past boards, slot analysis, steals and busts.', '/draft/')

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

/** "This Week" became the 2026 tab — keeps links already shared in the group chat working. */
export default function ThisWeekRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/2026')
  }, [router])
  return <LoadingSpinner />
}

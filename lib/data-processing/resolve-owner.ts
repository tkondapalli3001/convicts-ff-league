import { USER_ID_TO_OWNER, DISPLAY_NAME_TO_OWNER } from '@/lib/owner-map'

export function resolveOwnerName(userId: string | undefined, displayName: string | undefined): string {
  if (userId && USER_ID_TO_OWNER[userId]) return USER_ID_TO_OWNER[userId]
  if (displayName && DISPLAY_NAME_TO_OWNER[displayName]) return DISPLAY_NAME_TO_OWNER[displayName]
  return displayName || 'Unknown'
}

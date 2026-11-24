import { defineEventHandler } from 'h3'
import type { AuthUser } from '#shared/types/auth'
import { getAuthSessionUser } from '../../utils/authStore'

export default defineEventHandler((event): { user: AuthUser | null } => {
  return { user: getAuthSessionUser(event) }
})

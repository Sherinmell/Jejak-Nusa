import { defineEventHandler } from 'h3'
import type { AuthUser } from '#shared/types/auth'
import { getAuthSessionUser } from '../../utils/authStore'
import { findUserByIdFromDb } from '../../utils/dbRepositories'

export default defineEventHandler(async (event): Promise<{ user: AuthUser | null }> => {
  const sessionUser = getAuthSessionUser(event)
  if (!sessionUser) return { user: null }

  // Enrich session user with latest TiDB profile if persisted in DB (never logs out on DB error)
  try {
    const dbUser = await findUserByIdFromDb(sessionUser.id)
    if (dbUser) {
      return {
        user: {
          ...sessionUser,
          ...dbUser
        }
      }
    }
  } catch {
    // Keep signed cookie session intact
  }

  return { user: sessionUser }
})

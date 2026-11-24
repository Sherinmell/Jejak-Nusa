import { createError, type H3Event } from 'h3'
import type { AuthUser } from '#shared/types/auth'
import { getAuthSessionUser } from './authStore'

export async function requireAdmin(event: H3Event): Promise<AuthUser> {
  const user = getAuthSessionUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Autentikasi diperlukan. Silakan masuk sebagai Admin terlebih dahulu.'
    })
  }

  if (user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Akses ditolak. Hanya akun dengan role Admin yang dapat mengakses manajemen data.'
    })
  }

  return user
}

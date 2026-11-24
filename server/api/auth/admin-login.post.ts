import { createError, defineEventHandler, readBody } from 'h3'
import type { AdminLoginPayload, AuthResponse, AuthUser } from '#shared/types/auth'
import { safeCompareText, setAuthSession } from '../../utils/authStore'
import { authenticateUserFromDb } from '../../utils/dbRepositories'

export default defineEventHandler(async (event): Promise<AuthResponse> => {
  const body = await readBody<Partial<AdminLoginPayload>>(event)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  const accessCode = typeof body?.accessCode === 'string' ? body.accessCode.trim() : ''

  if (!email || !password || !accessCode) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email, kata sandi, dan kode akses khusus Admin wajib diisi.'
    })
  }

  // Server-only environment secrets (never exported to frontend bundle)
  const expectedEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase()
  const expectedPassword = process.env.ADMIN_PASSWORD || ''
  const expectedCode = (process.env.ADMIN_ACCESS_CODE || '').trim()

  if (!expectedEmail || !expectedPassword || !expectedCode) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Kredensial Admin server belum dikonfigurasi pada environment (.env).'
    })
  }

  if (!safeCompareText(accessCode, expectedCode)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Kredensial atau kode akses khusus Admin tidak valid.'
    })
  }

  let adminUser: AuthUser | null = null

  // Match against private server-only .env admin credentials first
  if (safeCompareText(email, expectedEmail) && safeCompareText(password, expectedPassword)) {
    adminUser = {
      id: 'usr-admin-root',
      name: 'Administrator JejakNusa',
      email: expectedEmail,
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=240&q=80',
      origin: 'Jakarta Pusat',
      memberSince: '2024-01-01',
      verified: true
    }
  } else {
    // Also allow admin accounts stored in database users table (with valid secret accessCode)
    try {
      const dbUser = await authenticateUserFromDb(email, password)
      if (dbUser && dbUser.role === 'admin') {
        adminUser = dbUser
      }
    } catch {
      // ignore if DB unavailable
    }
  }

  if (!adminUser) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Kredensial atau kode akses khusus Admin tidak valid.'
    })
  }

  setAuthSession(event, adminUser)

  return {
    user: adminUser,
    message: `Login Admin terverifikasi. Selamat bertugas, ${adminUser.name}!`
  }
})

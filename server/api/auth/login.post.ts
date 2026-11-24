import { createError, defineEventHandler, readBody } from 'h3'
import {
  normalizeUserRole,
  type AuthResponse,
  type AuthUser,
  type LoginPayload
} from '#shared/types/auth'
import {
  authenticateUser,
  getDemoUserByRole,
  setAuthSession,
  upsertCustomerByName
} from '../../utils/authStore'
import { authenticateUserFromDb } from '../../utils/dbRepositories'
import { executeSql, hashPassword } from '../../utils/db'

export default defineEventHandler(async (event): Promise<AuthResponse> => {
  const body = await readBody<Partial<LoginPayload> & Record<string, unknown>>(event)

  // MODE 0: 1-Klik Akun Demo Instan (Khusus Pelanggan; Pemandu & Admin wajib kredensial pribadi)
  if (body?.mode === 'demo' && 'role' in body && typeof body.role === 'string') {
    const targetRole = normalizeUserRole(body.role)
    if (targetRole === 'admin' || targetRole === 'guide') {
      throw createError({
        statusCode: 403,
        statusMessage:
          targetRole === 'guide'
            ? 'Login Pemandu wajib menggunakan Email / Nomor WhatsApp terdaftar dan kata sandi pribadi.'
            : 'Login Admin wajib menggunakan username dan kata sandi resmi.'
      })
    }
    const demoUser = getDemoUserByRole(targetRole)
    setAuthSession(event, demoUser)

    return {
      user: demoUser,
      message: `Login Demo berhasil (${demoUser.name}). Selamat datang di Dashboard Pelanggan JejakNusa.`
    }
  }

  // MODE 1: Login Cepat Pelanggan dengan Nama
  if (body?.mode === 'customer') {
    const name = 'name' in body && typeof body.name === 'string' ? body.name.trim() : ''
    const origin = 'origin' in body && typeof body.origin === 'string' ? body.origin.trim() : 'Indonesia'

    if (name.length < 2) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Silakan masukkan nama pelanggan minimal 2 karakter.'
      })
    }

    const user = upsertCustomerByName(name, origin)

    try {
      await executeSql(
        `INSERT IGNORE INTO users
          (id, name, email, password_hash, role, avatar, origin, member_since, verified, points, total_km_explored)
         VALUES (?, ?, ?, ?, 'customer', ?, ?, ?, 1, 500, 0)`,
        [
          user.id,
          user.name,
          user.email,
          hashPassword(user.id),
          user.avatar,
          user.origin,
          user.memberSince
        ]
      )
    } catch {
      // Fallback already stored in signed session cookie & memory
    }

    setAuthSession(event, user)
    return {
      user,
      message: `Selamat datang, ${user.name}! Anda masuk sebagai Pelanggan.`
    }
  }

  // MODE 2: Login Pemandu dinonaktifkan (hanya Peserta & Admin)
  if (body?.mode === 'guide') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Login Pemandu telah dinonaktifkan. Sistem hanya menyediakan login untuk Peserta dan Admin.'
    })
  }

  // MODE 3: Login Username/Email/WhatsApp & Password Standar (untuk Admin maupun Peserta terdaftar)
  const rawBody = body as { email?: string; username?: string; identifier?: string; password?: string } | undefined
  const identifier =
    typeof rawBody?.username === 'string' && rawBody.username.trim()
      ? rawBody.username.trim()
      : typeof rawBody?.identifier === 'string' && rawBody.identifier.trim()
        ? rawBody.identifier.trim()
        : typeof rawBody?.email === 'string'
          ? rawBody.email.trim()
          : ''
  const password = typeof rawBody?.password === 'string' ? rawBody.password : ''

  if (!identifier || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Silakan masukkan username/email dan kata sandi Anda.'
    })
  }

  let user: AuthUser | null = authenticateUser(identifier, password)
  if (!user) {
    try {
      user = await authenticateUserFromDb(identifier, password)
    } catch {
      user = null
    }
  }

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Kredensial atau kata sandi tidak sesuai.'
    })
  }

  if (user.role === 'guide') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Login Pemandu telah dinonaktifkan. Sistem hanya menyediakan login untuk Peserta dan Admin.'
    })
  }

  setAuthSession(event, user)

  return {
    user,
    message: `Selamat datang kembali, ${user.name}!`
  }
})

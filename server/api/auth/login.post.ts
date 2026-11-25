import { createError, defineEventHandler, readBody } from 'h3'
import {
  type AuthResponse,
  type AuthUser,
  type LoginPayload
} from '#shared/types/auth'
import {
  authenticateUser,
  setAuthSession
} from '../../utils/authStore'
import { authenticateUserFromDb } from '../../utils/dbRepositories'

export default defineEventHandler(async (event): Promise<AuthResponse> => {
  const body = await readBody<Partial<LoginPayload> & Record<string, unknown>>(event)

  // Tutup seluruh jalur login instan / tanpa password agar akun peserta & admin tetap privat
  if (body?.mode === 'demo' || body?.mode === 'customer') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Login wajib menggunakan Username/Email/WhatsApp dan Kata Sandi akun terdaftar.'
    })
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

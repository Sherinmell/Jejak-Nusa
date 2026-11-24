import { createError, defineEventHandler, readBody } from 'h3'
import type { AuthResponse, AuthUser, RegisterPayload } from '#shared/types/auth'
import {
  findUserByEmail,
  findUserByIdentifier,
  registerNewUser,
  setAuthSession
} from '../../utils/authStore'
import {
  findUserByEmailFromDb,
  findUserByIdentifierFromDb,
  registerUserInDb
} from '../../utils/dbRepositories'

export default defineEventHandler(async (event): Promise<AuthResponse> => {
  const body = await readBody<Partial<RegisterPayload>>(event)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const rawUsername = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : ''
  const username = rawUsername || (email ? email.split('@')[0]?.replace(/[^a-z0-9._-]/g, '') || '' : '')
  const phone = typeof body?.phone === 'string' ? body.phone.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  const origin = typeof body?.origin === 'string' ? body.origin.trim() : 'Indonesia'

  if (body?.role === 'guide') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Pendaftaran akun Pemandu sedang dinonaktifkan. Hanya pendaftaran Peserta yang tersedia.'
    })
  }
  const role: 'customer' = 'customer'

  if (name.length < 2) {
    throw createError({ statusCode: 400, statusMessage: 'Nama lengkap minimal 2 karakter.' })
  }
  if (username.length < 3 || !/^[a-z0-9._-]+$/.test(username)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Username minimal 3 karakter dan hanya boleh menggunakan huruf kecil, angka, titik, garis bawah, atau strip.'
    })
  }
  if (username === 'admin' || username === 'administrator') {
    throw createError({
      statusCode: 409,
      statusMessage: 'Username tersebut tidak tersedia. Gunakan username lain.'
    })
  }
  if (!email.includes('@')) {
    throw createError({ statusCode: 400, statusMessage: 'Format alamat email tidak valid.' })
  }
  if (password.length < 6) {
    throw createError({ statusCode: 400, statusMessage: 'Kata sandi minimal 6 karakter.' })
  }

  if (findUserByIdentifier(username)) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Username sudah digunakan. Silakan pilih username lain.'
    })
  }
  if (findUserByEmail(email)) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Email sudah terdaftar. Silakan masuk menggunakan akun tersebut.'
    })
  }
  if (phone && findUserByIdentifier(phone)) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Nomor WhatsApp sudah terdaftar. Silakan masuk menggunakan akun tersebut.'
    })
  }

  let user: AuthUser
  try {
    const existingByUsername = await findUserByIdentifierFromDb(username)
    if (existingByUsername) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Username sudah digunakan. Silakan pilih username lain.'
      })
    }
    const existingByEmail = await findUserByEmailFromDb(email)
    if (existingByEmail) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Email sudah terdaftar. Silakan masuk menggunakan akun tersebut.'
      })
    }
    user = await registerUserInDb({
      username,
      name,
      email,
      phone: phone || undefined,
      password,
      origin,
      role
    })
    // Mirror in memory store for instant fallback & same-ID consistency
    registerNewUser({
      id: user.id,
      username,
      name,
      email,
      phone: phone || undefined,
      password,
      origin,
      role
    })
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) {
      throw err
    }
    user = registerNewUser({
      username,
      name,
      email,
      phone: phone || undefined,
      password,
      origin,
      role
    })
  }

  setAuthSession(event, user)

  return {
    user,
    message: `Akun "${user.username || user.email}" berhasil didaftarkan & disimpan! Selamat menjelajah Nusantara, ${user.name}.`
  }
})

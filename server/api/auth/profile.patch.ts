import { createError, defineEventHandler, readBody } from 'h3'
import type { AuthResponse } from '#shared/types/auth'
import {
  findUserByIdentifier,
  getAuthSessionUser,
  getStoredUserPasswordHash,
  setAuthSession,
  setUploadedAvatarData,
  updateStoredUserProfile,
  verifyStoredUserPassword
} from '../../utils/authStore'
import {
  findUserByEmailFromDb,
  findUserByIdentifierFromDb,
  updateUserProfileInDb,
  verifyUserPasswordFromDb
} from '../../utils/dbRepositories'

interface UpdateProfileBody {
  name?: string
  username?: string
  email?: string
  phone?: string
  origin?: string
  avatar?: string
  currentPassword?: string
  newPassword?: string
}

export default defineEventHandler(async (event): Promise<AuthResponse> => {
  const sessionUser = getAuthSessionUser(event)
  if (!sessionUser) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Silakan login terlebih dahulu untuk mengubah profil.'
    })
  }

  const body = (await readBody<UpdateProfileBody>(event)) || {}
  const name = typeof body.name === 'string' ? body.name.trim() : sessionUser.name
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : sessionUser.email
  const origin = typeof body.origin === 'string' ? body.origin.trim() : sessionUser.origin
  const phone = typeof body.phone === 'string' ? body.phone.trim() : (sessionUser.phone || '')
  const rawUsername = typeof body.username === 'string' ? body.username.trim().toLowerCase() : (sessionUser.username || '')
  const rawAvatar = typeof body.avatar === 'string' ? body.avatar.trim() : ''
  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : ''
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''

  if (name.length < 2) {
    throw createError({ statusCode: 400, statusMessage: 'Nama lengkap minimal 2 karakter.' })
  }
  if (!email.includes('@')) {
    throw createError({ statusCode: 400, statusMessage: 'Format alamat email tidak valid.' })
  }

  // Validate username change (Admin username remains 'admin')
  let nextUsername = sessionUser.username
  if (sessionUser.role !== 'admin' && rawUsername) {
    if (rawUsername.length < 3 || !/^[a-z0-9._-]+$/.test(rawUsername)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Username minimal 3 karakter (hanya huruf kecil, angka, titik, garis bawah, atau strip).'
      })
    }
    if (rawUsername === 'admin' || rawUsername === 'administrator') {
      throw createError({ statusCode: 409, statusMessage: 'Username tersebut tidak tersedia.' })
    }
    const existingMem = findUserByIdentifier(rawUsername)
    if (existingMem && existingMem.id !== sessionUser.id) {
      throw createError({ statusCode: 409, statusMessage: 'Username sudah dipakai pengguna lain.' })
    }
    try {
      const existingDb = await findUserByIdentifierFromDb(rawUsername)
      if (existingDb && existingDb.id !== sessionUser.id) {
        throw createError({ statusCode: 409, statusMessage: 'Username sudah dipakai pengguna lain.' })
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'statusCode' in err) throw err
    }
    nextUsername = rawUsername
  }

  // Validate email uniqueness if changed
  if (email !== sessionUser.email.toLowerCase()) {
    const existingMemEmail = findUserByIdentifier(email)
    if (existingMemEmail && existingMemEmail.id !== sessionUser.id) {
      throw createError({ statusCode: 409, statusMessage: 'Alamat email sudah digunakan akun lain.' })
    }
    try {
      const existingDbEmail = await findUserByEmailFromDb(email)
      if (existingDbEmail && existingDbEmail.id !== sessionUser.id) {
        throw createError({ statusCode: 409, statusMessage: 'Alamat email sudah digunakan akun lain.' })
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'statusCode' in err) throw err
    }
  }

  // Optional password change validation
  let passwordToSave: string | undefined
  if (newPassword) {
    if (newPassword.length < 6) {
      throw createError({ statusCode: 400, statusMessage: 'Kata sandi baru minimal 6 karakter.' })
    }
    if (!currentPassword) {
      throw createError({ statusCode: 400, statusMessage: 'Masukkan kata sandi saat ini untuk mengubah kata sandi.' })
    }
    let currentOk = verifyStoredUserPassword(sessionUser.id, currentPassword)
    if (!currentOk) {
      try {
        currentOk = await verifyUserPasswordFromDb(sessionUser.id, currentPassword)
      } catch {
        currentOk = false
      }
    }
    if (!currentOk) {
      throw createError({ statusCode: 401, statusMessage: 'Kata sandi saat ini tidak sesuai.' })
    }
    passwordToSave = newPassword
  }

  // Handle avatar (either external URL or uploaded base64 image served via /api/auth/avatar/[id])
  let sessionAvatarUrl = sessionUser.avatar
  let dbAvatarPayload: string | undefined
  if (rawAvatar) {
    if (rawAvatar.startsWith('data:image/')) {
      if (rawAvatar.length > 450_000) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Ukuran foto terlalu besar. Gunakan foto yang lebih kecil (maks. ~300KB).'
        })
      }
      setUploadedAvatarData(sessionUser.id, rawAvatar)
      sessionAvatarUrl = `/api/auth/avatar/${encodeURIComponent(sessionUser.id)}?v=${Date.now()}`
      dbAvatarPayload = rawAvatar
    } else if (/^https?:\/\//i.test(rawAvatar) || rawAvatar.startsWith('/')) {
      sessionAvatarUrl = rawAvatar
      dbAvatarPayload = rawAvatar
    } else {
      throw createError({ statusCode: 400, statusMessage: 'Format URL atau file foto profil tidak valid.' })
    }
  }

  // Update in-memory store
  const updatedUser = updateStoredUserProfile(
    sessionUser.id,
    {
      name,
      username: nextUsername,
      email,
      phone,
      origin: origin || 'Indonesia',
      avatar: sessionAvatarUrl,
      newPassword: passwordToSave
    },
    sessionUser
  )

  // Persist to TiDB Cloud (with automatic upsert for built-in accounts)
  try {
    const fallbackPwHash = getStoredUserPasswordHash(sessionUser.id)
    await updateUserProfileInDb(
      sessionUser.id,
      {
        name: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
        phone: updatedUser.phone || null,
        origin: updatedUser.origin,
        avatarData: dbAvatarPayload,
        newPassword: passwordToSave
      },
      fallbackPwHash
        ? {
            role: updatedUser.role,
            memberSince: updatedUser.memberSince,
            verified: updatedUser.verified,
            avatar: updatedUser.avatar,
            passwordHash: fallbackPwHash
          }
        : undefined
    )
  } catch {
    // Non-blocking fallback when TiDB is temporarily unreachable
  }

  setAuthSession(event, updatedUser)

  return {
    user: updatedUser,
    message: passwordToSave
      ? 'Profil dan kata sandi Anda berhasil diperbarui!'
      : 'Perubahan profil Anda berhasil disimpan!'
  }
})

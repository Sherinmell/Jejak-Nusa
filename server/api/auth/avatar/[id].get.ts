import { createError, defineEventHandler, getRouterParam, setHeader } from 'h3'
import { getUploadedAvatarData } from '../../../utils/authStore'
import { getUserAvatarFromDb } from '../../../utils/dbRepositories'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID pengguna tidak valid.' })
  }

  let raw = getUploadedAvatarData(id)
  if (!raw) {
    try {
      raw = await getUserAvatarFromDb(id)
    } catch {
      raw = null
    }
  }

  if (!raw || !raw.startsWith('data:image/')) {
    throw createError({ statusCode: 404, statusMessage: 'Foto profil tidak ditemukan.' })
  }

  const match = raw.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
  if (!match || !match[1] || !match[2]) {
    throw createError({ statusCode: 400, statusMessage: 'Format gambar tidak valid.' })
  }

  const mimeType = match[1]
  const buffer = Buffer.from(match[2], 'base64')
  setHeader(event, 'Content-Type', mimeType)
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return buffer
})

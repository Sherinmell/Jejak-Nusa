import { createError, defineEventHandler, readBody } from 'h3'
import type { TripLobbyMessage } from '#shared/types/booking'
import { getAuthSessionUser } from '../../utils/authStore'
import { loadLobbyMessages, saveLobbyMessages } from '../../utils/runtimePersistence'

export default defineEventHandler(async (event) => {
  const user = getAuthSessionUser(event)
  const body = await readBody<{ tripSlug?: string; message?: string }>(event)

  const tripSlug = typeof body?.tripSlug === 'string' ? body.tripSlug.trim() : ''
  const message = typeof body?.message === 'string' ? body.message.trim() : ''

  if (!tripSlug || message.length < 2) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Pesan chat minimal 2 karakter.'
    })
  }

  const now = new Date()
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`

  const newMsg: TripLobbyMessage = {
    id: `msg-${Date.now()}`,
    tripSlug,
    senderName: user?.name || 'Peserta Terkonfirmasi',
    senderRole: user?.role || 'customer',
    senderAvatar:
      user?.avatar ||
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=180&q=80',
    message,
    createdAt: timeStr
  }

  const list = await loadLobbyMessages()
  list.push(newMsg)
  await saveLobbyMessages(list)

  return { ok: true, message: newMsg }
})

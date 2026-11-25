import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import type { SupportThreadRecord } from '#shared/types/support'
import { getAuthSessionUser } from '../../../utils/authStore'
import { appendSupportReply, findSupportThreadById } from '../../../utils/supportStore'

export default defineEventHandler(async (event): Promise<{ thread: SupportThreadRecord; message: string }> => {
  const user = getAuthSessionUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Silakan login terlebih dahulu.'
    })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID tiket tidak valid.' })
  }

  const existing = await findSupportThreadById(id)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Percakapan tidak ditemukan.' })
  }

  // Ownership check for non-admin users
  if (user.role !== 'admin') {
    const isOwner =
      existing.customerId === user.id ||
      existing.customerEmail.trim().toLowerCase() === user.email.trim().toLowerCase()
    if (!isOwner) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Anda tidak memiliki izin untuk membalas percakapan ini.'
      })
    }
  }

  const body = await readBody<{ message?: string }>(event)
  const text = (body?.message || '').trim()
  if (text.length < 2) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Isi balasan tidak boleh kosong.'
    })
  }

  const updated = await appendSupportReply({
    threadId: id,
    senderRole: user.role === 'admin' ? 'admin' : 'customer',
    senderName: user.name,
    message: text
  })

  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Gagal menyimpan balasan.' })
  }

  return {
    thread: updated,
    message: user.role === 'admin' ? 'Balasan Admin terkirim ke pelanggan.' : 'Pesan lanjutan terkirim ke Admin.'
  }
})

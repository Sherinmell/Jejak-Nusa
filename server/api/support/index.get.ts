import { createError, defineEventHandler } from 'h3'
import type { SupportListResponse } from '#shared/types/support'
import { getAuthSessionUser } from '../../utils/authStore'
import { listSupportThreads } from '../../utils/supportStore'

export default defineEventHandler(async (event): Promise<SupportListResponse> => {
  const user = getAuthSessionUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Silakan login terlebih dahulu untuk mengakses pesan dukungan.'
    })
  }

  let threads = await listSupportThreads()

  // Strict per-customer isolation: customers ONLY see their own support threads
  if (user.role !== 'admin') {
    const emailLower = user.email.trim().toLowerCase()
    const nameLower = user.name.trim().toLowerCase()
    threads = threads.filter(
      (t) =>
        t.customerId === user.id ||
        t.customerEmail.trim().toLowerCase() === emailLower ||
        t.customerName.trim().toLowerCase() === nameLower
    )
  }

  return {
    threads,
    counts: {
      total: threads.length,
      waiting: threads.filter((t) => t.status === 'Menunggu Balasan').length,
      replied: threads.filter((t) => t.status === 'Dibalas Admin').length,
      resolved: threads.filter((t) => t.status === 'Selesai').length
    }
  }
})

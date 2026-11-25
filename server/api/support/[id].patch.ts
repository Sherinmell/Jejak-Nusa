import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import type { SupportThreadRecord, SupportThreadStatus } from '#shared/types/support'
import { requireAdmin } from '../../utils/requireAdmin'
import { updateSupportThreadStatus } from '../../utils/supportStore'

const VALID_STATUSES: SupportThreadStatus[] = ['Menunggu Balasan', 'Dibalas Admin', 'Selesai']

export default defineEventHandler(async (event): Promise<{ thread: SupportThreadRecord }> => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID tiket tidak valid.' })
  }

  const body = await readBody<{ status?: SupportThreadStatus }>(event)
  if (!body?.status || !VALID_STATUSES.includes(body.status)) {
    throw createError({ statusCode: 400, statusMessage: 'Status tiket tidak valid.' })
  }

  const updated = await updateSupportThreadStatus(id, body.status)
  if (!updated) {
    throw createError({ statusCode: 404, statusMessage: 'Percakapan tidak ditemukan.' })
  }

  return { thread: updated }
})

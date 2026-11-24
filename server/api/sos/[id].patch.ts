import { createError, defineEventHandler, getRouterParam } from 'h3'
import { requireAdmin } from '../../utils/requireAdmin'
import { sosAlertsStore } from '../../utils/platformStore'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  const found = sosAlertsStore.find((a) => a.id === id)

  if (!found) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Sinyal SOS tidak ditemukan.'
    })
  }

  found.status = 'RESOLVED'
  found.resolvedBy = admin.name
  found.resolvedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')

  return { ok: true, alert: found }
})

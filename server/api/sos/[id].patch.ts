import { createError, defineEventHandler, getRouterParam } from 'h3'
import { requireAdmin } from '../../utils/requireAdmin'
import { loadSosAlerts, saveSosAlerts } from '../../utils/runtimePersistence'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  const alerts = await loadSosAlerts()
  const found = alerts.find((a) => a.id === id)

  if (!found) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Sinyal SOS tidak ditemukan.'
    })
  }

  found.status = 'RESOLVED'
  found.resolvedBy = admin.name
  found.resolvedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')

  await saveSosAlerts(alerts)
  return { ok: true, alert: found }
})

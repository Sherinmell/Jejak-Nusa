import { defineEventHandler } from 'h3'
import { loadSosAlerts } from '../../utils/runtimePersistence'

export default defineEventHandler(async () => {
  const alerts = await loadSosAlerts()
  const activeCount = alerts.filter((a) => a.status === 'ACTIVE').length
  return {
    activeCount,
    alerts
  }
})

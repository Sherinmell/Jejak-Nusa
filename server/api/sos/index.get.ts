import { defineEventHandler } from 'h3'
import { sosAlertsStore } from '../../utils/platformStore'

export default defineEventHandler(() => {
  const activeCount = sosAlertsStore.filter((a) => a.status === 'ACTIVE').length
  return {
    activeCount,
    alerts: sosAlertsStore
  }
})

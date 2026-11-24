import { defineEventHandler } from 'h3'
import { requireAdmin } from '../../utils/requireAdmin'
import { guideVerificationsStore } from '../../utils/platformStore'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  return {
    applications: guideVerificationsStore,
    pendingCount: guideVerificationsStore.filter((v) => v.status === 'pending').length,
    approvedCount: guideVerificationsStore.filter((v) => v.status === 'approved').length
  }
})

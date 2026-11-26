import { defineEventHandler } from 'h3'
import { requireAdmin } from '../../utils/requireAdmin'
import { loadGuideVerifications } from '../../utils/runtimePersistence'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const applications = await loadGuideVerifications()

  return {
    applications,
    pendingCount: applications.filter((v) => v.status === 'pending').length,
    approvedCount: applications.filter((v) => v.status === 'approved').length
  }
})

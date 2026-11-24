import { defineEventHandler } from 'h3'
import type { AdminOverviewResponse } from '#shared/types/admin'
import { getAdminOverview } from '../../utils/adminCrud'
import { requireAdmin } from '../../utils/requireAdmin'

export default defineEventHandler(async (event): Promise<AdminOverviewResponse> => {
  await requireAdmin(event)
  return await getAdminOverview()
})

import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import type { AdminResourceName } from '#shared/types/admin'
import { createAdminRecord } from '../../../utils/adminCrud'
import { requireAdmin } from '../../../utils/requireAdmin'

const VALID_RESOURCES = new Set<AdminResourceName>([
  'trips',
  'hotels',
  'bookings',
  'users',
  'addons',
  'community',
  'custom-trips',
  'rewards'
])

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const resource = getRouterParam(event, 'resource') as AdminResourceName | undefined
  if (!resource || !VALID_RESOURCES.has(resource)) {
    throw createError({ statusCode: 400, statusMessage: 'Resource manajemen tidak dikenali.' })
  }

  const body = (await readBody<Record<string, unknown>>(event)) || {}
  const record = await createAdminRecord(resource, body, admin.name)

  return { ok: true, resource, record }
})

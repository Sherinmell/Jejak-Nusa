import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import type { AdminResourceName } from '#shared/types/admin'
import { updateAdminRecord } from '../../../utils/adminCrud'
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
  const id = getRouterParam(event, 'id')

  if (!resource || !VALID_RESOURCES.has(resource) || !id) {
    throw createError({ statusCode: 400, statusMessage: 'Parameter resource atau ID tidak valid.' })
  }

  const body = (await readBody<Record<string, unknown>>(event)) || {}
  const result = await updateAdminRecord(resource, id, body, admin.name)

  return { ok: true, resource, result }
})

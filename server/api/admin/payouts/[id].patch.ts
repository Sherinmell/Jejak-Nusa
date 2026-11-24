import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { requireAdmin } from '../../../utils/requireAdmin'
import { guidePayoutsStore, weatherRefundsStore } from '../../../utils/platformStore'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody<{
    kind?: 'payout' | 'refund'
    action?: 'release' | 'approve' | 'reject'
  }>(event)

  if (body?.kind === 'refund') {
    const refund = weatherRefundsStore.find((r) => r.id === id)
    if (!refund) {
      throw createError({ statusCode: 404, statusMessage: 'Pengajuan refund cuaca tidak ditemukan.' })
    }
    refund.status = body.action === 'reject' ? 'Ditolak' : 'Disetujui & Dikembalikan'
    return { ok: true, refund }
  }

  const payout = guidePayoutsStore.find((p) => p.id === id)
  if (!payout) {
    throw createError({ statusCode: 404, statusMessage: 'Data pencairan dana pemandu tidak ditemukan.' })
  }

  payout.status = 'Dicairkan'
  payout.releasedAt = new Date().toISOString().slice(0, 10)
  return { ok: true, payout }
})

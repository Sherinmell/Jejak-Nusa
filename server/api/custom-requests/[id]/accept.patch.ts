import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { customTripsStore } from '../../../utils/customTripStore'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody<{ bidId?: string }>(event)
  const target = customTripsStore.find((r) => r.id === id)

  if (!target) {
    throw createError({ statusCode: 404, statusMessage: 'Permintaan Custom Trip tidak ditemukan.' })
  }

  const bidId = typeof body?.bidId === 'string' ? body.bidId : ''
  const matchedBid = target.bids.find((b) => b.id === bidId)
  if (!matchedBid) {
    throw createError({ statusCode: 404, statusMessage: 'Penawaran pemandu tidak ditemukan.' })
  }

  target.status = 'Pemandu Dipilih'
  for (const bid of target.bids) {
    bid.status = bid.id === bidId ? 'Diterima' : 'Menunggu Pilihan'
  }

  return { ok: true, request: target }
})

import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { customTripsStore } from '../../utils/customTripStore'
import { acceptCustomTripBidInDb } from '../../utils/dbRepositories'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody<{ bidId?: string }>(event)

  if (!id || !body?.bidId) {
    throw createError({ statusCode: 400, statusMessage: 'Parameter request atau bid tidak valid.' })
  }

  try {
    const ok = await acceptCustomTripBidInDb(id, body.bidId)
    if (ok) return { ok: true, requestId: id, bidId: body.bidId }
  } catch {
    // fallback below
  }

  const req = customTripsStore.find((item) => item.id === id)
  if (!req) {
    throw createError({ statusCode: 404, statusMessage: 'Permintaan custom trip tidak ditemukan.' })
  }

  const targetBid = req.bids.find((b) => b.id === body.bidId)
  if (!targetBid) {
    throw createError({ statusCode: 404, statusMessage: 'Penawaran pemandu tidak ditemukan.' })
  }

  req.bids.forEach((b) => {
    b.status = b.id === targetBid.id ? 'Diterima' : 'Menunggu Pilihan'
  })
  req.status = 'Pemandu Dipilih'

  return { request: req }
})

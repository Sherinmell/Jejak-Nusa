import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import type { CustomTripBidPayload } from '#shared/types/booking'
import type { GuideBidProposal } from '#shared/types/ecosystem'
import { getAuthSessionUser } from '../../../utils/authStore'
import { customTripsStore } from '../../../utils/customTripStore'

export default defineEventHandler(async (event) => {
  const user = getAuthSessionUser(event)
  if (!user || (user.role !== 'guide' && user.role !== 'admin')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Hanya Pemandu Lokal terverifikasi yang dapat mengajukan penawaran.'
    })
  }

  const id = getRouterParam(event, 'id')
  const target = customTripsStore.find((r) => r.id === id)
  if (!target) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Permintaan Custom Trip tidak ditemukan.'
    })
  }

  const body = await readBody<Partial<CustomTripBidPayload>>(event)
  const pricePerPerson = Number(body?.pricePerPerson || 0)
  const note = typeof body?.note === 'string' ? body.note.trim() : ''
  const highlights = Array.isArray(body?.highlights)
    ? body.highlights.map((h) => String(h).trim()).filter(Boolean)
    : []

  if (pricePerPerson < 150000 || note.length < 5) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Masukkan harga penawaran valid dan catatan proposal minimal 5 karakter.'
    })
  }

  const newBid: GuideBidProposal = {
    id: `bid-${Date.now()}`,
    guideName: user.name,
    guideAvatar: user.avatar,
    guideCertification: user.certification || 'APGI / HPI Terverifikasi',
    guideRating: 4.92,
    pricePerPerson,
    proposedHighlights: highlights.length
      ? highlights
      : ['Pemandu lokal berlisensi penuh', 'Perlengkapan safety standar & dokumentasi foto/video'],
    note,
    status: 'Menunggu Pilihan'
  }

  target.bids.unshift(newBid)
  return { ok: true, bid: newBid, request: target }
})

import { createError, defineEventHandler, readBody } from 'h3'
import type { CreateCustomRequestPayload } from '#shared/types/booking'
import type { CustomTripRequest } from '#shared/types/ecosystem'
import { getAuthSessionUser } from '../../utils/authStore'
import { customTripsStore } from '../../utils/customTripStore'

export default defineEventHandler(async (event) => {
  const user = getAuthSessionUser(event)
  const body = await readBody<Partial<CreateCustomRequestPayload>>(event)

  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const destination = typeof body?.destination === 'string' ? body.destination.trim() : ''
  const category = body?.category || 'Trekking'
  const preferredDate = typeof body?.preferredDate === 'string' ? body.preferredDate : '2026-12-28'
  const groupSize = Math.max(2, Number(body?.groupSize || 5))
  const budgetPerPerson = Math.max(200000, Number(body?.budgetPerPerson || 1000000))
  const notes = typeof body?.notes === 'string' ? body.notes.trim() : ''

  if (title.length < 4 || destination.length < 2) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Judul rencana trip dan destinasi wajib diisi.'
    })
  }

  const created: CustomTripRequest = {
    id: `ct-${Date.now()}`,
    title,
    destination,
    category,
    preferredDate,
    groupSize,
    budgetPerPerson,
    requesterName: user?.name || 'Grup Pelanggan',
    notes: notes || 'Terbuka terhadap rekomendasi itinerary terbaik dari pemandu lokal terverifikasi.',
    status: 'Menerima Penawaran',
    createdAt: new Date().toISOString().slice(0, 10),
    bids: []
  }

  customTripsStore.unshift(created)

  return {
    ok: true,
    request: created
  }
})

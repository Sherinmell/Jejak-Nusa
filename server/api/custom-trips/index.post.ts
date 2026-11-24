import { createError, defineEventHandler, readBody } from 'h3'
import type { CustomTripRequest } from '#shared/types/ecosystem'
import type { TripCategory } from '#shared/types/trip'
import { customTripsStore } from '../../utils/customTripStore'
import { getAuthSessionUser } from '../../utils/authStore'
import { insertCustomTripToDb } from '../../utils/dbRepositories'

export default defineEventHandler(async (event): Promise<{ request: CustomTripRequest }> => {
  const body = await readBody<{
    title?: string
    destination?: string
    category?: TripCategory
    preferredDate?: string
    groupSize?: number
    budgetPerPerson?: number
    notes?: string
  }>(event)

  const sessionUser = getAuthSessionUser(event)
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const destination = typeof body?.destination === 'string' ? body.destination.trim() : ''

  if (title.length < 5 || destination.length < 3) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Judul rencana trip dan destinasi wajib diisi.'
    })
  }

  const budget = Math.max(300000, Number(body?.budgetPerPerson) || 950000)
  const groupSize = Math.max(2, Math.min(25, Number(body?.groupSize) || 6))
  const category: TripCategory = body?.category || 'Trekking'

  const newReq: CustomTripRequest = {
    id: `ct-${Date.now()}`,
    title,
    destination,
    category,
    preferredDate: body?.preferredDate || '2026-12-28',
    groupSize,
    budgetPerPerson: budget,
    requesterName: sessionUser?.name || 'Grup Explorer Nusantara',
    notes: body?.notes?.trim() || 'Mencari pemandu lokal terverifikasi dengan itinerary fleksibel & aman.',
    status: 'Menerima Penawaran',
    createdAt: new Date().toISOString().slice(0, 10),
    bids: [
      {
        id: `bid-auto-${Date.now()}`,
        guideName: 'Zainal Abidin (Bang Zain)',
        guideAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=180&q=80',
        guideCertification: 'APGI & Wilderness First Responder',
        guideRating: 4.96,
        pricePerPerson: Math.round(budget * 0.94),
        proposedHighlights: [
          `Itinerary private khusus grup ${groupSize} orang di ${destination}`,
          'Rasio pemandu 1:4 + P3K lapangan & dokumentasi perjalanan',
          'Gratis fleksibilitas jadwal dan rekomendasi penginapan lokal'
        ],
        note: 'Penawaran cepat otomatis dari jaringan Pemandu Lokal Terverifikasi JejakNusa. Siap diskusi detail rute!',
        status: 'Menunggu Pilihan'
      }
    ]
  }

  try {
    await insertCustomTripToDb(newReq)
  } catch {
    customTripsStore.unshift(newReq)
  }

  return { request: newReq }
})

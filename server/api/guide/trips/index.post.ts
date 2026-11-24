import { createError, defineEventHandler, readBody } from 'h3'
import type { CreateGuideTripPayload, GuideManagedTripItem } from '#shared/types/guide'
import type { Trip } from '#shared/types/trip'
import { getAuthSessionUser } from '../../../utils/authStore'
import { dynamicTripsStore, guideManagedPackagesStore } from '../../../utils/platformStore'

export default defineEventHandler(async (event) => {
  const user = getAuthSessionUser(event)
  if (!user || (user.role !== 'guide' && user.role !== 'admin')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Hanya Pemandu Lokal yang dapat membuat paket trip baru.'
    })
  }

  const body = await readBody<Partial<CreateGuideTripPayload>>(event)
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const location = typeof body?.location === 'string' ? body.location.trim() : ''
  const province = typeof body?.province === 'string' ? body.province.trim() : 'Indonesia'
  const category = body?.category || 'Trekking'
  const adrenalineLevel = body?.adrenalineLevel || 'Menengah'
  const pricePerPerson = Math.max(150000, Number(body?.pricePerPerson || 950000))
  const duration = typeof body?.duration === 'string' && body.duration.trim() ? body.duration.trim() : '2 Hari 1 Malam'
  const nextDepartureDate = typeof body?.nextDepartureDate === 'string' && body.nextDepartureDate ? body.nextDepartureDate : '2026-12-28'
  const totalQuota = Math.max(2, Number(body?.totalQuota || 10))
  const meetingPoint = typeof body?.meetingPoint === 'string' && body.meetingPoint.trim() ? body.meetingPoint.trim() : `Basecamp ${location}`
  const shortDescription =
    typeof body?.shortDescription === 'string' && body.shortDescription.trim()
      ? body.shortDescription.trim()
      : `Petualangan ${category} terverifikasi di ${location} bersama pemandu lokal berpengalaman.`

  if (title.length < 4 || location.length < 2) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Judul trip (min. 4 karakter) dan lokasi wajib diisi.'
    })
  }

  const slugBase = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const slug = `${slugBase}-${Date.now().toString().slice(-4)}`
  const id = `trip-${Date.now()}`

  const itinerary = Array.isArray(body?.itinerary) && body.itinerary.length
    ? body.itinerary.map((it, idx) => ({
        day: it.day || `Hari ${idx + 1}`,
        title: it.title || `Eksplorasi Hari ${idx + 1}`,
        activities: Array.isArray(it.activities) && it.activities.length ? it.activities : ['Briefing keselamatan & eksplorasi jalur']
      }))
    : [
        {
          day: 'Hari 1',
          title: 'Meeting Point & Eksplorasi Utama',
          activities: ['Briefing keselamatan & pengecekan gear wajib', 'Eksplorasi rute utama bersama pemandu lokal']
        }
      ]

  const gearChecklist = Array.isArray(body?.gearChecklist) && body.gearChecklist.length
    ? body.gearChecklist.map((g, idx) => ({
        id: `gc-${Date.now()}-${idx}`,
        item: g.item.trim(),
        mandatory: Boolean(g.mandatory)
      })).filter((g) => g.item.length > 0)
    : [
        { id: `gc-${Date.now()}-1`, item: 'Sepatu outdoor ber-grip baik', mandatory: true },
        { id: `gc-${Date.now()}-2`, item: 'Jaket hujan / windproof & obat pribadi', mandatory: true }
      ]

  const coverImage =
    category === 'Diving'
      ? 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80'
      : category === 'Canyoning'
        ? 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80'
        : category === 'Caving'
          ? 'https://images.unsplash.com/photo-1504870712357-65ea720d6078?auto=format&fit=crop&w=1200&q=80'
          : 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80'

  const managedTrip: GuideManagedTripItem = {
    id,
    slug,
    title,
    location,
    province,
    category,
    adrenalineLevel,
    duration,
    nextDepartureDate,
    pricePerPerson,
    totalQuota,
    bookedCount: 0,
    quotaOpen: true,
    trailWeatherStatus: 'Buka',
    weatherNote: 'Baru dipublikasikan — Kondisi jalur dibuka dan aman.',
    coverImage,
    meetingPoint,
    gearChecklist,
    itinerary
  }

  guideManagedPackagesStore.unshift(managedTrip)

  const catalogTrip: Trip = {
    id,
    slug,
    title,
    location,
    province,
    category,
    adrenalineLevel,
    pricePerPerson,
    duration,
    nextDepartureDate,
    totalQuota,
    remainingQuota: totalQuota,
    meetingPoint,
    featured: true,
    rating: 4.9,
    reviewCount: 1,
    coverImage,
    gallery: [coverImage],
    shortDescription,
    description: `${shortDescription} Dilengkapi daftar perlengkapan wajib (Gear Checklist) dan briefing keselamatan standar pemandu lokal.`,
    highlights: gearChecklist.slice(0, 3).map((g) => `Perlengkapan: ${g.item}`),
    itinerary,
    included: ['Pemandu lokal terverifikasi', 'Tiket masuk & retribusi desa', 'P3K standar lapangan'],
    excluded: ['Transportasi menuju meeting point', 'Perlengkapan pribadi sesuai Gear Checklist'],
    guide: {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      origin: user.origin,
      verified: user.verified,
      certifications: [user.certification || 'APGI / HPI Terverifikasi'],
      experienceYears: 5,
      completedTrips: 42,
      rating: 4.9,
      reviewCount: 28,
      languages: ['Indonesia', 'Inggris'],
      responseTime: '< 15 menit',
      bio: `Pemandu lokal berlisensi dari ${user.origin}.`
    },
    reviews: []
  }

  dynamicTripsStore.unshift(catalogTrip)

  return {
    ok: true,
    trip: managedTrip
  }
})

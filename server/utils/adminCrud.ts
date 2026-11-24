import type { RowDataPacket } from 'mysql2/promise'
import { normalizeUserRole } from '#shared/types/auth'
import type {
  AdminAuditLog,
  AdminOverviewResponse,
  AdminResourceName,
  AdminUserRecord
} from '#shared/types/admin'
import type { AdrenalineLevel, Trip, TripCategory } from '#shared/types/trip'
import type { Hotel, HotelType } from '#shared/types/hotel'
import type {
  BuddyTravelStyle,
  CommunityBuddyPost,
  GearAddon,
  GuideBookingRecord
} from '#shared/types/adventure'
import type { CustomTripRequest, LoyaltyReward } from '#shared/types/ecosystem'
import { GEAR_ADDONS } from '#shared/types/adventure'
import { TRIPS_DATA } from './tripsData'
import { HOTELS_DATA } from './hotelsData'
import { communityPostsStore } from './communityStore'
import { guideBookingsStore } from './guidePortalStore'
import { customTripsStore } from './customTripStore'
import { passportStateStore } from './passportStore'
import {
  ensureDatabaseReady,
  executeSql,
  getSafeDatabaseName,
  hashPassword,
  queryRows
} from './db'
import {
  getAllHotelsFromDb,
  getAllTripsFromDb,
  getCommunityPostsFromDb,
  getCustomTripsFromDb,
  insertCommunityPostToDb,
  insertCustomTripToDb,
  insertTripToDb
} from './dbRepositories'

// In-memory fallback mirrors (only used if TiDB credentials are not yet active)
const fallbackAddons: GearAddon[] = [...GEAR_ADDONS]
const fallbackUsers: AdminUserRecord[] = [
  {
    id: 'usr-explorer-1',
    name: 'Nadia Kusuma',
    email: 'customer@jejaknusa.id',
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&q=80',
    origin: 'Jakarta Selatan',
    memberSince: '2025-04-12',
    verified: true,
    points: 1850,
    totalKmExplored: 148
  },
  {
    id: 'usr-guide-1',
    name: 'I Made Surya Pratama',
    email: 'guide@jejaknusa.id',
    role: 'guide',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&q=80',
    origin: 'Singaraja, Bali',
    memberSince: '2024-08-03',
    verified: true,
    points: 2400,
    totalKmExplored: 320
  },
  {
    id: 'usr-admin-1',
    name: 'Administrator JejakNusa',
    email: 'admin@jejaknusa.id',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=240&q=80',
    origin: 'Jakarta Pusat',
    memberSince: '2024-01-01',
    verified: true,
    points: 5000,
    totalKmExplored: 500
  }
]
const fallbackAuditLogs: AdminAuditLog[] = [
  {
    id: 'log-local-1',
    action: 'CREATE',
    resource: 'database',
    recordId: getSafeDatabaseName(),
    summary: `Siap menggunakan database baru "${getSafeDatabaseName()}" (bukan sys).`,
    actor: 'System',
    createdAt: new Date().toISOString()
  }
]

async function logAudit(
  action: AdminAuditLog['action'],
  resource: string,
  recordId: string,
  summary: string,
  actor = 'Admin JejakNusa'
) {
  const entry: AdminAuditLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    action,
    resource,
    recordId,
    summary,
    actor,
    createdAt: new Date().toISOString()
  }
  try {
    await executeSql(
      `INSERT INTO admin_audit_logs (id, action, resource, record_id, summary, actor, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [entry.id, entry.action, entry.resource, entry.recordId, entry.summary, entry.actor, entry.createdAt]
    )
  } catch {
    fallbackAuditLogs.unshift(entry)
  }
}

interface AddonRow extends RowDataPacket {
  id: string
  name: string
  category: GearAddon['category']
  price: number
  unit: string
  description: string
  recommended_json: string
}

interface AuditRow extends RowDataPacket {
  id: string
  action: AdminAuditLog['action']
  resource: string
  record_id: string
  summary: string
  actor: string
  created_at: string
}

interface AdminUserRow extends RowDataPacket {
  id: string
  name: string
  email: string
  role: 'explorer' | 'guide' | 'admin'
  avatar: string
  origin: string
  member_since: string
  verified: number
  points: number
  total_km_explored: number
}

interface BookingRow extends RowDataPacket {
  id: string
  booking_code: string
  trip_slug: string
  trip_title: string
  departure_date: string
  leader_name: string
  leader_origin: string
  participants_count: number
  is_solo_traveler: number
  has_insurance: number
  addons_json: string
  emergency_contact: string
  payment_scheme: 'DP 30%' | 'Lunas 100%'
  payment_status: GuideBookingRecord['paymentStatus']
  booking_status: GuideBookingRecord['bookingStatus']
  total_amount: number
  paid_amount: number
}

interface RewardRow extends RowDataPacket {
  id: string
  title: string
  points_cost: number
  badge_text: string
  description: string
  redeemed_code: string | null
}

export async function getAdminOverview(): Promise<AdminOverviewResponse> {
  const databaseName = getSafeDatabaseName()

  try {
    await ensureDatabaseReady()
    const [trips, hotels, community, customTrips, userRows, bookingRows, addonRows, rewardRows, auditRows] =
      await Promise.all([
        getAllTripsFromDb(),
        getAllHotelsFromDb(),
        getCommunityPostsFromDb(),
        getCustomTripsFromDb(),
        queryRows<AdminUserRow>('SELECT id, name, email, role, avatar, origin, member_since, verified, points, total_km_explored FROM users ORDER BY created_at DESC'),
        queryRows<BookingRow>('SELECT * FROM guide_bookings ORDER BY created_at DESC'),
        queryRows<AddonRow>('SELECT * FROM gear_addons ORDER BY id ASC'),
        queryRows<RewardRow>('SELECT * FROM passport_rewards ORDER BY points_cost ASC'),
        queryRows<AuditRow>('SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT 50')
      ])

    const users: AdminUserRecord[] = userRows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: normalizeUserRole(u.role),
      avatar: u.avatar,
      origin: u.origin,
      memberSince: u.member_since,
      verified: Boolean(u.verified),
      points: Number(u.points),
      totalKmExplored: Number(u.total_km_explored)
    }))

    const bookings: GuideBookingRecord[] = bookingRows.map((b) => ({
      id: b.id,
      bookingCode: b.booking_code,
      tripSlug: b.trip_slug,
      tripTitle: b.trip_title,
      departureDate: b.departure_date,
      leaderName: b.leader_name,
      leaderOrigin: b.leader_origin,
      participantsCount: Number(b.participants_count),
      isSoloTraveler: Boolean(b.is_solo_traveler),
      hasInsurance: Boolean(b.has_insurance),
      addonsSummary: JSON.parse(b.addons_json || '[]') as string[],
      emergencyContact: b.emergency_contact,
      paymentScheme: b.payment_scheme,
      paymentStatus: b.payment_status,
      bookingStatus: b.booking_status,
      totalAmount: Number(b.total_amount),
      paidAmount: Number(b.paid_amount)
    }))

    const addons: GearAddon[] = addonRows.map((a) => ({
      id: a.id,
      name: a.name,
      category: a.category,
      price: Number(a.price),
      unit: a.unit,
      description: a.description,
      recommendedFor: JSON.parse(a.recommended_json || '[]') as TripCategory[]
    }))

    const rewards: LoyaltyReward[] = rewardRows.map((r) => ({
      id: r.id,
      title: r.title,
      pointsCost: Number(r.points_cost),
      badgeText: r.badge_text,
      description: r.description,
      redeemedCode: r.redeemed_code || undefined
    }))

    const auditLogs: AdminAuditLog[] = auditRows.map((l) => ({
      id: l.id,
      action: l.action,
      resource: l.resource,
      recordId: l.record_id,
      summary: l.summary,
      actor: l.actor,
      createdAt: l.created_at
    }))

    return {
      storageMode: 'tidb',
      databaseName,
      counts: {
        trips: trips.length,
        hotels: hotels.length,
        bookings: bookings.length,
        users: users.length,
        addons: addons.length,
        community: community.length,
        customTrips: customTrips.length,
        rewards: rewards.length,
        auditLogs: auditLogs.length
      },
      trips,
      hotels,
      bookings,
      users,
      addons,
      community,
      customTrips,
      rewards,
      auditLogs
    }
  } catch (err: unknown) {
    const dbError = err instanceof Error ? err.message : 'TiDB Cloud connection unavailable'
    return {
      storageMode: 'fallback',
      databaseName,
      dbError,
      counts: {
        trips: TRIPS_DATA.length,
        hotels: HOTELS_DATA.length,
        bookings: guideBookingsStore.length,
        users: fallbackUsers.length,
        addons: fallbackAddons.length,
        community: communityPostsStore.length,
        customTrips: customTripsStore.length,
        rewards: passportStateStore.rewards.length,
        auditLogs: fallbackAuditLogs.length
      },
      trips: TRIPS_DATA,
      hotels: HOTELS_DATA,
      bookings: guideBookingsStore,
      users: fallbackUsers,
      addons: fallbackAddons,
      community: communityPostsStore,
      customTrips: customTripsStore,
      rewards: passportStateStore.rewards,
      auditLogs: fallbackAuditLogs
    }
  }
}

export async function createAdminRecord(
  resource: AdminResourceName,
  payload: Record<string, unknown>,
  actor = 'Admin JejakNusa'
) {
  const nowId = Date.now().toString()

  if (resource === 'trips') {
    const title = String(payload.title || '').trim()
    const location = String(payload.location || '').trim()
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'trip'}-${nowId.slice(-4)}`
    const totalQuota = Math.max(2, Number(payload.totalQuota) || 10)
    const trip: Trip = {
      id: `trip-${nowId}`,
      slug,
      title: title || 'Open Trip Nusantara Baru',
      location: location || 'Bali',
      province: String(payload.province || location || 'Bali').trim(),
      category: (payload.category as TripCategory) || 'Trekking',
      adrenalineLevel: (payload.adrenalineLevel as AdrenalineLevel) || 'Menengah',
      pricePerPerson: Math.max(100000, Number(payload.pricePerPerson) || 850000),
      duration: String(payload.duration || '2 Hari 1 Malam'),
      nextDepartureDate: String(payload.nextDepartureDate || '2026-12-27'),
      totalQuota,
      remainingQuota: Number(payload.remainingQuota ?? totalQuota),
      meetingPoint: String(payload.meetingPoint || `Basecamp ${location || 'Nusantara'}`),
      featured: Boolean(payload.featured),
      rating: 4.9,
      reviewCount: 1,
      coverImage:
        String(payload.coverImage || '').trim() ||
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80',
      gallery: [
        String(payload.coverImage || '').trim() ||
          'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80'
      ],
      shortDescription: String(payload.shortDescription || `Petualangan seru di ${location || 'Indonesia'}.`),
      description: String(payload.description || payload.shortDescription || `Paket open trip terverifikasi di ${location || 'Indonesia'}.`),
      highlights: ['Dipandu Pemandu Lokal Terverifikasi', 'Rasio keamanan 1:4 & P3K lapangan'],
      itinerary: [
        { day: 'Hari 1', title: 'Safety Briefing & Eksplorasi', activities: ['Registrasi peserta', 'Kegiatan utama petualangan'] }
      ],
      included: ['Pemandu Lokal Terverifikasi', 'Tiket masuk kawasan', 'P3K & dokumentasi'],
      excluded: ['Transportasi dari kota asal', 'Pengeluaran pribadi'],
      guide: TRIPS_DATA[0]!.guide,
      reviews: []
    }
    try {
      await insertTripToDb(trip)
    } catch {
      TRIPS_DATA.unshift(trip)
    }
    await logAudit('CREATE', 'trips', trip.id, `Menambahkan Open Trip "${trip.title}"`, actor)
    return trip
  }

  if (resource === 'hotels') {
    const name = String(payload.name || '').trim() || 'Eco Lodge Baru'
    const location = String(payload.location || 'Bali').trim()
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}-${nowId.slice(-4)}`
    const pricePerNight = Math.max(150000, Number(payload.pricePerNight) || 650000)
    const hotel: Hotel = {
      id: `hotel-${nowId}`,
      slug,
      name,
      location,
      province: String(payload.province || location).trim(),
      type: (payload.type as HotelType) || 'Eco Lodge',
      stars: Math.min(5, Math.max(1, Number(payload.stars) || 4)),
      rating: Number(payload.rating) || 4.85,
      reviewCount: 12,
      pricePerNight,
      nearTripSlug: String(payload.nearTripSlug || TRIPS_DATA[0]!.slug),
      nearTripLabel: String(payload.nearTripLabel || 'Open Trip Terdekat'),
      distanceToBasecamp: String(payload.distanceToBasecamp || '10 menit ke basecamp trip'),
      verifiedPartner: true,
      featured: Boolean(payload.featured),
      coverImage:
        String(payload.coverImage || '').trim() ||
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
      gallery: [
        String(payload.coverImage || '').trim() ||
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80'
      ],
      shortDescription: String(payload.shortDescription || `Penginapan nyaman & bersih di ${location}.`),
      description: String(payload.description || payload.shortDescription || `Partner penginapan resmi JejakNusa di ${location}.`),
      facilities: ['Wi-Fi Cepat', 'Sarapan Pagi', 'Air Panas', 'Penitipan Gear Outdoor'],
      checkInTime: '14:00',
      checkOutTime: '12:00',
      rooms: [
        {
          id: `room-${nowId}`,
          name: 'Deluxe Explorer Room',
          capacity: 2,
          bedType: '1 Queen Bed',
          sizeSqm: 32,
          pricePerNight,
          breakfastIncluded: true,
          availableRooms: 5,
          amenities: ['AC', 'Air Panas', 'Sarapan 2 Orang']
        }
      ],
      policies: ['Pembatalan gratis H-3 sebelum check-in.']
    }

    try {
      await executeSql(
        `INSERT INTO hotels
          (id, slug, name, location, province, type, stars, rating, review_count, price_per_night,
           near_trip_slug, near_trip_label, distance_to_basecamp, verified_partner, featured,
           cover_image, short_description, description, check_in_time, check_out_time, data_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          hotel.id,
          hotel.slug,
          hotel.name,
          hotel.location,
          hotel.province,
          hotel.type,
          hotel.stars,
          hotel.rating,
          hotel.reviewCount,
          hotel.pricePerNight,
          hotel.nearTripSlug,
          hotel.nearTripLabel,
          hotel.distanceToBasecamp,
          1,
          hotel.featured ? 1 : 0,
          hotel.coverImage,
          hotel.shortDescription,
          hotel.description,
          hotel.checkInTime,
          hotel.checkOutTime,
          JSON.stringify({
            gallery: hotel.gallery,
            facilities: hotel.facilities,
            rooms: hotel.rooms,
            policies: hotel.policies
          })
        ]
      )
    } catch {
      HOTELS_DATA.unshift(hotel)
    }
    await logAudit('CREATE', 'hotels', hotel.id, `Menambahkan penginapan "${hotel.name}"`, actor)
    return hotel
  }

  if (resource === 'bookings') {
    const totalAmount = Math.max(100000, Number(payload.totalAmount) || 1200000)
    const scheme = (payload.paymentScheme as 'DP 30%' | 'Lunas 100%') || 'DP 30%'
    const paidAmount =
      Number(payload.paidAmount) || (scheme === 'DP 30%' ? Math.ceil(totalAmount * 0.3) : totalAmount)
    const booking: GuideBookingRecord = {
      id: `bk-${nowId}`,
      bookingCode: `JN-${nowId.slice(-6)}`,
      tripSlug: String(payload.tripSlug || TRIPS_DATA[0]!.slug),
      tripTitle: String(payload.tripTitle || TRIPS_DATA[0]!.title),
      departureDate: String(payload.departureDate || '2026-12-20'),
      leaderName: String(payload.leaderName || 'Peserta Explorer'),
      leaderOrigin: String(payload.leaderOrigin || 'Jakarta'),
      participantsCount: Math.max(1, Number(payload.participantsCount) || 1),
      isSoloTraveler: Boolean(payload.isSoloTraveler),
      hasInsurance: payload.hasInsurance !== false,
      addonsSummary: Array.isArray(payload.addonsSummary)
        ? payload.addonsSummary.map(String)
        : [],
      emergencyContact: String(payload.emergencyContact || 'Belum diisi'),
      paymentScheme: scheme,
      paymentStatus:
        (payload.paymentStatus as GuideBookingRecord['paymentStatus']) ||
        (scheme === 'DP 30%' ? 'DP 30% Lunas' : 'Lunas 100%'),
      bookingStatus:
        (payload.bookingStatus as GuideBookingRecord['bookingStatus']) || 'Menunggu Konfirmasi',
      totalAmount,
      paidAmount
    }
    try {
      await executeSql(
        `INSERT INTO guide_bookings
          (id, booking_code, trip_slug, trip_title, departure_date, leader_name, leader_origin,
           participants_count, is_solo_traveler, has_insurance, addons_json, emergency_contact,
           payment_scheme, payment_status, booking_status, total_amount, paid_amount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          booking.id,
          booking.bookingCode,
          booking.tripSlug,
          booking.tripTitle,
          booking.departureDate,
          booking.leaderName,
          booking.leaderOrigin,
          booking.participantsCount,
          booking.isSoloTraveler ? 1 : 0,
          booking.hasInsurance ? 1 : 0,
          JSON.stringify(booking.addonsSummary),
          booking.emergencyContact,
          booking.paymentScheme,
          booking.paymentStatus,
          booking.bookingStatus,
          booking.totalAmount,
          booking.paidAmount
        ]
      )
    } catch {
      guideBookingsStore.unshift(booking)
    }
    await logAudit('CREATE', 'bookings', booking.id, `Booking ${booking.bookingCode} atas nama ${booking.leaderName}`, actor)
    return booking
  }

  if (resource === 'users') {
    const email = String(payload.email || `user${nowId.slice(-4)}@jejaknusa.id`).trim().toLowerCase()
    const record: AdminUserRecord = {
      id: `usr-${nowId}`,
      name: String(payload.name || 'Pengguna Baru').trim(),
      email,
      role: normalizeUserRole(String(payload.role || 'customer')),
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=240&q=80',
      origin: String(payload.origin || 'Indonesia').trim(),
      memberSince: new Date().toISOString().slice(0, 10),
      verified: payload.verified !== false,
      points: Number(payload.points ?? 500),
      totalKmExplored: Number(payload.totalKmExplored ?? 0)
    }
    try {
      await executeSql(
        `INSERT INTO users (id, name, email, password_hash, role, avatar, origin, member_since, verified, points, total_km_explored)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.id,
          record.name,
          record.email,
          hashPassword(String(payload.password || 'jejaknusa123')),
          record.role,
          record.avatar,
          record.origin,
          record.memberSince,
          record.verified ? 1 : 0,
          record.points,
          record.totalKmExplored
        ]
      )
    } catch {
      fallbackUsers.unshift(record)
    }
    await logAudit('CREATE', 'users', record.id, `Menambahkan akun ${record.role}: ${record.name} (${record.email})`, actor)
    return record
  }

  if (resource === 'addons') {
    const addon: GearAddon = {
      id: `addon-${nowId}`,
      name: String(payload.name || 'Perlengkapan Outdoor').trim(),
      category: (payload.category as GearAddon['category']) || 'Perlengkapan',
      price: Math.max(10000, Number(payload.price) || 50000),
      unit: String(payload.unit || 'per orang'),
      description: String(payload.description || 'Perlengkapan standar petualangan outdoor.'),
      recommendedFor: Array.isArray(payload.recommendedFor)
        ? (payload.recommendedFor as TripCategory[])
        : ['Trekking', 'Canyoning']
    }
    try {
      await executeSql(
        `INSERT INTO gear_addons (id, name, category, price, unit, description, recommended_json)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          addon.id,
          addon.name,
          addon.category,
          addon.price,
          addon.unit,
          addon.description,
          JSON.stringify(addon.recommendedFor)
        ]
      )
    } catch {
      fallbackAddons.unshift(addon)
    }
    await logAudit('CREATE', 'addons', addon.id, `Menambahkan Add-On "${addon.name}"`, actor)
    return addon
  }

  if (resource === 'community') {
    const post: CommunityBuddyPost = {
      id: `post-${nowId}`,
      tripSlug: String(payload.tripSlug || TRIPS_DATA[0]!.slug),
      tripTitle: String(payload.tripTitle || TRIPS_DATA[0]!.title),
      location: String(payload.location || 'Indonesia'),
      authorName: String(payload.authorName || 'Explorer'),
      authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      authorOrigin: String(payload.authorOrigin || 'Jakarta'),
      travelStyle: (payload.travelStyle as BuddyTravelStyle) || 'Solo Traveler',
      departureDate: String(payload.departureDate || '2026-12-15'),
      slotsLookingFor: Math.max(1, Number(payload.slotsLookingFor) || 2),
      note: String(payload.note || 'Cari barengan open trip seru!'),
      likes: 1,
      createdAt: new Date().toISOString().slice(0, 10)
    }
    try {
      await insertCommunityPostToDb(post)
    } catch {
      communityPostsStore.unshift(post)
    }
    await logAudit('CREATE', 'community', post.id, `Membuat postingan komunitas oleh ${post.authorName}`, actor)
    return post
  }

  if (resource === 'custom-trips') {
    const req: CustomTripRequest = {
      id: `ct-${nowId}`,
      title: String(payload.title || 'Private Trip Baru').trim(),
      destination: String(payload.destination || 'Bali').trim(),
      category: (payload.category as TripCategory) || 'Trekking',
      preferredDate: String(payload.preferredDate || '2026-12-28'),
      groupSize: Math.max(2, Number(payload.groupSize) || 6),
      budgetPerPerson: Math.max(200000, Number(payload.budgetPerPerson) || 950000),
      requesterName: String(payload.requesterName || 'Admin / Grup'),
      notes: String(payload.notes || 'Permintaan private trip baru.'),
      status: 'Menerima Penawaran',
      bids: [],
      createdAt: new Date().toISOString().slice(0, 10)
    }
    try {
      await insertCustomTripToDb(req)
    } catch {
      customTripsStore.unshift(req)
    }
    await logAudit('CREATE', 'custom-trips', req.id, `Membuat permintaan Custom Trip "${req.title}"`, actor)
    return req
  }

  // rewards
  const reward: LoyaltyReward = {
    id: `rew-${nowId}`,
    title: String(payload.title || 'Voucher Diskon Petualangan').trim(),
    pointsCost: Math.max(100, Number(payload.pointsCost) || 500),
    badgeText: String(payload.badgeText || 'Promo Member'),
    description: String(payload.description || 'Voucher penukaran poin loyalitas JejakNusa.')
  }
  try {
    await executeSql(
      `INSERT INTO passport_rewards (id, title, points_cost, badge_text, description, redeemed_code)
       VALUES (?, ?, ?, ?, ?, NULL)`,
      [reward.id, reward.title, reward.pointsCost, reward.badgeText, reward.description]
    )
  } catch {
    passportStateStore.rewards.unshift(reward)
  }
  await logAudit('CREATE', 'rewards', reward.id, `Menambahkan reward loyalitas "${reward.title}"`, actor)
  return reward
}

export async function updateAdminRecord(
  resource: AdminResourceName,
  id: string,
  payload: Record<string, unknown>,
  actor = 'Admin JejakNusa'
) {
  if (resource === 'trips') {
    try {
      await executeSql(
        `UPDATE trips
         SET title = COALESCE(?, title),
             location = COALESCE(?, location),
             category = COALESCE(?, category),
             adrenaline_level = COALESCE(?, adrenaline_level),
             price_per_person = COALESCE(?, price_per_person),
             remaining_quota = COALESCE(?, remaining_quota),
             featured = COALESCE(?, featured)
         WHERE id = ?`,
        [
          payload.title !== undefined ? String(payload.title) : null,
          payload.location !== undefined ? String(payload.location) : null,
          payload.category !== undefined ? String(payload.category) : null,
          payload.adrenalineLevel !== undefined ? String(payload.adrenalineLevel) : null,
          payload.pricePerPerson !== undefined ? Number(payload.pricePerPerson) : null,
          payload.remainingQuota !== undefined ? Number(payload.remainingQuota) : null,
          payload.featured !== undefined ? (payload.featured ? 1 : 0) : null,
          id
        ]
      )
    } catch {
      const target = TRIPS_DATA.find((t) => t.id === id)
      if (target) {
        if (payload.title !== undefined) target.title = String(payload.title)
        if (payload.location !== undefined) target.location = String(payload.location)
        if (payload.category !== undefined) target.category = payload.category as TripCategory
        if (payload.adrenalineLevel !== undefined) target.adrenalineLevel = payload.adrenalineLevel as AdrenalineLevel
        if (payload.pricePerPerson !== undefined) target.pricePerPerson = Number(payload.pricePerPerson)
        if (payload.remainingQuota !== undefined) target.remainingQuota = Number(payload.remainingQuota)
        if (payload.featured !== undefined) target.featured = Boolean(payload.featured)
      }
    }
    await logAudit('UPDATE', 'trips', id, `Memperbarui data Open Trip (${id})`, actor)
    return { ok: true, id }
  }

  if (resource === 'hotels') {
    try {
      await executeSql(
        `UPDATE hotels
         SET name = COALESCE(?, name),
             location = COALESCE(?, location),
             type = COALESCE(?, type),
             price_per_night = COALESCE(?, price_per_night),
             stars = COALESCE(?, stars),
             featured = COALESCE(?, featured)
         WHERE id = ?`,
        [
          payload.name !== undefined ? String(payload.name) : null,
          payload.location !== undefined ? String(payload.location) : null,
          payload.type !== undefined ? String(payload.type) : null,
          payload.pricePerNight !== undefined ? Number(payload.pricePerNight) : null,
          payload.stars !== undefined ? Number(payload.stars) : null,
          payload.featured !== undefined ? (payload.featured ? 1 : 0) : null,
          id
        ]
      )
    } catch {
      const target = HOTELS_DATA.find((h) => h.id === id)
      if (target) {
        if (payload.name !== undefined) target.name = String(payload.name)
        if (payload.location !== undefined) target.location = String(payload.location)
        if (payload.type !== undefined) target.type = payload.type as HotelType
        if (payload.pricePerNight !== undefined) target.pricePerNight = Number(payload.pricePerNight)
        if (payload.stars !== undefined) target.stars = Number(payload.stars)
        if (payload.featured !== undefined) target.featured = Boolean(payload.featured)
      }
    }
    await logAudit('UPDATE', 'hotels', id, `Memperbarui data Penginapan (${id})`, actor)
    return { ok: true, id }
  }

  if (resource === 'bookings') {
    try {
      await executeSql(
        `UPDATE guide_bookings
         SET booking_status = COALESCE(?, booking_status),
             payment_status = COALESCE(?, payment_status),
             participants_count = COALESCE(?, participants_count)
         WHERE id = ?`,
        [
          payload.bookingStatus !== undefined ? String(payload.bookingStatus) : null,
          payload.paymentStatus !== undefined ? String(payload.paymentStatus) : null,
          payload.participantsCount !== undefined ? Number(payload.participantsCount) : null,
          id
        ]
      )
    } catch {
      const target = guideBookingsStore.find((b) => b.id === id)
      if (target) {
        if (payload.bookingStatus !== undefined) target.bookingStatus = payload.bookingStatus as GuideBookingRecord['bookingStatus']
        if (payload.paymentStatus !== undefined) target.paymentStatus = payload.paymentStatus as GuideBookingRecord['paymentStatus']
        if (payload.participantsCount !== undefined) target.participantsCount = Number(payload.participantsCount)
      }
    }
    await logAudit('UPDATE', 'bookings', id, `Memperbarui status Booking (${id})`, actor)
    return { ok: true, id }
  }

  if (resource === 'users') {
    try {
      await executeSql(
        `UPDATE users
         SET name = COALESCE(?, name),
             role = COALESCE(?, role),
             origin = COALESCE(?, origin),
             points = COALESCE(?, points),
             verified = COALESCE(?, verified)
         WHERE id = ?`,
        [
          payload.name !== undefined ? String(payload.name) : null,
          payload.role !== undefined ? String(payload.role) : null,
          payload.origin !== undefined ? String(payload.origin) : null,
          payload.points !== undefined ? Number(payload.points) : null,
          payload.verified !== undefined ? (payload.verified ? 1 : 0) : null,
          id
        ]
      )
    } catch {
      const target = fallbackUsers.find((u) => u.id === id)
      if (target) {
        if (payload.name !== undefined) target.name = String(payload.name)
        if (payload.role !== undefined) target.role = normalizeUserRole(String(payload.role))
        if (payload.origin !== undefined) target.origin = String(payload.origin)
        if (payload.points !== undefined) target.points = Number(payload.points)
        if (payload.verified !== undefined) target.verified = Boolean(payload.verified)
      }
    }
    await logAudit('UPDATE', 'users', id, `Memperbarui data Pengguna (${id})`, actor)
    return { ok: true, id }
  }

  if (resource === 'addons') {
    try {
      await executeSql(
        `UPDATE gear_addons
         SET name = COALESCE(?, name),
             category = COALESCE(?, category),
             price = COALESCE(?, price),
             unit = COALESCE(?, unit),
             description = COALESCE(?, description)
         WHERE id = ?`,
        [
          payload.name !== undefined ? String(payload.name) : null,
          payload.category !== undefined ? String(payload.category) : null,
          payload.price !== undefined ? Number(payload.price) : null,
          payload.unit !== undefined ? String(payload.unit) : null,
          payload.description !== undefined ? String(payload.description) : null,
          id
        ]
      )
    } catch {
      const target = fallbackAddons.find((a) => a.id === id)
      if (target) {
        if (payload.name !== undefined) target.name = String(payload.name)
        if (payload.category !== undefined) target.category = payload.category as GearAddon['category']
        if (payload.price !== undefined) target.price = Number(payload.price)
        if (payload.unit !== undefined) target.unit = String(payload.unit)
        if (payload.description !== undefined) target.description = String(payload.description)
      }
    }
    await logAudit('UPDATE', 'addons', id, `Memperbarui Add-On Gear (${id})`, actor)
    return { ok: true, id }
  }

  if (resource === 'community') {
    try {
      await executeSql(
        `UPDATE community_posts
         SET note = COALESCE(?, note),
             travel_style = COALESCE(?, travel_style),
             likes = COALESCE(?, likes)
         WHERE id = ?`,
        [
          payload.note !== undefined ? String(payload.note) : null,
          payload.travelStyle !== undefined ? String(payload.travelStyle) : null,
          payload.likes !== undefined ? Number(payload.likes) : null,
          id
        ]
      )
    } catch {
      const target = communityPostsStore.find((p) => p.id === id)
      if (target) {
        if (payload.note !== undefined) target.note = String(payload.note)
        if (payload.travelStyle !== undefined) target.travelStyle = payload.travelStyle as BuddyTravelStyle
        if (payload.likes !== undefined) target.likes = Number(payload.likes)
      }
    }
    await logAudit('UPDATE', 'community', id, `Memperbarui postingan komunitas (${id})`, actor)
    return { ok: true, id }
  }

  if (resource === 'custom-trips') {
    try {
      await executeSql(
        `UPDATE custom_trip_requests
         SET title = COALESCE(?, title),
             destination = COALESCE(?, destination),
             status = COALESCE(?, status),
             budget_per_person = COALESCE(?, budget_per_person)
         WHERE id = ?`,
        [
          payload.title !== undefined ? String(payload.title) : null,
          payload.destination !== undefined ? String(payload.destination) : null,
          payload.status !== undefined ? String(payload.status) : null,
          payload.budgetPerPerson !== undefined ? Number(payload.budgetPerPerson) : null,
          id
        ]
      )
    } catch {
      const target = customTripsStore.find((c) => c.id === id)
      if (target) {
        if (payload.title !== undefined) target.title = String(payload.title)
        if (payload.destination !== undefined) target.destination = String(payload.destination)
        if (payload.status !== undefined) target.status = payload.status as CustomTripRequest['status']
        if (payload.budgetPerPerson !== undefined) target.budgetPerPerson = Number(payload.budgetPerPerson)
      }
    }
    await logAudit('UPDATE', 'custom-trips', id, `Memperbarui Custom Trip (${id})`, actor)
    return { ok: true, id }
  }

  // rewards
  try {
    await executeSql(
      `UPDATE passport_rewards
       SET title = COALESCE(?, title),
           points_cost = COALESCE(?, points_cost),
           badge_text = COALESCE(?, badge_text),
           redeemed_code = ?
       WHERE id = ?`,
      [
        payload.title !== undefined ? String(payload.title) : null,
        payload.pointsCost !== undefined ? Number(payload.pointsCost) : null,
        payload.badgeText !== undefined ? String(payload.badgeText) : null,
        payload.resetRedeem ? null : payload.redeemedCode ? String(payload.redeemedCode) : null,
        id
      ]
    )
  } catch {
    const target = passportStateStore.rewards.find((r) => r.id === id)
    if (target) {
      if (payload.title !== undefined) target.title = String(payload.title)
      if (payload.pointsCost !== undefined) target.pointsCost = Number(payload.pointsCost)
      if (payload.badgeText !== undefined) target.badgeText = String(payload.badgeText)
      if (payload.resetRedeem) target.redeemedCode = undefined
    }
  }
  await logAudit('UPDATE', 'rewards', id, `Memperbarui Reward Loyalitas (${id})`, actor)
  return { ok: true, id }
}

export async function deleteAdminRecord(
  resource: AdminResourceName,
  id: string,
  actor = 'Admin JejakNusa'
) {
  const tableMap: Record<AdminResourceName, string> = {
    trips: 'trips',
    hotels: 'hotels',
    bookings: 'guide_bookings',
    users: 'users',
    addons: 'gear_addons',
    community: 'community_posts',
    'custom-trips': 'custom_trip_requests',
    rewards: 'passport_rewards'
  }

  const tableName = tableMap[resource]
  try {
    if (resource === 'custom-trips') {
      await executeSql('DELETE FROM custom_trip_bids WHERE request_id = ?', [id])
    }
    await executeSql(`DELETE FROM \`${tableName}\` WHERE id = ?`, [id])
  } catch {
    if (resource === 'trips') {
      const i = TRIPS_DATA.findIndex((x) => x.id === id)
      if (i !== -1) TRIPS_DATA.splice(i, 1)
    } else if (resource === 'hotels') {
      const i = HOTELS_DATA.findIndex((x) => x.id === id)
      if (i !== -1) HOTELS_DATA.splice(i, 1)
    } else if (resource === 'bookings') {
      const i = guideBookingsStore.findIndex((x) => x.id === id)
      if (i !== -1) guideBookingsStore.splice(i, 1)
    } else if (resource === 'users') {
      const i = fallbackUsers.findIndex((x) => x.id === id)
      if (i !== -1) fallbackUsers.splice(i, 1)
    } else if (resource === 'addons') {
      const i = fallbackAddons.findIndex((x) => x.id === id)
      if (i !== -1) fallbackAddons.splice(i, 1)
    } else if (resource === 'community') {
      const i = communityPostsStore.findIndex((x) => x.id === id)
      if (i !== -1) communityPostsStore.splice(i, 1)
    } else if (resource === 'custom-trips') {
      const i = customTripsStore.findIndex((x) => x.id === id)
      if (i !== -1) customTripsStore.splice(i, 1)
    } else if (resource === 'rewards') {
      const i = passportStateStore.rewards.findIndex((x) => x.id === id)
      if (i !== -1) passportStateStore.rewards.splice(i, 1)
    }
  }

  await logAudit('DELETE', resource, id, `Menghapus data pada modul ${resource} (${id})`, actor)
  return { ok: true, id }
}

import type { RowDataPacket } from 'mysql2/promise'
import { normalizeUserRole, type AuthUser, type UserRole } from '#shared/types/auth'
import type { AdrenalineLevel, Trip, TripCategory } from '#shared/types/trip'
import type { Hotel, HotelType } from '#shared/types/hotel'
import type {
  BuddyTravelStyle,
  CommunityBuddyPost,
  GuideBookingRecord,
  GuideBookingStatus,
  GuideDashboardResponse,
  GuideManagedTrip,
  TrailConditionStatus
} from '#shared/types/adventure'
import type {
  CustomTripRequest,
  GuideBidProposal,
  LoyaltyReward,
  MemberTier,
  PassportProfileResponse,
  PassportStamp
} from '#shared/types/ecosystem'
import { executeSql, hashPassword, queryRows, type SqlParam } from './db'
import { hashPasswordSecure, normalizePhoneNumber, verifyPasswordSecure } from './authStore'
import { passportStateStore } from './passportStore'

// ---------- TRIPS ----------
interface TripRow extends RowDataPacket {
  id: string
  slug: string
  title: string
  location: string
  province: string
  category: TripCategory
  adrenaline_level: AdrenalineLevel
  price_per_person: number
  duration: string
  next_departure_date: string
  total_quota: number
  remaining_quota: number
  meeting_point: string
  featured: number
  rating: number | string
  review_count: number
  cover_image: string
  short_description: string
  description: string
  trail_status: TrailConditionStatus
  last_weather_update: string
  data_json: string
}

function mapTripRow(row: TripRow): Trip {
  const extra = JSON.parse(row.data_json) as Pick<
    Trip,
    'gallery' | 'highlights' | 'itinerary' | 'included' | 'excluded' | 'guide' | 'reviews'
  >
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    location: row.location,
    province: row.province,
    category: row.category,
    adrenalineLevel: row.adrenaline_level,
    pricePerPerson: Number(row.price_per_person),
    duration: row.duration,
    nextDepartureDate: row.next_departure_date,
    totalQuota: Number(row.total_quota),
    remainingQuota: Number(row.remaining_quota),
    meetingPoint: row.meeting_point,
    featured: Boolean(row.featured),
    rating: Number(row.rating),
    reviewCount: Number(row.review_count),
    coverImage: row.cover_image,
    shortDescription: row.short_description,
    description: row.description,
    ...extra
  }
}

export async function getAllTripsFromDb(): Promise<Trip[]> {
  const rows = await queryRows<TripRow>('SELECT * FROM trips ORDER BY featured DESC, created_at DESC')
  return rows.map(mapTripRow)
}

export async function getTripBySlugFromDb(slug: string): Promise<Trip | null> {
  const rows = await queryRows<TripRow>('SELECT * FROM trips WHERE slug = ? LIMIT 1', [slug])
  return rows[0] ? mapTripRow(rows[0]) : null
}

export async function insertTripToDb(trip: Trip): Promise<void> {
  const dataJson = JSON.stringify({
    gallery: trip.gallery,
    highlights: trip.highlights,
    itinerary: trip.itinerary,
    included: trip.included,
    excluded: trip.excluded,
    guide: trip.guide,
    reviews: trip.reviews
  })
  await executeSql(
    `INSERT INTO trips
      (id, slug, title, location, province, category, adrenaline_level, price_per_person, duration,
       next_departure_date, total_quota, remaining_quota, meeting_point, featured, rating, review_count,
       cover_image, short_description, description, trail_status, last_weather_update, data_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      trip.id,
      trip.slug,
      trip.title,
      trip.location,
      trip.province,
      trip.category,
      trip.adrenalineLevel,
      trip.pricePerPerson,
      trip.duration,
      trip.nextDepartureDate,
      trip.totalQuota,
      trip.remainingQuota,
      trip.meetingPoint,
      trip.featured ? 1 : 0,
      trip.rating,
      trip.reviewCount,
      trip.coverImage,
      trip.shortDescription,
      trip.description,
      'Aman & Dibuka',
      'Baru dipublikasikan — Kondisi jalur siap berangkat',
      dataJson
    ]
  )
}

// ---------- HOTELS ----------
interface HotelRow extends RowDataPacket {
  id: string
  slug: string
  name: string
  location: string
  province: string
  type: HotelType
  stars: number
  rating: number | string
  review_count: number
  price_per_night: number
  near_trip_slug: string
  near_trip_label: string
  distance_to_basecamp: string
  verified_partner: number
  featured: number
  cover_image: string
  short_description: string
  description: string
  check_in_time: string
  check_out_time: string
  data_json: string
}

function mapHotelRow(row: HotelRow): Hotel {
  const extra = JSON.parse(row.data_json) as Pick<Hotel, 'gallery' | 'facilities' | 'rooms' | 'policies'>
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    location: row.location,
    province: row.province,
    type: row.type,
    stars: Number(row.stars),
    rating: Number(row.rating),
    reviewCount: Number(row.review_count),
    pricePerNight: Number(row.price_per_night),
    nearTripSlug: row.near_trip_slug,
    nearTripLabel: row.near_trip_label,
    distanceToBasecamp: row.distance_to_basecamp,
    verifiedPartner: Boolean(row.verified_partner),
    featured: Boolean(row.featured),
    coverImage: row.cover_image,
    shortDescription: row.short_description,
    description: row.description,
    checkInTime: row.check_in_time,
    checkOutTime: row.check_out_time,
    ...extra
  }
}

export async function getAllHotelsFromDb(): Promise<Hotel[]> {
  const rows = await queryRows<HotelRow>('SELECT * FROM hotels ORDER BY featured DESC, rating DESC')
  return rows.map(mapHotelRow)
}

export async function getHotelBySlugFromDb(slug: string): Promise<Hotel | null> {
  const rows = await queryRows<HotelRow>('SELECT * FROM hotels WHERE slug = ? LIMIT 1', [slug])
  return rows[0] ? mapHotelRow(rows[0]) : null
}

// ---------- USERS & AUTH ----------
interface UserRow extends RowDataPacket {
  id: string
  username?: string | null
  name: string
  email: string
  phone?: string | null
  password_hash: string
  role: UserRole
  avatar: string
  origin: string
  member_since: string
  verified: number
  points: number
  total_km_explored: number
}

function mapUserRow(row: UserRow): AuthUser {
  const safeAvatar =
    row.avatar && row.avatar.startsWith('data:image/')
      ? `/api/auth/avatar/${encodeURIComponent(row.id)}`
      : row.avatar
  return {
    id: row.id,
    username: row.username || undefined,
    name: row.name,
    email: row.email,
    phone: row.phone || undefined,
    role: normalizeUserRole(row.role),
    avatar: safeAvatar,
    origin: row.origin,
    memberSince: row.member_since,
    verified: Boolean(row.verified)
  }
}

export async function findUserByEmailFromDb(email: string): Promise<UserRow | null> {
  const rows = await queryRows<UserRow>('SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1', [email.trim()])
  return rows[0] ?? null
}

export async function findUserByIdentifierFromDb(identifier: string): Promise<UserRow | null> {
  const clean = identifier.trim()
  if (!clean) return null

  const rows = await queryRows<UserRow>(
    'SELECT * FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?) LIMIT 1',
    [clean, clean]
  )
  if (rows[0]) return rows[0]

  const normPhone = normalizePhoneNumber(clean)
  if (normPhone.length >= 9) {
    const phoneRows = await queryRows<UserRow>('SELECT * FROM users WHERE phone IS NOT NULL AND phone <> ""')
    const matched = phoneRows.find((r) => normalizePhoneNumber(r.phone) === normPhone)
    if (matched) return matched
  }

  return null
}

export async function findUserByIdFromDb(id: string): Promise<AuthUser | null> {
  const rows = await queryRows<UserRow>('SELECT * FROM users WHERE id = ? LIMIT 1', [id])
  return rows[0] ? mapUserRow(rows[0]) : null
}

export async function getUserAvatarFromDb(id: string): Promise<string | null> {
  const rows = await queryRows<RowDataPacket>('SELECT avatar FROM users WHERE id = ? LIMIT 1', [id])
  const val = rows[0]?.avatar
  return typeof val === 'string' && val.length > 0 ? val : null
}

export async function verifyUserPasswordFromDb(id: string, plainPassword: string): Promise<boolean> {
  const rows = await queryRows<UserRow>('SELECT password_hash FROM users WHERE id = ? LIMIT 1', [id])
  const row = rows[0]
  if (!row) return false
  return verifyPasswordSecure(plainPassword, row.password_hash) || row.password_hash === hashPassword(plainPassword)
}

export async function updateUserProfileInDb(
  id: string,
  updates: {
    name?: string
    username?: string
    email?: string
    phone?: string | null
    origin?: string
    avatarData?: string
    newPassword?: string
  }
): Promise<boolean> {
  const fields: string[] = []
  const params: SqlParam[] = []

  if (updates.name !== undefined) {
    fields.push('name = ?')
    params.push(updates.name)
  }
  if (updates.username !== undefined) {
    fields.push('username = ?')
    params.push(updates.username)
  }
  if (updates.email !== undefined) {
    fields.push('email = ?')
    params.push(updates.email)
  }
  if (updates.phone !== undefined) {
    fields.push('phone = ?')
    params.push(updates.phone)
  }
  if (updates.origin !== undefined) {
    fields.push('origin = ?')
    params.push(updates.origin)
  }
  if (updates.avatarData !== undefined) {
    fields.push('avatar = ?')
    params.push(updates.avatarData)
  }
  if (updates.newPassword !== undefined) {
    fields.push('password_hash = ?')
    params.push(hashPasswordSecure(updates.newPassword))
  }

  if (!fields.length) return false
  params.push(id)

  const result = await executeSql(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params)
  return result.affectedRows > 0
}

export async function authenticateUserFromDb(identifier: string, password: string): Promise<AuthUser | null> {
  const row = await findUserByIdentifierFromDb(identifier)
  if (!row) return null
  const ok =
    verifyPasswordSecure(password, row.password_hash) ||
    row.password_hash === hashPassword(password)
  if (!ok) return null
  return mapUserRow(row)
}

export async function registerUserInDb(input: {
  username?: string
  name: string
  email: string
  phone?: string
  password: string
  origin?: string
  role?: 'customer' | 'guide'
}): Promise<AuthUser> {
  const id = `usr-${Date.now()}`
  const email = input.email.trim().toLowerCase()
  const username = input.username?.trim().toLowerCase() || email.split('@')[0] || `user_${Date.now().toString().slice(-4)}`
  const phone = input.phone?.trim() || null
  const origin = input.origin?.trim() || 'Indonesia'
  const role: UserRole = input.role === 'guide' ? 'guide' : 'customer'
  const dbRole = role === 'guide' ? 'guide' : 'customer'
  const memberSince = new Date().toISOString().slice(0, 10)
  const avatar = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=240&q=80'
  const secureHash = hashPasswordSecure(input.password)

  await executeSql(
    `INSERT INTO users (id, username, name, email, phone, password_hash, role, avatar, origin, member_since, verified, points, total_km_explored)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
    [id, username, input.name.trim(), email, phone, secureHash, dbRole, avatar, origin, memberSince, role === 'guide' ? 0 : 1]
  )

  return {
    id,
    username,
    name: input.name.trim(),
    email,
    phone: phone || undefined,
    role,
    avatar,
    origin,
    memberSince,
    verified: role !== 'guide'
  }
}

// ---------- COMMUNITY ----------
interface CommunityRow extends RowDataPacket {
  id: string
  trip_slug: string
  trip_title: string
  location: string
  author_name: string
  author_avatar: string
  author_origin: string
  travel_style: BuddyTravelStyle
  departure_date: string
  slots_looking_for: number
  note: string
  likes: number
  created_at: string
}

export async function getCommunityPostsFromDb(
  tripSlug?: string,
  style?: string
): Promise<CommunityBuddyPost[]> {
  const conditions: string[] = []
  const params: SqlParam[] = []

  if (tripSlug) {
    conditions.push('trip_slug = ?')
    params.push(tripSlug)
  }
  if (style) {
    conditions.push('travel_style = ?')
    params.push(style)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const rows = await queryRows<CommunityRow>(
    `SELECT * FROM community_posts ${where} ORDER BY created_at DESC, id DESC`,
    params
  )

  return rows.map((r) => ({
    id: r.id,
    tripSlug: r.trip_slug,
    tripTitle: r.trip_title,
    location: r.location,
    authorName: r.author_name,
    authorAvatar: r.author_avatar,
    authorOrigin: r.author_origin,
    travelStyle: r.travel_style,
    departureDate: r.departure_date,
    slotsLookingFor: Number(r.slots_looking_for),
    note: r.note,
    likes: Number(r.likes),
    createdAt: r.created_at
  }))
}

export async function insertCommunityPostToDb(post: CommunityBuddyPost): Promise<void> {
  await executeSql(
    `INSERT INTO community_posts
      (id, trip_slug, trip_title, location, author_name, author_avatar, author_origin,
       travel_style, departure_date, slots_looking_for, note, likes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      post.id,
      post.tripSlug,
      post.tripTitle,
      post.location,
      post.authorName,
      post.authorAvatar,
      post.authorOrigin,
      post.travelStyle,
      post.departureDate,
      post.slotsLookingFor,
      post.note,
      post.likes,
      post.createdAt
    ]
  )
}

// ---------- GUIDE PORTAL ----------
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
  booking_status: GuideBookingStatus
  total_amount: number
  paid_amount: number
}

export async function getGuideDashboardFromDb(): Promise<GuideDashboardResponse> {
  const tripRows = await queryRows<TripRow>('SELECT * FROM trips ORDER BY created_at DESC LIMIT 6')
  const bookingRows = await queryRows<BookingRow>('SELECT * FROM guide_bookings ORDER BY created_at DESC')

  const managedTrips: GuideManagedTrip[] = tripRows.map((t) => ({
    id: t.id,
    slug: t.slug,
    title: t.title,
    location: t.location,
    category: t.category,
    adrenalineLevel: t.adrenaline_level,
    nextDepartureDate: t.next_departure_date,
    pricePerPerson: Number(t.price_per_person),
    totalQuota: Number(t.total_quota),
    bookedCount: Math.max(0, Number(t.total_quota) - Number(t.remaining_quota)),
    trailStatus: t.trail_status || 'Aman & Dibuka',
    lastWeatherUpdate: t.last_weather_update || 'Kondisi jalur terpantau aman'
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

  const escrowBalance = bookings.reduce((sum, b) => sum + b.paidAmount, 0)
  const monthlyRevenue = escrowBalance + 14850000
  const activeParticipants = managedTrips.reduce((sum, t) => sum + t.bookedCount, 0)

  return {
    guideName: 'I Made Surya Pratama',
    certifications: ['ICOpro Canyoning Guide Lv. 2', 'BASARNAS Water Rescue', 'First Aid Wilderness'],
    escrowBalance,
    monthlyRevenue,
    activeParticipants,
    averageRating: 4.95,
    safetyScore: 99,
    managedTrips,
    bookings
  }
}

export async function updateBookingStatusInDb(id: string, status: GuideBookingStatus): Promise<boolean> {
  const res = await executeSql('UPDATE guide_bookings SET booking_status = ? WHERE id = ?', [status, id])
  return res.affectedRows > 0
}

export async function updateTrailStatusInDb(
  tripId: string,
  trailStatus: TrailConditionStatus
): Promise<boolean> {
  const note = `Diperbarui dari Guide Portal — Status lapangan: ${trailStatus}`
  const res = await executeSql(
    'UPDATE trips SET trail_status = ?, last_weather_update = ? WHERE id = ?',
    [trailStatus, note, tripId]
  )
  return res.affectedRows > 0
}

// ---------- CUSTOM TRIPS & BIDDING ----------
interface CustomReqRow extends RowDataPacket {
  id: string
  title: string
  destination: string
  category: TripCategory
  preferred_date: string
  group_size: number
  budget_per_person: number
  requester_name: string
  notes: string
  status: CustomTripRequest['status']
  created_at: string
}

interface CustomBidRow extends RowDataPacket {
  id: string
  request_id: string
  guide_name: string
  guide_avatar: string
  guide_certification: string
  guide_rating: number | string
  price_per_person: number
  highlights_json: string
  note: string
  status: GuideBidProposal['status']
}

export async function getCustomTripsFromDb(): Promise<CustomTripRequest[]> {
  const reqRows = await queryRows<CustomReqRow>(
    'SELECT * FROM custom_trip_requests ORDER BY created_at DESC, id DESC'
  )
  const bidRows = await queryRows<CustomBidRow>('SELECT * FROM custom_trip_bids')

  return reqRows.map((req) => ({
    id: req.id,
    title: req.title,
    destination: req.destination,
    category: req.category,
    preferredDate: req.preferred_date,
    groupSize: Number(req.group_size),
    budgetPerPerson: Number(req.budget_per_person),
    requesterName: req.requester_name,
    notes: req.notes,
    status: req.status,
    createdAt: req.created_at,
    bids: bidRows
      .filter((b) => b.request_id === req.id)
      .map((b) => ({
        id: b.id,
        guideName: b.guide_name,
        guideAvatar: b.guide_avatar,
        guideCertification: b.guide_certification,
        guideRating: Number(b.guide_rating),
        pricePerPerson: Number(b.price_per_person),
        proposedHighlights: JSON.parse(b.highlights_json || '[]') as string[],
        note: b.note,
        status: b.status
      }))
  }))
}

export async function insertCustomTripToDb(req: CustomTripRequest): Promise<void> {
  await executeSql(
    `INSERT INTO custom_trip_requests
      (id, title, destination, category, preferred_date, group_size, budget_per_person,
       requester_name, notes, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.id,
      req.title,
      req.destination,
      req.category,
      req.preferredDate,
      req.groupSize,
      req.budgetPerPerson,
      req.requesterName,
      req.notes,
      req.status,
      req.createdAt
    ]
  )

  for (const bid of req.bids) {
    await executeSql(
      `INSERT INTO custom_trip_bids
        (id, request_id, guide_name, guide_avatar, guide_certification, guide_rating,
         price_per_person, highlights_json, note, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bid.id,
        req.id,
        bid.guideName,
        bid.guideAvatar,
        bid.guideCertification,
        bid.guideRating,
        bid.pricePerPerson,
        JSON.stringify(bid.proposedHighlights),
        bid.note,
        bid.status
      ]
    )
  }
}

export async function acceptCustomTripBidInDb(requestId: string, bidId: string): Promise<boolean> {
  const res = await executeSql(
    `UPDATE custom_trip_bids SET status = CASE WHEN id = ? THEN 'Diterima' ELSE 'Menunggu Pilihan' END WHERE request_id = ?`,
    [bidId, requestId]
  )
  if (res.affectedRows === 0) return false
  await executeSql(`UPDATE custom_trip_requests SET status = 'Pemandu Dipilih' WHERE id = ?`, [requestId])
  return true
}

// ---------- ADVENTURE PASSPORT ----------
interface StampRow extends RowDataPacket {
  id: string
  province: string
  destination: string
  trip_title: string
  date: string
  guide_name: string
  category: TripCategory
}

interface RewardRow extends RowDataPacket {
  id: string
  title: string
  points_cost: number
  badge_text: string
  description: string
  redeemed_code: string | null
}

export async function getPassportFromDb(userId?: string, explorerName?: string): Promise<PassportProfileResponse> {
  const targetUserId = userId || 'usr-explorer-1'
  const userRows = await queryRows<UserRow>('SELECT * FROM users WHERE id = ? LIMIT 1', [targetUserId])
  const userRow = userRows[0]

  const stampRows = await queryRows<StampRow>(
    'SELECT * FROM passport_stamps ORDER BY date DESC'
  )
  const rewardRows = await queryRows<RewardRow>('SELECT * FROM passport_rewards')

  const points = Number(userRow?.points ?? 1850)
  const totalKmExplored = Number(userRow?.total_km_explored ?? 148)

  let tier: MemberTier = 'Trailblazer'
  let nextTierName: MemberTier = 'Summit Seeker'
  let nextTierPoints = 1000
  if (points >= 2500) {
    tier = 'Nusantara Legend'
    nextTierName = 'Nusantara Legend'
    nextTierPoints = 2500
  } else if (points >= 1000) {
    tier = 'Summit Seeker'
    nextTierName = 'Nusantara Legend'
    nextTierPoints = 2500
  }

  const stamps: PassportStamp[] = stampRows.map((s) => ({
    id: s.id,
    province: s.province,
    destination: s.destination,
    tripTitle: s.trip_title,
    date: s.date,
    guideName: s.guide_name,
    category: s.category
  }))

  const visitedProvinces = Array.from(new Set(stamps.map((s) => s.province)))

  const rewards: LoyaltyReward[] = rewardRows.map((r) => ({
    id: r.id,
    title: r.title,
    pointsCost: Number(r.points_cost),
    badgeText: r.badge_text,
    description: r.description,
    redeemedCode: r.redeemed_code || undefined
  }))

  return {
    explorerName: explorerName || userRow?.name || 'Nadia Kusuma (Explorer)',
    tier,
    points,
    nextTierName,
    nextTierPoints,
    completedTripsCount: stamps.length,
    totalKmExplored,
    visitedProvinces,
    stamps,
    badges: passportStateStore.badges,
    rewards
  }
}

export async function redeemPassportRewardInDb(
  rewardId: string,
  userId?: string
): Promise<{ code: string; remainingPoints: number; message: string }> {
  const targetUserId = userId || 'usr-explorer-1'
  const rewards = await queryRows<RewardRow>('SELECT * FROM passport_rewards WHERE id = ? LIMIT 1', [rewardId])
  const reward = rewards[0]
  if (!reward) {
    throw new Error('NOT_FOUND')
  }

  const users = await queryRows<UserRow>('SELECT * FROM users WHERE id = ? LIMIT 1', [targetUserId])
  const currentPoints = Number(users[0]?.points ?? 1850)

  if (reward.redeemed_code) {
    return {
      code: reward.redeemed_code,
      remainingPoints: currentPoints,
      message: 'Voucher ini sudah Anda tukarkan sebelumnya.'
    }
  }

  if (currentPoints < Number(reward.points_cost)) {
    throw new Error(`INSUFFICIENT:${currentPoints}:${reward.points_cost}`)
  }

  const nextPoints = currentPoints - Number(reward.points_cost)
  const code = `JN-${reward.id.slice(-3).toUpperCase()}-${Date.now().toString().slice(-4)}`

  await executeSql('UPDATE users SET points = ? WHERE id = ?', [nextPoints, targetUserId])
  await executeSql('UPDATE passport_rewards SET redeemed_code = ? WHERE id = ?', [code, rewardId])

  return {
    code,
    remainingPoints: nextPoints,
    message: `Berhasil menukar ${reward.points_cost} poin! Kode aktif: ${code}`
  }
}

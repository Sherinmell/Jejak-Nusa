import { createHash } from 'node:crypto'
import mysql, { type Pool, type ResultSetHeader, type RowDataPacket } from 'mysql2/promise'
import { resolveTripRequirements } from '#shared/types/trip'
import { TRIPS_DATA } from './tripsData'
import { HOTELS_DATA } from './hotelsData'
import { communityPostsStore } from './communityStore'
import { guideBookingsStore, guideManagedTripsStore } from './guidePortalStore'
import { customTripsStore } from './customTripStore'
import { passportStateStore } from './passportStore'
import { customerBookingsStore, platformFeaturesStore } from './platformStore'
import { GEAR_ADDONS } from '#shared/types/adventure'

const FORBIDDEN_SYSTEM_DATABASES = new Set([
  'sys',
  'mysql',
  'information_schema',
  'performance_schema',
  'metrics_schema'
])

export function getSafeDatabaseName(): string {
  const raw = (process.env.TIDB_DATABASE || 'jejaknusa').trim()
  if (!raw || FORBIDDEN_SYSTEM_DATABASES.has(raw.toLowerCase())) {
    return 'jejaknusa'
  }
  return raw.replace(/[^a-zA-Z0-9_]/g, '_')
}

let poolInstance: Pool | null = null
let initPromise: Promise<void> | null = null

export function hashPassword(password: string): string {
  return createHash('sha256').update(`jejaknusa_v1:${password}`).digest('hex')
}

function getDbConfig() {
  const host = process.env.TIDB_HOST || 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com'
  const port = Number(process.env.TIDB_PORT || 4000)
  const user = process.env.TIDB_USER || ''
  const password = process.env.TIDB_PASSWORD || ''
  const database = getSafeDatabaseName()
  const useSsl = process.env.TIDB_SSL !== 'false'

  return { host, port, user, password, database, useSsl }
}

export function getTidbPool(): Pool {
  if (!poolInstance) {
    const cfg = getDbConfig()
    poolInstance = mysql.createPool({
      host: cfg.host,
      port: cfg.port,
      user: cfg.user,
      password: cfg.password,
      database: cfg.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      ssl: cfg.useSsl
        ? {
            minVersion: 'TLSv1.2',
            rejectUnauthorized: true
          }
        : undefined
    })
  }
  return poolInstance
}

export type SqlParam = string | number | boolean | null | Date | Buffer

export async function queryRows<T extends RowDataPacket>(
  sql: string,
  params: SqlParam[] = []
): Promise<T[]> {
  await ensureDatabaseReady()
  const pool = getTidbPool()
  const [rows] = await pool.query<T[]>(sql, params)
  return rows
}

export async function executeSql(
  sql: string,
  params: SqlParam[] = []
): Promise<ResultSetHeader> {
  await ensureDatabaseReady()
  const pool = getTidbPool()
  const [result] = await pool.execute<ResultSetHeader>(sql, params)
  return result
}

export async function ensureDatabaseReady(): Promise<void> {
  if (!initPromise) {
    initPromise = runSchemaAndSeed().catch((err) => {
      initPromise = null
      throw err
    })
  }
  return initPromise
}

async function runSchemaAndSeed(): Promise<void> {
  const cfg = getDbConfig()

  // Step 1: Ensure database exists using bootstrap connection (without fixed database)
  const bootstrapConn = await mysql.createConnection({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    ssl: cfg.useSsl
      ? {
          minVersion: 'TLSv1.2',
          rejectUnauthorized: true
        }
      : undefined
  })

  try {
    await bootstrapConn.query(
      `CREATE DATABASE IF NOT EXISTS \`${cfg.database.replace(/`/g, '')}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
  } finally {
    await bootstrapConn.end()
  }

  const pool = getTidbPool()

  // Step 2: Create all tables (TiDB / MySQL 8 compatible)
  const ddlStatements = [
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      username VARCHAR(80) DEFAULT NULL UNIQUE,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(160) NOT NULL UNIQUE,
      phone VARCHAR(40) DEFAULT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('customer', 'explorer', 'guide', 'admin') NOT NULL DEFAULT 'customer',
      avatar TEXT,
      origin VARCHAR(120) NOT NULL DEFAULT 'Indonesia',
      member_since VARCHAR(20) NOT NULL,
      verified TINYINT(1) NOT NULL DEFAULT 1,
      points INT NOT NULL DEFAULT 0,
      total_km_explored INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS trips (
      id VARCHAR(80) PRIMARY KEY,
      slug VARCHAR(140) NOT NULL UNIQUE,
      title VARCHAR(220) NOT NULL,
      location VARCHAR(140) NOT NULL,
      province VARCHAR(100) NOT NULL,
      category VARCHAR(40) NOT NULL,
      adrenaline_level VARCHAR(40) NOT NULL,
      price_per_person INT NOT NULL,
      duration VARCHAR(80) NOT NULL,
      next_departure_date VARCHAR(20) NOT NULL,
      total_quota INT NOT NULL,
      remaining_quota INT NOT NULL,
      meeting_point TEXT NOT NULL,
      featured TINYINT(1) NOT NULL DEFAULT 0,
      rating DECIMAL(3,2) NOT NULL DEFAULT 4.80,
      review_count INT NOT NULL DEFAULT 0,
      cover_image TEXT NOT NULL,
      short_description TEXT NOT NULL,
      description TEXT NOT NULL,
      trail_status VARCHAR(60) NOT NULL DEFAULT 'Aman & Dibuka',
      last_weather_update VARCHAR(255) NOT NULL DEFAULT 'Terpantau aman & siap berangkat',
      data_json LONGTEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS hotels (
      id VARCHAR(80) PRIMARY KEY,
      slug VARCHAR(140) NOT NULL UNIQUE,
      name VARCHAR(200) NOT NULL,
      location VARCHAR(140) NOT NULL,
      province VARCHAR(100) NOT NULL,
      type VARCHAR(60) NOT NULL,
      stars INT NOT NULL DEFAULT 4,
      rating DECIMAL(3,2) NOT NULL DEFAULT 4.80,
      review_count INT NOT NULL DEFAULT 0,
      price_per_night INT NOT NULL,
      near_trip_slug VARCHAR(140) NOT NULL,
      near_trip_label VARCHAR(220) NOT NULL,
      distance_to_basecamp VARCHAR(200) NOT NULL,
      verified_partner TINYINT(1) NOT NULL DEFAULT 1,
      featured TINYINT(1) NOT NULL DEFAULT 0,
      cover_image TEXT NOT NULL,
      short_description TEXT NOT NULL,
      description TEXT NOT NULL,
      check_in_time VARCHAR(40) NOT NULL,
      check_out_time VARCHAR(40) NOT NULL,
      data_json LONGTEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS community_posts (
      id VARCHAR(80) PRIMARY KEY,
      trip_slug VARCHAR(140) NOT NULL,
      trip_title VARCHAR(220) NOT NULL,
      location VARCHAR(140) NOT NULL,
      author_name VARCHAR(120) NOT NULL,
      author_avatar TEXT,
      author_origin VARCHAR(120) NOT NULL,
      travel_style VARCHAR(60) NOT NULL,
      departure_date VARCHAR(20) NOT NULL,
      slots_looking_for INT NOT NULL DEFAULT 2,
      note TEXT NOT NULL,
      likes INT NOT NULL DEFAULT 1,
      created_at VARCHAR(30) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS guide_bookings (
      id VARCHAR(80) PRIMARY KEY,
      booking_code VARCHAR(40) NOT NULL UNIQUE,
      trip_slug VARCHAR(140) NOT NULL,
      trip_title VARCHAR(220) NOT NULL,
      departure_date VARCHAR(20) NOT NULL,
      leader_name VARCHAR(160) NOT NULL,
      leader_origin VARCHAR(120) NOT NULL,
      participants_count INT NOT NULL,
      is_solo_traveler TINYINT(1) NOT NULL DEFAULT 0,
      has_insurance TINYINT(1) NOT NULL DEFAULT 1,
      addons_json TEXT NOT NULL,
      emergency_contact VARCHAR(220) NOT NULL,
      payment_scheme VARCHAR(40) NOT NULL,
      payment_status VARCHAR(60) NOT NULL,
      booking_status VARCHAR(60) NOT NULL,
      total_amount INT NOT NULL,
      paid_amount INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS custom_trip_requests (
      id VARCHAR(80) PRIMARY KEY,
      title VARCHAR(220) NOT NULL,
      destination VARCHAR(160) NOT NULL,
      category VARCHAR(40) NOT NULL,
      preferred_date VARCHAR(20) NOT NULL,
      group_size INT NOT NULL,
      budget_per_person INT NOT NULL,
      requester_name VARCHAR(140) NOT NULL,
      notes TEXT NOT NULL,
      status VARCHAR(60) NOT NULL DEFAULT 'Menerima Penawaran',
      created_at VARCHAR(30) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS custom_trip_bids (
      id VARCHAR(80) PRIMARY KEY,
      request_id VARCHAR(80) NOT NULL,
      guide_name VARCHAR(140) NOT NULL,
      guide_avatar TEXT,
      guide_certification VARCHAR(160) NOT NULL,
      guide_rating DECIMAL(3,2) NOT NULL DEFAULT 4.90,
      price_per_person INT NOT NULL,
      highlights_json TEXT NOT NULL,
      note TEXT NOT NULL,
      status VARCHAR(40) NOT NULL DEFAULT 'Menunggu Pilihan',
      INDEX idx_custom_bids_req (request_id)
    )`,
    `CREATE TABLE IF NOT EXISTS passport_stamps (
      id VARCHAR(80) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      province VARCHAR(100) NOT NULL,
      destination VARCHAR(160) NOT NULL,
      trip_title VARCHAR(220) NOT NULL,
      date VARCHAR(20) NOT NULL,
      guide_name VARCHAR(140) NOT NULL,
      category VARCHAR(40) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS passport_rewards (
      id VARCHAR(80) PRIMARY KEY,
      title VARCHAR(180) NOT NULL,
      points_cost INT NOT NULL,
      badge_text VARCHAR(80) NOT NULL,
      description TEXT NOT NULL,
      redeemed_code VARCHAR(60) DEFAULT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS gear_addons (
      id VARCHAR(80) PRIMARY KEY,
      name VARCHAR(180) NOT NULL,
      category VARCHAR(60) NOT NULL,
      price INT NOT NULL,
      unit VARCHAR(40) NOT NULL,
      description TEXT NOT NULL,
      recommended_json TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS admin_audit_logs (
      id VARCHAR(80) PRIMARY KEY,
      action VARCHAR(20) NOT NULL,
      resource VARCHAR(60) NOT NULL,
      record_id VARCHAR(100) NOT NULL,
      summary TEXT NOT NULL,
      actor VARCHAR(120) NOT NULL,
      created_at VARCHAR(40) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS platform_features (
      id VARCHAR(40) PRIMARY KEY,
      qris_enabled TINYINT(1) NOT NULL DEFAULT 1,
      split_bill_dp_enabled TINYINT(1) NOT NULL DEFAULT 1,
      instant_insurance_enabled TINYINT(1) NOT NULL DEFAULT 1,
      carbon_offset_enabled TINYINT(1) NOT NULL DEFAULT 1,
      require_identity_and_health_cert TINYINT(1) NOT NULL DEFAULT 1,
      platform_commission_percent DECIMAL(5,2) NOT NULL DEFAULT 10.00,
      service_fee_amount INT NOT NULL DEFAULT 15000,
      updated_at VARCHAR(40) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS customer_bookings (
      id VARCHAR(80) PRIMARY KEY,
      customer_id VARCHAR(80) NOT NULL,
      booking_type VARCHAR(20) NOT NULL DEFAULT 'trip',
      invoice_number VARCHAR(60) NOT NULL UNIQUE,
      booking_code VARCHAR(40) NOT NULL,
      trip_slug VARCHAR(140) NOT NULL,
      trip_title VARCHAR(255) NOT NULL,
      location VARCHAR(160) NOT NULL,
      departure_date VARCHAR(20) NOT NULL,
      leader_name VARCHAR(160) NOT NULL,
      customer_phone VARCHAR(60) NOT NULL,
      customer_email VARCHAR(160) NOT NULL,
      participants_count INT NOT NULL DEFAULT 1,
      participants_json LONGTEXT,
      agreement_accepted TINYINT(1) NOT NULL DEFAULT 0,
      hotel_slug VARCHAR(140) DEFAULT NULL,
      hotel_name VARCHAR(200) DEFAULT NULL,
      payment_method VARCHAR(60) NOT NULL,
      payment_status VARCHAR(60) NOT NULL,
      booking_status VARCHAR(60) NOT NULL,
      total_amount INT NOT NULL,
      paid_amount INT NOT NULL DEFAULT 0,
      certificate_id VARCHAR(60) DEFAULT NULL,
      certificate_sent TINYINT(1) NOT NULL DEFAULT 0,
      certificate_claimed TINYINT(1) NOT NULL DEFAULT 0,
      certificate_holder_name VARCHAR(160) DEFAULT NULL,
      completed_at VARCHAR(40) DEFAULT NULL,
      created_at VARCHAR(40) NOT NULL
    )`
  ]

  for (const ddl of ddlStatements) {
    await pool.query(ddl)
  }

  // Ensure existing users table supports 'customer' & 'admin' roles, username, phone, and wider scrypt password_hash
  await pool
    .query(`ALTER TABLE users MODIFY COLUMN role ENUM('customer', 'explorer', 'guide', 'admin') NOT NULL DEFAULT 'customer'`)
    .catch(() => {})
  await pool
    .query(`ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NOT NULL`)
    .catch(() => {})
  await pool
    .query(`ALTER TABLE users ADD COLUMN username VARCHAR(80) DEFAULT NULL`)
    .catch(() => {})
  await pool
    .query(`ALTER TABLE users ADD UNIQUE INDEX idx_users_username (username)`)
    .catch(() => {})
  await pool
    .query(`ALTER TABLE users ADD COLUMN phone VARCHAR(40) DEFAULT NULL`)
    .catch(() => {})

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    await pool.execute(
      `INSERT IGNORE INTO users (id, name, email, password_hash, role, avatar, origin, member_since, verified, points, total_km_explored)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'usr-admin-root',
        'Administrator JejakNusa',
        process.env.ADMIN_EMAIL.trim().toLowerCase(),
        hashPassword(process.env.ADMIN_PASSWORD),
        'admin',
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=240&q=80',
        'Jakarta Pusat',
        '2024-01-01',
        1,
        5000,
        500
      ]
    )
  }

  // Step 3: Seed initial data idempotently when tables are empty
  const [userCountRows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS cnt FROM users')
  if (Number(userCountRows[0]?.cnt || 0) === 0) {
    await pool.execute(
      `INSERT IGNORE INTO users (id, name, email, password_hash, role, avatar, origin, member_since, verified, points, total_km_explored)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'usr-explorer-1',
        'Nadia Kusuma',
        'explorer@jejaknusa.id',
        hashPassword('explorer123'),
        'explorer',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&q=80',
        'Jakarta Selatan',
        '2025-04-12',
        1,
        1850,
        148,
        'usr-guide-1',
        'I Made Surya Pratama',
        'guide@jejaknusa.id',
        hashPassword('guide123'),
        'guide',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&q=80',
        'Singaraja, Bali',
        '2024-08-03',
        1,
        2400,
        320
      ]
    )
  }

  const [tripCountRows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS cnt FROM trips')
  if (Number(tripCountRows[0]?.cnt || 0) === 0) {
    for (const trip of TRIPS_DATA) {
      const managed = guideManagedTripsStore.find((m) => m.id === trip.id)
      const dataJson = JSON.stringify({
        gallery: trip.gallery,
        highlights: trip.highlights,
        itinerary: trip.itinerary,
        included: trip.included,
        excluded: trip.excluded,
        guide: trip.guide,
        reviews: trip.reviews,
        requirements: resolveTripRequirements(trip)
      })
      await pool.execute(
        `INSERT IGNORE INTO trips
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
          managed?.trailStatus || 'Aman & Dibuka',
          managed?.lastWeatherUpdate || 'Hari ini — Kondisi jalur cerah & siap berangkat',
          dataJson
        ]
      )
    }
  }

  const [hotelCountRows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS cnt FROM hotels')
  if (Number(hotelCountRows[0]?.cnt || 0) === 0) {
    for (const hotel of HOTELS_DATA) {
      const dataJson = JSON.stringify({
        gallery: hotel.gallery,
        facilities: hotel.facilities,
        rooms: hotel.rooms,
        policies: hotel.policies
      })
      await pool.execute(
        `INSERT IGNORE INTO hotels
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
          hotel.verifiedPartner ? 1 : 0,
          hotel.featured ? 1 : 0,
          hotel.coverImage,
          hotel.shortDescription,
          hotel.description,
          hotel.checkInTime,
          hotel.checkOutTime,
          dataJson
        ]
      )
    }
  }

  const [commCountRows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS cnt FROM community_posts')
  if (Number(commCountRows[0]?.cnt || 0) === 0) {
    for (const post of communityPostsStore) {
      await pool.execute(
        `INSERT IGNORE INTO community_posts
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
  }

  const [bkCountRows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS cnt FROM guide_bookings')
  if (Number(bkCountRows[0]?.cnt || 0) === 0) {
    for (const bk of guideBookingsStore) {
      await pool.execute(
        `INSERT IGNORE INTO guide_bookings
          (id, booking_code, trip_slug, trip_title, departure_date, leader_name, leader_origin,
           participants_count, is_solo_traveler, has_insurance, addons_json, emergency_contact,
           payment_scheme, payment_status, booking_status, total_amount, paid_amount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          bk.id,
          bk.bookingCode,
          bk.tripSlug,
          bk.tripTitle,
          bk.departureDate,
          bk.leaderName,
          bk.leaderOrigin,
          bk.participantsCount,
          bk.isSoloTraveler ? 1 : 0,
          bk.hasInsurance ? 1 : 0,
          JSON.stringify(bk.addonsSummary),
          bk.emergencyContact,
          bk.paymentScheme,
          bk.paymentStatus,
          bk.bookingStatus,
          bk.totalAmount,
          bk.paidAmount
        ]
      )
    }
  }

  const [ctCountRows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS cnt FROM custom_trip_requests')
  if (Number(ctCountRows[0]?.cnt || 0) === 0) {
    for (const req of customTripsStore) {
      await pool.execute(
        `INSERT IGNORE INTO custom_trip_requests
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
        await pool.execute(
          `INSERT IGNORE INTO custom_trip_bids
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
  }

  const [stampCountRows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS cnt FROM passport_stamps')
  if (Number(stampCountRows[0]?.cnt || 0) === 0) {
    for (const stamp of passportStateStore.stamps) {
      await pool.execute(
        `INSERT IGNORE INTO passport_stamps
          (id, user_id, province, destination, trip_title, date, guide_name, category)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          stamp.id,
          'usr-explorer-1',
          stamp.province,
          stamp.destination,
          stamp.tripTitle,
          stamp.date,
          stamp.guideName,
          stamp.category
        ]
      )
    }
  }

  const [rewCountRows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS cnt FROM passport_rewards')
  if (Number(rewCountRows[0]?.cnt || 0) === 0) {
    for (const rew of passportStateStore.rewards) {
      await pool.execute(
        `INSERT IGNORE INTO passport_rewards
          (id, title, points_cost, badge_text, description, redeemed_code)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [rew.id, rew.title, rew.pointsCost, rew.badgeText, rew.description, rew.redeemedCode || null]
      )
    }
  }

  const [addonCountRows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS cnt FROM gear_addons')
  if (Number(addonCountRows[0]?.cnt || 0) === 0) {
    for (const addon of GEAR_ADDONS) {
      await pool.execute(
        `INSERT IGNORE INTO gear_addons
          (id, name, category, price, unit, description, recommended_json)
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
    }
  }

  const [featCountRows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS cnt FROM platform_features')
  if (Number(featCountRows[0]?.cnt || 0) === 0) {
    await pool.execute(
      `INSERT IGNORE INTO platform_features
        (id, qris_enabled, split_bill_dp_enabled, instant_insurance_enabled, carbon_offset_enabled,
         require_identity_and_health_cert, platform_commission_percent, service_fee_amount, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'default',
        platformFeaturesStore.qrisEnabled ? 1 : 0,
        platformFeaturesStore.splitBillDpEnabled ? 1 : 0,
        platformFeaturesStore.instantInsuranceEnabled ? 1 : 0,
        platformFeaturesStore.carbonOffsetEnabled ? 1 : 0,
        platformFeaturesStore.requireIdentityAndHealthCert ? 1 : 0,
        platformFeaturesStore.platformCommissionPercent,
        platformFeaturesStore.serviceFeeAmount,
        platformFeaturesStore.updatedAt
      ]
    )
  }

  const [cbkCountRows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS cnt FROM customer_bookings')
  if (Number(cbkCountRows[0]?.cnt || 0) === 0) {
    for (const cbk of customerBookingsStore) {
      await pool.execute(
        `INSERT IGNORE INTO customer_bookings
          (id, customer_id, booking_type, invoice_number, booking_code, trip_slug, trip_title, location,
           departure_date, leader_name, customer_phone, customer_email, participants_count, participants_json,
           agreement_accepted, hotel_slug, hotel_name, payment_method, payment_status, booking_status,
           total_amount, paid_amount, certificate_id, certificate_sent, certificate_claimed,
           certificate_holder_name, completed_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cbk.id,
          cbk.customerId,
          cbk.bookingType,
          cbk.invoiceNumber,
          cbk.bookingCode,
          cbk.tripSlug,
          cbk.tripTitle,
          cbk.location,
          cbk.departureDate,
          cbk.leaderName,
          cbk.customerPhone,
          cbk.customerEmail,
          cbk.participantsCount,
          JSON.stringify(cbk.participants ?? []),
          cbk.agreementAccepted ? 1 : 0,
          cbk.hotelSlug || null,
          cbk.hotelName || null,
          cbk.paymentMethod,
          cbk.paymentStatus,
          cbk.bookingStatus,
          cbk.totalAmount,
          cbk.paidAmount,
          cbk.certificateId || null,
          cbk.certificateSent ? 1 : 0,
          cbk.certificateClaimed ? 1 : 0,
          cbk.certificateHolderName || null,
          cbk.completedAt || null,
          cbk.createdAt
        ]
      )
    }
  }

  const [logCountRows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS cnt FROM admin_audit_logs')
  if (Number(logCountRows[0]?.cnt || 0) === 0) {
    await pool.execute(
      `INSERT IGNORE INTO admin_audit_logs
        (id, action, resource, record_id, summary, actor, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        'log-init-1',
        'CREATE',
        'database',
        cfg.database,
        `Inisialisasi skema 13 tabel baru pada database "${cfg.database}" (TiDB Cloud) selesai.`,
        'System Bootstrap',
        new Date().toISOString()
      ]
    )
  }
}

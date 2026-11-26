import type { RowDataPacket } from 'mysql2/promise'
import type {
  BookingParticipant,
  CustomerBookingRecord,
  PlatformFeatureFlags,
  SosAlertRecord,
  TripLobbyMessage
} from '#shared/types/booking'
import type {
  GuidePayoutRecord,
  GuideVerificationApplication,
  WeatherRefundRecord
} from '#shared/types/guide'
import { executeSql, queryRows } from './db'
import {
  getPassportStateForUser,
  isDemoExperiencedUser,
  passportStateStore,
  type PerUserPassportState
} from './passportStore'
import {
  customerBookingsStore,
  guidePayoutsStore,
  guideVerificationsStore,
  platformFeaturesStore,
  sosAlertsStore,
  tripLobbyMessagesStore,
  weatherRefundsStore
} from './platformStore'

interface StateRow extends RowDataPacket {
  state_key: string
  data_json: string
  updated_at: string
}

interface DbCustomerBookingRow extends RowDataPacket {
  id: string
  customer_id: string
  booking_type: 'trip' | 'hotel' | 'trip+hotel'
  invoice_number: string
  booking_code: string
  trip_slug: string
  trip_title: string
  location: string
  departure_date: string
  leader_name: string
  customer_phone: string
  customer_email: string
  participants_count: number
  participants_json: string | null
  agreement_accepted: number
  hotel_slug: string | null
  hotel_name: string | null
  payment_method: 'QRIS Instant Payment' | 'Transfer Virtual Account'
  payment_status: 'MENUNGGU PEMBAYARAN' | 'DP 30% Lunas' | 'LUNAS'
  booking_status: 'Menunggu Konfirmasi' | 'Terkonfirmasi' | 'Selesai'
  total_amount: number
  paid_amount: number
  certificate_id: string | null
  certificate_sent: number
  certificate_claimed: number
  certificate_holder_name: string | null
  completed_at: string | null
  record_json: string | null
  created_at: string
}

async function readRuntimeState<T>(key: string): Promise<T | null> {
  try {
    const rows = await queryRows<StateRow>(
      'SELECT state_key, data_json, updated_at FROM app_runtime_state WHERE state_key = ? LIMIT 1',
      [key]
    )
    if (!rows[0]?.data_json) return null
    return JSON.parse(rows[0].data_json) as T
  } catch {
    return null
  }
}

async function writeRuntimeState<T>(key: string, value: T): Promise<void> {
  try {
    const now = new Date().toISOString()
    const payload = JSON.stringify(value)
    await executeSql(
      `INSERT INTO app_runtime_state (state_key, data_json, updated_at)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE data_json = VALUES(data_json), updated_at = VALUES(updated_at)`,
      [key, payload, now]
    )
  } catch {
    // Graceful fallback to in-memory store when DB unavailable
  }
}

// ============================================================================
// 1. CUSTOMER BOOKINGS (Full TiDB Persistence + Seed Merge)
// ============================================================================

function mapDbBookingRow(row: DbCustomerBookingRow): CustomerBookingRecord {
  if (row.record_json) {
    try {
      const parsed = JSON.parse(row.record_json) as CustomerBookingRecord
      if (parsed && parsed.id && parsed.invoiceNumber) {
        return parsed
      }
    } catch {
      // Fall through to column reconstruction
    }
  }

  // Fallback: merge with matching seeded store record if available, otherwise reconstruct
  const seeded = customerBookingsStore.find(
    (b) => b.id === row.id || b.invoiceNumber === row.invoice_number
  )

  let participants: BookingParticipant[] | undefined
  if (row.participants_json) {
    try {
      const parsed = JSON.parse(row.participants_json)
      if (Array.isArray(parsed) && parsed.length > 0) {
        participants = parsed as BookingParticipant[]
      }
    } catch {
      participants = undefined
    }
  }

  const totalAmount = Number(row.total_amount || 0)
  const paidAmount = Number(row.paid_amount || 0)
  const remainingAmount = Math.max(0, totalAmount - paidAmount)

  return {
    ...(seeded || {
      coverImage:
        'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=960&q=75',
      guideId: 'guide-made-surya',
      guideName: 'Pemandu Terverifikasi JejakNusa',
      guideCertification: 'APGI / HPI Terverifikasi',
      specialNotes: 'Tidak ada catatan khusus.',
      hotelSubtotal: 0,
      shuttleFee: 0,
      paymentReference: `QRIS-${row.booking_code}`,
      paymentScheme: row.payment_status === 'DP 30% Lunas' ? 'DP 30%' : 'Lunas 100%',
      hasInsurance: true,
      hasCarbonOffset: false,
      packageSubtotal: totalAmount,
      insuranceFee: 0,
      carbonOffsetFee: 0,
      serviceFee: 15000,
      splitPerPerson: Math.ceil(totalAmount / Math.max(1, Number(row.participants_count || 1))),
      splitPaymentLink: `https://jejaknusa.id/split/${row.invoice_number}`,
      rosterNames: [row.leader_name],
      gearChecklist: [],
      checkedIn: false
    }),
    id: row.id,
    customerId: row.customer_id,
    bookingType: row.booking_type || 'trip',
    invoiceNumber: row.invoice_number,
    bookingCode: row.booking_code,
    tripSlug: row.trip_slug,
    tripTitle: row.trip_title,
    location: row.location,
    departureDate: row.departure_date,
    leaderName: row.leader_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email,
    participantsCount: Number(row.participants_count || 1),
    participants: participants ?? seeded?.participants,
    agreementAccepted: Boolean(row.agreement_accepted),
    hotelSlug: row.hotel_slug || seeded?.hotelSlug,
    hotelName: row.hotel_name || seeded?.hotelName,
    paymentMethod: row.payment_method || 'QRIS Instant Payment',
    paymentStatus: row.payment_status,
    bookingStatus: row.booking_status,
    totalAmount,
    paidAmount,
    remainingAmount,
    certificateId: row.certificate_id || seeded?.certificateId,
    certificateSent: Boolean(row.certificate_sent),
    certificateClaimed: Boolean(row.certificate_claimed),
    certificateHolderName: row.certificate_holder_name || seeded?.certificateHolderName,
    completedAt: row.completed_at || seeded?.completedAt,
    createdAt: row.created_at
  }
}

function syncMemoryBooking(record: CustomerBookingRecord) {
  const idx = customerBookingsStore.findIndex(
    (b) => b.id === record.id || b.invoiceNumber === record.invoiceNumber
  )
  if (idx >= 0) {
    customerBookingsStore[idx] = record
  } else {
    customerBookingsStore.unshift(record)
  }
}

export async function loadAllBookings(): Promise<CustomerBookingRecord[]> {
  try {
    const rows = await queryRows<DbCustomerBookingRow>(
      'SELECT * FROM customer_bookings ORDER BY created_at DESC LIMIT 300'
    )
    if (rows.length > 0) {
      const dbRecords = rows.map(mapDbBookingRow)
      const byInvoice = new Map<string, CustomerBookingRecord>()
      for (const rec of dbRecords) {
        byInvoice.set(rec.invoiceNumber, rec)
        syncMemoryBooking(rec)
      }
      // Keep any in-memory-only records not yet in DB
      for (const mem of customerBookingsStore) {
        if (!byInvoice.has(mem.invoiceNumber)) {
          byInvoice.set(mem.invoiceNumber, mem)
        }
      }
      return Array.from(byInvoice.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    }
  } catch {
    // Fallback to in-memory store
  }
  return [...customerBookingsStore]
}

export async function findBookingRecord(idOrCode: string): Promise<CustomerBookingRecord | null> {
  if (!idOrCode) return null
  try {
    const rows = await queryRows<DbCustomerBookingRow>(
      'SELECT * FROM customer_bookings WHERE id = ? OR invoice_number = ? OR booking_code = ? LIMIT 1',
      [idOrCode, idOrCode, idOrCode]
    )
    if (rows[0]) {
      const mapped = mapDbBookingRow(rows[0])
      syncMemoryBooking(mapped)
      return mapped
    }
  } catch {
    // Fallback to memory
  }
  return (
    customerBookingsStore.find(
      (b) => b.id === idOrCode || b.invoiceNumber === idOrCode || b.bookingCode === idOrCode
    ) ?? null
  )
}

export async function saveBookingRecord(record: CustomerBookingRecord): Promise<void> {
  syncMemoryBooking(record)
  try {
    await executeSql(
      `INSERT INTO customer_bookings
        (id, customer_id, booking_type, invoice_number, booking_code, trip_slug, trip_title,
         location, departure_date, leader_name, customer_phone, customer_email, participants_count,
         participants_json, agreement_accepted, hotel_slug, hotel_name, payment_method, payment_status,
         booking_status, total_amount, paid_amount, certificate_id, certificate_sent, certificate_claimed,
         certificate_holder_name, completed_at, record_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         payment_status = VALUES(payment_status),
         booking_status = VALUES(booking_status),
         total_amount = VALUES(total_amount),
         paid_amount = VALUES(paid_amount),
         certificate_id = VALUES(certificate_id),
         certificate_sent = VALUES(certificate_sent),
         certificate_claimed = VALUES(certificate_claimed),
         certificate_holder_name = VALUES(certificate_holder_name),
         completed_at = VALUES(completed_at),
         record_json = VALUES(record_json)`,
      [
        record.id,
        record.customerId,
        record.bookingType,
        record.invoiceNumber,
        record.bookingCode,
        record.tripSlug,
        record.tripTitle,
        record.location,
        record.departureDate,
        record.leaderName,
        record.customerPhone,
        record.customerEmail,
        record.participantsCount,
        JSON.stringify(record.participants ?? []),
        record.agreementAccepted ? 1 : 0,
        record.hotelSlug || null,
        record.hotelName || null,
        record.paymentMethod,
        record.paymentStatus,
        record.bookingStatus,
        record.totalAmount,
        record.paidAmount,
        record.certificateId || null,
        record.certificateSent ? 1 : 0,
        record.certificateClaimed ? 1 : 0,
        record.certificateHolderName || null,
        record.completedAt || null,
        JSON.stringify(record),
        record.createdAt
      ]
    )
  } catch {
    // In-memory store already updated
  }
}

// ============================================================================
// 2. PLATFORM FEATURE FLAGS
// ============================================================================

export async function loadPlatformFeatures(): Promise<PlatformFeatureFlags> {
  const saved = await readRuntimeState<PlatformFeatureFlags>('platform_features')
  if (saved) {
    Object.assign(platformFeaturesStore, saved)
  }
  return { ...platformFeaturesStore }
}

export async function savePlatformFeatures(next: PlatformFeatureFlags): Promise<void> {
  Object.assign(platformFeaturesStore, next)
  await writeRuntimeState('platform_features', platformFeaturesStore)
}

// ============================================================================
// 3. EMERGENCY SOS ALERTS
// ============================================================================

export async function loadSosAlerts(): Promise<SosAlertRecord[]> {
  const saved = await readRuntimeState<SosAlertRecord[]>('sos_alerts')
  if (Array.isArray(saved) && saved.length > 0) {
    sosAlertsStore.splice(0, sosAlertsStore.length, ...saved)
  }
  return [...sosAlertsStore]
}

export async function saveSosAlerts(list: SosAlertRecord[]): Promise<void> {
  sosAlertsStore.splice(0, sosAlertsStore.length, ...list)
  await writeRuntimeState('sos_alerts', sosAlertsStore)
}

// ============================================================================
// 4. TRIP LOBBY MESSAGES
// ============================================================================

export async function loadLobbyMessages(): Promise<TripLobbyMessage[]> {
  const saved = await readRuntimeState<TripLobbyMessage[]>('lobby_messages')
  if (Array.isArray(saved) && saved.length > 0) {
    tripLobbyMessagesStore.splice(0, tripLobbyMessagesStore.length, ...saved)
  }
  return [...tripLobbyMessagesStore]
}

export async function saveLobbyMessages(list: TripLobbyMessage[]): Promise<void> {
  tripLobbyMessagesStore.splice(0, tripLobbyMessagesStore.length, ...list)
  await writeRuntimeState('lobby_messages', tripLobbyMessagesStore)
}

// ============================================================================
// 5. GUIDE VERIFICATIONS, PAYOUTS & WEATHER REFUNDS
// ============================================================================

export async function loadGuideVerifications(): Promise<GuideVerificationApplication[]> {
  const saved = await readRuntimeState<GuideVerificationApplication[]>('guide_verifications')
  if (Array.isArray(saved) && saved.length > 0) {
    guideVerificationsStore.splice(0, guideVerificationsStore.length, ...saved)
  }
  return [...guideVerificationsStore]
}

export async function saveGuideVerifications(list: GuideVerificationApplication[]): Promise<void> {
  guideVerificationsStore.splice(0, guideVerificationsStore.length, ...list)
  await writeRuntimeState('guide_verifications', guideVerificationsStore)
}

export async function loadGuidePayouts(): Promise<GuidePayoutRecord[]> {
  const saved = await readRuntimeState<GuidePayoutRecord[]>('guide_payouts')
  if (Array.isArray(saved) && saved.length > 0) {
    guidePayoutsStore.splice(0, guidePayoutsStore.length, ...saved)
  }
  return [...guidePayoutsStore]
}

export async function saveGuidePayouts(list: GuidePayoutRecord[]): Promise<void> {
  guidePayoutsStore.splice(0, guidePayoutsStore.length, ...list)
  await writeRuntimeState('guide_payouts', guidePayoutsStore)
}

export async function loadWeatherRefunds(): Promise<WeatherRefundRecord[]> {
  const saved = await readRuntimeState<WeatherRefundRecord[]>('weather_refunds')
  if (Array.isArray(saved) && saved.length > 0) {
    weatherRefundsStore.splice(0, weatherRefundsStore.length, ...saved)
  }
  return [...weatherRefundsStore]
}

export async function saveWeatherRefunds(list: WeatherRefundRecord[]): Promise<void> {
  weatherRefundsStore.splice(0, weatherRefundsStore.length, ...list)
  await writeRuntimeState('weather_refunds', weatherRefundsStore)
}

// ============================================================================
// 6. PER-USER ADVENTURE PASSPORT STATE
// ============================================================================

function passportStateKey(userId?: string, email?: string): string {
  if (isDemoExperiencedUser(userId, email)) return 'passport:demo-nadia'
  const raw = (userId || email || 'guest').trim().toLowerCase().replace(/[^a-z0-9@._-]+/g, '_')
  return `passport:${raw.slice(0, 96)}`
}

export async function loadUserPassportState(
  userId?: string,
  email?: string
): Promise<PerUserPassportState> {
  const key = passportStateKey(userId, email)
  const mem = getPassportStateForUser(userId, email)
  const saved = await readRuntimeState<PerUserPassportState>(key)
  if (saved && typeof saved.points === 'number' && Array.isArray(saved.stamps)) {
    mem.points = saved.points
    mem.totalKmExplored = saved.totalKmExplored
    mem.visitedProvinces = saved.visitedProvinces
    mem.stamps = saved.stamps
    mem.badges = saved.badges
    mem.rewards = saved.rewards
    if (isDemoExperiencedUser(userId, email)) {
      Object.assign(passportStateStore, mem)
    }
  }
  return mem
}

export async function saveUserPassportState(
  state: PerUserPassportState,
  userId?: string,
  email?: string
): Promise<void> {
  const key = passportStateKey(userId, email)
  await writeRuntimeState(key, state)
}

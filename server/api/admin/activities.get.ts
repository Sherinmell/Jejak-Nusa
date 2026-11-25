import type { RowDataPacket } from 'mysql2/promise'
import { defineEventHandler } from 'h3'
import type {
  ActivityCategory,
  ActivitySeverity,
  AdminActivitiesResponse,
  AdminActivityItem
} from '#shared/types/activity'
import { normalizeUserRole } from '#shared/types/auth'
import { getAllStoredUsers } from '../../utils/authStore'
import { communityPostsStore } from '../../utils/communityStore'
import { queryRows } from '../../utils/db'
import { getCommunityPostsFromDb } from '../../utils/dbRepositories'
import {
  customerBookingsStore,
  guidePayoutsStore,
  guideVerificationsStore,
  sosAlertsStore,
  tripLobbyMessagesStore,
  weatherRefundsStore
} from '../../utils/platformStore'
import { listSupportThreads } from '../../utils/supportStore'
import { requireAdmin } from '../../utils/requireAdmin'

interface DbUserRow extends RowDataPacket {
  id: string
  username: string | null
  name: string
  email: string
  phone: string | null
  role: string
  origin: string
  member_since: string
  verified: number
  created_at?: Date | string | null
}

interface DbBookingRow extends RowDataPacket {
  id: string
  invoice_number: string
  booking_code: string
  booking_type: string
  trip_title: string
  location: string
  departure_date: string
  leader_name: string
  customer_phone: string
  customer_email: string
  participants_count: number
  payment_method: string
  payment_status: string
  booking_status: string
  total_amount: number
  paid_amount: number
  certificate_id: string | null
  certificate_sent: number
  certificate_claimed: number
  created_at: string
}

interface DbAuditRow extends RowDataPacket {
  id: string
  action: string
  resource: string
  record_id: string
  summary: string
  actor: string
  created_at: string
}

function parseDateSafe(raw: string | Date | null | undefined): { timestamp: string; dateOnly: string; sortTime: number } {
  if (!raw) {
    const now = new Date()
    const iso = now.toISOString()
    return {
      timestamp: `${iso.slice(0, 10)} ${iso.slice(11, 16)} WIB`,
      dateOnly: iso.slice(0, 10),
      sortTime: now.getTime()
    }
  }

  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    const iso = raw.toISOString()
    return {
      timestamp: `${iso.slice(0, 10)} ${iso.slice(11, 16)} WIB`,
      dateOnly: iso.slice(0, 10),
      sortTime: raw.getTime()
    }
  }

  const text = String(raw).trim()
  // Extract YYYY-MM-DD and optional HH:mm
  const match = text.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s](\d{2}:\d{2}))?/)
  if (match) {
    const dateOnly = match[1]!
    const timePart = match[2] || '00:00'
    const parsed = Date.parse(`${dateOnly}T${timePart}:00+07:00`)
    return {
      timestamp: text.includes('WIB') || text.includes('WITA') ? text : `${dateOnly} ${timePart} WIB`,
      dateOnly,
      sortTime: Number.isNaN(parsed) ? Date.now() : parsed
    }
  }

  // Time-only strings such as "08:25 WITA"
  const timeOnly = text.match(/^(\d{2}:\d{2})/)
  if (timeOnly) {
    const today = new Date().toISOString().slice(0, 10)
    const parsed = Date.parse(`${today}T${timeOnly[1]}:00+07:00`)
    return {
      timestamp: `${today} ${text}`,
      dateOnly: today,
      sortTime: Number.isNaN(parsed) ? Date.now() : parsed
    }
  }

  const fallbackParsed = Date.parse(text)
  const fallbackDate = Number.isNaN(fallbackParsed) ? new Date() : new Date(fallbackParsed)
  const iso = fallbackDate.toISOString()
  return {
    timestamp: text,
    dateOnly: iso.slice(0, 10),
    sortTime: fallbackDate.getTime()
  }
}

function getBookingSeverity(paymentStatus: string, bookingStatus: string): ActivitySeverity {
  if (bookingStatus === 'Dibatalkan') return 'danger'
  if (paymentStatus === 'LUNAS' || bookingStatus === 'Selesai') return 'success'
  if (paymentStatus === 'DP 30% Lunas') return 'warning'
  return 'warning'
}

export default defineEventHandler(async (event): Promise<AdminActivitiesResponse> => {
  await requireAdmin(event)

  const activities: AdminActivityItem[] = []

  // Build phone lookup directory (by lowercased name & email) from authStore, TiDB users, and bookings
  const phoneByName = new Map<string, string>()
  const phoneByEmail = new Map<string, string>()
  function registerPhone(name?: string | null, email?: string | null, phone?: string | null) {
    const cleanPhone = (phone || '').trim()
    if (!cleanPhone) return
    if (name && name.trim()) phoneByName.set(name.trim().toLowerCase(), cleanPhone)
    if (email && email.trim()) phoneByEmail.set(email.trim().toLowerCase(), cleanPhone)
  }
  function resolvePhone(directPhone?: string | null, name?: string | null, email?: string | null): string {
    const clean = (directPhone || '').trim()
    if (clean) return clean
    if (email && email.trim()) {
      const byEmail = phoneByEmail.get(email.trim().toLowerCase())
      if (byEmail) return byEmail
    }
    if (name && name.trim()) {
      const key = name.trim().toLowerCase()
      const exact = phoneByName.get(key)
      if (exact) return exact
      // Handle names like "Fajar Hidayat (+3 teman)" by stripping parenthetical suffix
      const base = key.replace(/\s*\([^)]*\)\s*$/, '').trim()
      const byBase = phoneByName.get(base)
      if (byBase) return byBase
    }
    return '-'
  }

  for (const u of getAllStoredUsers()) {
    registerPhone(u.name, u.email, u.phone)
  }
  for (const bk of customerBookingsStore) {
    registerPhone(bk.leaderName, bk.customerEmail, bk.customerPhone)
  }

  // Pre-fetch TiDB users once so we can enrich phone directory AND list registrations
  let dbUsers: DbUserRow[] = []
  try {
    dbUsers = await queryRows<DbUserRow>(
      'SELECT id, username, name, email, phone, role, origin, member_since, verified, created_at FROM users ORDER BY created_at DESC LIMIT 200'
    )
    for (const u of dbUsers) {
      registerPhone(u.name, u.email, u.phone)
    }
  } catch {
    dbUsers = []
  }

  // 1. Transaksi & Booking Masuk (runtime store + TiDB customer_bookings deduplicated)
  const seenInvoices = new Set<string>()
  let totalBookings = 0
  let totalBookingParticipants = 0
  let totalFinancialValue = 0
  let totalPaidValue = 0

  for (const bk of customerBookingsStore) {
    seenInvoices.add(bk.invoiceNumber)
    totalBookings += 1
    totalBookingParticipants += bk.participantsCount
    totalFinancialValue += bk.totalAmount
    totalPaidValue += bk.paidAmount

    const dt = parseDateSafe(bk.createdAt)
    const certNote = bk.certificateClaimed
      ? ` • Sertifikat ${bk.certificateId || ''} sudah diklaim`
      : bk.certificateSent
        ? ` • Sertifikat ${bk.certificateId || ''} terkirim`
        : ''
    const typeLabel = bk.bookingType === 'hotel' ? 'Booking Hotel' : 'Booking Open Trip'

    activities.push({
      id: `act-bk-${bk.id}`,
      category: 'booking',
      categoryLabel: 'Transaksi Booking',
      title: `${typeLabel}: ${bk.tripTitle}`,
      actor: bk.leaderName,
      actorPhone: resolvePhone(bk.customerPhone, bk.leaderName, bk.customerEmail),
      actorContact: bk.customerEmail,
      referenceCode: bk.invoiceNumber,
      description: `${bk.participantsCount} peserta • ${bk.location} • Berangkat ${bk.departureDate} • ${bk.paymentMethod} (${bk.bookingStatus})${certNote}`,
      amount: bk.totalAmount,
      status: bk.paymentStatus,
      severity: getBookingSeverity(bk.paymentStatus, bk.bookingStatus),
      timestamp: dt.timestamp,
      dateOnly: dt.dateOnly,
      sortTime: dt.sortTime,
      detailLink: '/admin/bookings'
    })
  }

  try {
    const dbBookings = await queryRows<DbBookingRow>(
      'SELECT * FROM customer_bookings ORDER BY created_at DESC LIMIT 200'
    )
    for (const row of dbBookings) {
      registerPhone(row.leader_name, row.customer_email, row.customer_phone)
      if (seenInvoices.has(row.invoice_number)) continue
      seenInvoices.add(row.invoice_number)
      totalBookings += 1
      totalBookingParticipants += Number(row.participants_count || 1)
      totalFinancialValue += Number(row.total_amount || 0)
      totalPaidValue += Number(row.paid_amount || 0)

      const dt = parseDateSafe(row.created_at)
      const certNote = row.certificate_claimed
        ? ` • Sertifikat ${row.certificate_id || ''} diklaim`
        : row.certificate_sent
          ? ` • Sertifikat ${row.certificate_id || ''} terkirim`
          : ''
      const typeLabel = row.booking_type === 'hotel' ? 'Booking Hotel' : 'Booking Open Trip'

      activities.push({
        id: `act-dbbk-${row.id}`,
        category: 'booking',
        categoryLabel: 'Transaksi Booking',
        title: `${typeLabel}: ${row.trip_title}`,
        actor: row.leader_name,
        actorPhone: resolvePhone(row.customer_phone, row.leader_name, row.customer_email),
        actorContact: row.customer_email,
        referenceCode: row.invoice_number,
        description: `${row.participants_count} peserta • ${row.location} • Berangkat ${row.departure_date} • ${row.payment_method} (${row.booking_status})${certNote}`,
        amount: Number(row.total_amount || 0),
        status: row.payment_status,
        severity: getBookingSeverity(row.payment_status, row.booking_status),
        timestamp: dt.timestamp,
        dateOnly: dt.dateOnly,
        sortTime: dt.sortTime,
        detailLink: '/admin/bookings'
      })
    }
  } catch {
    // Fallback gracefully to in-memory bookings
  }

  // 2. Pendaftaran Akun Pengguna (TiDB users + authStore deduplicated, NEVER exposing password_hash)
  const seenEmails = new Set<string>()
  let totalRegistrations = 0

  for (const u of dbUsers) {
    const emailKey = (u.email || '').trim().toLowerCase()
    if (!emailKey || seenEmails.has(emailKey)) continue
    const role = normalizeUserRole(u.role)
    if (role === 'admin') continue
    seenEmails.add(emailKey)
    totalRegistrations += 1

    const dt = parseDateSafe(u.created_at || u.member_since)
    const roleLabel = role === 'guide' ? 'Pemandu' : 'Peserta'

    activities.push({
      id: `act-usr-${u.id}`,
      category: 'registration',
      categoryLabel: 'Pendaftaran Akun',
      title: `Akun ${roleLabel} Terdaftar: ${u.name}`,
      actor: u.name,
      actorPhone: resolvePhone(u.phone, u.name, u.email),
      actorContact: [u.username ? `@${u.username}` : null, u.email].filter(Boolean).join(' • '),
      referenceCode: u.id,
      description: `Asal: ${u.origin || 'Indonesia'} • Bergabung sejak ${u.member_since || dt.dateOnly}`,
      amount: null,
      status: u.verified ? 'Terverifikasi' : 'Menunggu Verifikasi',
      severity: u.verified ? 'success' : 'warning',
      timestamp: dt.timestamp,
      dateOnly: dt.dateOnly,
      sortTime: dt.sortTime,
      detailLink: '/admin/crud'
    })
  }

  for (const u of getAllStoredUsers()) {
    const emailKey = u.email.trim().toLowerCase()
    if (u.role === 'admin' || seenEmails.has(emailKey)) continue
    seenEmails.add(emailKey)
    totalRegistrations += 1

    const dt = parseDateSafe(u.memberSince)
    const roleLabel = u.role === 'guide' ? 'Pemandu' : 'Peserta'

    activities.push({
      id: `act-memusr-${u.id}`,
      category: 'registration',
      categoryLabel: 'Pendaftaran Akun',
      title: `Akun ${roleLabel} Terdaftar: ${u.name}`,
      actor: u.name,
      actorPhone: resolvePhone(u.phone, u.name, u.email),
      actorContact: [u.username ? `@${u.username}` : null, u.email].filter(Boolean).join(' • '),
      referenceCode: u.id,
      description: `Asal: ${u.origin || 'Indonesia'} • Bergabung sejak ${u.memberSince}`,
      amount: null,
      status: u.verified ? 'Terverifikasi' : 'Menunggu Verifikasi',
      severity: u.verified ? 'success' : 'warning',
      timestamp: dt.timestamp,
      dateOnly: dt.dateOnly,
      sortTime: dt.sortTime,
      detailLink: '/admin/crud'
    })
  }

  // 3. Postingan Komunitas / Buddy Finder
  let communityPosts = communityPostsStore
  try {
    const dbPosts = await getCommunityPostsFromDb()
    if (dbPosts.length > 0) communityPosts = dbPosts
  } catch {
    // Use in-memory store
  }

  for (const post of communityPosts) {
    const dt = parseDateSafe(post.createdAt)
    activities.push({
      id: `act-comm-${post.id}`,
      category: 'community',
      categoryLabel: 'Komunitas Buddy',
      title: `Ajakan Barengan: ${post.tripTitle}`,
      actor: post.authorName,
      actorPhone: resolvePhone(null, post.authorName),
      actorContact: `Asal ${post.authorOrigin} • ${post.travelStyle}`,
      referenceCode: post.id.toUpperCase(),
      description: `"${post.note}" (Cari ${post.slotsLookingFor} teman • ${post.likes} minat gabung)`,
      amount: null,
      status: 'Dipublikasikan',
      severity: 'normal',
      timestamp: dt.timestamp,
      dateOnly: dt.dateOnly,
      sortTime: dt.sortTime,
      detailLink: '/community'
    })
  }

  // 4. Sinyal Darurat SOS Lapangan
  let activeSosCount = 0
  for (const alert of sosAlertsStore) {
    if (alert.status === 'ACTIVE') activeSosCount += 1
    const dt = parseDateSafe(alert.createdAt)
    activities.push({
      id: `act-sos-${alert.id}`,
      category: 'sos',
      categoryLabel: 'Darurat SOS',
      title: `Sinyal SOS: ${alert.tripTitle}`,
      actor: alert.reporterName,
      actorPhone: resolvePhone(null, alert.reporterName),
      actorContact: `${alert.locationLabel} (${alert.latitude}, ${alert.longitude})`,
      referenceCode: alert.id.toUpperCase(),
      description: alert.message,
      amount: null,
      status: alert.status === 'ACTIVE' ? 'SOS AKTIF' : 'TERTANGANI',
      severity: alert.status === 'ACTIVE' ? 'danger' : 'success',
      timestamp: dt.timestamp,
      dateOnly: dt.dateOnly,
      sortTime: dt.sortTime,
      detailLink: '/admin/dashboard'
    })
  }

  // 5. Pengajuan Verifikasi Pemandu
  let pendingQueueCount = 0
  for (const ver of guideVerificationsStore) {
    if (ver.status === 'pending') pendingQueueCount += 1
    const dt = parseDateSafe(ver.submittedAt)
    const statusLabel =
      ver.status === 'approved' ? 'Disetujui' : ver.status === 'rejected' ? 'Ditolak' : 'Menunggu Verifikasi'

    activities.push({
      id: `act-ver-${ver.id}`,
      category: 'verification',
      categoryLabel: 'Verifikasi Pemandu',
      title: `Pengajuan Lisensi ${ver.licenseBody} — ${ver.guideName}`,
      actor: ver.guideName,
      actorPhone: resolvePhone(null, ver.guideName, ver.email),
      actorContact: `${ver.email} • ${ver.origin}`,
      referenceCode: ver.licenseNumber,
      description: `${ver.documentTitle} (${ver.specialty}, ${ver.experienceYears} thn pengalaman)`,
      amount: null,
      status: statusLabel,
      severity: ver.status === 'approved' ? 'success' : ver.status === 'rejected' ? 'danger' : 'warning',
      timestamp: dt.timestamp,
      dateOnly: dt.dateOnly,
      sortTime: dt.sortTime,
      detailLink: '/admin/verifications'
    })
  }

  // 6. Pengajuan Refund Garansi Cuaca
  for (const ref of weatherRefundsStore) {
    if (ref.status === 'Menunggu Persetujuan') pendingQueueCount += 1
    const dt = parseDateSafe(ref.requestedAt)
    activities.push({
      id: `act-ref-${ref.id}`,
      category: 'refund',
      categoryLabel: 'Refund Cuaca',
      title: `Pengajuan Refund: ${ref.tripTitle}`,
      actor: ref.customerName,
      actorPhone: resolvePhone(null, ref.customerName),
      actorContact: `Berangkat ${ref.departureDate}`,
      referenceCode: ref.bookingCode,
      description: `${ref.weatherCondition} — ${ref.reason}`,
      amount: ref.refundAmount,
      status: ref.status,
      severity: ref.status === 'Disetujui & Dikembalikan' ? 'success' : ref.status === 'Ditolak' ? 'danger' : 'warning',
      timestamp: dt.timestamp,
      dateOnly: dt.dateOnly,
      sortTime: dt.sortTime,
      detailLink: '/admin/payouts'
    })
  }

  // 7. Pencairan Dana (Payout) Pemandu
  for (const pay of guidePayoutsStore) {
    if (pay.status === 'Menunggu Pencairan') pendingQueueCount += 1
    const dt = parseDateSafe(pay.releasedAt || pay.departureDate)
    activities.push({
      id: `act-pay-${pay.id}`,
      category: 'payout',
      categoryLabel: 'Payout Pemandu',
      title: `Pencairan Dana Trip: ${pay.tripTitle}`,
      actor: pay.guideName,
      actorPhone: resolvePhone(null, pay.guideName),
      actorContact: `${pay.participantsCount} peserta • Berangkat ${pay.departureDate}`,
      referenceCode: pay.id.toUpperCase(),
      description: `Bruto Rp ${pay.grossAmount.toLocaleString('id-ID')} • Komisi Platform Rp ${pay.platformCommission.toLocaleString('id-ID')} • Net Pemandu Rp ${pay.netPayout.toLocaleString('id-ID')}`,
      amount: pay.netPayout,
      status: pay.status,
      severity: pay.status === 'Dicairkan' ? 'success' : 'warning',
      timestamp: dt.timestamp,
      dateOnly: dt.dateOnly,
      sortTime: dt.sortTime,
      detailLink: '/admin/payouts'
    })
  }

  // 8. Pesan Chat Lobby Trip
  for (const msg of tripLobbyMessagesStore) {
    const dt = parseDateSafe(msg.createdAt)
    activities.push({
      id: `act-chat-${msg.id}`,
      category: 'chat',
      categoryLabel: 'Chat Lobby',
      title: `Pesan Lobby Trip (${msg.tripSlug})`,
      actor: msg.senderName,
      actorPhone: resolvePhone(null, msg.senderName),
      actorContact: msg.senderRole === 'guide' ? 'Pemandu Lokal' : 'Peserta',
      referenceCode: msg.id.toUpperCase(),
      description: msg.message,
      amount: null,
      status: 'Terkirim',
      severity: 'normal',
      timestamp: dt.timestamp,
      dateOnly: dt.dateOnly,
      sortTime: dt.sortTime,
      detailLink: '/admin/dashboard'
    })
  }

  // 8b. Pesan Bantuan Pelanggan ke Admin
  try {
    const supportThreads = await listSupportThreads()
    for (const thread of supportThreads) {
      if (thread.status === 'Menunggu Balasan') pendingQueueCount += 1
      const dt = parseDateSafe(thread.updatedAt || thread.createdAt)
      const latestMsg = thread.messages[thread.messages.length - 1]
      activities.push({
        id: `act-sup-${thread.id}`,
        category: 'chat',
        categoryLabel: 'Pesan ke Admin',
        title: `Pesan Pelanggan (${thread.category}): ${thread.subject}`,
        actor: thread.customerName,
        actorPhone: resolvePhone(thread.customerPhone, thread.customerName, thread.customerEmail),
        actorContact: thread.customerEmail,
        referenceCode: thread.ticketCode,
        description: latestMsg ? `${latestMsg.senderName}: "${latestMsg.message}"` : thread.subject,
        amount: null,
        status: thread.status,
        severity: thread.status === 'Menunggu Balasan' ? 'warning' : thread.status === 'Selesai' ? 'success' : 'normal',
        timestamp: dt.timestamp,
        dateOnly: dt.dateOnly,
        sortTime: dt.sortTime,
        detailLink: '/admin/messages'
      })
    }
  } catch {
    // Support threads optional fallback
  }

  // 9. Log Audit Admin dari TiDB
  try {
    const auditRows = await queryRows<DbAuditRow>(
      'SELECT id, action, resource, record_id, summary, actor, created_at FROM admin_audit_logs ORDER BY created_at DESC LIMIT 100'
    )
    for (const log of auditRows) {
      const dt = parseDateSafe(log.created_at)
      activities.push({
        id: `act-aud-${log.id}`,
        category: 'audit',
        categoryLabel: 'Audit Admin',
        title: `[${log.action}] ${log.resource}`,
        actor: log.actor,
        actorPhone: resolvePhone(null, log.actor),
        actorContact: `Tabel ${log.resource}`,
        referenceCode: log.record_id,
        description: log.summary,
        amount: null,
        status: log.action,
        severity: log.action === 'DELETE' ? 'danger' : log.action === 'CREATE' ? 'success' : 'normal',
        timestamp: dt.timestamp,
        dateOnly: dt.dateOnly,
        sortTime: dt.sortTime,
        detailLink: '/admin/crud'
      })
    }
  } catch {
    // TiDB audit log optional fallback
  }

  // Sort newest first
  activities.sort((a, b) => b.sortTime - a.sortTime)

  const byCategory: Record<ActivityCategory, number> = {
    booking: 0,
    registration: 0,
    community: 0,
    sos: 0,
    verification: 0,
    refund: 0,
    payout: 0,
    chat: 0,
    audit: 0
  }
  for (const act of activities) {
    byCategory[act.category] += 1
  }

  const now = new Date()
  const generatedAt = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta'
  }).format(now) + ' WIB'

  return {
    generatedAt,
    summary: {
      totalActivities: activities.length,
      totalBookings,
      totalBookingParticipants,
      totalFinancialValue,
      totalPaidValue,
      totalRegistrations,
      totalCommunityPosts: communityPosts.length,
      activeSosCount,
      pendingQueueCount,
      byCategory
    },
    activities
  }
})

import type { RowDataPacket } from 'mysql2/promise'
import { defineEventHandler } from 'h3'
import type {
  AdminFinanceReportResponse,
  DestinationFinanceRow,
  FinanceLedgerItem,
  FinanceSeverity
} from '#shared/types/finance'
import { queryRows } from '../../utils/db'
import {
  customerBookingsStore,
  guidePayoutsStore,
  platformFeaturesStore,
  weatherRefundsStore
} from '../../utils/platformStore'
import { requireAdmin } from '../../utils/requireAdmin'

interface DbBookingFinanceRow extends RowDataPacket {
  id: string
  invoice_number: string
  booking_type: string
  trip_slug: string
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
  created_at: string
}

function parseFinanceDate(raw: string | Date | null | undefined): {
  timestamp: string
  dateOnly: string
  sortTime: number
} {
  if (!raw) {
    const now = new Date()
    const iso = now.toISOString()
    return { timestamp: `${iso.slice(0, 10)} 00:00 WIB`, dateOnly: iso.slice(0, 10), sortTime: now.getTime() }
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
  const parsed = Date.parse(text)
  const d = Number.isNaN(parsed) ? new Date() : new Date(parsed)
  return {
    timestamp: text,
    dateOnly: d.toISOString().slice(0, 10),
    sortTime: d.getTime()
  }
}

function bookingSeverity(paymentStatus: string, bookingStatus: string): FinanceSeverity {
  if (bookingStatus === 'Dibatalkan') return 'danger'
  if (paymentStatus === 'LUNAS') return 'success'
  return 'warning'
}

export default defineEventHandler(async (event): Promise<AdminFinanceReportResponse> => {
  await requireAdmin(event)

  const commissionPercent = platformFeaturesStore.platformCommissionPercent
  const commissionRate = commissionPercent / 100
  const defaultServiceFee = platformFeaturesStore.serviceFeeAmount

  const ledger: FinanceLedgerItem[] = []
  const destinationMap = new Map<string, DestinationFinanceRow>()
  const seenInvoices = new Set<string>()

  let totalBookingGross = 0
  let totalCashIn = 0
  let totalReceivable = 0
  let totalBookingCommission = 0
  let totalServiceFee = 0
  let totalInsuranceFee = 0
  let totalCarbonOffsetFee = 0
  let paidTransactionsCount = 0
  let dpTransactionsCount = 0
  let unpaidTransactionsCount = 0

  function accumulateDestination(params: {
    tripSlug: string
    tripTitle: string
    location: string
    participantsCount: number
    totalAmount: number
    paidAmount: number
    commission: number
  }) {
    const existing = destinationMap.get(params.tripSlug)
    const unpaid = Math.max(0, params.totalAmount - params.paidAmount)
    if (existing) {
      existing.bookingsCount += 1
      existing.participantsCount += params.participantsCount
      existing.grossRevenue += params.totalAmount
      existing.paidRevenue += params.paidAmount
      existing.unpaidRevenue += unpaid
      existing.estimatedCommission += params.commission
    } else {
      destinationMap.set(params.tripSlug, {
        tripSlug: params.tripSlug,
        tripTitle: params.tripTitle,
        location: params.location,
        bookingsCount: 1,
        participantsCount: params.participantsCount,
        grossRevenue: params.totalAmount,
        paidRevenue: params.paidAmount,
        unpaidRevenue: unpaid,
        estimatedCommission: params.commission
      })
    }
  }

  // 1. Booking & Payment Income (in-memory live store)
  for (const bk of customerBookingsStore) {
    seenInvoices.add(bk.invoiceNumber)
    const dt = parseFinanceDate(bk.paidAt || bk.createdAt)
    const commissionBase = bk.packageSubtotal + bk.hotelSubtotal
    const estimatedCommission = Math.round(commissionBase * commissionRate)
    const unpaid = Math.max(0, bk.totalAmount - bk.paidAmount)

    totalBookingGross += bk.totalAmount
    totalCashIn += bk.paidAmount
    totalReceivable += unpaid
    totalBookingCommission += estimatedCommission
    totalServiceFee += bk.serviceFee
    totalInsuranceFee += bk.insuranceFee
    totalCarbonOffsetFee += bk.carbonOffsetFee

    if (bk.paymentStatus === 'LUNAS') paidTransactionsCount += 1
    else if (bk.paymentStatus === 'DP 30% Lunas') dpTransactionsCount += 1
    else unpaidTransactionsCount += 1

    accumulateDestination({
      tripSlug: bk.tripSlug,
      tripTitle: bk.tripTitle,
      location: bk.location,
      participantsCount: bk.participantsCount,
      totalAmount: bk.totalAmount,
      paidAmount: bk.paidAmount,
      commission: estimatedCommission
    })

    ledger.push({
      id: `fin-bk-${bk.id}`,
      dateOnly: dt.dateOnly,
      timestamp: dt.timestamp,
      sortTime: dt.sortTime,
      type: 'income_booking',
      typeLabel: bk.bookingType === 'hotel' ? 'Pemasukan Hotel' : 'Pemasukan Booking',
      direction: 'MASUK',
      referenceCode: bk.invoiceNumber,
      title: bk.tripTitle,
      counterparty: bk.leaderName,
      counterpartyInfo: `${bk.participantsCount} org • ${bk.customerPhone}`,
      paymentMethod: bk.paymentMethod,
      grossAmount: bk.totalAmount,
      settledAmount: bk.paidAmount,
      outstandingAmount: unpaid,
      platformCommission: estimatedCommission,
      serviceFee: bk.serviceFee,
      insuranceFee: bk.insuranceFee,
      carbonOffsetFee: bk.carbonOffsetFee,
      netCashImpact: bk.paidAmount,
      status: bk.paymentStatus,
      severity: bookingSeverity(bk.paymentStatus, bk.bookingStatus),
      notes: `${bk.paymentScheme} • ${bk.location} • Berangkat ${bk.departureDate}`,
      detailLink: '/admin/bookings'
    })
  }

  // Merge TiDB customer_bookings that aren't in memory
  try {
    const dbBookings = await queryRows<DbBookingFinanceRow>(
      'SELECT * FROM customer_bookings ORDER BY created_at DESC LIMIT 200'
    )
    for (const row of dbBookings) {
      if (seenInvoices.has(row.invoice_number)) continue
      seenInvoices.add(row.invoice_number)
      const dt = parseFinanceDate(row.created_at)
      const totalAmount = Number(row.total_amount || 0)
      const paidAmount = Number(row.paid_amount || 0)
      const unpaid = Math.max(0, totalAmount - paidAmount)
      const serviceFee = totalAmount > defaultServiceFee ? defaultServiceFee : 0
      const estimatedCommission = Math.round(Math.max(0, totalAmount - serviceFee) * commissionRate)

      totalBookingGross += totalAmount
      totalCashIn += paidAmount
      totalReceivable += unpaid
      totalBookingCommission += estimatedCommission
      totalServiceFee += serviceFee

      if (row.payment_status === 'LUNAS') paidTransactionsCount += 1
      else if (row.payment_status === 'DP 30% Lunas') dpTransactionsCount += 1
      else unpaidTransactionsCount += 1

      accumulateDestination({
        tripSlug: row.trip_slug,
        tripTitle: row.trip_title,
        location: row.location,
        participantsCount: Number(row.participants_count || 1),
        totalAmount,
        paidAmount,
        commission: estimatedCommission
      })

      ledger.push({
        id: `fin-dbbk-${row.id}`,
        dateOnly: dt.dateOnly,
        timestamp: dt.timestamp,
        sortTime: dt.sortTime,
        type: 'income_booking',
        typeLabel: row.booking_type === 'hotel' ? 'Pemasukan Hotel' : 'Pemasukan Booking',
        direction: 'MASUK',
        referenceCode: row.invoice_number,
        title: row.trip_title,
        counterparty: row.leader_name,
        counterpartyInfo: `${row.participants_count} org • ${row.customer_phone}`,
        paymentMethod: row.payment_method,
        grossAmount: totalAmount,
        settledAmount: paidAmount,
        outstandingAmount: unpaid,
        platformCommission: estimatedCommission,
        serviceFee,
        insuranceFee: 0,
        carbonOffsetFee: 0,
        netCashImpact: paidAmount,
        status: row.payment_status,
        severity: bookingSeverity(row.payment_status, row.booking_status),
        notes: `${row.location} • Berangkat ${row.departure_date}`,
        detailLink: '/admin/bookings'
      })
    }
  } catch {
    // Graceful fallback if TiDB unavailable
  }

  // 2. Guide Payouts (Outflow to Guides + Realized Platform Commission)
  let payoutGrossTotal = 0
  let payoutCommissionTotal = 0
  let totalPayoutReleased = 0
  let totalPayoutPending = 0

  for (const pay of guidePayoutsStore) {
    const dt = parseFinanceDate(pay.releasedAt || pay.departureDate)
    const isReleased = pay.status === 'Dicairkan'
    payoutGrossTotal += pay.grossAmount
    payoutCommissionTotal += pay.platformCommission
    if (isReleased) totalPayoutReleased += pay.netPayout
    else totalPayoutPending += pay.netPayout

    ledger.push({
      id: `fin-pay-${pay.id}`,
      dateOnly: dt.dateOnly,
      timestamp: dt.timestamp,
      sortTime: dt.sortTime,
      type: 'payout_guide',
      typeLabel: 'Payout Pemandu',
      direction: 'KELUAR',
      referenceCode: pay.id.toUpperCase(),
      title: pay.tripTitle,
      counterparty: pay.guideName,
      counterpartyInfo: `Pemandu Lokal • ${pay.participantsCount} peserta`,
      paymentMethod: 'Transfer Escrow Pemandu',
      grossAmount: pay.grossAmount,
      settledAmount: isReleased ? pay.netPayout : 0,
      outstandingAmount: isReleased ? 0 : pay.netPayout,
      platformCommission: pay.platformCommission,
      serviceFee: 0,
      insuranceFee: 0,
      carbonOffsetFee: 0,
      netCashImpact: isReleased ? -pay.netPayout : 0,
      status: pay.status,
      severity: isReleased ? 'success' : 'warning',
      notes: `Bruto Rp ${pay.grossAmount.toLocaleString('id-ID')} • Komisi ${Math.round(pay.commissionRate * 100)}% (Rp ${pay.platformCommission.toLocaleString('id-ID')})`,
      detailLink: '/admin/payouts'
    })
  }

  // 3. Weather Refunds (Outflow / Potential Liability)
  let totalRefundApproved = 0
  let totalRefundPending = 0

  for (const ref of weatherRefundsStore) {
    const dt = parseFinanceDate(ref.requestedAt)
    const isApproved = ref.status === 'Disetujui & Dikembalikan'
    const isPending = ref.status === 'Menunggu Persetujuan'
    if (isApproved) totalRefundApproved += ref.refundAmount
    if (isPending) totalRefundPending += ref.refundAmount

    ledger.push({
      id: `fin-ref-${ref.id}`,
      dateOnly: dt.dateOnly,
      timestamp: dt.timestamp,
      sortTime: dt.sortTime,
      type: 'refund_weather',
      typeLabel: 'Refund Cuaca',
      direction: 'KELUAR',
      referenceCode: ref.bookingCode,
      title: ref.tripTitle,
      counterparty: ref.customerName,
      counterpartyInfo: `Berangkat ${ref.departureDate}`,
      paymentMethod: 'Pengembalian Dana Escrow',
      grossAmount: ref.refundAmount,
      settledAmount: isApproved ? ref.refundAmount : 0,
      outstandingAmount: isPending ? ref.refundAmount : 0,
      platformCommission: 0,
      serviceFee: 0,
      insuranceFee: 0,
      carbonOffsetFee: 0,
      netCashImpact: isApproved ? -ref.refundAmount : 0,
      status: ref.status,
      severity: isApproved ? 'success' : ref.status === 'Ditolak' ? 'danger' : 'warning',
      notes: `${ref.weatherCondition} — ${ref.reason}`,
      detailLink: '/admin/payouts'
    })
  }

  ledger.sort((a, b) => b.sortTime - a.sortTime)

  const byDestination = Array.from(destinationMap.values()).sort(
    (a, b) => b.grossRevenue - a.grossRevenue || b.participantsCount - a.participantsCount
  )

  const totalGmv = totalBookingGross + payoutGrossTotal
  const totalPlatformCommission = totalBookingCommission + payoutCommissionTotal
  const totalPlatformNetRevenue = totalPlatformCommission + totalServiceFee
  const totalCashOut = totalPayoutReleased + totalRefundApproved
  const netEscrowBalance = totalCashIn + payoutGrossTotal - totalCashOut

  const generatedAt =
    new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: 'Asia/Jakarta'
    }).format(new Date()) + ' WIB'

  return {
    generatedAt,
    summary: {
      commissionPercent,
      totalGmv,
      totalBookingGross,
      totalCashIn,
      totalReceivable,
      totalPlatformCommission,
      totalServiceFee,
      totalInsuranceFee,
      totalCarbonOffsetFee,
      totalPlatformNetRevenue,
      totalPayoutReleased,
      totalPayoutPending,
      totalRefundApproved,
      totalRefundPending,
      totalCashOut,
      netEscrowBalance,
      paidTransactionsCount,
      dpTransactionsCount,
      unpaidTransactionsCount,
      totalTransactionsCount: paidTransactionsCount + dpTransactionsCount + unpaidTransactionsCount
    },
    byDestination,
    ledger
  }
})

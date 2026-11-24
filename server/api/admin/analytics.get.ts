import { defineEventHandler } from 'h3'
import { requireAdmin } from '../../utils/requireAdmin'
import {
  customerBookingsStore,
  guideManagedPackagesStore,
  guidePayoutsStore,
  guideVerificationsStore,
  platformFeaturesStore,
  sosAlertsStore,
  weatherRefundsStore
} from '../../utils/platformStore'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const commissionRate = platformFeaturesStore.platformCommissionPercent / 100
  const payoutGross = guidePayoutsStore.reduce((sum, p) => sum + p.grossAmount, 0)
  const bookingGross = customerBookingsStore.reduce((sum, b) => sum + b.totalAmount, 0)
  const totalGmv = payoutGross + bookingGross
  const platformCommission = Math.round(totalGmv * commissionRate)
  const totalTransactions = customerBookingsStore.length
  const totalBookedParticipants = customerBookingsStore.reduce((sum, b) => sum + b.participantsCount, 0)
  const activeSosCount = sosAlertsStore.filter((s) => s.status === 'ACTIVE').length
  const pendingVerifications = guideVerificationsStore.filter((v) => v.status === 'pending').length
  const pendingPayouts = guidePayoutsStore.filter((p) => p.status === 'Menunggu Pencairan').length
  const pendingRefunds = weatherRefundsStore.filter((r) => r.status === 'Menunggu Persetujuan').length

  // Real-time destination demand aggregation from customer bookings
  const destinationMap = new Map<
    string,
    {
      tripSlug: string
      tripTitle: string
      location: string
      guideName: string
      bookingsCount: number
      participantsCount: number
      totalRevenue: number
      paidCount: number
    }
  >()

  for (const bk of customerBookingsStore) {
    const existing = destinationMap.get(bk.tripSlug)
    if (existing) {
      existing.bookingsCount += 1
      existing.participantsCount += bk.participantsCount
      existing.totalRevenue += bk.totalAmount
      if (bk.paymentStatus !== 'MENUNGGU PEMBAYARAN') existing.paidCount += 1
    } else {
      destinationMap.set(bk.tripSlug, {
        tripSlug: bk.tripSlug,
        tripTitle: bk.tripTitle,
        location: bk.location,
        guideName: bk.guideName,
        bookingsCount: 1,
        participantsCount: bk.participantsCount,
        totalRevenue: bk.totalAmount,
        paidCount: bk.paymentStatus !== 'MENUNGGU PEMBAYARAN' ? 1 : 0
      })
    }
  }

  const popularDestinations = Array.from(destinationMap.values()).sort(
    (a, b) => b.participantsCount - a.participantsCount || b.totalRevenue - a.totalRevenue
  )

  return {
    metrics: {
      totalGmv,
      platformCommission,
      commissionPercent: platformFeaturesStore.platformCommissionPercent,
      totalTransactions,
      totalBookedParticipants,
      activeTripsCount: guideManagedPackagesStore.length,
      activeSosCount,
      pendingVerifications,
      pendingPayouts,
      pendingRefunds
    },
    popularDestinations,
    recentBookings: customerBookingsStore.slice(0, 8),
    features: platformFeaturesStore,
    sosAlerts: sosAlertsStore,
    liveTrips: guideManagedPackagesStore
  }
})

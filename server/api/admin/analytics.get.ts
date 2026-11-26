import { defineEventHandler } from 'h3'
import { requireAdmin } from '../../utils/requireAdmin'
import { guideManagedPackagesStore } from '../../utils/platformStore'
import {
  loadAllBookings,
  loadGuidePayouts,
  loadGuideVerifications,
  loadPlatformFeatures,
  loadSosAlerts,
  loadWeatherRefunds
} from '../../utils/runtimePersistence'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const [bookings, features, sosAlerts, verifications, payouts, weatherRefunds] = await Promise.all([
    loadAllBookings(),
    loadPlatformFeatures(),
    loadSosAlerts(),
    loadGuideVerifications(),
    loadGuidePayouts(),
    loadWeatherRefunds()
  ])

  const commissionRate = features.platformCommissionPercent / 100
  const payoutGross = payouts.reduce((sum, p) => sum + p.grossAmount, 0)
  const bookingGross = bookings.reduce((sum, b) => sum + b.totalAmount, 0)
  const totalGmv = payoutGross + bookingGross
  const platformCommission = Math.round(totalGmv * commissionRate)
  const totalTransactions = bookings.length
  const totalBookedParticipants = bookings.reduce((sum, b) => sum + b.participantsCount, 0)
  const activeSosCount = sosAlerts.filter((s) => s.status === 'ACTIVE').length
  const pendingVerifications = verifications.filter((v) => v.status === 'pending').length
  const pendingPayouts = payouts.filter((p) => p.status === 'Menunggu Pencairan').length
  const pendingRefunds = weatherRefunds.filter((r) => r.status === 'Menunggu Persetujuan').length

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

  for (const bk of bookings) {
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
      commissionPercent: features.platformCommissionPercent,
      totalTransactions,
      totalBookedParticipants,
      activeTripsCount: guideManagedPackagesStore.length,
      activeSosCount,
      pendingVerifications,
      pendingPayouts,
      pendingRefunds
    },
    popularDestinations,
    recentBookings: bookings.slice(0, 8),
    features,
    sosAlerts,
    liveTrips: guideManagedPackagesStore
  }
})

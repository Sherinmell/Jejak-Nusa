import { defineEventHandler } from 'h3'
import { getAuthSessionUser } from '../../../utils/authStore'
import {
  customerBookingsStore,
  guideManagedPackagesStore,
  guidePayoutsStore,
  guideVerificationsStore,
  platformFeaturesStore
} from '../../../utils/platformStore'

export default defineEventHandler((event) => {
  const user = getAuthSessionUser(event)
  const guideName = user?.name || 'I Made Surya Pratama'

  const commissionPercent = platformFeaturesStore.platformCommissionPercent
  const commissionRate = commissionPercent / 100

  // Real-time customer bookings for this guide (plus all incoming bookings for easy demo visibility)
  const myBookings = customerBookingsStore.filter(
    (b) =>
      b.guideId === user?.id ||
      b.guideName.toLowerCase() === guideName.toLowerCase()
  )

  const bookingsGross = customerBookingsStore.reduce((sum, b) => sum + b.paidAmount, 0)
  const managedGross = guideManagedPackagesStore.reduce(
    (sum, t) => sum + t.pricePerPerson * t.bookedCount,
    0
  )
  const grossRevenue = Math.max(managedGross, bookingsGross)
  const platformCommission = Math.round(grossRevenue * commissionRate)
  const netRevenue = grossRevenue - platformCommission
  const totalParticipants = customerBookingsStore.reduce((sum, b) => sum + b.participantsCount, 0)
  const openTripsCount = guideManagedPackagesStore.filter((t) => t.quotaOpen).length

  const verificationRecord = user
    ? guideVerificationsStore.find((v) => v.guideId === user.id || v.email === user.email)
    : null

  return {
    guide: {
      name: guideName,
      origin: user?.origin || 'Singaraja, Bali',
      verified: verificationRecord ? verificationRecord.status === 'approved' : Boolean(user?.verified ?? true),
      verificationStatus: verificationRecord?.status || (user?.verificationStatus === 'pending' ? 'pending' : 'approved'),
      certification:
        verificationRecord
          ? `${verificationRecord.licenseBody} — ${verificationRecord.licenseNumber}`
          : user?.certification || 'ICOpro Canyoning Lv. 2 & APGI'
    },
    stats: {
      commissionPercent,
      grossRevenue,
      platformCommission,
      netRevenue,
      totalParticipants,
      myCustomersCount: myBookings.length,
      openTripsCount,
      totalTripsCount: guideManagedPackagesStore.length
    },
    myBookings,
    allBookings: customerBookingsStore,
    trips: guideManagedPackagesStore,
    payouts: guidePayoutsStore
  }
})

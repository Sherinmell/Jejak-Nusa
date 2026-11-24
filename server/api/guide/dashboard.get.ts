import { defineEventHandler } from 'h3'
import type { GuideDashboardResponse } from '#shared/types/adventure'
import { guideBookingsStore, guideManagedTripsStore } from '../../utils/guidePortalStore'
import { getGuideDashboardFromDb } from '../../utils/dbRepositories'
import { getAuthSessionUser } from '../../utils/authStore'
import { TRIPS_DATA } from '../../utils/tripsData'

export default defineEventHandler(async (event): Promise<GuideDashboardResponse> => {
  const sessionUser = getAuthSessionUser(event)
  const activeGuideProfile =
    sessionUser?.role === 'guide'
      ? TRIPS_DATA.find((t) => t.guide.id === sessionUser.id || t.guide.name === sessionUser.name)?.guide
      : null

  let base: GuideDashboardResponse
  try {
    base = await getGuideDashboardFromDb()
  } catch {
    const escrowBalance = guideBookingsStore.reduce((sum, b) => sum + b.paidAmount, 0)
    const monthlyRevenue = escrowBalance + 14850000
    const activeParticipants = guideManagedTripsStore.reduce((sum, t) => sum + t.bookedCount, 0)

    base = {
      guideName: 'I Made Surya Pratama',
      certifications: ['ICOpro Canyoning Guide Lv. 2', 'BASARNAS Water Rescue', 'First Aid Wilderness'],
      escrowBalance,
      monthlyRevenue,
      activeParticipants,
      averageRating: 4.95,
      safetyScore: 99,
      managedTrips: guideManagedTripsStore,
      bookings: guideBookingsStore
    }
  }

  if (sessionUser?.role === 'guide') {
    return {
      ...base,
      guideName: sessionUser.name,
      certifications: activeGuideProfile?.certifications ?? base.certifications,
      averageRating: activeGuideProfile?.rating ?? base.averageRating
    }
  }

  return base
})

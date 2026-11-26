import type {
  CreateCheckoutBookingPayload,
  CustomerBookingRecord,
  PlatformFeatureFlags
} from '#shared/types/booking'
import type { Trip, TripsApiResponse } from '#shared/types/trip'

const DEFAULT_FEATURES: PlatformFeatureFlags = {
  qrisEnabled: true,
  splitBillDpEnabled: true,
  instantInsuranceEnabled: true,
  carbonOffsetEnabled: true,
  customTripEnabled: true,
  requireIdentityAndHealthCert: true,
  platformCommissionPercent: 10,
  serviceFeeAmount: 15000,
  updatedAt: '2026-11-24 00:00 WIB'
}

export function useMarketplace() {
  const features = useState<PlatformFeatureFlags>('jejaknusa-features', () => ({ ...DEFAULT_FEATURES }))
  const featuresLoaded = useState<boolean>('jejaknusa-features-loaded', () => false)

  const bookings = useState<CustomerBookingRecord[]>('jejaknusa-bookings', () => [])
  const bookingsLoaded = useState<boolean>('jejaknusa-bookings-loaded', () => false)
  const bookingsOwner = useState<string>('jejaknusa-bookings-owner', () => '')

  const trips = useState<Trip[]>('jejaknusa-trips', () => [])

  async function fetchFeatures(force = false) {
    if (featuresLoaded.value && !force) return features.value
    try {
      const fetcher = useRequestFetch()
      const res = await fetcher<{ features: PlatformFeatureFlags }>('/api/features')
      if (res?.features) {
        features.value = { ...res.features }
        featuresLoaded.value = true
      }
    } catch {
      // keep defaults
    }
    return features.value
  }

  async function updateFeatures(patch: Partial<PlatformFeatureFlags>) {
    const res = await $fetch<{ ok: boolean; features: PlatformFeatureFlags }>('/api/admin/features', {
      method: 'PATCH',
      body: patch
    })
    if (res?.features) {
      features.value = { ...res.features }
      featuresLoaded.value = true
    }
    return features.value
  }

  async function fetchBookings(force = false) {
    const activeUser = useState<{ id?: string } | null>('jejaknusa-auth-user', () => null)
    const activeUserId = activeUser.value?.id || ''
    const ownerChanged = bookingsOwner.value !== activeUserId
    if (bookingsLoaded.value && !force && !ownerChanged) return bookings.value
    try {
      const fetcher = useRequestFetch()
      const res = await fetcher<{
        bookings: CustomerBookingRecord[]
        features?: PlatformFeatureFlags
      }>('/api/bookings')
      if (res?.bookings) {
        bookings.value = res.bookings
        bookingsLoaded.value = true
        bookingsOwner.value = activeUserId
      }
      if (res?.features) {
        features.value = { ...res.features }
        featuresLoaded.value = true
      }
    } catch {
      // Keep existing bookings intact on transient error
    }
    return bookings.value
  }

  async function fetchTrips(force = false) {
    if (trips.value.length && !force) return trips.value
    try {
      const fetcher = useRequestFetch()
      const res = await fetcher<TripsApiResponse>('/api/trips')
      if (res?.trips) {
        trips.value = res.trips
      }
    } catch {
      // ignore
    }
    return trips.value
  }

  async function createCheckoutBooking(payload: CreateCheckoutBookingPayload) {
    const res = await $fetch<{ ok: boolean; booking: CustomerBookingRecord }>('/api/bookings', {
      method: 'POST',
      body: payload
    })
    if (res?.booking) {
      bookings.value = [res.booking, ...bookings.value.filter((b) => b.id !== res.booking.id)]
      bookingsLoaded.value = true
    }
    return res.booking
  }

  async function confirmBookingPayment(id: string) {
    const res = await $fetch<{ ok: boolean; booking: CustomerBookingRecord }>(`/api/bookings/${id}`, {
      method: 'PATCH',
      body: { action: 'confirm-payment' }
    })
    if (res?.booking) {
      bookings.value = bookings.value.map((b) => (b.id === res.booking.id ? res.booking : b))
    }
    return res.booking
  }

  async function verifyBookingByAdmin(id: string) {
    const res = await $fetch<{ ok: boolean; booking: CustomerBookingRecord }>(`/api/bookings/${id}`, {
      method: 'PATCH',
      body: { action: 'verify-payment' }
    })
    if (res?.booking) {
      bookings.value = bookings.value.map((b) => (b.id === res.booking.id ? res.booking : b))
    }
    return res.booking
  }

  async function toggleParticipantCheckin(id: string, checkedIn?: boolean) {
    const res = await $fetch<{ ok: boolean; booking: CustomerBookingRecord }>(`/api/bookings/${id}`, {
      method: 'PATCH',
      body: { action: 'toggle-checkin', checkedIn }
    })
    if (res?.booking) {
      bookings.value = bookings.value.map((b) => (b.id === res.booking.id ? res.booking : b))
    }
    return res.booking
  }

  async function setTripCompletionStatus(id: string, completed: boolean) {
    const res = await $fetch<{ ok: boolean; booking: CustomerBookingRecord }>(`/api/bookings/${id}`, {
      method: 'PATCH',
      body: { action: 'set-trip-status', completed }
    })
    if (res?.booking) {
      bookings.value = bookings.value.map((b) => (b.id === res.booking.id ? res.booking : b))
    }
    return res.booking
  }

  async function sendCertificateToParticipant(id: string, adminNote?: string) {
    const res = await $fetch<{ ok: boolean; booking: CustomerBookingRecord }>(`/api/bookings/${id}`, {
      method: 'PATCH',
      body: { action: 'send-certificate', adminNote }
    })
    if (res?.booking) {
      bookings.value = bookings.value.map((b) => (b.id === res.booking.id ? res.booking : b))
    }
    return res.booking
  }

  async function claimTripCertificate(id: string, holderName?: string) {
    const res = await $fetch<{
      ok: boolean
      booking: CustomerBookingRecord
      passportReward?: { pointsAwarded: number; unlockedBadges: string[] }
    }>(`/api/bookings/${id}`, {
      method: 'PATCH',
      body: { action: 'claim-certificate', holderName }
    })
    if (res?.booking) {
      bookings.value = bookings.value.map((b) => (b.id === res.booking.id ? res.booking : b))
    }
    return res
  }

  return {
    features,
    bookings,
    trips,
    fetchFeatures,
    updateFeatures,
    fetchBookings,
    fetchTrips,
    createCheckoutBooking,
    confirmBookingPayment,
    verifyBookingByAdmin,
    toggleParticipantCheckin,
    setTripCompletionStatus,
    sendCertificateToParticipant,
    claimTripCertificate
  }
}

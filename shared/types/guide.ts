import type { AdrenalineLevel, ItineraryItem, TripCategory } from './trip'

export type SimpleTrailWeatherStatus = 'Buka' | 'Waspada Hujan' | 'Tutup'

export interface TripGearChecklistItem {
  id: string
  item: string
  mandatory: boolean
  note?: string
}

export interface GuideManagedTripItem {
  id: string
  slug: string
  title: string
  location: string
  province: string
  category: TripCategory
  adrenalineLevel: AdrenalineLevel
  duration: string
  nextDepartureDate: string
  pricePerPerson: number
  totalQuota: number
  bookedCount: number
  quotaOpen: boolean
  trailWeatherStatus: SimpleTrailWeatherStatus
  weatherNote: string
  coverImage: string
  meetingPoint: string
  gearChecklist: TripGearChecklistItem[]
  itinerary: ItineraryItem[]
}

export type GuideVerificationStatus = 'pending' | 'approved' | 'rejected'

export interface GuideVerificationApplication {
  id: string
  guideId: string
  guideName: string
  email: string
  origin: string
  avatar: string
  licenseBody: 'APGI' | 'POSSI' | 'ICOpro' | 'HPI' | 'FAJI'
  licenseNumber: string
  specialty: TripCategory
  experienceYears: number
  documentTitle: string
  documentPreviewUrl: string
  submittedAt: string
  status: GuideVerificationStatus
  reviewNote?: string
}

export type PayoutStatus = 'Menunggu Pencairan' | 'Dicairkan'

export interface GuidePayoutRecord {
  id: string
  tripTitle: string
  guideName: string
  departureDate: string
  participantsCount: number
  grossAmount: number
  commissionRate: number
  platformCommission: number
  netPayout: number
  status: PayoutStatus
  releasedAt?: string
}

export type WeatherRefundStatus = 'Menunggu Persetujuan' | 'Disetujui & Dikembalikan' | 'Ditolak'

export interface WeatherRefundRecord {
  id: string
  bookingCode: string
  customerName: string
  tripTitle: string
  departureDate: string
  weatherCondition: string
  reason: string
  refundAmount: number
  requestedAt: string
  status: WeatherRefundStatus
}

export interface CreateGuideTripPayload {
  title: string
  location: string
  province: string
  category: TripCategory
  adrenalineLevel: AdrenalineLevel
  pricePerPerson: number
  duration: string
  nextDepartureDate: string
  totalQuota: number
  meetingPoint: string
  shortDescription: string
  itinerary: ItineraryItem[]
  gearChecklist: { item: string; mandatory: boolean }[]
}

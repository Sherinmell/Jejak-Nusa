import type { UserRole } from './auth'
import type { TripCategory } from './trip'

export type BookingType = 'trip' | 'trip+hotel' | 'hotel'

export interface PlatformFeatureFlags {
  qrisEnabled: boolean
  splitBillDpEnabled: boolean
  instantInsuranceEnabled: boolean
  carbonOffsetEnabled: boolean
  customTripEnabled: boolean
  requireIdentityAndHealthCert: boolean
  platformCommissionPercent: number
  serviceFeeAmount: number
  updatedAt: string
}

export interface BookingParticipant {
  fullName: string
  idNumber: string
  emergencyContact: string
  medicalNotes: string
  agreementAccepted: boolean
}

export interface BookingGearCheckState {
  id: string
  item: string
  mandatory: boolean
  checked: boolean
}

export type BookingPaymentStatus = 'LUNAS' | 'DP 30% Lunas' | 'MENUNGGU PEMBAYARAN'

export interface CustomerBookingRecord {
  id: string
  customerId: string
  bookingType: BookingType
  invoiceNumber: string
  bookingCode: string
  tripSlug: string
  tripTitle: string
  location: string
  coverImage: string
  departureDate: string
  guideId: string
  guideName: string
  guideCertification: string
  leaderName: string
  customerPhone: string
  customerEmail: string
  specialNotes: string
  participantsCount: number
  // Optional or primary Hotel Stay fields
  hotelSlug?: string
  hotelName?: string
  hotelRoomName?: string
  hotelCheckIn?: string
  hotelCheckOut?: string
  hotelNights?: number
  hotelRooms?: number
  hotelSubtotal: number
  shuttleFee: number
  // Payment & Financials
  paymentMethod: 'QRIS Instant Payment' | 'Transfer Virtual Account'
  paymentReference: string
  paymentScheme: 'DP 30%' | 'Lunas 100%'
  paymentStatus: BookingPaymentStatus
  bookingStatus: 'Terkonfirmasi' | 'Menunggu Konfirmasi' | 'Selesai'
  hasInsurance: boolean
  hasCarbonOffset: boolean
  packageSubtotal: number
  insuranceFee: number
  carbonOffsetFee: number
  serviceFee: number
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  splitPerPerson: number
  splitPaymentLink: string
  rosterNames: string[]
  participants?: BookingParticipant[]
  agreementAccepted?: boolean
  gearChecklist: BookingGearCheckState[]
  checkedIn: boolean
  createdAt: string
  paidAt?: string
  completedAt?: string
  certificateSent?: boolean
  certificateSentAt?: string
  certificateSentBy?: string
  certificateAdminNote?: string
  certificateId?: string
  certificateClaimed?: boolean
  certificateClaimedAt?: string
  certificateHolderName?: string
}

export interface CreateCheckoutBookingPayload {
  bookingType?: BookingType
  tripSlug?: string
  leaderName: string
  customerPhone: string
  customerEmail: string
  specialNotes?: string
  participantsCount: number
  includeInsurance?: boolean
  includeCarbonOffset?: boolean
  paymentScheme?: 'DP 30%' | 'Lunas 100%'
  paymentMethod?: 'QRIS Instant Payment' | 'Transfer Virtual Account'
  markPaidImmediately?: boolean
  rosterNames?: string[]
  participants?: BookingParticipant[]
  agreementAccepted?: boolean
  // Hotel fields (for 'trip+hotel' or 'hotel')
  hotelSlug?: string
  hotelRoomId?: string
  hotelCheckIn?: string
  hotelCheckOut?: string
  hotelNights?: number
  hotelRooms?: number
  includeShuttle?: boolean
}

export interface TripLobbyMessage {
  id: string
  tripSlug: string
  senderName: string
  senderRole: UserRole
  senderAvatar: string
  message: string
  createdAt: string
}

export type SosStatus = 'ACTIVE' | 'RESOLVED'

export interface SosAlertRecord {
  id: string
  tripSlug: string
  tripTitle: string
  reporterName: string
  reporterRole: UserRole
  latitude: number
  longitude: number
  locationLabel: string
  message: string
  status: SosStatus
  createdAt: string
  resolvedBy?: string
  resolvedAt?: string
}

export interface CustomTripBidPayload {
  pricePerPerson: number
  highlights: string[]
  note: string
}

export interface CreateCustomRequestPayload {
  title: string
  destination: string
  category: TripCategory
  preferredDate: string
  groupSize: number
  budgetPerPerson: number
  notes: string
}

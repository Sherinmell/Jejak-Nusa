import type { Trip } from './trip'
import type { Hotel } from './hotel'
import type { AuthUser } from './auth'
import type {
  CommunityBuddyPost,
  GearAddon,
  GuideBookingRecord
} from './adventure'
import type { CustomTripRequest, LoyaltyReward } from './ecosystem'

export type AdminResourceName =
  | 'trips'
  | 'hotels'
  | 'bookings'
  | 'users'
  | 'addons'
  | 'community'
  | 'custom-trips'
  | 'rewards'

export interface AdminAuditLog {
  id: string
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  resource: string
  recordId: string
  summary: string
  actor: string
  createdAt: string
}

export interface AdminUserRecord extends AuthUser {
  points: number
  totalKmExplored: number
}

export interface AdminOverviewResponse {
  storageMode: 'tidb' | 'fallback'
  databaseName: string
  dbError?: string
  counts: {
    trips: number
    hotels: number
    bookings: number
    users: number
    addons: number
    community: number
    customTrips: number
    rewards: number
    auditLogs: number
  }
  trips: Trip[]
  hotels: Hotel[]
  bookings: GuideBookingRecord[]
  users: AdminUserRecord[]
  addons: GearAddon[]
  community: CommunityBuddyPost[]
  customTrips: CustomTripRequest[]
  rewards: LoyaltyReward[]
  auditLogs: AdminAuditLog[]
}

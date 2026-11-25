export type ActivityCategory =
  | 'booking'
  | 'registration'
  | 'community'
  | 'sos'
  | 'verification'
  | 'refund'
  | 'payout'
  | 'chat'
  | 'audit'

export type ActivitySeverity = 'normal' | 'success' | 'warning' | 'danger'

export interface AdminActivityItem {
  id: string
  category: ActivityCategory
  categoryLabel: string
  title: string
  actor: string
  actorPhone: string
  actorContact: string
  referenceCode: string
  description: string
  amount: number | null
  status: string
  severity: ActivitySeverity
  timestamp: string
  dateOnly: string
  sortTime: number
  detailLink?: string
}

export interface AdminActivitySummary {
  totalActivities: number
  totalBookings: number
  totalBookingParticipants: number
  totalFinancialValue: number
  totalPaidValue: number
  totalRegistrations: number
  totalCommunityPosts: number
  activeSosCount: number
  pendingQueueCount: number
  byCategory: Record<ActivityCategory, number>
}

export interface AdminActivitiesResponse {
  generatedAt: string
  summary: AdminActivitySummary
  activities: AdminActivityItem[]
}

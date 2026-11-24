import type { Trip, TripCategory } from './trip'

// 1. AI Matchmaker & Contextual Q&A
export interface MatchmakerAnswers {
  fitness: 'relaxed' | 'moderate' | 'athletic'
  comfort: 'all' | 'no-heights' | 'no-deep-water' | 'easy-land'
  maxBudget: number
  vibe: 'adrenaline' | 'ocean' | 'summit' | 'karst'
  durationPref: 'short' | 'multi-day'
}

export interface MatchmakerRecommendation {
  trip: Trip
  matchScore: number
  reasons: string[]
}

export interface TripQaResponse {
  answer: string
  highlights: string[]
  confidenceNote: string
  suggestedFollowUps: string[]
}

// 2. Gamification & Adventure Passport
export type MemberTier = 'Trailblazer' | 'Summit Seeker' | 'Nusantara Legend'

export interface AdventureBadge {
  id: string
  title: string
  subtitle: string
  category: string
  unlocked: boolean
  unlockedDate?: string
  progressText: string
}

export interface PassportStamp {
  id: string
  province: string
  destination: string
  tripTitle: string
  date: string
  guideName: string
  category: TripCategory
}

export interface LoyaltyReward {
  id: string
  title: string
  pointsCost: number
  badgeText: string
  description: string
  redeemedCode?: string
}

export interface PassportProfileResponse {
  explorerName: string
  tier: MemberTier
  points: number
  nextTierName: MemberTier
  nextTierPoints: number
  completedTripsCount: number
  totalKmExplored: number
  visitedProvinces: string[]
  stamps: PassportStamp[]
  badges: AdventureBadge[]
  rewards: LoyaltyReward[]
}

// 3. Eco-Tourism & Local Impact
export const CARBON_OFFSET_FEE = 25000

// 4. Custom & Private Trip Bidding
export interface GuideBidProposal {
  id: string
  guideName: string
  guideAvatar: string
  guideCertification: string
  guideRating: number
  pricePerPerson: number
  proposedHighlights: string[]
  note: string
  status: 'Menunggu Pilihan' | 'Diterima'
}

export interface CustomTripRequest {
  id: string
  title: string
  destination: string
  category: TripCategory
  preferredDate: string
  groupSize: number
  budgetPerPerson: number
  requesterName: string
  notes: string
  status: 'Menerima Penawaran' | 'Pemandu Dipilih'
  bids: GuideBidProposal[]
  createdAt: string
}

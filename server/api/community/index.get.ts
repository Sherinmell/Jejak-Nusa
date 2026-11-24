import { defineEventHandler, getQuery } from 'h3'
import type { BuddyTravelStyle, CommunityBuddyPost, TripParticipantPreview } from '#shared/types/adventure'
import { communityPostsStore, tripParticipantsMap } from '../../utils/communityStore'
import { getCommunityPostsFromDb } from '../../utils/dbRepositories'

export default defineEventHandler(
  async (event): Promise<{ posts: CommunityBuddyPost[]; participants: TripParticipantPreview[] }> => {
    const query = getQuery(event)
    const tripSlug = typeof query.tripSlug === 'string' ? query.tripSlug.trim() : ''
    const style = typeof query.style === 'string' ? (query.style.trim() as BuddyTravelStyle | '') : ''

    let posts: CommunityBuddyPost[]
    try {
      posts = await getCommunityPostsFromDb(tripSlug || undefined, style || undefined)
    } catch {
      posts = [...communityPostsStore]
      if (tripSlug) posts = posts.filter((p) => p.tripSlug === tripSlug)
      if (style) posts = posts.filter((p) => p.travelStyle === style)
    }

    const fallbackParticipants: TripParticipantPreview[] = [
      {
        id: 'p-default-1',
        name: 'Putri H.',
        origin: 'Jakarta',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
        isSoloTraveler: true,
        badge: 'Solo Traveler'
      },
      {
        id: 'p-default-2',
        name: 'Fajar N.',
        origin: 'Tangerang',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
        isSoloTraveler: true,
        badge: 'Pemula Santai'
      }
    ]

    const participants = tripSlug
      ? (tripParticipantsMap[tripSlug] ?? fallbackParticipants)
      : Object.values(tripParticipantsMap).flat()

    return { posts, participants }
  }
)

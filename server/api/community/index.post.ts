import { createError, defineEventHandler, readBody } from 'h3'
import type { BuddyTravelStyle, CommunityBuddyPost } from '#shared/types/adventure'
import { communityPostsStore } from '../../utils/communityStore'
import { TRIPS_DATA } from '../../utils/tripsData'
import { getAuthSessionUser } from '../../utils/authStore'
import { getTripBySlugFromDb, insertCommunityPostToDb } from '../../utils/dbRepositories'

interface CreateBuddyPostBody {
  tripSlug?: string
  authorName?: string
  authorOrigin?: string
  travelStyle?: BuddyTravelStyle
  slotsLookingFor?: number
  note?: string
}

export default defineEventHandler(async (event): Promise<{ post: CommunityBuddyPost }> => {
  const body = await readBody<CreateBuddyPostBody>(event)
  const sessionUser = getAuthSessionUser(event)

  const tripSlug = typeof body?.tripSlug === 'string' ? body.tripSlug.trim() : ''
  let matchedTrip = TRIPS_DATA.find((t) => t.slug === tripSlug) ?? TRIPS_DATA[0]!
  try {
    const dbTrip = tripSlug ? await getTripBySlugFromDb(tripSlug) : null
    if (dbTrip) matchedTrip = dbTrip
  } catch {
    // use fallback
  }

  const note = typeof body?.note === 'string' ? body.note.trim() : ''
  if (note.length < 10) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tuliskan pesan ajakan minimal 10 karakter agar teman perjalanan mudah mengenalmu.'
    })
  }

  const post: CommunityBuddyPost = {
    id: `post-${Date.now()}`,
    tripSlug: matchedTrip.slug,
    tripTitle: matchedTrip.title,
    location: matchedTrip.location,
    authorName:
      (typeof body?.authorName === 'string' && body.authorName.trim()) ||
      sessionUser?.name ||
      'Explorer Nusantara',
    authorAvatar:
      sessionUser?.avatar ||
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80',
    authorOrigin:
      (typeof body?.authorOrigin === 'string' && body.authorOrigin.trim()) ||
      sessionUser?.origin ||
      'Indonesia',
    travelStyle: body?.travelStyle || 'Solo Traveler',
    departureDate: matchedTrip.nextDepartureDate,
    slotsLookingFor: Math.max(1, Math.min(6, Number(body?.slotsLookingFor) || 2)),
    note,
    likes: 1,
    createdAt: new Date().toISOString().slice(0, 10)
  }

  try {
    await insertCommunityPostToDb(post)
  } catch {
    communityPostsStore.unshift(post)
  }

  return { post }
})

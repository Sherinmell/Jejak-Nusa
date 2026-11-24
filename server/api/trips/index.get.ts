import { defineEventHandler, getQuery } from 'h3'
import {
  ADRENALINE_LEVELS,
  TRIP_CATEGORIES,
  type AdrenalineLevel,
  type Trip,
  type TripCategory,
  type TripsApiResponse,
  type TripSortOption
} from '#shared/types/trip'
import { getMergedCatalogTrips } from '../../utils/platformStore'
import { getAllTripsFromDb } from '../../utils/dbRepositories'

export default defineEventHandler(async (event): Promise<TripsApiResponse> => {
  const query = getQuery(event)

  let sourceTrips: Trip[]
  try {
    const dbTrips = await getAllTripsFromDb()
    sourceTrips = dbTrips.length ? dbTrips : getMergedCatalogTrips()
  } catch {
    sourceTrips = getMergedCatalogTrips()
  }

  const q = typeof query.q === 'string' ? query.q.trim().toLowerCase() : ''
  const category = typeof query.category === 'string' ? query.category.trim() : ''
  const level = typeof query.level === 'string' ? query.level.trim() : ''
  const maxPriceRaw = typeof query.maxPrice === 'string' ? Number(query.maxPrice) : Number(query.maxPrice)
  const maxPrice = Number.isFinite(maxPriceRaw) && maxPriceRaw > 0 ? maxPriceRaw : null
  const date = typeof query.date === 'string' ? query.date.trim() : ''
  const featuredOnly = query.featured === 'true' || query.featured === '1'
  const sort = (typeof query.sort === 'string' ? query.sort : 'recommended') as TripSortOption

  const maxAvailablePrice = sourceTrips.reduce(
    (max, item) => (item.pricePerPerson > max ? item.pricePerPerson : max),
    0
  )

  let filtered = sourceTrips.filter((trip) => {
    if (featuredOnly && !trip.featured) return false

    if (q) {
      const searchable = [
        trip.title,
        trip.location,
        trip.province,
        trip.category,
        trip.shortDescription,
        trip.guide.name
      ]
        .join(' ')
        .toLowerCase()

      if (!searchable.includes(q)) return false
    }

    if (category && TRIP_CATEGORIES.includes(category as TripCategory)) {
      if (trip.category !== category) return false
    }

    if (level && ADRENALINE_LEVELS.includes(level as AdrenalineLevel)) {
      if (trip.adrenalineLevel !== level) return false
    }

    if (maxPrice !== null && trip.pricePerPerson > maxPrice) return false
    if (date && trip.nextDepartureDate < date) return false

    return true
  })

  switch (sort) {
    case 'price-asc':
      filtered = [...filtered].sort((a, b) => a.pricePerPerson - b.pricePerPerson)
      break
    case 'price-desc':
      filtered = [...filtered].sort((a, b) => b.pricePerPerson - a.pricePerPerson)
      break
    case 'quota-asc':
      filtered = [...filtered].sort((a, b) => a.remainingQuota - b.remainingQuota)
      break
    case 'rating-desc':
      filtered = [...filtered].sort((a, b) => b.rating - a.rating)
      break
    default:
      filtered = [...filtered].sort((a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating)
      break
  }

  return {
    trips: filtered,
    total: filtered.length,
    maxAvailablePrice,
    categories: TRIP_CATEGORIES,
    levels: ADRENALINE_LEVELS
  }
})

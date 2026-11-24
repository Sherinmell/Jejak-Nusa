import { defineEventHandler, getQuery } from 'h3'
import {
  HOTEL_TYPES,
  type Hotel,
  type HotelSortOption,
  type HotelsApiResponse,
  type HotelType
} from '#shared/types/hotel'
import { HOTELS_DATA } from '../../utils/hotelsData'
import { getAllHotelsFromDb } from '../../utils/dbRepositories'

export default defineEventHandler(async (event): Promise<HotelsApiResponse> => {
  const query = getQuery(event)

  let sourceHotels: Hotel[]
  try {
    sourceHotels = await getAllHotelsFromDb()
  } catch {
    sourceHotels = HOTELS_DATA
  }

  const q = typeof query.q === 'string' ? query.q.trim().toLowerCase() : ''
  const type = typeof query.type === 'string' ? query.type.trim() : ''
  const maxPriceRaw = Number(query.maxPrice)
  const maxPrice = Number.isFinite(maxPriceRaw) && maxPriceRaw > 0 ? maxPriceRaw : null
  const breakfastOnly = query.breakfastOnly === 'true' || query.breakfastOnly === '1'
  const featuredOnly = query.featured === 'true' || query.featured === '1'
  const sort = (typeof query.sort === 'string' ? query.sort : 'recommended') as HotelSortOption

  const maxAvailablePrice = sourceHotels.reduce(
    (max, item) => (item.pricePerNight > max ? item.pricePerNight : max),
    0
  )

  let filtered = sourceHotels.filter((hotel) => {
    if (featuredOnly && !hotel.featured) return false

    if (q) {
      const searchable = [
        hotel.name,
        hotel.location,
        hotel.province,
        hotel.type,
        hotel.nearTripLabel,
        hotel.shortDescription
      ]
        .join(' ')
        .toLowerCase()

      if (!searchable.includes(q)) return false
    }

    if (type && HOTEL_TYPES.includes(type as HotelType)) {
      if (hotel.type !== type) return false
    }

    if (maxPrice !== null && hotel.pricePerNight > maxPrice) return false

    if (breakfastOnly) {
      const hasBreakfast = hotel.rooms.some((r) => r.breakfastIncluded)
      if (!hasBreakfast) return false
    }

    return true
  })

  switch (sort) {
    case 'price-asc':
      filtered = [...filtered].sort((a, b) => a.pricePerNight - b.pricePerNight)
      break
    case 'price-desc':
      filtered = [...filtered].sort((a, b) => b.pricePerNight - a.pricePerNight)
      break
    case 'rating-desc':
      filtered = [...filtered].sort((a, b) => b.rating - a.rating)
      break
    default:
      filtered = [...filtered].sort((a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating)
      break
  }

  return {
    hotels: filtered,
    total: filtered.length,
    maxAvailablePrice,
    types: HOTEL_TYPES
  }
})

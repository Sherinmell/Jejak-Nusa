export type HotelType = 'Eco Lodge' | 'Resort' | 'Villa' | 'Boutique Hotel' | 'Glamping'

export type HotelSortOption = 'recommended' | 'price-asc' | 'price-desc' | 'rating-desc'

export interface HotelRoom {
  id: string
  name: string
  capacity: number
  bedType: string
  sizeSqm: number
  pricePerNight: number
  breakfastIncluded: boolean
  availableRooms: number
  amenities: string[]
}

export interface Hotel {
  id: string
  slug: string
  name: string
  location: string
  province: string
  type: HotelType
  stars: number
  rating: number
  reviewCount: number
  pricePerNight: number
  nearTripSlug: string
  nearTripLabel: string
  distanceToBasecamp: string
  verifiedPartner: boolean
  featured: boolean
  coverImage: string
  gallery: string[]
  shortDescription: string
  description: string
  facilities: string[]
  checkInTime: string
  checkOutTime: string
  rooms: HotelRoom[]
  policies: string[]
}

export interface HotelsApiResponse {
  hotels: Hotel[]
  total: number
  maxAvailablePrice: number
  types: HotelType[]
}

export interface HotelFilterState {
  q: string
  type: HotelType | ''
  maxPrice: number
  breakfastOnly: boolean
  sort: HotelSortOption
}

export const HOTEL_TYPES: HotelType[] = [
  'Eco Lodge',
  'Resort',
  'Villa',
  'Boutique Hotel',
  'Glamping'
]

export const SHUTTLE_TRANSFER_FEE = 120000

import { createError, defineEventHandler, getRouterParam } from 'h3'
import type { Hotel } from '#shared/types/hotel'
import { HOTELS_DATA } from '../../utils/hotelsData'
import { getHotelBySlugFromDb } from '../../utils/dbRepositories'

export default defineEventHandler(async (event): Promise<Hotel> => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Parameter slug hotel tidak valid.'
    })
  }

  let hotel: Hotel | null = null
  try {
    hotel = await getHotelBySlugFromDb(slug)
  } catch {
    hotel = HOTELS_DATA.find((item) => item.slug === slug) ?? null
  }

  if (!hotel) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Penginapan / Hotel tidak ditemukan.'
    })
  }

  return hotel
})

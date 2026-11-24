import { createError, defineEventHandler, getRouterParam } from 'h3'
import { resolveTripRequirements, type Trip } from '#shared/types/trip'
import { getMergedCatalogTrips } from '../../utils/platformStore'
import { getTripBySlugFromDb } from '../../utils/dbRepositories'

export default defineEventHandler(async (event): Promise<Trip> => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Parameter slug trip tidak valid.'
    })
  }

  let trip: Trip | null = null
  try {
    trip = await getTripBySlugFromDb(slug)
  } catch {
    trip = null
  }
  if (!trip) {
    trip = getMergedCatalogTrips().find((item) => item.slug === slug) ?? null
  }

  if (!trip) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Paket Open Trip tidak ditemukan.'
    })
  }

  return {
    ...trip,
    requirements: resolveTripRequirements(trip)
  }
})

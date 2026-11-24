import { defineEventHandler } from 'h3'
import type { CustomTripRequest } from '#shared/types/ecosystem'
import { customTripsStore } from '../../utils/customTripStore'
import { getCustomTripsFromDb } from '../../utils/dbRepositories'

export default defineEventHandler(async (): Promise<{ requests: CustomTripRequest[] }> => {
  try {
    const requests = await getCustomTripsFromDb()
    return { requests }
  } catch {
    return { requests: customTripsStore }
  }
})

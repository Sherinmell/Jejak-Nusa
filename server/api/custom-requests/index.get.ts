import { defineEventHandler } from 'h3'
import { customTripsStore } from '../../utils/customTripStore'

export default defineEventHandler(() => {
  return {
    requests: customTripsStore,
    total: customTripsStore.length
  }
})

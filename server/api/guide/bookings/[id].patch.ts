import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import type { GuideBookingStatus, TrailConditionStatus } from '#shared/types/adventure'
import { guideBookingsStore, updateTrailStatus } from '../../../utils/guidePortalStore'
import { updateBookingStatusInDb, updateTrailStatusInDb } from '../../../utils/dbRepositories'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody<{
    bookingStatus?: GuideBookingStatus
    trailStatus?: TrailConditionStatus
  }>(event)

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID tidak valid.' })
  }

  if (body?.trailStatus) {
    try {
      const ok = await updateTrailStatusInDb(id, body.trailStatus)
      if (ok) return { ok: true, trailStatus: body.trailStatus }
    } catch {
      // fallback below
    }
    const updatedTrip = updateTrailStatus(id, body.trailStatus)
    if (!updatedTrip) {
      throw createError({ statusCode: 404, statusMessage: 'Trip pemandu tidak ditemukan.' })
    }
    return { trip: updatedTrip }
  }

  if (body?.bookingStatus) {
    try {
      const ok = await updateBookingStatusInDb(id, body.bookingStatus)
      if (ok) return { ok: true, bookingStatus: body.bookingStatus }
    } catch {
      // fallback below
    }
  }

  const booking = guideBookingsStore.find((b) => b.id === id)
  if (!booking) {
    throw createError({ statusCode: 404, statusMessage: 'Data reservasi tidak ditemukan.' })
  }

  if (body?.bookingStatus) {
    booking.bookingStatus = body.bookingStatus
  }

  return { booking }
})

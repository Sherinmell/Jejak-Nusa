import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import type { SimpleTrailWeatherStatus } from '#shared/types/guide'
import { getAuthSessionUser } from '../../../utils/authStore'
import { guideManagedPackagesStore } from '../../../utils/platformStore'

export default defineEventHandler(async (event) => {
  const user = getAuthSessionUser(event)
  if (!user || (user.role !== 'guide' && user.role !== 'admin')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Akses khusus Pemandu Lokal.'
    })
  }

  const id = getRouterParam(event, 'id')
  const target = guideManagedPackagesStore.find((t) => t.id === id)
  if (!target) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Paket trip tidak ditemukan.'
    })
  }

  const body = await readBody<{
    quotaOpen?: boolean
    trailWeatherStatus?: SimpleTrailWeatherStatus
    weatherNote?: string
  }>(event)

  if (typeof body?.quotaOpen === 'boolean') {
    target.quotaOpen = body.quotaOpen
  }

  if (
    body?.trailWeatherStatus === 'Buka' ||
    body?.trailWeatherStatus === 'Waspada Hujan' ||
    body?.trailWeatherStatus === 'Tutup'
  ) {
    target.trailWeatherStatus = body.trailWeatherStatus
    target.weatherNote =
      body.weatherNote?.trim() ||
      (body.trailWeatherStatus === 'Buka'
        ? 'Jalur dibuka normal, cuaca terpantau aman.'
        : body.trailWeatherStatus === 'Waspada Hujan'
          ? 'Potensi hujan sore hari — peserta wajib bawa jas hujan & dry bag.'
          : 'Jalur ditutup sementara demi keselamatan. Garansi refund cuaca aktif.')
  }

  return { ok: true, trip: target }
})

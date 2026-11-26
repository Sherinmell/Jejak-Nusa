import { createError, defineEventHandler, readBody } from 'h3'
import type { SosAlertRecord } from '#shared/types/booking'
import { getAuthSessionUser } from '../../utils/authStore'
import { loadSosAlerts, saveSosAlerts } from '../../utils/runtimePersistence'

export default defineEventHandler(async (event) => {
  const user = getAuthSessionUser(event)
  const body = await readBody<{
    tripSlug?: string
    tripTitle?: string
    latitude?: number
    longitude?: number
    locationLabel?: string
    message?: string
  }>(event)

  const tripTitle = typeof body?.tripTitle === 'string' && body.tripTitle.trim()
    ? body.tripTitle.trim()
    : 'Open Trip Aktif'
  const message = typeof body?.message === 'string' && body.message.trim()
    ? body.message.trim()
    : 'Sinyal Darurat Emergency SOS — Membutuhkan bantuan tim tanggap darurat & kontak pemandu.'

  if (message.length < 4) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Pesan darurat tidak valid.'
    })
  }

  const lat = Number.isFinite(Number(body?.latitude)) ? Number(body?.latitude) : -8.19842
  const lng = Number.isFinite(Number(body?.longitude)) ? Number(body?.longitude) : 115.13426

  const now = new Date()
  const timestamp = `${now.toISOString().slice(0, 10)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`

  const alert: SosAlertRecord = {
    id: `sos-${Date.now()}`,
    tripSlug: body?.tripSlug || 'canyoning-air-terjun-gitgit-bali',
    tripTitle,
    reporterName: user?.name || 'Peserta Lapangan',
    reporterRole: user?.role || 'customer',
    latitude: Number(lat.toFixed(5)),
    longitude: Number(lng.toFixed(5)),
    locationLabel: body?.locationLabel?.trim() || 'Koordinat GPS Live Lapangan',
    message,
    status: 'ACTIVE',
    createdAt: timestamp
  }

  const alerts = await loadSosAlerts()
  alerts.unshift(alert)
  await saveSosAlerts(alerts)

  return { ok: true, alert }
})

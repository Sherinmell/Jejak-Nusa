import { createError, defineEventHandler, readBody } from 'h3'
import type { PlatformFeatureFlags } from '#shared/types/booking'
import { requireAdmin } from '../../utils/requireAdmin'
import { platformFeaturesStore } from '../../utils/platformStore'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody<Partial<PlatformFeatureFlags>>(event)
  if (!body || typeof body !== 'object') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Payload konfigurasi fitur tidak valid.'
    })
  }

  if (typeof body.qrisEnabled === 'boolean') {
    platformFeaturesStore.qrisEnabled = body.qrisEnabled
  }
  if (typeof body.splitBillDpEnabled === 'boolean') {
    platformFeaturesStore.splitBillDpEnabled = body.splitBillDpEnabled
  }
  if (typeof body.instantInsuranceEnabled === 'boolean') {
    platformFeaturesStore.instantInsuranceEnabled = body.instantInsuranceEnabled
  }
  if (typeof body.carbonOffsetEnabled === 'boolean') {
    platformFeaturesStore.carbonOffsetEnabled = body.carbonOffsetEnabled
  }
  if (typeof body.customTripEnabled === 'boolean') {
    platformFeaturesStore.customTripEnabled = body.customTripEnabled
  }
  if (typeof body.requireIdentityAndHealthCert === 'boolean') {
    platformFeaturesStore.requireIdentityAndHealthCert = body.requireIdentityAndHealthCert
  }
  if (body.platformCommissionPercent !== undefined) {
    const pct = Number(body.platformCommissionPercent)
    if (!Number.isFinite(pct) || pct < 0 || pct > 40) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Persentase komisi platform harus antara 0% hingga 40%.'
      })
    }
    platformFeaturesStore.platformCommissionPercent = Math.round(pct * 10) / 10
  }
  if (body.serviceFeeAmount !== undefined) {
    const fee = Number(body.serviceFeeAmount)
    if (!Number.isFinite(fee) || fee < 0 || fee > 250000) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Biaya layanan aplikasi harus antara Rp0 hingga Rp250.000.'
      })
    }
    platformFeaturesStore.serviceFeeAmount = Math.round(fee)
  }

  const now = new Date()
  platformFeaturesStore.updatedAt = `${now.toISOString().slice(0, 10)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`

  return {
    ok: true,
    features: platformFeaturesStore
  }
})

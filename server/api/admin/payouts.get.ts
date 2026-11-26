import { defineEventHandler } from 'h3'
import { requireAdmin } from '../../utils/requireAdmin'
import { loadGuidePayouts, loadWeatherRefunds } from '../../utils/runtimePersistence'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const [payouts, weatherRefunds] = await Promise.all([
    loadGuidePayouts(),
    loadWeatherRefunds()
  ])

  const totalCommission = payouts.reduce((sum, p) => sum + p.platformCommission, 0)
  const pendingPayoutAmount = payouts
    .filter((p) => p.status === 'Menunggu Pencairan')
    .reduce((sum, p) => sum + p.netPayout, 0)
  const pendingRefundAmount = weatherRefunds
    .filter((r) => r.status === 'Menunggu Persetujuan')
    .reduce((sum, r) => sum + r.refundAmount, 0)

  return {
    summary: {
      totalCommission,
      pendingPayoutAmount,
      pendingRefundAmount
    },
    payouts,
    weatherRefunds
  }
})

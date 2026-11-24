import { defineEventHandler } from 'h3'
import { requireAdmin } from '../../utils/requireAdmin'
import { guidePayoutsStore, weatherRefundsStore } from '../../utils/platformStore'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const totalCommission = guidePayoutsStore.reduce((sum, p) => sum + p.platformCommission, 0)
  const pendingPayoutAmount = guidePayoutsStore
    .filter((p) => p.status === 'Menunggu Pencairan')
    .reduce((sum, p) => sum + p.netPayout, 0)
  const pendingRefundAmount = weatherRefundsStore
    .filter((r) => r.status === 'Menunggu Persetujuan')
    .reduce((sum, r) => sum + r.refundAmount, 0)

  return {
    summary: {
      totalCommission,
      pendingPayoutAmount,
      pendingRefundAmount
    },
    payouts: guidePayoutsStore,
    weatherRefunds: weatherRefundsStore
  }
})

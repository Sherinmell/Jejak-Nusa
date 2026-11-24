import { createError, defineEventHandler, readBody } from 'h3'
import { getAuthSessionUser } from '../../utils/authStore'
import { getPassportStateForUser } from '../../utils/passportStore'

export default defineEventHandler(async (event) => {
  const sessionUser = getAuthSessionUser(event)
  const body = await readBody<{ rewardId?: string }>(event)
  const rewardId = typeof body?.rewardId === 'string' ? body.rewardId.trim() : ''

  const state = getPassportStateForUser(sessionUser?.id, sessionUser?.email)
  const reward = state.rewards.find((r) => r.id === rewardId)
  if (!reward) {
    throw createError({ statusCode: 404, statusMessage: 'Hadiah loyalitas tidak ditemukan.' })
  }

  if (reward.redeemedCode) {
    return {
      ok: true,
      pointsRemaining: state.points,
      reward,
      message: `Voucher sudah ditukar sebelumnya (${reward.redeemedCode}).`
    }
  }

  if (state.points < reward.pointsCost) {
    throw createError({
      statusCode: 400,
      statusMessage: `Poin Anda (${state.points}) belum cukup. Dibutuhkan ${reward.pointsCost} poin.`
    })
  }

  state.points -= reward.pointsCost
  const code = `JN-${reward.id.slice(-4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
  reward.redeemedCode = code

  return {
    ok: true,
    pointsRemaining: state.points,
    reward,
    message: `Berhasil menukar ${reward.title}! Kode voucher Anda: ${code}`
  }
})

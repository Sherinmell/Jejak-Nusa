import { createError, defineEventHandler, getRouterParam } from 'h3'
import { getAuthSessionUser } from '../../utils/authStore'
import { customerBookingsStore, platformFeaturesStore } from '../../utils/platformStore'

export default defineEventHandler((event) => {
  const user = getAuthSessionUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Silakan login terlebih dahulu untuk melihat detail transaksi.'
    })
  }

  const id = getRouterParam(event, 'id')
  const found = customerBookingsStore.find(
    (b) => b.id === id || b.invoiceNumber === id || b.bookingCode === id
  )

  if (!found) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Detail transaksi / invoice tidak ditemukan.'
    })
  }

  if (user.role === 'customer') {
    const isOwner =
      found.customerId === user.id ||
      found.customerEmail.toLowerCase() === user.email.toLowerCase() ||
      found.leaderName.toLowerCase() === user.name.toLowerCase()
    if (!isOwner) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Anda tidak memiliki izin mengakses transaksi milik peserta lain.'
      })
    }
  }

  return {
    booking: found,
    features: platformFeaturesStore
  }
})

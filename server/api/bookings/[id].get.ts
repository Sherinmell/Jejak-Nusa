import { createError, defineEventHandler, getRouterParam } from 'h3'
import { customerBookingsStore, platformFeaturesStore } from '../../utils/platformStore'

export default defineEventHandler((event) => {
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

  return {
    booking: found,
    features: platformFeaturesStore
  }
})

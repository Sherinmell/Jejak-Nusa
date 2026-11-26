import { defineEventHandler, getQuery } from 'h3'
import { getAuthSessionUser } from '../../utils/authStore'
import { loadAllBookings, loadPlatformFeatures } from '../../utils/runtimePersistence'

export default defineEventHandler(async (event) => {
  const user = getAuthSessionUser(event)
  const query = getQuery(event)
  const tripSlug = typeof query.tripSlug === 'string' ? query.tripSlug.trim() : ''
  const paymentStatus = typeof query.paymentStatus === 'string' ? query.paymentStatus.trim() : ''
  const guideOnly = query.guideOnly === 'true'

  const [allBookings, features] = await Promise.all([
    user ? loadAllBookings() : Promise.resolve([]),
    loadPlatformFeatures()
  ])

  let list = [...allBookings]

  // STRICT PER-CUSTOMER ISOLATION:
  // Pelanggan hanya melihat booking miliknya sendiri (0 jika belum pernah memesan!)
  if (user?.role === 'customer') {
    const userId = user.id
    const userEmail = user.email.toLowerCase()
    const userName = user.name.toLowerCase()
    list = list.filter(
      (b) =>
        b.customerId === userId ||
        b.customerEmail.toLowerCase() === userEmail ||
        b.leaderName.toLowerCase() === userName
    )
  }

  if (tripSlug) {
    list = list.filter((b) => b.tripSlug === tripSlug)
  }

  if (paymentStatus) {
    list = list.filter((b) => b.paymentStatus === paymentStatus)
  }

  if (guideOnly && user?.role === 'guide') {
    const own = list.filter(
      (b) =>
        b.guideId === user.id ||
        b.guideName.toLowerCase() === user.name.toLowerCase()
    )
    if (own.length > 0) {
      list = own
    }
  }

  return {
    user: user ? { id: user.id, name: user.name, role: user.role } : null,
    bookings: list,
    total: list.length,
    features
  }
})

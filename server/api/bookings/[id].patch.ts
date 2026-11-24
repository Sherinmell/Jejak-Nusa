import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { getAuthSessionUser } from '../../utils/authStore'
import { awardTripCompletionToPassport } from '../../utils/passportStore'
import {
  customerBookingsStore,
  getMergedCatalogTrips,
  guideManagedPackagesStore
} from '../../utils/platformStore'

export default defineEventHandler(async (event) => {
  const user = getAuthSessionUser(event)
  const id = getRouterParam(event, 'id')
  const found = customerBookingsStore.find(
    (b) => b.id === id || b.invoiceNumber === id || b.bookingCode === id
  )

  if (!found) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Transaksi tidak ditemukan.'
    })
  }

  const body = await readBody<{
    action?: 'confirm-payment' | 'verify-payment' | 'toggle-checkin' | 'set-trip-status' | 'send-certificate' | 'claim-certificate'
    checkedIn?: boolean
    completed?: boolean
    adminNote?: string
    holderName?: string
  }>(event)

  const now = new Date()
  const dateOnly = now.toISOString().slice(0, 10)
  const dateCompact = dateOnly.replace(/-/g, '')
  const timestamp = `${dateOnly} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`

  if (body?.action === 'confirm-payment' || body?.action === 'verify-payment') {
    const due = found.paymentScheme === 'DP 30%' ? Math.ceil(found.totalAmount * 0.3) : found.totalAmount
    const wasUnpaid = found.paymentStatus === 'MENUNGGU PEMBAYARAN'

    found.paymentStatus =
      body.action === 'verify-payment'
        ? 'LUNAS'
        : found.paymentScheme === 'DP 30%'
          ? 'DP 30% Lunas'
          : 'LUNAS'
    found.paidAmount = found.paymentStatus === 'LUNAS' ? found.totalAmount : due
    found.remainingAmount = Math.max(0, found.totalAmount - found.paidAmount)
    found.bookingStatus = 'Terkonfirmasi'
    found.paidAt = timestamp

    if (wasUnpaid) {
      const managed = guideManagedPackagesStore.find((m) => m.slug === found.tripSlug)
      if (managed) {
        managed.bookedCount = Math.min(managed.totalQuota, managed.bookedCount + found.participantsCount)
      }
    }

    return { ok: true, booking: found }
  }

  if (body?.action === 'toggle-checkin') {
    if (!user || (user.role !== 'guide' && user.role !== 'admin')) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Hanya Pemandu Lokal atau Admin yang dapat mengubah status Check-in peserta.'
      })
    }
    found.checkedIn = typeof body.checkedIn === 'boolean' ? body.checkedIn : !found.checkedIn
    return { ok: true, booking: found }
  }

  if (body?.action === 'set-trip-status') {
    if (!user || user.role !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Hanya Admin yang dapat menentukan status penyelesaian trip peserta.'
      })
    }
    if (found.bookingType === 'hotel') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Status penyelesaian trip & sertifikat hanya berlaku untuk Open Trip atau paket Trip + Hotel.'
      })
    }
    if (found.paymentStatus === 'MENUNGGU PEMBAYARAN') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Peserta belum menyelesaikan pembayaran. Verifikasi pembayaran terlebih dahulu.'
      })
    }

    const markCompleted = Boolean(body.completed)
    if (markCompleted) {
      found.bookingStatus = 'Selesai'
      found.checkedIn = true
      found.completedAt = found.completedAt || timestamp
    } else {
      if (found.certificateClaimed) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Sertifikat sudah diklaim peserta sehingga status trip tidak bisa dikembalikan ke Belum Selesai.'
        })
      }
      found.bookingStatus = 'Terkonfirmasi'
      found.completedAt = undefined
      found.certificateSent = false
      found.certificateSentAt = undefined
      found.certificateSentBy = undefined
      found.certificateAdminNote = undefined
    }
    return { ok: true, booking: found }
  }

  if (body?.action === 'send-certificate') {
    if (!user || user.role !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Hanya Admin yang dapat mengirim sertifikat ke peserta.'
      })
    }
    if (found.bookingType === 'hotel') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Sertifikat tidak berlaku untuk transaksi Hotel Saja.'
      })
    }
    if (found.paymentStatus === 'MENUNGGU PEMBAYARAN') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Transaksi belum dibayar. Verifikasi pembayaran sebelum mengirim sertifikat.'
      })
    }
    if (found.bookingStatus !== 'Selesai') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Pilih status peserta menjadi "Sudah Selesai" terlebih dahulu sebelum mengirim sertifikat.'
      })
    }

    const rand4 = String(Math.floor(1000 + Math.random() * 9000))
    found.certificateId = found.certificateId || `CERT-JN-${dateCompact}-${rand4}`
    found.certificateSent = true
    found.certificateSentAt = timestamp
    found.certificateSentBy = user.name || 'Admin JejakNusa'
    found.certificateAdminNote =
      typeof body.adminNote === 'string' && body.adminNote.trim().length > 0
        ? body.adminNote.trim()
        : 'Selamat! Kegiatan trip Anda telah dinyatakan selesai oleh Admin JejakNusa. Silakan klaim sertifikat resmi Anda.'

    return { ok: true, booking: found }
  }

  if (body?.action === 'claim-certificate') {
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Silakan login terlebih dahulu untuk mengklaim sertifikat.'
      })
    }
    if (found.bookingType === 'hotel') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Sertifikat petualangan hanya tersedia untuk kegiatan Open Trip / Paket Trip + Hotel.'
      })
    }
    if (found.paymentStatus === 'MENUNGGU PEMBAYARAN') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Pembayaran harus selesai sebelum mengklaim sertifikat.'
      })
    }
    if (found.bookingStatus !== 'Selesai') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Kegiatan trip Anda belum dinyatakan selesai oleh Admin. Tunggu Admin menandai trip selesai terlebih dahulu.'
      })
    }
    if (!found.certificateSent) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Sertifikat belum dikirim oleh Admin ke akun Anda. Silakan tunggu Admin mengirim sertifikat terlebih dahulu.'
      })
    }

    const holderName =
      typeof body.holderName === 'string' && body.holderName.trim().length >= 2
        ? body.holderName.trim()
        : found.certificateHolderName || found.leaderName

    if (!found.certificateClaimed) {
      const rand4 = String(Math.floor(1000 + Math.random() * 9000))
      found.certificateId = found.certificateId || `CERT-JN-${dateCompact}-${rand4}`
      found.certificateClaimed = true
      found.certificateClaimedAt = timestamp
      found.certificateHolderName = holderName

      // Award Adventure Passport points, destination stamp & badges automatically!
      const matchedTrip = getMergedCatalogTrips().find((t) => t.slug === found.tripSlug)
      const rewardResult = awardTripCompletionToPassport({
        userId: found.customerId || user.id,
        email: found.customerEmail || user.email,
        tripTitle: matchedTrip?.title || found.tripTitle,
        location: matchedTrip?.location || found.location,
        province: matchedTrip?.province || 'Indonesia',
        guideName: found.guideName,
        category: matchedTrip?.category || 'Trekking',
        hasCarbonOffset: found.hasCarbonOffset,
        completedDate: dateOnly
      })

      return {
        ok: true,
        booking: found,
        passportReward: rewardResult
      }
    }

    // Allow updating display name if already claimed
    found.certificateHolderName = holderName
    return {
      ok: true,
      booking: found,
      passportReward: { pointsAwarded: 0, unlockedBadges: [] }
    }
  }

  throw createError({
    statusCode: 400,
    statusMessage: 'Aksi pembaruan transaksi tidak dikenali.'
  })
})

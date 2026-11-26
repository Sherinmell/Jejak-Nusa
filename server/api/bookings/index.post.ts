import { createError, defineEventHandler, readBody } from 'h3'
import { ADVENTURE_INSURANCE_FEE, resolveTripRequirements } from '#shared/types/trip'
import { SHUTTLE_TRANSFER_FEE } from '#shared/types/hotel'
import { CARBON_OFFSET_FEE } from '#shared/types/ecosystem'
import type {
  BookingParticipant,
  BookingType,
  CreateCheckoutBookingPayload,
  CustomerBookingRecord
} from '#shared/types/booking'
import { createAdminRecord } from '../../utils/adminCrud'
import { getAuthSessionUser } from '../../utils/authStore'
import { HOTELS_DATA } from '../../utils/hotelsData'
import {
  getMergedCatalogTrips,
  guideManagedPackagesStore
} from '../../utils/platformStore'
import { loadPlatformFeatures, saveBookingRecord } from '../../utils/runtimePersistence'

export default defineEventHandler(async (event) => {
  const body = (await readBody<Partial<CreateCheckoutBookingPayload> & Record<string, unknown>>(event)) || {}
  const sessionUser = getAuthSessionUser(event)
  const platformFeaturesStore = await loadPlatformFeatures()

  const requestedType = body.bookingType as BookingType | undefined
  const hotelSlug = typeof body.hotelSlug === 'string' ? body.hotelSlug.trim() : ''
  const matchedHotel = hotelSlug ? HOTELS_DATA.find((h) => h.slug === hotelSlug) ?? null : null

  const bookingType: BookingType =
    requestedType === 'hotel'
      ? 'hotel'
      : requestedType === 'trip+hotel' || (matchedHotel && body.tripSlug)
        ? 'trip+hotel'
        : 'trip'

  const leaderName = String(body.leaderName || sessionUser?.name || 'Peserta Pelanggan').trim()
  if (leaderName.length < 2) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nama pemesan wajib diisi minimal 2 karakter.'
    })
  }

  const participantsCount = Math.max(1, Math.min(20, Number(body.participantsCount || 1)))
  const customerPhone = String(body.customerPhone || '0812-3456-7890').trim()
  const customerEmail = String(body.customerEmail || sessionUser?.email || 'pelanggan@jejaknusa.id').trim()
  const specialNotes = String(body.specialNotes || 'Tidak ada catatan khusus.').trim()

  const now = new Date()
  const dateCompact = now.toISOString().slice(0, 10).replace(/-/g, '')
  const rand4 = String(Math.floor(1000 + Math.random() * 9000))
  const invoiceNumber = `INV-${dateCompact}-${rand4}`
  const bookingCode = `JN-${dateCompact.slice(2, 6)}-${rand4}`
  const paymentReference = `QRIS-${dateCompact}-${rand4}${Math.floor(10 + Math.random() * 89)}`
  const timestamp = `${now.toISOString().slice(0, 10)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`
  const paymentMethod: 'QRIS Instant Payment' | 'Transfer Virtual Account' =
    platformFeaturesStore.qrisEnabled && body.paymentMethod !== 'Transfer Virtual Account'
      ? 'QRIS Instant Payment'
      : 'Transfer Virtual Account'

  // Compute Hotel component (used in 'hotel' or 'trip+hotel')
  let hotelSubtotal = 0
  let hotelRoomName: string | undefined
  let hotelNights = 0
  let hotelRooms = 0
  let hotelCheckIn: string | undefined
  let hotelCheckOut: string | undefined
  let shuttleFee = 0

  if (bookingType === 'hotel' || bookingType === 'trip+hotel') {
    if (!matchedHotel) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Hotel / penginapan yang dipilih tidak ditemukan.'
      })
    }
    const matchedRoom =
      matchedHotel.rooms.find((r) => r.id === body.hotelRoomId) ?? matchedHotel.rooms[0]
    const pricePerNight = matchedRoom?.pricePerNight ?? matchedHotel.pricePerNight
    hotelNights = Math.max(1, Math.min(14, Number(body.hotelNights || 1)))
    hotelRooms = Math.max(1, Math.min(10, Number(body.hotelRooms || 1)))
    hotelRoomName = matchedRoom?.name || 'Standard Suite'
    hotelCheckIn = typeof body.hotelCheckIn === 'string' && body.hotelCheckIn ? body.hotelCheckIn : '2026-12-05'
    hotelCheckOut = typeof body.hotelCheckOut === 'string' && body.hotelCheckOut ? body.hotelCheckOut : '2026-12-06'
    hotelSubtotal = pricePerNight * hotelNights * hotelRooms
    shuttleFee = body.includeShuttle ? SHUTTLE_TRANSFER_FEE : 0
  }

  // Case A: HOTEL ONLY BOOKING
  if (bookingType === 'hotel' && matchedHotel) {
    const serviceFee = platformFeaturesStore.serviceFeeAmount
    const totalAmount = hotelSubtotal + shuttleFee + serviceFee
    const markPaid = Boolean(body.markPaidImmediately)

    const hotelRecord: CustomerBookingRecord = {
      id: `trx-${Date.now()}`,
      customerId: sessionUser?.id || `cust-${leaderName.toLowerCase().replace(/\s+/g, '-')}`,
      bookingType: 'hotel',
      invoiceNumber,
      bookingCode,
      tripSlug: matchedHotel.nearTripSlug || matchedHotel.slug,
      tripTitle: `Penginapan: ${matchedHotel.name}`,
      location: matchedHotel.location,
      coverImage: matchedHotel.coverImage,
      departureDate: hotelCheckIn || '2026-12-05',
      guideId: matchedHotel.id,
      guideName: `${matchedHotel.name} (Partner Penginapan)`,
      guideCertification: 'Verified Eco-Lodge / Hotel Partner',
      leaderName,
      customerPhone,
      customerEmail,
      specialNotes,
      participantsCount,
      hotelSlug: matchedHotel.slug,
      hotelName: matchedHotel.name,
      hotelRoomName,
      hotelCheckIn,
      hotelCheckOut,
      hotelNights,
      hotelRooms,
      hotelSubtotal,
      shuttleFee,
      paymentMethod,
      paymentReference,
      paymentScheme: 'Lunas 100%',
      paymentStatus: markPaid ? 'LUNAS' : 'MENUNGGU PEMBAYARAN',
      bookingStatus: markPaid ? 'Terkonfirmasi' : 'Menunggu Konfirmasi',
      hasInsurance: false,
      hasCarbonOffset: false,
      packageSubtotal: 0,
      insuranceFee: 0,
      carbonOffsetFee: 0,
      serviceFee,
      totalAmount,
      paidAmount: markPaid ? totalAmount : 0,
      remainingAmount: markPaid ? 0 : totalAmount,
      splitPerPerson: Math.ceil(totalAmount / participantsCount),
      splitPaymentLink: `https://jejaknusa.id/split/${invoiceNumber}`,
      rosterNames: [leaderName],
      gearChecklist: [
        { id: `hgc-${Date.now()}-1`, item: 'Bawa KTP / identitas resmi untuk check-in hotel', mandatory: true, checked: false },
        { id: `hgc-${Date.now()}-2`, item: 'Tunjukkan bukti Invoice QRIS JejakNusa di resepsionis', mandatory: true, checked: false }
      ],
      checkedIn: false,
      createdAt: timestamp,
      paidAt: markPaid ? timestamp : undefined
    }

    await saveBookingRecord(hotelRecord)

    return {
      ok: true,
      booking: hotelRecord
    }
  }

  // Case B: TRIP ONLY or TRIP + HOTEL BUNDLE
  const tripSlug = String(body.tripSlug || 'canyoning-air-terjun-gitgit-bali')
  const matchedTrip = getMergedCatalogTrips().find((t) => t.slug === tripSlug)
  if (!matchedTrip) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Destinasi trip tidak ditemukan.'
    })
  }

  const allowInsurance =
    platformFeaturesStore.instantInsuranceEnabled &&
    Boolean(body.includeInsurance ?? body.hasInsurance ?? false)
  const allowCarbon =
    platformFeaturesStore.carbonOffsetEnabled &&
    Boolean(body.includeCarbonOffset ?? body.hasCarbonOffset ?? false)
  const requestedScheme = body.paymentScheme === 'DP 30%' ? 'DP 30%' : 'Lunas 100%'
  const paymentScheme: 'DP 30%' | 'Lunas 100%' =
    requestedScheme === 'DP 30%' && platformFeaturesStore.splitBillDpEnabled ? 'DP 30%' : 'Lunas 100%'

  const packageSubtotal = matchedTrip.pricePerPerson * participantsCount
  const insuranceFee = allowInsurance ? ADVENTURE_INSURANCE_FEE * participantsCount : 0
  const carbonOffsetFee = allowCarbon ? CARBON_OFFSET_FEE : 0
  const serviceFee = platformFeaturesStore.serviceFeeAmount
  const totalAmount =
    packageSubtotal + hotelSubtotal + shuttleFee + insuranceFee + carbonOffsetFee + serviceFee

  const dueAmount = paymentScheme === 'DP 30%' ? Math.ceil(totalAmount * 0.3) : totalAmount
  const markPaid = Boolean(body.markPaidImmediately)

  const managed = guideManagedPackagesStore.find((m) => m.slug === matchedTrip.slug)
  const gearChecklist = managed?.gearChecklist?.length
    ? managed.gearChecklist.map((g, i) => ({
      id: `gc-${Date.now()}-${i}`,
      item: g.item,
      mandatory: g.mandatory,
      checked: false
    }))
    : [
      { id: `gc-${Date.now()}-1`, item: 'Pakaian outdoor quick-dry & baju ganti', mandatory: true, checked: false },
      { id: `gc-${Date.now()}-2`, item: 'Sepatu outdoor / water shoes anti-slip', mandatory: true, checked: false },
      { id: `gc-${Date.now()}-3`, item: 'Dry bag & obat pribadi', mandatory: true, checked: false }
    ]

  const tripReqs = resolveTripRequirements(matchedTrip)
  const requireIdAndHealth =
    platformFeaturesStore.requireIdentityAndHealthCert &&
    (tripReqs.requiresIdCard || Boolean(matchedHotel))

  const rawParticipants = Array.isArray(body.participants) ? body.participants : []
  const agreementAccepted = Boolean(body.agreementAccepted)

  // Validate structured participant manifest when submitted from checkout
  let normalizedParticipants: BookingParticipant[] = []
  if (rawParticipants.length > 0) {
    if (!agreementAccepted) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Anda wajib menyetujui Syarat Perjalanan, Ketentuan Menginap, dan Pelepasan Tanggung Jawab Keselamatan.'
      })
    }
    if (rawParticipants.length < participantsCount) {
      throw createError({
        statusCode: 400,
        statusMessage: `Data peserta belum lengkap (${rawParticipants.length}/${participantsCount} peserta terisi).`
      })
    }
    normalizedParticipants = rawParticipants.slice(0, participantsCount).map((p, idx) => {
      const fullName = String(p?.fullName || '').trim()
      const idNumber = String(p?.idNumber || '').trim()
      const emergencyContact = String(p?.emergencyContact || '').trim()
      const medicalNotes = String(p?.medicalNotes || '').trim()
      if (fullName.length < 2) {
        throw createError({
          statusCode: 400,
          statusMessage: `Nama lengkap Peserta ${idx + 1} wajib diisi sesuai KTP/Paspor.`
        })
      }
      if (requireIdAndHealth && idNumber.length < 6) {
        throw createError({
          statusCode: 400,
          statusMessage: `Nomor NIK/Paspor Peserta ${idx + 1} wajib diisi minimal 6 karakter.`
        })
      }
      if (emergencyContact.length < 6) {
        throw createError({
          statusCode: 400,
          statusMessage: `Nomor Kontak Darurat Peserta ${idx + 1} wajib diisi.`
        })
      }
      if (!medicalNotes) {
        throw createError({
          statusCode: 400,
          statusMessage: `Catatan riwayat penyakit/alergi Peserta ${idx + 1} wajib diisi (isi "Tidak ada" jika sehat).`
        })
      }
      return {
        fullName,
        idNumber: idNumber || '-',
        emergencyContact,
        medicalNotes,
        agreementAccepted: true
      }
    })
  } else {
    normalizedParticipants = Array.from({ length: participantsCount }, (_, idx) => ({
      fullName: idx === 0 ? leaderName : `Peserta ${idx + 1} (${leaderName.split(' ')[0]})`,
      idNumber: '-',
      emergencyContact: customerPhone,
      medicalNotes: specialNotes || 'Tidak ada catatan khusus.',
      agreementAccepted
    }))
  }

  const rosterNames =
    normalizedParticipants.length > 0
      ? normalizedParticipants.map((p) => p.fullName)
      : Array.isArray(body.rosterNames) && body.rosterNames.length
        ? body.rosterNames.map((n) => String(n).trim()).filter(Boolean)
        : Array.from({ length: participantsCount }, (_, idx) =>
          idx === 0 ? leaderName : `Peserta ${idx + 1} (${leaderName.split(' ')[0]})`
        )

  const bookingRecord: CustomerBookingRecord = {
    id: `trx-${Date.now()}`,
    customerId: sessionUser?.id || `cust-${leaderName.toLowerCase().replace(/\s+/g, '-')}`,
    bookingType,
    invoiceNumber,
    bookingCode,
    tripSlug: matchedTrip.slug,
    tripTitle: matchedHotel ? `${matchedTrip.title} + ${matchedHotel.name}` : matchedTrip.title,
    location: matchedTrip.location,
    coverImage: matchedTrip.coverImage,
    departureDate: matchedTrip.nextDepartureDate,
    guideId: matchedTrip.guide.id,
    guideName: matchedTrip.guide.name,
    guideCertification: matchedTrip.guide.certifications[0] || 'APGI / HPI Terverifikasi',
    leaderName,
    customerPhone,
    customerEmail,
    specialNotes,
    participantsCount,
    hotelSlug: matchedHotel?.slug,
    hotelName: matchedHotel?.name,
    hotelRoomName,
    hotelCheckIn,
    hotelCheckOut,
    hotelNights: matchedHotel ? hotelNights : undefined,
    hotelRooms: matchedHotel ? hotelRooms : undefined,
    hotelSubtotal,
    shuttleFee,
    paymentMethod,
    paymentReference,
    paymentScheme,
    paymentStatus: markPaid
      ? paymentScheme === 'DP 30%'
        ? 'DP 30% Lunas'
        : 'LUNAS'
      : 'MENUNGGU PEMBAYARAN',
    bookingStatus: markPaid ? 'Terkonfirmasi' : 'Menunggu Konfirmasi',
    hasInsurance: allowInsurance,
    hasCarbonOffset: allowCarbon,
    packageSubtotal,
    insuranceFee,
    carbonOffsetFee,
    serviceFee,
    totalAmount,
    paidAmount: markPaid ? dueAmount : 0,
    remainingAmount: markPaid ? Math.max(0, totalAmount - dueAmount) : totalAmount,
    splitPerPerson: Math.ceil(totalAmount / participantsCount),
    splitPaymentLink: `https://jejaknusa.id/split/${invoiceNumber}`,
    rosterNames,
    participants: normalizedParticipants,
    agreementAccepted,
    gearChecklist,
    checkedIn: false,
    createdAt: timestamp,
    paidAt: markPaid ? timestamp : undefined
  }

  await saveBookingRecord(bookingRecord)

  if (managed && markPaid) {
    managed.bookedCount = Math.min(managed.totalQuota, managed.bookedCount + participantsCount)
  }

  try {
    await createAdminRecord(
      'bookings',
      {
        tripSlug: bookingRecord.tripSlug,
        tripTitle: bookingRecord.tripTitle,
        departureDate: bookingRecord.departureDate,
        leaderName: bookingRecord.leaderName,
        leaderOrigin: sessionUser?.origin || 'Indonesia',
        participantsCount: bookingRecord.participantsCount,
        isSoloTraveler: bookingRecord.participantsCount === 1,
        hasInsurance: bookingRecord.hasInsurance,
        paymentScheme: bookingRecord.paymentScheme,
        paymentStatus: bookingRecord.paymentStatus === 'LUNAS' ? 'Lunas 100%' : bookingRecord.paymentStatus,
        bookingStatus: bookingRecord.bookingStatus,
        totalAmount: bookingRecord.totalAmount,
        paidAmount: bookingRecord.paidAmount
      },
      sessionUser?.name || bookingRecord.leaderName
    )
  } catch {
    // Shared platform store already persisted in memory
  }

  return {
    ok: true,
    booking: bookingRecord
  }
})

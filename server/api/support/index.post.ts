import { createError, defineEventHandler, readBody } from 'h3'
import type { SupportCategory, SupportThreadRecord } from '#shared/types/support'
import { getAuthSessionUser } from '../../utils/authStore'
import { createSupportThread } from '../../utils/supportStore'

const ALLOWED_CATEGORIES: SupportCategory[] = [
  'Pertanyaan Trip',
  'Pembayaran & Invoice',
  'Refund & Reschedule',
  'Sertifikat & Passport',
  'Kendala Akun',
  'Lainnya'
]

export default defineEventHandler(async (event): Promise<{ thread: SupportThreadRecord; message: string }> => {
  const user = getAuthSessionUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Silakan login terlebih dahulu untuk menghubungi Admin.'
    })
  }

  const body = await readBody<{
    category?: SupportCategory
    subject?: string
    bookingReference?: string
    phone?: string
    message?: string
  }>(event)

  const subject = (body?.subject || '').trim()
  const message = (body?.message || '').trim()
  const category: SupportCategory = ALLOWED_CATEGORIES.includes(body?.category as SupportCategory)
    ? (body!.category as SupportCategory)
    : 'Pertanyaan Trip'
  const phone = (body?.phone || user.phone || '').trim() || '-'

  if (subject.length < 4) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Subjek pesan minimal 4 karakter.'
    })
  }

  if (message.length < 8) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tuliskan pesan Anda minimal 8 karakter agar Admin dapat membantu dengan cepat.'
    })
  }

  const thread = await createSupportThread({
    customerId: user.id,
    customerName: user.name,
    customerEmail: user.email,
    customerPhone: phone,
    category,
    subject,
    bookingReference: body?.bookingReference,
    message
  })

  return {
    thread,
    message: `Pesan Anda (${thread.ticketCode}) berhasil terkirim ke Admin JejakNusa!`
  }
})

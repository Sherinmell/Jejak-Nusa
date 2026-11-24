import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { requireAdmin } from '../../../utils/requireAdmin'
import { updateStoredUserVerification } from '../../../utils/authStore'
import { guideVerificationsStore } from '../../../utils/platformStore'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody<{ decision?: 'approved' | 'rejected'; reviewNote?: string }>(event)

  const target = guideVerificationsStore.find((v) => v.id === id)
  if (!target) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Pengajuan verifikasi pemandu tidak ditemukan.'
    })
  }

  if (body?.decision !== 'approved' && body?.decision !== 'rejected') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Keputusan harus berupa approved atau rejected.'
    })
  }

  target.status = body.decision
  target.reviewNote =
    body.reviewNote?.trim() ||
    (body.decision === 'approved'
      ? `Disetujui oleh ${admin.name} — Lisensi ${target.licenseBody} tervalidasi aktif.`
      : `Ditolak oleh ${admin.name} — Dokumen sertifikasi belum lengkap.`)

  updateStoredUserVerification(
    target.guideId,
    body.decision === 'approved' ? 'verified' : 'rejected',
    body.decision === 'approved' ? `${target.licenseBody} Terverifikasi (${target.licenseNumber})` : undefined
  )

  return { ok: true, application: target }
})

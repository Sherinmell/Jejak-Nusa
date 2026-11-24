import { defineEventHandler } from 'h3'
import { clearAuthSession } from '../../utils/authStore'

export default defineEventHandler((event): { ok: boolean; message: string } => {
  clearAuthSession(event)
  return {
    ok: true,
    message: 'Anda telah keluar dari akun.'
  }
})

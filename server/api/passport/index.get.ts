import { defineEventHandler } from 'h3'
import type { PassportProfileResponse } from '#shared/types/ecosystem'
import { buildPassportResponse } from '../../utils/passportStore'
import { getAuthSessionUser } from '../../utils/authStore'
import { loadUserPassportState } from '../../utils/runtimePersistence'

export default defineEventHandler(async (event): Promise<PassportProfileResponse> => {
  const sessionUser = getAuthSessionUser(event)
  const state = await loadUserPassportState(sessionUser?.id, sessionUser?.email)
  return buildPassportResponse(state, sessionUser?.name || 'Pelanggan Baru')
})

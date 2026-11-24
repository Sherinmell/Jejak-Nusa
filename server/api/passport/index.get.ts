import { defineEventHandler } from 'h3'
import type { PassportProfileResponse } from '#shared/types/ecosystem'
import {
  buildPassportResponse,
  getPassportStateForUser
} from '../../utils/passportStore'
import { getAuthSessionUser } from '../../utils/authStore'

export default defineEventHandler(async (event): Promise<PassportProfileResponse> => {
  const sessionUser = getAuthSessionUser(event)
  const state = getPassportStateForUser(sessionUser?.id, sessionUser?.email)
  return buildPassportResponse(state, sessionUser?.name || 'Pelanggan Baru')
})

import { getRoleHomePath, normalizeUserRole, type UserRole } from '#shared/types/auth'

export default defineNuxtRouteMiddleware(async (to) => {
  const { user, fetchUser } = useAuth()
  await fetchUser()

  const allowedRoles = to.meta.allowedRoles as UserRole[] | undefined

  if (!user.value) {
    const roleHint = allowedRoles?.[0] ? `&role=${allowedRoles[0]}` : ''
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}${roleHint}`)
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const currentRole = normalizeUserRole(user.value.role)
    if (!allowedRoles.includes(currentRole)) {
      return navigateTo(getRoleHomePath(currentRole))
    }
  }
})

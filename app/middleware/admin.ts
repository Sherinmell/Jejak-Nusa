export default defineNuxtRouteMiddleware(async (to) => {
  const { user, fetchUser } = useAuth()
  await fetchUser()

  if (!user.value || user.value.role !== 'admin') {
    return navigateTo(`/login?role=admin&redirect=${encodeURIComponent(to.fullPath)}`)
  }
})

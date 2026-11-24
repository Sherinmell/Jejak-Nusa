export default defineNuxtRouteMiddleware(async (to) => {
  const { user, fetchUser } = useAuth()
  await fetchUser()

  if (!user.value) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})

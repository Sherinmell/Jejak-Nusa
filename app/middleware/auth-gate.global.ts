const PUBLIC_AUTH_PATHS = new Set(['/login', '/register', '/admin/login'])

export default defineNuxtRouteMiddleware(async (to) => {
  const { user, fetchUser } = useAuth()
  await fetchUser()

  // Root link ("/"): keep logged-in users inside /home instead of kicking them to /login!
  if (to.path === '/') {
    return navigateTo(user.value ? '/home' : '/login', { replace: true })
  }

  // Allow access to login & register pages without session
  if (PUBLIC_AUTH_PATHS.has(to.path)) {
    return
  }

  // Require login first before accessing ANY other page (/home, /trips, /customer/*, /admin/*, etc.)
  if (!user.value) {
    const redirectQuery = to.fullPath && to.fullPath !== '/home' ? `?redirect=${encodeURIComponent(to.fullPath)}` : ''
    return navigateTo(`/login${redirectQuery}`)
  }
})

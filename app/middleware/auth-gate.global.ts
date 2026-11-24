const PUBLIC_AUTH_PATHS = new Set(['/', '/login', '/register', '/admin/login'])

export default defineNuxtRouteMiddleware(async (to) => {
  // Root link (http://localhost:3000/) ALWAYS opens /login directly
  if (to.path === '/') {
    return navigateTo('/login', { replace: true })
  }

  const { user, fetchUser } = useAuth()
  await fetchUser()

  // Allow access to login & register pages without session
  if (PUBLIC_AUTH_PATHS.has(to.path)) {
    return
  }

  // Require login first before accessing ANY other page (/home, /trips, /customer/*, /guide/*, /admin/*, etc.)
  if (!user.value) {
    const redirectQuery = to.fullPath && to.fullPath !== '/home' ? `?redirect=${encodeURIComponent(to.fullPath)}` : ''
    return navigateTo(`/login${redirectQuery}`)
  }
})

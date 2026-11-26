import {
  getRoleHomePath,
  normalizeUserRole,
  type AdminLoginPayload,
  type AuthResponse,
  type AuthUser,
  type LoginPayload,
  type RegisterPayload,
  type UserRole
} from '#shared/types/auth'

export function useAuth() {
  const sessionCookie = useCookie<AuthUser | null>('jejaknusa_user_profile', {
    default: () => null,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  })

  const user = useState<AuthUser | null>('jejaknusa-auth-user', () => sessionCookie.value ?? null)
  const initialized = useState<boolean>('jejaknusa-auth-initialized', () => false)
  const loading = useState<boolean>('jejaknusa-auth-loading', () => false)

  const isAuthenticated = computed(() => Boolean(user.value))
  const isCustomer = computed(() => user.value?.role === 'customer')
  const isGuide = computed(() => user.value?.role === 'guide')
  const isAdmin = computed(() => user.value?.role === 'admin')
  const roleHomePath = computed(() => getRoleHomePath(user.value?.role))

  function setSessionUser(nextUser: AuthUser | null) {
    const normalized = nextUser
      ? { ...nextUser, role: normalizeUserRole(nextUser.role) }
      : null
    const prevId = user.value?.id ?? ''
    const nextId = normalized?.id ?? ''
    user.value = normalized
    sessionCookie.value = normalized
    initialized.value = true

    // Reset cached per-account bookings whenever the active user changes or logs out
    if (prevId !== nextId) {
      const bookingsLoaded = useState<boolean>('jejaknusa-bookings-loaded', () => false)
      const bookingsOwner = useState<string>('jejaknusa-bookings-owner', () => '')
      bookingsLoaded.value = false
      bookingsOwner.value = ''
    }
  }

  async function fetchUser(force = false) {
    if (initialized.value && !force) return user.value
    try {
      const fetcher = useRequestFetch()
      const res = await fetcher<{ user: AuthUser | null }>('/api/auth/me')
      if (res && 'user' in res) {
        setSessionUser(res.user ?? null)
      }
    } catch {
      // Preserve existing session state on transient network errors instead of wiping user data!
      if (!user.value && sessionCookie.value) {
        user.value = sessionCookie.value
      }
    }
    return user.value
  }

  async function login(payload: LoginPayload): Promise<AuthResponse> {
    loading.value = true
    try {
      const res = await $fetch<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: payload
      })
      setSessionUser(res.user)
      return res
    } finally {
      loading.value = false
    }
  }

  async function demoLogin(role: UserRole): Promise<AuthResponse> {
    return login({ mode: 'demo', role })
  }

  async function adminLogin(payload: AdminLoginPayload): Promise<AuthResponse> {
    loading.value = true
    try {
      const res = await $fetch<AuthResponse>('/api/auth/admin-login', {
        method: 'POST',
        body: payload
      })
      setSessionUser(res.user)
      return res
    } finally {
      loading.value = false
    }
  }

  async function register(payload: RegisterPayload): Promise<AuthResponse> {
    loading.value = true
    try {
      const res = await $fetch<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: payload
      })
      setSessionUser(res.user)
      return res
    } finally {
      loading.value = false
    }
  }

  async function updateProfile(payload: {
    name?: string
    username?: string
    email?: string
    phone?: string
    origin?: string
    avatar?: string
    currentPassword?: string
    newPassword?: string
  }): Promise<AuthResponse> {
    loading.value = true
    try {
      const res = await $fetch<AuthResponse>('/api/auth/profile', {
        method: 'PATCH',
        body: payload
      })
      setSessionUser(res.user)
      return res
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    loading.value = true
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
      setSessionUser(null)
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    isAuthenticated,
    isCustomer,
    isGuide,
    isAdmin,
    roleHomePath,
    loading,
    fetchUser,
    login,
    demoLogin,
    adminLogin,
    register,
    updateProfile,
    logout
  }
}

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { deleteCookie, getCookie, setCookie, type H3Event } from 'h3'
import { normalizeUserRole, type AuthUser, type UserRole } from '#shared/types/auth'

interface StoredUser extends AuthUser {
  passwordHash: string
}

const SESSION_COOKIE_NAME = 'jejaknusa_session'

function getSessionSecret(): string {
  return (
    process.env.ADMIN_ACCESS_CODE ||
    process.env.TIDB_PASSWORD ||
    'jejaknusa_internal_session_key_2026'
  )
}

function signPayload(encoded: string): string {
  return createHmac('sha256', getSessionSecret()).update(encoded).digest('base64url')
}

export function safeCompareText(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

/**
 * Hash a password using Node.js scrypt with a unique random 16-byte salt.
 * Output format: "scrypt$<saltHex>$<derivedKeyHex>"
 */
export function hashPasswordSecure(plainPassword: string): string {
  const salt = randomBytes(16).toString('hex')
  const derived = scryptSync(plainPassword, salt, 64).toString('hex')
  return `scrypt$${salt}$${derived}`
}

/**
 * Constant-time verification against a stored scrypt password hash.
 */
export function verifyPasswordSecure(plainPassword: string, storedHash: string): boolean {
  if (!plainPassword || !storedHash) return false
  const parts = storedHash.split('$')
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false
  const [, salt, expectedHex] = parts
  if (!salt || !expectedHex) return false
  try {
    const derivedBuf = scryptSync(plainPassword, salt, 64)
    const expectedBuf = Buffer.from(expectedHex, 'hex')
    if (derivedBuf.length !== expectedBuf.length) return false
    return timingSafeEqual(derivedBuf, expectedBuf)
  } catch {
    return false
  }
}

/**
 * Normalize Indonesian WhatsApp/phone numbers for reliable lookup:
 * "+62 812-3900-1122", "6281239001122", "0812-3900-1122" -> "081239001122"
 */
export function normalizePhoneNumber(raw: string | undefined | null): string {
  if (!raw) return ''
  let digits = raw.replace(/\D+/g, '')
  if (digits.startsWith('62') && digits.length >= 10) {
    digits = `0${digits.slice(2)}`
  }
  return digits
}

// Built-in & registered accounts for 3 roles (all passwords stored exclusively as salted scrypt hashes)
const usersStore: StoredUser[] = [
  {
    id: 'usr-customer-demo',
    username: 'nadia',
    name: 'Nadia Kusuma',
    email: 'customer@jejaknusa.id',
    phone: '0812-8890-4411',
    passwordHash: hashPasswordSecure('customer123'),
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&q=80',
    origin: 'Jakarta Selatan',
    memberSince: '2025-04-12',
    verified: true
  },
  {
    id: 'usr-raka-demo',
    username: 'raka',
    name: 'Raka Mahendra',
    email: 'raka.mahendra@mail.id',
    phone: '0811-2201-9980',
    passwordHash: hashPasswordSecure('raka123'),
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&q=80',
    origin: 'Bandung',
    memberSince: '2025-06-15',
    verified: true
  },
  {
    id: 'usr-ayu-demo',
    username: 'ayu',
    name: 'Ayu Pratiwi',
    email: 'ayu.pratiwi@mail.id',
    phone: '0813-4455-6677',
    passwordHash: hashPasswordSecure('ayu123'),
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80',
    origin: 'Semarang',
    memberSince: '2025-08-20',
    verified: true
  },
  {
    id: 'usr-kevin-demo',
    username: 'kevin',
    name: 'Kevin Santoso',
    email: 'kevin.santoso@mail.id',
    phone: '0815-7788-3344',
    passwordHash: hashPasswordSecure('kevin123'),
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80',
    origin: 'Surabaya',
    memberSince: '2025-07-08',
    verified: true
  },
  {
    id: 'guide-made-surya',
    username: 'made.surya',
    name: 'I Made Surya Pratama',
    email: 'guide@jejaknusa.id',
    phone: '0812-3900-1122',
    passwordHash: hashPasswordSecure('guide123'),
    role: 'guide',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&q=80',
    origin: 'Singaraja, Bali',
    memberSince: '2024-08-03',
    verified: true,
    certification: 'ICOpro Canyoning Lv. 2 & APGI',
    licenseNumber: 'ICOPRO-L2-ID-2024-772',
    verificationStatus: 'verified'
  },
  {
    id: 'guide-bang-zainal',
    username: 'zainal',
    name: 'Zainal Abidin (Bang Zainal)',
    email: 'zainal@guide.jejaknusa.id',
    phone: '0813-3700-2233',
    passwordHash: hashPasswordSecure('rinjani123'),
    role: 'guide',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80',
    origin: 'Sembalun, Lombok Timur',
    memberSince: '2024-05-18',
    verified: true,
    certification: 'APGI Mountain Guide & BASARNAS',
    licenseNumber: 'APGI-NTB-2024-319',
    verificationStatus: 'verified'
  },
  {
    id: 'guide-yosep-komodo',
    username: 'yosep',
    name: 'Yosep Fernandes',
    email: 'yosep@guide.jejaknusa.id',
    phone: '0812-4600-3344',
    passwordHash: hashPasswordSecure('komodo123'),
    role: 'guide',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=240&q=80',
    origin: 'Labuan Bajo, NTT',
    memberSince: '2024-06-11',
    verified: true,
    certification: 'PADI Divemaster & POSSI',
    licenseNumber: 'PADI-DM-ID-2024-518',
    verificationStatus: 'verified'
  },
  {
    id: 'usr-admin-demo',
    username: 'admin',
    name: 'Rendra Mahesa (Admin)',
    email: 'admin@jejaknusa.id',
    passwordHash: hashPasswordSecure('admin123'),
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=240&q=80',
    origin: 'Command Center Jakarta',
    memberSince: '2024-01-10',
    verified: true
  }
]

function sanitizeUser(user: StoredUser): AuthUser {
  const { passwordHash: _, ...safeUser } = user
  return {
    ...safeUser,
    role: normalizeUserRole(safeUser.role)
  }
}

export function getDemoUserByRole(role: UserRole): AuthUser {
  const normalized = normalizeUserRole(role)
  const found = usersStore.find((u) => u.role === normalized)
  if (found) return sanitizeUser(found)
  return sanitizeUser(usersStore[0]!)
}

export function findUserByIdentifier(identifier: string, roleFilter?: UserRole): StoredUser | undefined {
  const normalized = identifier.trim().toLowerCase()
  const normalizedPhone = normalizePhoneNumber(identifier)

  if (!roleFilter && normalized === 'admin') {
    return usersStore.find((u) => u.role === 'admin')
  }
  if (!roleFilter && normalized === 'explorer@jejaknusa.id') {
    return usersStore.find((u) => u.email === 'customer@jejaknusa.id')
  }

  return usersStore.find((u) => {
    if (roleFilter && u.role !== roleFilter) return false
    if (u.username && u.username.toLowerCase() === normalized) return true
    if (u.email.toLowerCase() === normalized) return true
    if (normalizedPhone.length >= 9 && u.phone && normalizePhoneNumber(u.phone) === normalizedPhone) {
      return true
    }
    return false
  })
}

export function findUserByEmail(identifier: string): StoredUser | undefined {
  return findUserByIdentifier(identifier)
}

export function findUserById(id: string): AuthUser | null {
  const user = usersStore.find((u) => u.id === id)
  return user ? sanitizeUser(user) : null
}

export function authenticateUser(
  identifier: string,
  password: string,
  requiredRole?: UserRole
): AuthUser | null {
  const user = findUserByIdentifier(identifier, requiredRole)
  if (!user) return null
  if (verifyPasswordSecure(password, user.passwordHash)) {
    return sanitizeUser(user)
  }
  // Allow legacy explorer password alias for customer demo
  if (!requiredRole && identifier.trim().toLowerCase() === 'explorer@jejaknusa.id' && password === 'explorer123') {
    return sanitizeUser(user)
  }
  return null
}

export function upsertCustomerByName(name: string, origin?: string): AuthUser {
  const cleanName = name.trim()
  const cleanOrigin = origin?.trim() || 'Indonesia'
  const existing = usersStore.find(
    (u) => u.role === 'customer' && u.name.toLowerCase() === cleanName.toLowerCase()
  )
  if (existing) {
    if (origin?.trim()) existing.origin = cleanOrigin
    return sanitizeUser(existing)
  }

  const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '') || 'customer'
  const created: StoredUser = {
    id: `usr-cust-${Date.now()}`,
    name: cleanName,
    email: `${slug}@pelanggan.jejaknusa.id`,
    passwordHash: hashPasswordSecure(randomBytes(24).toString('hex')),
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&q=80',
    origin: cleanOrigin,
    memberSince: new Date().toISOString().slice(0, 10),
    verified: true
  }
  usersStore.push(created)
  return sanitizeUser(created)
}

export function registerNewUser(input: {
  id?: string
  username?: string
  name: string
  email: string
  phone?: string
  password: string
  role?: 'customer' | 'guide'
  origin?: string
  licenseBody?: string
  licenseNumber?: string
}): AuthUser {
  const normalizedEmail = input.email.trim().toLowerCase()
  const normalizedUsername = input.username?.trim().toLowerCase() || undefined
  const role: UserRole = input.role === 'guide' ? 'guide' : 'customer'
  const isGuide = role === 'guide'
  const newUser: StoredUser = {
    id: input.id || `usr-${role}-${Date.now()}`,
    username: normalizedUsername,
    name: input.name.trim(),
    email: normalizedEmail,
    phone: input.phone?.trim() || undefined,
    passwordHash: hashPasswordSecure(input.password),
    role,
    avatar: isGuide
      ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80'
      : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=240&q=80',
    origin: input.origin?.trim() || 'Indonesia',
    memberSince: new Date().toISOString().slice(0, 10),
    verified: !isGuide,
    certification: isGuide ? `${input.licenseBody || 'APGI'} (Menunggu Verifikasi)` : undefined,
    licenseNumber: isGuide ? input.licenseNumber || `PENDING-${Date.now().toString().slice(-5)}` : undefined,
    verificationStatus: isGuide ? 'pending' : undefined
  }

  usersStore.push(newUser)
  return sanitizeUser(newUser)
}

// In-memory store for uploaded avatar data URLs (also persisted in TiDB users.avatar)
const uploadedAvatarCache = new Map<string, string>()

export function setUploadedAvatarData(userId: string, dataUrl: string) {
  uploadedAvatarCache.set(userId, dataUrl)
}

export function getUploadedAvatarData(userId: string): string | null {
  return uploadedAvatarCache.get(userId) ?? null
}

export function updateStoredUserProfile(
  userId: string,
  updates: {
    name?: string
    username?: string
    email?: string
    phone?: string
    origin?: string
    avatar?: string
    newPassword?: string
  },
  fallbackUser?: AuthUser
): AuthUser {
  let found = usersStore.find((u) => u.id === userId)
  if (!found && fallbackUser) {
    found = {
      ...fallbackUser,
      passwordHash: hashPasswordSecure(randomBytes(24).toString('hex'))
    }
    usersStore.push(found)
  }
  if (!found) {
    throw new Error('Akun pengguna tidak ditemukan.')
  }

  if (typeof updates.name === 'string' && updates.name.trim().length >= 2) {
    found.name = updates.name.trim()
  }
  if (typeof updates.username === 'string' && updates.username.trim().length >= 3 && found.role !== 'admin') {
    found.username = updates.username.trim().toLowerCase()
  }
  if (typeof updates.email === 'string' && updates.email.includes('@')) {
    found.email = updates.email.trim().toLowerCase()
  }
  if (updates.phone !== undefined) {
    found.phone = updates.phone.trim() || undefined
  }
  if (typeof updates.origin === 'string' && updates.origin.trim()) {
    found.origin = updates.origin.trim()
  }
  if (typeof updates.avatar === 'string' && updates.avatar.trim()) {
    found.avatar = updates.avatar.trim()
  }
  if (typeof updates.newPassword === 'string' && updates.newPassword.length >= 6) {
    found.passwordHash = hashPasswordSecure(updates.newPassword)
  }

  return sanitizeUser(found)
}

export function verifyStoredUserPassword(userId: string, plainPassword: string): boolean {
  const found = usersStore.find((u) => u.id === userId)
  if (!found) return false
  return verifyPasswordSecure(plainPassword, found.passwordHash)
}

export function updateStoredUserVerification(
  guideId: string,
  status: 'verified' | 'rejected',
  certificationLabel?: string
) {
  const found = usersStore.find((u) => u.id === guideId)
  if (found) {
    found.verified = status === 'verified'
    found.verificationStatus = status
    if (certificationLabel) found.certification = certificationLabel
  }
}

export function setAuthSession(event: H3Event, user: AuthUser) {
  const normalizedUser: AuthUser = {
    ...user,
    role: normalizeUserRole(user.role)
  }
  const encoded = Buffer.from(JSON.stringify(normalizedUser)).toString('base64url')
  const sig = signPayload(encoded)
  setCookie(event, SESSION_COOKIE_NAME, `${encoded}.${sig}`, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  })
}

export function clearAuthSession(event: H3Event) {
  deleteCookie(event, SESSION_COOKIE_NAME, {
    path: '/'
  })
}

export function getAuthSessionUser(event: H3Event): AuthUser | null {
  const token = getCookie(event, SESSION_COOKIE_NAME)
  if (!token || !token.includes('.')) return null

  const [encoded, sig] = token.split('.')
  if (!encoded || !sig) return null

  const expectedSig = signPayload(encoded)
  if (!safeCompareText(sig, expectedSig)) {
    return null
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8')) as AuthUser
    if (!parsed?.id || !parsed?.role || !parsed?.name) return null
    return {
      ...parsed,
      role: normalizeUserRole(parsed.role)
    }
  } catch {
    return null
  }
}

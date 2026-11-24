export type UserRole = 'customer' | 'guide' | 'admin'

export function normalizeUserRole(role: string | undefined | null): UserRole {
  if (role === 'admin') return 'admin'
  if (role === 'guide') return 'guide'
  return 'customer'
}

export function getRoleHomePath(role: UserRole | string | undefined | null): string {
  const normalized = normalizeUserRole(role)
  if (normalized === 'admin') return '/admin/dashboard'
  if (normalized === 'guide') return '/guide/dashboard'
  return '/customer/dashboard'
}

export function getRoleLabel(role: UserRole | string | undefined | null): string {
  const normalized = normalizeUserRole(role)
  if (normalized === 'admin') return 'Administrator'
  if (normalized === 'guide') return 'Pemandu Lokal'
  return 'Pelanggan'
}

export interface AuthUser {
  id: string
  username?: string
  name: string
  email: string
  phone?: string
  role: UserRole
  avatar: string
  origin: string
  memberSince: string
  verified: boolean
  certification?: string
  licenseNumber?: string
  verificationStatus?: 'verified' | 'pending' | 'rejected'
}

export interface DemoLoginPayload {
  mode: 'demo'
  role: UserRole
}

export interface CustomerNameLoginPayload {
  mode: 'customer'
  name: string
  origin?: string
}

export interface GuideCredentialsLoginPayload {
  mode: 'guide'
  identifier: string
  password: string
}

export interface ClassicLoginPayload {
  mode?: 'credentials'
  identifier?: string
  email?: string
  username?: string
  password: string
}

export type LoginPayload =
  | DemoLoginPayload
  | CustomerNameLoginPayload
  | GuideCredentialsLoginPayload
  | ClassicLoginPayload

export interface AdminLoginPayload {
  email: string
  password: string
  accessCode: string
}

export interface RegisterPayload {
  username?: string
  name: string
  email: string
  phone?: string
  password: string
  role: 'customer' | 'guide'
  origin?: string
  licenseBody?: string
  licenseNumber?: string
}

export interface AuthResponse {
  user: AuthUser
  message: string
}

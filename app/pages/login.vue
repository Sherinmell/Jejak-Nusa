<script setup lang="ts">
import {
  ArrowRight,
  BadgeCheck,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus
} from 'lucide-vue-next'
import { getRoleHomePath, type UserRole } from '#shared/types/auth'

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Masuk — JejakNusa',
  description:
    'Masuk ke JejakNusa dengan username, email, atau nomor WhatsApp dan kata sandi Anda.'
})

const route = useRoute()
const router = useRouter()
const { user, isAuthenticated, loading, login, logout } = useAuth()

const identifier = ref('')
const password = ref('')
const showPassword = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const redirectTarget = computed(() => {
  const r = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  return r.startsWith('/') ? r : ''
})

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as { data?: { statusMessage?: string; message?: string }; statusMessage?: string; message?: string }
    return e.data?.statusMessage || e.data?.message || e.statusMessage || e.message || 'Username atau kata sandi tidak sesuai.'
  }
  return 'Username atau kata sandi tidak sesuai.'
}

function resolvePostLoginRoute(role: UserRole): string {
  const target = redirectTarget.value
  if (target) {
    if (role === 'admin' && target.startsWith('/admin')) return target
    if (role === 'customer' && !target.startsWith('/admin') && !target.startsWith('/guide')) return target
  }
  if (role === 'customer') return '/home'
  return getRoleHomePath(role)
}

async function handleUnifiedLogin() {
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const res = await login({
      mode: 'credentials',
      identifier: identifier.value.trim(),
      username: identifier.value.trim(),
      password: password.value
    })
    successMessage.value = res.message
    password.value = ''
    await router.push(resolvePostLoginRoute(res.user.role))
  } catch (err) {
    errorMessage.value = extractErrorMessage(err)
  }
}

async function handleLogout() {
  await logout()
  successMessage.value = 'Anda berhasil keluar. Silakan masuk kembali.'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Active Session Banner -->
    <div
      v-if="isAuthenticated && user"
      class="rounded-[28px] glass-surface p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#c7e4e0]"
    >
      <div class="flex items-center gap-3.5">
        <img :src="user.avatar" :alt="user.name" class="h-14 w-14 rounded-2xl object-cover border-2 border-[#c7e4e0]">
        <div>
          <span class="inline-flex items-center gap-1 rounded-full bg-[#eef7f6] px-2.5 py-0.5 text-[11px] font-extrabold text-[#175957]">
            <BadgeCheck class="h-3.5 w-3.5" />
            Aktif sebagai {{ user.role === 'admin' ? 'Administrator' : 'Peserta' }}
          </span>
          <h2 class="font-editorial text-xl font-bold text-[#162221] mt-0.5">{{ user.name }}</h2>
          <p class="text-xs text-[#5c6b69]">
            <span v-if="user.username">@{{ user.username }} &bull; </span>{{ user.email }}
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <NuxtLink
          :to="user.role === 'customer' ? '/home' : getRoleHomePath(user.role)"
          class="inline-flex items-center gap-1.5 rounded-full bg-[#1f6f6d] px-4 py-2.5 text-xs font-extrabold text-white hover:bg-[#175957] transition"
        >
          <span>Lanjut Masuk Aplikasi</span>
          <ArrowRight class="h-3.5 w-3.5" />
        </NuxtLink>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-full border border-orange-300 bg-white px-4 py-2.5 text-xs font-bold text-orange-700 hover:bg-orange-600 hover:text-white transition cursor-pointer"
          @click="handleLogout"
        >
          <LogOut class="h-3.5 w-3.5" />
          Ganti Akun
        </button>
      </div>
    </div>

    <!-- Main Unified Login Card Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      <!-- Left Editorial Panel -->
      <div class="lg:col-span-5 relative rounded-[32px] overflow-hidden min-h-[240px] lg:min-h-[480px] flex flex-col justify-between p-6 sm:p-8 text-white shadow-xl">
        <img
          src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&fm=webp&w=720&q=70"
          srcset="https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&fm=webp&w=540&q=68 540w, https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&fm=webp&w=960&q=72 960w"
          sizes="(max-width: 1024px) 95vw, 480px"
          alt="Petualangan Nusantara"
          decoding="async"
          class="absolute inset-0 h-full w-full object-cover"
        >
        <div
          class="absolute inset-0"
          style="background: linear-gradient(165deg, rgba(16,63,62,0.92) 0%, rgba(18,72,71,0.78) 55%, rgba(10,32,31,0.94) 100%);"
        />

        <div class="relative z-10 space-y-3">
          <span class="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 px-3 py-1 text-xs font-bold text-amber-200">
            <ShieldCheck class="h-3.5 w-3.5" />
            Gerbang Masuk JejakNusa
          </span>
          <h1 class="font-editorial text-3xl sm:text-4xl font-bold leading-tight">
            Masuk dengan Akun Anda
          </h1>
          <p class="text-xs sm:text-sm text-teal-100/90 leading-relaxed">
            Gunakan username, alamat email, atau nomor WhatsApp yang sudah terdaftar beserta kata sandi Anda. Sistem otomatis mengenali peran akun dan mengarahkan Anda ke portal yang sesuai.
          </p>
        </div>

        <div class="relative z-10 pt-6">
          <div class="rounded-2xl bg-white/12 backdrop-blur-md border border-white/20 p-4 text-xs text-teal-50 space-y-1">
            <p class="font-extrabold text-amber-200 flex items-center gap-1.5">
              <Sparkles class="h-3.5 w-3.5" />
              Akun Tersimpan Permanen &amp; Aman
            </p>
            <p class="leading-relaxed text-teal-50/90">
              Seluruh akun terdaftar tersimpan aman di database TiDB Cloud dengan enkripsi kata sandi (scrypt hash), terhubung langsung dengan riwayat pesanan QRIS, Adventure Passport, dan Sertifikat Trip Anda.
            </p>
          </div>
        </div>
      </div>

      <!-- Right Unified Single Form Card -->
      <div class="lg:col-span-7 rounded-[32px] glass-surface p-6 sm:p-9 flex flex-col justify-center space-y-6">
        <div class="space-y-1.5">
          <span class="inline-flex items-center gap-1.5 rounded-full bg-[#eef7f6] border border-[#c7e4e0] px-3 py-1 text-[11px] font-extrabold text-[#175957]">
            <Lock class="h-3.5 w-3.5" />
            Login Terpadu JejakNusa
          </span>
          <h2 class="font-editorial text-2xl sm:text-3xl font-bold text-[#162221]">
            Masuk ke Akun
          </h2>
          <p class="text-xs sm:text-sm text-[#5c6b69]">
            Masukkan username (atau email / WhatsApp) dan kata sandi Anda untuk melanjutkan.
          </p>
        </div>

        <!-- Alerts -->
        <div
          v-if="errorMessage"
          class="rounded-2xl bg-orange-50 border border-orange-200 px-4 py-3 text-xs font-bold text-orange-800"
        >
          {{ errorMessage }}
        </div>
        <div
          v-if="successMessage"
          class="rounded-2xl bg-[#eef7f6] border border-[#c7e4e0] px-4 py-3 text-xs font-bold text-[#175957]"
        >
          {{ successMessage }}
        </div>

        <!-- Single Unified Credentials Form -->
        <form class="space-y-4" @submit.prevent="handleUnifiedLogin">
          <div class="space-y-1.5">
            <label for="login-identifier" class="block text-xs font-extrabold uppercase tracking-wider text-[#5c6b69]">
              Username / Email / WhatsApp <span class="text-orange-600">*</span>
            </label>
            <div class="relative">
              <User class="h-4 w-4 text-[#7a8785] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="login-identifier"
                v-model="identifier"
                type="text"
                required
                autofocus
                autocomplete="username"
                placeholder="Masukkan username, email, atau nomor WhatsApp"
                class="w-full rounded-full border border-[#e3dccd] bg-white pl-11 pr-4 py-3.5 text-sm font-semibold text-[#162221] placeholder:text-[#98a3a0] focus:border-[#1f6f6d] focus:outline-none focus:ring-2 focus:ring-[#1f6f6d]/20"
              >
            </div>
          </div>

          <div class="space-y-1.5">
            <label for="login-password" class="block text-xs font-extrabold uppercase tracking-wider text-[#5c6b69]">
              Kata Sandi <span class="text-orange-600">*</span>
            </label>
            <div class="relative">
              <Lock class="h-4 w-4 text-[#7a8785] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="login-password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                autocomplete="current-password"
                placeholder="Masukkan kata sandi Anda"
                class="w-full rounded-full border border-[#e3dccd] bg-white pl-11 pr-11 py-3.5 text-sm text-[#162221] placeholder:text-[#98a3a0] focus:border-[#1f6f6d] focus:outline-none focus:ring-2 focus:ring-[#1f6f6d]/20"
              >
              <button
                type="button"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7a8785] hover:text-[#1f6f6d] cursor-pointer"
                aria-label="Tampilkan atau sembunyikan kata sandi"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" class="h-4 w-4" />
                <Eye v-else class="h-4 w-4" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            :disabled="loading || !identifier.trim() || !password"
            class="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#1f6f6d] px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#1f6f6d]/25 hover:bg-[#175957] disabled:opacity-60 transition cursor-pointer"
          >
            <span>{{ loading ? 'Memverifikasi Akun...' : 'Masuk' }}</span>
            <ArrowRight class="h-4 w-4" />
          </button>
        </form>

        <!-- Register Link -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl bg-white/85 border border-[#e5dfd2] px-4 py-3.5 text-xs">
          <span class="text-[#5c6b69]">Belum memiliki akun? Buat username &amp; kata sandi Anda sekarang.</span>
          <NuxtLink
            to="/register"
            class="inline-flex items-center gap-1 font-extrabold text-[#1f6f6d] hover:underline shrink-0"
          >
            <UserPlus class="h-3.5 w-3.5" />
            Daftar Akun Baru &rarr;
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

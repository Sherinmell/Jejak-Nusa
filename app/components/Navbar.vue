<script setup lang="ts">
import {
  Award,
  BadgeCheck,
  BedDouble,
  Bell,
  Briefcase,
  Compass,
  Database,
  Headphones,
  Heart,
  Home,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Search,
  Send,
  ShieldCheck,
  User,
  UserPlus,
  Users,
  Wallet,
  Wand2,
  X
} from 'lucide-vue-next'
import { getRoleHomePath, getRoleLabel } from '#shared/types/auth'

const route = useRoute()
const router = useRouter()
const { savedIds } = useSavedTrips()
const { watchedDestinations } = useWishlistAlerts()
const { user, isAuthenticated, isAdmin, isGuide, isCustomer, roleHomePath, logout } = useAuth()

const topSearch = ref(typeof route.query.q === 'string' ? route.query.q : '')
const showNotifications = ref(false)
const showSupportModal = ref(false)
const showAccountMenu = ref(false)
const showMobileMenu = ref(false)

watch(
  () => route.query.q,
  (val) => {
    topSearch.value = typeof val === 'string' ? val : ''
  }
)

watch(
  () => route.fullPath,
  () => {
    showNotifications.value = false
    showAccountMenu.value = false
    showMobileMenu.value = false
  }
)

function submitTopSearch() {
  const q = topSearch.value.trim()
  const targetPath = route.path.startsWith('/hotels') ? '/hotels' : '/trips'
  router.push(q ? { path: targetPath, query: { q } } : { path: targetPath })
}

async function handleLogout() {
  await logout()
  showAccountMenu.value = false
  await router.push('/login')
}

const isHome = computed(() => route.path === '/home')
const isSavedView = computed(() => route.path === '/trips' && route.query.saved === 'true')
const isExploreView = computed(() => route.path.startsWith('/trips') && route.query.saved !== 'true')
const isHotelsView = computed(() => route.path.startsWith('/hotels'))
const isCommunityView = computed(() => route.path.startsWith('/community'))
const isMatchmakerView = computed(() => route.path.startsWith('/matchmaker'))
const isCustomerView = computed(() => route.path.startsWith('/customer/dashboard') || route.path.startsWith('/customer/checkout') || route.path.startsWith('/customer/transactions') || route.path.startsWith('/customer/certificates'))
const isPassportView = computed(() => route.path.startsWith('/customer/passport') || route.path.startsWith('/passport'))
const isGuideView = computed(() => route.path.startsWith('/guide'))
const isAdminView = computed(() => route.path.startsWith('/admin'))
const isLoginView = computed(() => route.path === '/login' || route.path === '/register')

const firstName = computed(() => {
  if (!user.value?.name) return 'Explorer'
  return user.value.name.split(' ')[0] || 'Explorer'
})

const roleBadgeClass = computed(() => {
  if (isAdmin.value) return 'bg-amber-100 text-amber-900 border-amber-300'
  if (isGuide.value) return 'bg-emerald-100 text-emerald-900 border-emerald-300'
  return 'bg-[#eef7f6] text-[#175957] border-[#c7e4e0]'
})

const pageHeading = computed(() => {
  if (isHome.value) {
    return {
      title: `Hello, ${firstName.value}`,
      emoji: '',
      subtitle: 'Marketplace Open Trip & Pemandu Lokal Terverifikasi di seluruh Nusantara.'
    }
  }
  if (isHotelsView.value) {
    return {
      title: 'Stays & Hotels',
      emoji: '',
      subtitle: 'Eco-lodge, villa, glamping, dan boutique hotel terverifikasi dekat basecamp open trip.'
    }
  }
  if (isCommunityView.value) {
    return {
      title: 'Solo Traveler Community',
      emoji: '',
      subtitle: 'Cari teman seperjalanan, sharing shuttle, dan kenalan pra-trip sebelum berangkat.'
    }
  }
  if (isMatchmakerView.value) {
    return {
      title: 'Adventure Matchmaker',
      emoji: '',
      subtitle: 'Kuis AI untuk mencocokkan kebugaran fisik, anggaran, dan gaya petualangan Anda.'
    }
  }
  if (route.path === '/register') {
    return {
      title: 'Daftar Akun Baru',
      emoji: '',
      subtitle: 'Bergabung sebagai Pelanggan atau ajukan lisensi sebagai Pemandu Lokal Terverifikasi.'
    }
  }
  if (isLoginView.value) {
    return {
      title: isAuthenticated.value ? 'Sesi Akun Aktif' : 'Masuk ke JejakNusa',
      emoji: '',
      subtitle: isAuthenticated.value
        ? 'Akses portal sesuai peran aktif Anda atau ganti role kapan saja.'
        : 'Login Multi-Role (Pelanggan, Pemandu Lokal, Admin) lengkap dengan 3 akun demo instan.'
    }
  }
  if (isSavedView.value) {
    return {
      title: 'Saved Adventures',
      emoji: '',
      subtitle: 'Daftar open trip favorit yang sudah Anda simpan untuk rencana keberangkatan.'
    }
  }
  if (route.path === '/trips') {
    return {
      title: 'Explore Nusantara',
      emoji: '',
      subtitle: 'Temukan open trip trekking, canyoning, diving, dan caving bersama pemandu terverifikasi.'
    }
  }
  return {
    title: 'Trip Itinerary & Smart Booking',
    emoji: '',
    subtitle: 'Pelajari rute, lisensi pemandu, dampak lokal, dan buat Split Payment Link secara instan.'
  }
})
</script>

<template>
  <!-- Top Header Bar -->
  <header class="relative z-30 w-full">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <!-- Greeting / Page Title -->
      <div class="flex items-start gap-3">
        <!-- Mobile Menu Drawer Trigger -->
        <button
          type="button"
          class="lg:hidden flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#1f6f6d] text-white shadow-md hover:bg-[#175957] transition cursor-pointer"
          aria-label="Buka Menu Navigasi"
          @click="showMobileMenu = true"
        >
          <Menu class="h-5 w-5" />
        </button>

        <div>
          <h1 class="font-editorial text-2xl sm:text-4xl font-bold tracking-tight text-[#162221] leading-tight">
            {{ pageHeading.title }}
            <span v-if="pageHeading.emoji" class="ml-1 inline-block">{{ pageHeading.emoji }}</span>
          </h1>
          <p class="mt-0.5 text-xs sm:text-sm font-medium text-[#5c6765]">
            {{ pageHeading.subtitle }}
          </p>
        </div>
      </div>

      <!-- Right Search Pill + Role Quick Button + Notifications + Auth Pill -->
      <div class="flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap">
        <form class="relative flex-1 sm:w-56 md:w-64" @submit.prevent="submitTopSearch">
          <Search class="h-4 w-4 text-[#6d7977] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            v-model="topSearch"
            type="text"
            :placeholder="isHotelsView ? 'Cari hotel...' : 'Cari destinasi trip...'"
            aria-label="Cari destinasi atau hotel"
            class="w-full rounded-full glass-pill pl-11 pr-4 py-2.5 text-sm font-medium text-[#1c2423] placeholder:text-[#889391] focus:outline-none focus:ring-2 focus:ring-[#1f6f6d]/35 transition"
          >
        </form>

        <!-- Dynamic Role Dashboard Shortcut (Visible when authenticated) -->
        <NuxtLink
          v-if="isAuthenticated && user"
          :to="roleHomePath"
          class="hidden md:inline-flex h-11 items-center gap-1.5 rounded-full border px-3.5 text-xs font-extrabold transition shrink-0"
          :class="roleBadgeClass"
        >
          <BadgeCheck class="h-3.5 w-3.5" />
          <span>{{ getRoleLabel(user.role) }}</span>
        </NuxtLink>

        <!-- Notification Bell -->
        <div class="relative">
          <button
            type="button"
            class="relative flex h-11 w-11 items-center justify-center rounded-full glass-pill text-[#344240] hover:text-[#1f6f6d] transition cursor-pointer"
            aria-label="Notifikasi"
            @click="showNotifications = !showNotifications; showAccountMenu = false"
          >
            <Bell class="h-4.5 w-4.5" />
            <span class="absolute top-2.5 right-2.5 h-2.5 w-2.5 rounded-full bg-orange-500 ring-2 ring-[#faf8f4]" />
          </button>

          <Transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 translate-y-1 scale-95"
            enter-to-class="opacity-100 translate-y-0 scale-100"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100 translate-y-0 scale-100"
            leave-to-class="opacity-0 translate-y-1 scale-95"
          >
            <div
              v-if="showNotifications"
              class="absolute right-0 mt-2.5 w-80 rounded-[24px] glass-surface p-4 z-50 space-y-3"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-extrabold uppercase tracking-wider text-[#1f6f6d]">Info Keberangkatan</span>
                <button
                  type="button"
                  class="text-stone-400 hover:text-stone-700 cursor-pointer"
                  @click="showNotifications = false"
                >
                  <X class="h-4 w-4" />
                </button>
              </div>
              <NuxtLink
                to="/trips/canyoning-air-terjun-gitgit-bali"
                class="block rounded-2xl bg-white/90 p-3 border border-[#e8e2d5] hover:border-[#1f6f6d]/40 transition"
                @click="showNotifications = false"
              >
                <p class="text-xs font-bold text-[#162221]">Sisa 3 Slot — Canyoning Gitgit Bali</p>
                <p class="mt-0.5 text-[11px] text-[#5c6765]">Keberangkatan 6 Des bersama Bli Made (ICOpro Lv.2).</p>
              </NuxtLink>
              <div class="rounded-2xl bg-[#eef7f6] p-3 border border-[#c7e4e0] space-y-1.5">
                <p class="text-[11px] font-extrabold text-[#175957]">
                  Wishlist Notifikasi Kuota ({{ watchedDestinations.length }})
                </p>
                <p class="text-[11px] text-[#4a5f5d]">
                  Memantau jadwal baru: {{ watchedDestinations.join(', ') || 'Belum ada destinasi dipilih' }}
                </p>
                <NuxtLink
                  to="/trips"
                  class="inline-block text-[11px] font-extrabold text-[#1f6f6d] hover:underline"
                  @click="showNotifications = false"
                >
                  Lihat Katalog Open Trip &rarr;
                </NuxtLink>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Guest: Login & Register -->
        <template v-if="!isAuthenticated">
          <NuxtLink
            to="/register"
            class="hidden sm:inline-flex h-11 items-center gap-1.5 rounded-full glass-pill px-4 text-xs font-bold text-[#162221] hover:bg-white transition shrink-0"
          >
            <UserPlus class="h-4 w-4 text-[#1f6f6d]" />
            <span>Daftar</span>
          </NuxtLink>
          <NuxtLink
            to="/login"
            class="inline-flex h-11 items-center gap-2 rounded-full bg-[#1f6f6d] px-4 sm:px-5 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#1f6f6d]/25 hover:bg-[#175957] transition shrink-0"
          >
            <LogIn class="h-4 w-4" />
            <span>Masuk</span>
          </NuxtLink>
        </template>

        <!-- Authenticated Dynamic Role Menu -->
        <div v-else class="relative">
          <button
            type="button"
            class="inline-flex h-11 items-center gap-2 rounded-full glass-pill pl-1.5 pr-3.5 text-xs font-bold text-[#162221] hover:bg-white transition cursor-pointer shrink-0"
            @click="showAccountMenu = !showAccountMenu; showNotifications = false"
          >
            <img
              :src="user?.avatar"
              :alt="user?.name"
              class="h-8 w-8 rounded-full object-cover border border-[#c7e4e0]"
            >
            <span class="hidden sm:inline max-w-[110px] truncate">{{ firstName }}</span>
          </button>

          <Transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 translate-y-1 scale-95"
            enter-to-class="opacity-100 translate-y-0 scale-100"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100 translate-y-0 scale-100"
            leave-to-class="opacity-0 translate-y-1 scale-95"
          >
            <div
              v-if="showAccountMenu && user"
              class="absolute right-0 mt-2.5 w-64 rounded-[24px] glass-surface p-3 z-50 space-y-1.5"
            >
              <div class="px-3 py-2 border-b border-[#e8e2d5]">
                <span
                  class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-extrabold mb-1"
                  :class="roleBadgeClass"
                >
                  {{ getRoleLabel(user.role) }}
                </span>
                <p class="text-xs font-extrabold text-[#162221] truncate">{{ user.name }}</p>
                <p class="text-[11px] text-[#5c6b69] truncate">{{ user.email }}</p>
              </div>

              <!-- Customer Menu -->
              <template v-if="isCustomer">
                <NuxtLink
                  to="/profile"
                  class="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-[#354442] hover:bg-white hover:text-[#1f6f6d] transition"
                >
                  <User class="h-3.5 w-3.5" />
                  Edit Profil Saya
                </NuxtLink>
                <NuxtLink
                  to="/customer/dashboard"
                  class="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-[#354442] hover:bg-white hover:text-[#1f6f6d] transition"
                >
                  <LayoutDashboard class="h-3.5 w-3.5" />
                  Dashboard Trip Saya
                </NuxtLink>
                <NuxtLink
                  to="/customer/passport"
                  class="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-[#354442] hover:bg-white hover:text-[#1f6f6d] transition"
                >
                  <Award class="h-3.5 w-3.5" />
                  Adventure Passport
                </NuxtLink>
              </template>

              <!-- Guide Menu -->
              <template v-else-if="isGuide">
                <NuxtLink
                  to="/guide/dashboard"
                  class="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-[#354442] hover:bg-white hover:text-[#1f6f6d] transition"
                >
                  <LayoutDashboard class="h-3.5 w-3.5" />
                  Dashboard Pemandu
                </NuxtLink>
                <NuxtLink
                  to="/guide/customers"
                  class="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-[#354442] hover:bg-white hover:text-[#1f6f6d] transition"
                >
                  <Users class="h-3.5 w-3.5" />
                  Daftar Peserta &amp; Check-in
                </NuxtLink>
                <NuxtLink
                  to="/guide/trips"
                  class="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-[#354442] hover:bg-white hover:text-[#1f6f6d] transition"
                >
                  <Briefcase class="h-3.5 w-3.5" />
                  Kelola Paket Trip
                </NuxtLink>
              </template>

              <!-- Admin Menu -->
              <template v-else-if="isAdmin">
                <NuxtLink
                  to="/profile"
                  class="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-[#354442] hover:bg-white hover:text-[#1f6f6d] transition"
                >
                  <User class="h-3.5 w-3.5" />
                  Edit Profil Saya
                </NuxtLink>
                <NuxtLink
                  to="/admin/dashboard"
                  class="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-[#354442] hover:bg-white hover:text-[#1f6f6d] transition"
                >
                  <LayoutDashboard class="h-3.5 w-3.5" />
                  Admin Command Center
                </NuxtLink>
                <NuxtLink
                  to="/admin/bookings"
                  class="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-[#354442] hover:bg-white hover:text-[#1f6f6d] transition"
                >
                  <Database class="h-3.5 w-3.5" />
                  Transaksi &amp; Booking
                </NuxtLink>
                <NuxtLink
                  to="/admin/features"
                  class="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-[#354442] hover:bg-white hover:text-[#1f6f6d] transition"
                >
                  <Wand2 class="h-3.5 w-3.5" />
                  Manajemen Fitur &amp; Komisi
                </NuxtLink>
                <NuxtLink
                  to="/admin/verifications"
                  class="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-[#354442] hover:bg-white hover:text-[#1f6f6d] transition"
                >
                  <ShieldCheck class="h-3.5 w-3.5" />
                  Verifikasi Pemandu
                </NuxtLink>
                <NuxtLink
                  to="/admin/payouts"
                  class="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-[#354442] hover:bg-white hover:text-[#1f6f6d] transition"
                >
                  <Wallet class="h-3.5 w-3.5" />
                  Payout &amp; Refund Cuaca
                </NuxtLink>
              </template>

              <div class="pt-1 border-t border-[#e8e2d5]">
                <button
                  type="button"
                  class="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-orange-700 hover:bg-orange-50 transition cursor-pointer"
                  @click="handleLogout"
                >
                  <LogOut class="h-3.5 w-3.5" />
                  Logout / Ganti Akun
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- Mobile Horizontal Quick-Navigation Rail (Same items as Desktop Left Rail!) -->
    <nav
      aria-label="Menu Cepat Mobile"
      class="lg:hidden mt-4 -mx-1 px-1 flex items-center gap-2 overflow-x-auto pb-1.5 rail-scroll"
    >
      <NuxtLink
        to="/home"
        class="shrink-0 flex min-w-[68px] flex-col items-center justify-center gap-1 rounded-[18px] px-3 py-2 text-[11px] font-semibold transition-all"
        :class="isHome ? 'bg-[#1f6f6d] text-white shadow-md shadow-[#1f6f6d]/25' : 'glass-pill text-[#455351]'"
      >
        <Home class="h-4 w-4" />
        <span>Home</span>
      </NuxtLink>

      <NuxtLink
        to="/trips"
        class="shrink-0 flex min-w-[68px] flex-col items-center justify-center gap-1 rounded-[18px] px-3 py-2 text-[11px] font-semibold transition-all"
        :class="isExploreView ? 'bg-[#1f6f6d] text-white shadow-md shadow-[#1f6f6d]/25' : 'glass-pill text-[#455351]'"
      >
        <Compass class="h-4 w-4" />
        <span>Explore</span>
      </NuxtLink>

      <NuxtLink
        to="/hotels"
        class="shrink-0 flex min-w-[68px] flex-col items-center justify-center gap-1 rounded-[18px] px-3 py-2 text-[11px] font-semibold transition-all"
        :class="isHotelsView ? 'bg-[#1f6f6d] text-white shadow-md shadow-[#1f6f6d]/25' : 'glass-pill text-[#455351]'"
      >
        <BedDouble class="h-4 w-4" />
        <span>Hotels</span>
      </NuxtLink>

      <NuxtLink
        to="/matchmaker"
        class="shrink-0 flex min-w-[68px] flex-col items-center justify-center gap-1 rounded-[18px] px-3 py-2 text-[11px] font-semibold transition-all"
        :class="isMatchmakerView ? 'bg-[#1f6f6d] text-white shadow-md shadow-[#1f6f6d]/25' : 'glass-pill text-[#455351]'"
      >
        <Wand2 class="h-4 w-4" />
        <span>Quiz AI</span>
      </NuxtLink>

      <NuxtLink
        v-if="isAuthenticated"
        :to="getRoleHomePath(user?.role)"
        class="shrink-0 flex min-w-[68px] flex-col items-center justify-center gap-1 rounded-[18px] px-3 py-2 text-[11px] font-semibold transition-all"
        :class="isCustomerView || isAdminView ? 'bg-[#1f6f6d] text-white shadow-md shadow-[#1f6f6d]/25' : 'glass-pill text-[#1f6f6d]'"
      >
        <LayoutDashboard class="h-4 w-4" />
        <span>{{ isAdmin ? 'Admin' : 'My Trip' }}</span>
      </NuxtLink>

      <NuxtLink
        v-if="!isAuthenticated || isCustomer"
        to="/customer/passport"
        class="shrink-0 flex min-w-[68px] flex-col items-center justify-center gap-1 rounded-[18px] px-3 py-2 text-[11px] font-semibold transition-all"
        :class="isPassportView ? 'bg-[#1f6f6d] text-white shadow-md shadow-[#1f6f6d]/25' : 'glass-pill text-[#455351]'"
      >
        <Award class="h-4 w-4" />
        <span>Passport</span>
      </NuxtLink>

      <NuxtLink
        to="/community"
        class="shrink-0 flex min-w-[68px] flex-col items-center justify-center gap-1 rounded-[18px] px-3 py-2 text-[11px] font-semibold transition-all"
        :class="isCommunityView ? 'bg-[#1f6f6d] text-white shadow-md shadow-[#1f6f6d]/25' : 'glass-pill text-[#455351]'"
      >
        <Users class="h-4 w-4" />
        <span>Buddy</span>
      </NuxtLink>

      <NuxtLink
        to="/trips?saved=true"
        class="shrink-0 relative flex min-w-[68px] flex-col items-center justify-center gap-1 rounded-[18px] px-3 py-2 text-[11px] font-semibold transition-all"
        :class="isSavedView ? 'bg-[#1f6f6d] text-white shadow-md shadow-[#1f6f6d]/25' : 'glass-pill text-[#455351]'"
      >
        <Heart class="h-4 w-4" />
        <span>Saved</span>
        <span
          v-if="savedIds.length"
          class="absolute top-1 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold"
          :class="isSavedView ? 'bg-amber-400 text-[#103f3e]' : 'bg-[#1f6f6d] text-white'"
        >
          {{ savedIds.length }}
        </span>
      </NuxtLink>

      <NuxtLink
        :to="isAuthenticated ? '/profile' : '/login'"
        class="shrink-0 flex min-w-[68px] flex-col items-center justify-center gap-1 rounded-[18px] px-3 py-2 text-[11px] font-semibold transition-all"
        :class="route.path === '/profile' ? 'bg-[#1f6f6d] text-white shadow-md shadow-[#1f6f6d]/25' : 'glass-pill text-[#455351]'"
      >
        <User class="h-4 w-4" />
        <span>{{ isAuthenticated ? 'Profil' : 'Login' }}</span>
      </NuxtLink>

      <button
        type="button"
        class="shrink-0 flex min-w-[68px] flex-col items-center justify-center gap-1 rounded-[18px] bg-[#1f6f6d] px-3 py-2 text-[11px] font-semibold text-white shadow-md shadow-[#1f6f6d]/25 cursor-pointer"
        @click="showSupportModal = true"
      >
        <Headphones class="h-4 w-4" />
        <span>Support</span>
      </button>
    </nav>
  </header>

  <!-- Mobile Slide-Out Navigation Drawer -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showMobileMenu"
        class="fixed inset-0 z-50 lg:hidden flex"
      >
        <div class="fixed inset-0 bg-[#0d2423]/55 backdrop-blur-xs" @click="showMobileMenu = false" />
        <aside class="relative z-10 w-72 max-w-[84vw] h-full bg-[#103f3e] text-white flex flex-col shadow-2xl">
          <div class="p-5 flex items-center justify-between border-b border-white/10">
            <NuxtLink to="/home" class="flex items-center gap-2.5" @click="showMobileMenu = false">
              <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-amber-300">
                <Compass class="h-5 w-5" />
              </span>
              <span class="font-editorial text-xl font-bold text-white">JejakNusa</span>
            </NuxtLink>
            <button
              type="button"
              class="rounded-full p-1.5 text-teal-100 hover:bg-white/10 cursor-pointer"
              aria-label="Tutup Menu"
              @click="showMobileMenu = false"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <nav class="flex-1 overflow-y-auto p-4 space-y-1.5 rail-scroll">
            <NuxtLink
              to="/home"
              class="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-xs font-extrabold transition"
              :class="isHome ? 'bg-white text-[#103f3e]' : 'text-teal-100 hover:bg-white/10'"
            >
              <Home class="h-4.5 w-4.5" />
              <span>Home</span>
            </NuxtLink>
            <NuxtLink
              to="/trips"
              class="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-xs font-extrabold transition"
              :class="isExploreView ? 'bg-white text-[#103f3e]' : 'text-teal-100 hover:bg-white/10'"
            >
              <Compass class="h-4.5 w-4.5" />
              <span>Explore Open Trip</span>
            </NuxtLink>
            <NuxtLink
              to="/hotels"
              class="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-xs font-extrabold transition"
              :class="isHotelsView ? 'bg-white text-[#103f3e]' : 'text-teal-100 hover:bg-white/10'"
            >
              <BedDouble class="h-4.5 w-4.5" />
              <span>Hotels &amp; Penginapan</span>
            </NuxtLink>
            <NuxtLink
              to="/matchmaker"
              class="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-xs font-extrabold transition"
              :class="isMatchmakerView ? 'bg-white text-[#103f3e]' : 'text-teal-100 hover:bg-white/10'"
            >
              <Wand2 class="h-4.5 w-4.5" />
              <span>Quiz AI Matchmaker</span>
            </NuxtLink>
            <NuxtLink
              v-if="isAuthenticated"
              :to="getRoleHomePath(user?.role)"
              class="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-xs font-extrabold transition"
              :class="isCustomerView || isAdminView ? 'bg-white text-[#103f3e]' : 'text-teal-100 hover:bg-white/10'"
            >
              <LayoutDashboard class="h-4.5 w-4.5" />
              <span>{{ isAdmin ? 'Admin Command Center' : 'My Trip (Dashboard)' }}</span>
            </NuxtLink>
            <NuxtLink
              v-if="!isAuthenticated || isCustomer"
              to="/customer/passport"
              class="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-xs font-extrabold transition"
              :class="isPassportView ? 'bg-white text-[#103f3e]' : 'text-teal-100 hover:bg-white/10'"
            >
              <Award class="h-4.5 w-4.5" />
              <span>Adventure Passport</span>
            </NuxtLink>
            <NuxtLink
              to="/community"
              class="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-xs font-extrabold transition"
              :class="isCommunityView ? 'bg-white text-[#103f3e]' : 'text-teal-100 hover:bg-white/10'"
            >
              <Users class="h-4.5 w-4.5" />
              <span>Buddy &amp; Komunitas</span>
            </NuxtLink>
            <NuxtLink
              to="/trips?saved=true"
              class="flex items-center justify-between gap-3 rounded-2xl px-3.5 py-3 text-xs font-extrabold transition"
              :class="isSavedView ? 'bg-white text-[#103f3e]' : 'text-teal-100 hover:bg-white/10'"
            >
              <span class="flex items-center gap-3">
                <Heart class="h-4.5 w-4.5" />
                <span>Saved Trip</span>
              </span>
              <span v-if="savedIds.length" class="rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-extrabold text-[#103f3e]">
                {{ savedIds.length }}
              </span>
            </NuxtLink>
            <NuxtLink
              :to="isAuthenticated ? '/profile' : '/login'"
              class="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-xs font-extrabold transition"
              :class="route.path === '/profile' || isLoginView ? 'bg-white text-[#103f3e]' : 'text-teal-100 hover:bg-white/10'"
            >
              <User class="h-4.5 w-4.5" />
              <span>{{ isAuthenticated ? 'Edit Profil Saya' : 'Login' }}</span>
            </NuxtLink>
          </nav>

          <div class="p-4 border-t border-white/10 space-y-2">
            <button
              type="button"
              class="w-full flex items-center justify-center gap-2 rounded-2xl bg-white/15 hover:bg-white/25 px-4 py-2.5 text-xs font-extrabold text-white transition cursor-pointer"
              @click="showMobileMenu = false; showSupportModal = true"
            >
              <Headphones class="h-4 w-4" />
              Support &amp; Keamanan
            </button>
            <button
              v-if="isAuthenticated"
              type="button"
              class="w-full flex items-center justify-center gap-2 rounded-2xl bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-xs font-extrabold text-white transition cursor-pointer"
              @click="handleLogout"
            >
              <LogOut class="h-4 w-4" />
              Logout / Ganti Akun
            </button>
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>

  <!-- Desktop Left Floating Pill Rail (Role-Aware Dynamic Items) -->
  <aside
    class="hidden lg:flex fixed left-4 xl:left-6 top-4 bottom-4 z-40 w-[86px] flex-col items-center gap-2.5"
    aria-label="Navigasi Samping"
  >
    <!-- Wave Brand Emblem -->
    <NuxtLink
      to="/home"
      class="shrink-0 flex h-12 w-12 items-center justify-center rounded-2xl hover:scale-105 transition"
      title="JejakNusa — Beranda"
    >
      <svg viewBox="0 0 44 28" fill="none" class="h-9 w-11">
        <path
          d="M3 17C9 9.5 16 7 23 12.5C29.5 17.5 35.5 15.5 41 7.5"
          stroke="#1f6f6d"
          stroke-width="3.2"
          stroke-linecap="round"
        />
        <path
          d="M7 22.5C14 17 21 16.5 28 19.5C33 21.5 37.5 20.5 41 17"
          stroke="#2a948f"
          stroke-width="2.4"
          stroke-linecap="round"
        />
      </svg>
    </NuxtLink>

    <!-- Scrollable Menu -->
    <div class="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden overscroll-contain rail-scroll flex flex-col items-center gap-2.5 py-1 px-1">
      <NuxtLink
        to="/home"
        class="shrink-0 flex w-[72px] flex-col items-center justify-center gap-1 rounded-[20px] py-2.5 text-[11px] font-semibold transition-all"
        :class="isHome ? 'bg-[#1f6f6d] text-white shadow-lg shadow-[#1f6f6d]/30' : 'glass-pill text-[#455351] hover:text-[#1f6f6d] hover:bg-white'"
      >
        <Home class="h-4.5 w-4.5" />
        <span>Home</span>
      </NuxtLink>

      <NuxtLink
        to="/trips"
        class="shrink-0 flex w-[72px] flex-col items-center justify-center gap-1 rounded-[20px] py-2.5 text-[11px] font-semibold transition-all"
        :class="isExploreView ? 'bg-[#1f6f6d] text-white shadow-lg shadow-[#1f6f6d]/30' : 'glass-pill text-[#455351] hover:text-[#1f6f6d] hover:bg-white'"
      >
        <Compass class="h-4.5 w-4.5" />
        <span>Explore</span>
      </NuxtLink>

      <NuxtLink
        to="/hotels"
        class="shrink-0 flex w-[72px] flex-col items-center justify-center gap-1 rounded-[20px] py-2.5 text-[11px] font-semibold transition-all"
        :class="isHotelsView ? 'bg-[#1f6f6d] text-white shadow-lg shadow-[#1f6f6d]/30' : 'glass-pill text-[#455351] hover:text-[#1f6f6d] hover:bg-white'"
      >
        <BedDouble class="h-4.5 w-4.5" />
        <span>Hotels</span>
      </NuxtLink>

      <NuxtLink
        to="/matchmaker"
        class="shrink-0 flex w-[72px] flex-col items-center justify-center gap-1 rounded-[20px] py-2.5 text-[11px] font-semibold transition-all"
        :class="isMatchmakerView ? 'bg-[#1f6f6d] text-white shadow-lg shadow-[#1f6f6d]/30' : 'glass-pill text-[#455351] hover:text-[#1f6f6d] hover:bg-white'"
      >
        <Wand2 class="h-4.5 w-4.5" />
        <span>Quiz AI</span>
      </NuxtLink>

      <!-- Dynamic Role Portal Button -->
      <NuxtLink
        v-if="isAuthenticated"
        :to="getRoleHomePath(user?.role)"
        class="shrink-0 flex w-[72px] flex-col items-center justify-center gap-1 rounded-[20px] py-2.5 text-[11px] font-semibold transition-all"
        :class="
          isCustomerView || isGuideView || isAdminView
            ? 'bg-[#1f6f6d] text-white shadow-lg shadow-[#1f6f6d]/30'
            : 'glass-pill text-[#1f6f6d] hover:bg-white'
        "
      >
        <LayoutDashboard class="h-4.5 w-4.5" />
        <span>{{ isAdmin ? 'Admin' : isGuide ? 'Guide' : 'My Trip' }}</span>
      </NuxtLink>

      <!-- Customer Shortcuts when Customer or Guest -->
      <template v-if="!isAuthenticated || isCustomer">
        <NuxtLink
          to="/customer/passport"
          class="shrink-0 flex w-[72px] flex-col items-center justify-center gap-1 rounded-[20px] py-2.5 text-[11px] font-semibold transition-all"
          :class="isPassportView ? 'bg-[#1f6f6d] text-white shadow-lg shadow-[#1f6f6d]/30' : 'glass-pill text-[#455351] hover:text-[#1f6f6d] hover:bg-white'"
        >
          <Award class="h-4.5 w-4.5" />
          <span>Passport</span>
        </NuxtLink>
      </template>

      <!-- Guide Shortcuts -->
      <template v-if="isGuide">
        <NuxtLink
          to="/guide/trips"
          class="shrink-0 flex w-[72px] flex-col items-center justify-center gap-1 rounded-[20px] py-2.5 text-[11px] font-semibold transition-all glass-pill text-[#455351] hover:text-[#1f6f6d] hover:bg-white"
        >
          <Briefcase class="h-4.5 w-4.5" />
          <span>Trips</span>
        </NuxtLink>
      </template>

      <!-- Admin Shortcuts -->
      <template v-if="isAdmin">
        <NuxtLink
          to="/admin/verifications"
          class="shrink-0 flex w-[72px] flex-col items-center justify-center gap-1 rounded-[20px] py-2.5 text-[11px] font-semibold transition-all glass-pill text-[#455351] hover:text-[#1f6f6d] hover:bg-white"
        >
          <ShieldCheck class="h-4.5 w-4.5" />
          <span>Verify</span>
        </NuxtLink>
        <NuxtLink
          to="/admin/payouts"
          class="shrink-0 flex w-[72px] flex-col items-center justify-center gap-1 rounded-[20px] py-2.5 text-[11px] font-semibold transition-all glass-pill text-[#455351] hover:text-[#1f6f6d] hover:bg-white"
        >
          <Wallet class="h-4.5 w-4.5" />
          <span>Payout</span>
        </NuxtLink>
      </template>

      <NuxtLink
        to="/community"
        class="shrink-0 flex w-[72px] flex-col items-center justify-center gap-1 rounded-[20px] py-2.5 text-[11px] font-semibold transition-all"
        :class="isCommunityView ? 'bg-[#1f6f6d] text-white shadow-lg shadow-[#1f6f6d]/30' : 'glass-pill text-[#455351] hover:text-[#1f6f6d] hover:bg-white'"
      >
        <Users class="h-4.5 w-4.5" />
        <span>Buddy</span>
      </NuxtLink>

      <NuxtLink
        to="/trips?saved=true"
        class="shrink-0 relative flex w-[72px] flex-col items-center justify-center gap-1 rounded-[20px] py-2.5 text-[11px] font-semibold transition-all"
        :class="isSavedView ? 'bg-[#1f6f6d] text-white shadow-lg shadow-[#1f6f6d]/30' : 'glass-pill text-[#455351] hover:text-[#1f6f6d] hover:bg-white'"
      >
        <Heart class="h-4.5 w-4.5" />
        <span>Saved</span>
        <span
          v-if="savedIds.length"
          class="absolute top-1.5 right-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
          :class="isSavedView ? 'bg-amber-400 text-[#103f3e]' : 'bg-[#1f6f6d] text-white'"
        >
          {{ savedIds.length }}
        </span>
      </NuxtLink>

      <NuxtLink
        :to="isAuthenticated ? '/profile' : '/login'"
        class="shrink-0 flex w-[72px] flex-col items-center justify-center gap-1 rounded-[20px] py-2.5 text-[11px] font-semibold transition-all"
        :class="route.path === '/profile' || isLoginView ? 'bg-[#1f6f6d] text-white shadow-lg shadow-[#1f6f6d]/30' : 'glass-pill text-[#455351] hover:text-[#1f6f6d] hover:bg-white'"
      >
        <User class="h-4.5 w-4.5" />
        <span>{{ isAuthenticated ? 'Profil' : 'Login' }}</span>
      </NuxtLink>
    </div>

    <!-- Bottom Support Button -->
    <button
      type="button"
      class="shrink-0 flex w-[72px] flex-col items-center justify-center gap-1 rounded-[20px] bg-[#1f6f6d] py-2.5 text-[11px] font-semibold text-white shadow-lg shadow-[#1f6f6d]/30 hover:bg-[#175957] transition cursor-pointer"
      @click="showSupportModal = true"
    >
      <Headphones class="h-4.5 w-4.5" />
      <span>Support</span>
    </button>
  </aside>

  <!-- Floating Bottom Navigation Dock -->
  <nav
    aria-label="Navigasi Bawah"
    class="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-[490px]"
  >
    <div class="relative flex items-center justify-between rounded-[28px] glass-pill px-5 sm:px-7 py-2.5">
      <NuxtLink
        to="/trips"
        class="flex flex-col items-center gap-1 text-[11px] font-semibold transition"
        :class="isExploreView ? 'text-[#1f6f6d]' : 'text-[#5b6967] hover:text-[#1f6f6d]'"
      >
        <span class="flex h-8 w-8 items-center justify-center rounded-full transition" :class="isExploreView ? 'bg-[#1f6f6d] text-white' : ''">
          <Compass class="h-4.5 w-4.5" />
        </span>
        <span>Explore</span>
      </NuxtLink>

      <NuxtLink
        to="/matchmaker"
        class="flex flex-col items-center gap-1 text-[11px] font-semibold transition"
        :class="isMatchmakerView ? 'text-[#1f6f6d]' : 'text-[#5b6967] hover:text-[#1f6f6d]'"
      >
        <span class="flex h-8 w-8 items-center justify-center rounded-full transition" :class="isMatchmakerView ? 'bg-[#1f6f6d] text-white' : ''">
          <Wand2 class="h-4.5 w-4.5" />
        </span>
        <span>Quiz AI</span>
      </NuxtLink>

      <!-- Elevated Center Action Button -->
      <NuxtLink
        to="/home"
        aria-label="Beranda JejakNusa"
        class="-mt-8 flex h-15 w-15 items-center justify-center rounded-full bg-[#1f6f6d] text-white shadow-xl shadow-[#1f6f6d]/35 ring-4 ring-[#f4f1ea] hover:bg-[#175957] hover:scale-105 transition"
      >
        <Send class="h-6 w-6 -translate-x-0.5 translate-y-0.5" />
      </NuxtLink>

      <NuxtLink
        :to="isAuthenticated ? roleHomePath : '/login'"
        class="flex flex-col items-center gap-1 text-[11px] font-semibold transition"
        :class="isCustomerView || isGuideView || isAdminView ? 'text-[#1f6f6d]' : 'text-[#5b6967] hover:text-[#1f6f6d]'"
      >
        <span class="flex h-8 w-8 items-center justify-center rounded-full transition" :class="isCustomerView || isGuideView || isAdminView ? 'bg-[#1f6f6d] text-white' : ''">
          <LayoutDashboard class="h-4.5 w-4.5" />
        </span>
        <span>{{ isAuthenticated ? 'Portal' : 'Masuk' }}</span>
      </NuxtLink>

      <NuxtLink
        to="/hotels"
        class="flex flex-col items-center gap-1 text-[11px] font-semibold transition"
        :class="isHotelsView ? 'text-[#1f6f6d]' : 'text-[#5b6967] hover:text-[#1f6f6d]'"
      >
        <span class="flex h-8 w-8 items-center justify-center rounded-full transition" :class="isHotelsView ? 'bg-[#1f6f6d] text-white' : ''">
          <BedDouble class="h-4.5 w-4.5" />
        </span>
        <span>Hotels</span>
      </NuxtLink>
    </div>
  </nav>

  <!-- Verified Guide & Safety Support Modal -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showSupportModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-[#102625]/45 backdrop-blur-xs p-4"
        @click.self="showSupportModal = false"
      >
        <div class="w-full max-w-md rounded-[28px] bg-[#fbf9f5] border border-white p-6 sm:p-7 shadow-2xl space-y-5">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1f6f6d] text-white">
                <ShieldCheck class="h-5 w-5" />
              </span>
              <div>
                <h2 class="font-editorial text-xl font-bold text-[#162221]">Standar Keamanan JejakNusa</h2>
                <p class="text-xs text-[#5c6765]">Pemandu Terverifikasi &amp; Live SOS Monitor</p>
              </div>
            </div>
            <button
              type="button"
              class="rounded-full p-1.5 text-stone-400 hover:bg-stone-200/70 hover:text-stone-700 cursor-pointer"
              @click="showSupportModal = false"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <ul class="space-y-3 text-sm text-[#3c4a48]">
            <li class="rounded-2xl bg-white p-3.5 border border-[#e8e2d5]">
              <strong class="block text-[#162221]">1. Pemandu Lokal Bersertifikat</strong>
              <span class="text-xs text-[#5c6765]">Lisensi resmi APGI, POSSI, ICOpro, FAJI, atau HPI diverifikasi langsung oleh Admin.</span>
            </li>
            <li class="rounded-2xl bg-white p-3.5 border border-[#e8e2d5]">
              <strong class="block text-[#162221]">2. Emergency SOS &amp; Garansi Cuaca Ekstrem</strong>
              <span class="text-xs text-[#5c6765]">Peserta dapat mengirim koordinat GPS darurat ke Command Center serta klaim refund otomatis saat cuaca buruk.</span>
            </li>
            <li class="rounded-2xl bg-white p-3.5 border border-[#e8e2d5]">
              <strong class="block text-[#162221]">3. Escrow &amp; Split Payment Link</strong>
              <span class="text-xs text-[#5c6765]">Dana aman di rekening bersama dan dicairkan ke pemandu hanya setelah trip selesai.</span>
            </li>
          </ul>

          <div class="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              class="rounded-full px-4 py-2 text-xs font-bold text-[#5c6765] hover:bg-stone-200/60 cursor-pointer"
              @click="showSupportModal = false"
            >
              Tutup
            </button>
            <NuxtLink
              to="/login"
              class="rounded-full bg-[#1f6f6d] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#175957] transition"
              @click="showSupportModal = false"
            >
              Coba Demo Multi-Role
            </NuxtLink>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

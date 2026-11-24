<script setup lang="ts">
import {
  Award,
  BadgeCheck,
  Briefcase,
  ClipboardList,
  Compass,
  Database,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  UserCheck,
  Wallet,
  X
} from 'lucide-vue-next'
import { getRoleLabel } from '#shared/types/auth'

const route = useRoute()
const router = useRouter()
const { user, logout } = useAuth()

const mobileSidebarOpen = ref(false)

watch(
  () => route.fullPath,
  () => {
    mobileSidebarOpen.value = false
  }
)

interface NavItem {
  label: string
  to: string
  description: string
  icon: 'dashboard' | 'passport' | 'customers' | 'trips' | 'create' | 'bookings' | 'features' | 'verify' | 'payouts' | 'crud'
}

const navItems = computed<NavItem[]>(() => {
  const role = user.value?.role
  if (role === 'admin') {
    return [
      {
        label: 'Command Center',
        to: '/admin/dashboard',
        description: 'Destinasi live, GMV & SOS',
        icon: 'dashboard'
      },
      {
        label: 'Transaksi & Booking',
        to: '/admin/bookings',
        description: 'Verifikasi QRIS & Invoice',
        icon: 'bookings'
      },
      {
        label: 'Manajemen Fitur',
        to: '/admin/features',
        description: 'Toggle fitur & % komisi',
        icon: 'features'
      },
      {
        label: 'Verifikasi Pemandu',
        to: '/admin/verifications',
        description: 'Approve / reject lisensi',
        icon: 'verify'
      },
      {
        label: 'Keuangan & Refund',
        to: '/admin/payouts',
        description: 'Payout & garansi cuaca',
        icon: 'payouts'
      },
      {
        label: 'Database CRUD',
        to: '/admin/crud',
        description: 'Kelola seluruh tabel data',
        icon: 'crud'
      }
    ]
  }
  if (role === 'guide') {
    return [
      {
        label: 'Dashboard Pemandu',
        to: '/guide/dashboard',
        description: 'Pendapatan & peserta baru',
        icon: 'dashboard'
      },
      {
        label: 'Daftar Peserta',
        to: '/guide/customers',
        description: 'Kontak, Check-in & Lobby',
        icon: 'customers'
      },
      {
        label: 'Kelola Paket Trip',
        to: '/guide/trips',
        description: 'Kuota & status jalur/cuaca',
        icon: 'trips'
      },
      {
        label: 'Buat Trip Baru',
        to: '/guide/trips/create',
        description: 'Itinerary & Gear Checklist',
        icon: 'create'
      }
    ]
  }
  return [
    {
      label: 'Dashboard Trip Saya',
      to: '/customer/dashboard',
      description: 'Booking, Gear, Chat & SOS',
      icon: 'dashboard'
    },
    {
      label: 'Adventure Passport',
      to: '/customer/passport',
      description: 'Badges, poin & peta jejak',
      icon: 'passport'
    }
  ]
})

const roleBadgeStyle = computed(() => {
  if (user.value?.role === 'admin') {
    return 'bg-amber-100 text-amber-900 border-amber-300'
  }
  if (user.value?.role === 'guide') {
    return 'bg-emerald-100 text-emerald-900 border-emerald-300'
  }
  return 'bg-[#eef7f6] text-[#175957] border-[#c7e4e0]'
})

function isActiveLink(to: string): boolean {
  if (to === '/guide/trips') {
    return route.path === '/guide/trips'
  }
  return route.path === to || route.path.startsWith(`${to}/`)
}

async function handleLogout() {
  await logout()
  await router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-[#f4f1ea] print:bg-white text-[#1c2423] flex">
    <!-- Desktop Fixed Sidebar -->
    <aside class="hidden lg:flex print:hidden fixed inset-y-0 left-0 z-40 w-72 flex-col bg-[#103f3e] text-white border-r border-white/10">
      <!-- Brand Header -->
      <div class="p-6 border-b border-white/10">
        <NuxtLink to="/home" class="flex items-center gap-3 group">
          <span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-amber-300 group-hover:scale-105 transition">
            <Compass class="h-5 w-5" />
          </span>
          <div>
            <span class="block font-editorial text-xl font-bold tracking-tight text-white">JejakNusa</span>
            <span class="block text-[11px] text-teal-200/80">Portal {{ getRoleLabel(user?.role) }}</span>
          </div>
        </NuxtLink>
      </div>

      <!-- Active User Card -->
      <div v-if="user" class="px-5 pt-5">
        <div class="rounded-2xl bg-white/10 border border-white/15 p-3.5 flex items-center gap-3">
          <img
            :src="user.avatar"
            :alt="user.name"
            class="h-11 w-11 rounded-xl object-cover border border-white/25 shrink-0"
          >
          <div class="min-w-0">
            <p class="text-sm font-extrabold text-white truncate">{{ user.name }}</p>
            <span class="mt-0.5 inline-flex items-center gap-1 rounded-full bg-amber-300/20 px-2 py-0.5 text-[10px] font-bold text-amber-200">
              <BadgeCheck class="h-3 w-3" />
              {{ getRoleLabel(user.role) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Navigation Links -->
      <nav class="flex-1 overflow-y-auto px-4 py-5 space-y-1.5 rail-scroll">
        <p class="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-teal-200/70">
          Menu {{ getRoleLabel(user?.role) }}
        </p>
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 rounded-2xl px-3.5 py-3 transition"
          :class="
            isActiveLink(item.to)
              ? 'bg-white text-[#103f3e] shadow-md'
              : 'text-teal-100/90 hover:bg-white/10 hover:text-white'
          "
        >
          <LayoutDashboard v-if="item.icon === 'dashboard'" class="h-4.5 w-4.5 shrink-0" />
          <Award v-else-if="item.icon === 'passport'" class="h-4.5 w-4.5 shrink-0" />
          <UserCheck v-else-if="item.icon === 'customers'" class="h-4.5 w-4.5 shrink-0" />
          <ClipboardList v-else-if="item.icon === 'bookings'" class="h-4.5 w-4.5 shrink-0" />
          <Sliders v-else-if="item.icon === 'features'" class="h-4.5 w-4.5 shrink-0" />
          <Briefcase v-else-if="item.icon === 'trips'" class="h-4.5 w-4.5 shrink-0" />
          <PlusCircle v-else-if="item.icon === 'create'" class="h-4.5 w-4.5 shrink-0" />
          <ShieldCheck v-else-if="item.icon === 'verify'" class="h-4.5 w-4.5 shrink-0" />
          <Wallet v-else-if="item.icon === 'payouts'" class="h-4.5 w-4.5 shrink-0" />
          <Database v-else class="h-4.5 w-4.5 shrink-0" />
          <div class="min-w-0">
            <span class="block text-xs font-extrabold leading-tight truncate">{{ item.label }}</span>
            <span
              class="block text-[10px] truncate mt-0.5"
              :class="isActiveLink(item.to) ? 'text-[#4c615f]' : 'text-teal-200/75'"
            >
              {{ item.description }}
            </span>
          </div>
        </NuxtLink>

        <div class="pt-4 mt-4 border-t border-white/10 space-y-1">
          <p class="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-teal-200/70">
            Jelajah Publik
          </p>
          <NuxtLink
            to="/home"
            class="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-teal-100/90 hover:bg-white/10 hover:text-white transition"
          >
            <Home class="h-4 w-4" />
            Beranda Publik
          </NuxtLink>
          <NuxtLink
            to="/trips"
            class="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-teal-100/90 hover:bg-white/10 hover:text-white transition"
          >
            <Compass class="h-4 w-4" />
            Katalog Open Trip
          </NuxtLink>
        </div>
      </nav>

      <!-- Bottom Logout Action -->
      <div class="p-4 border-t border-white/10 space-y-2">
        <button
          type="button"
          class="w-full flex items-center justify-center gap-2 rounded-2xl bg-orange-500/90 hover:bg-orange-500 px-4 py-2.5 text-xs font-extrabold text-white transition cursor-pointer"
          @click="handleLogout"
        >
          <LogOut class="h-4 w-4" />
          Keluar / Ganti Role
        </button>
      </div>
    </aside>

    <!-- Mobile Sidebar Drawer -->
    <Teleport to="body">
      <div
        v-if="mobileSidebarOpen"
        class="fixed inset-0 z-50 lg:hidden flex"
      >
        <div class="fixed inset-0 bg-[#0d2423]/60 backdrop-blur-xs" @click="mobileSidebarOpen = false" />
        <aside class="relative z-10 w-72 max-w-[85vw] flex flex-col bg-[#103f3e] text-white h-full shadow-2xl">
          <div class="p-5 flex items-center justify-between border-b border-white/10">
            <span class="font-editorial text-lg font-bold">JejakNusa</span>
            <button
              type="button"
              class="rounded-full p-1.5 text-teal-100 hover:bg-white/10 cursor-pointer"
              @click="mobileSidebarOpen = false"
            >
              <X class="h-5 w-5" />
            </button>
          </div>
          <nav class="flex-1 overflow-y-auto p-4 space-y-1.5">
            <NuxtLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-xs font-extrabold transition"
              :class="isActiveLink(item.to) ? 'bg-white text-[#103f3e]' : 'text-teal-100 hover:bg-white/10'"
            >
              <span>{{ item.label }}</span>
            </NuxtLink>
            <div class="pt-3 mt-3 border-t border-white/10 space-y-1">
              <NuxtLink to="/home" class="block rounded-xl px-3.5 py-2 text-xs font-bold text-teal-100 hover:bg-white/10">
                Beranda Publik
              </NuxtLink>
              <NuxtLink to="/trips" class="block rounded-xl px-3.5 py-2 text-xs font-bold text-teal-100 hover:bg-white/10">
                Katalog Open Trip
              </NuxtLink>
            </div>
          </nav>
          <div class="p-4 border-t border-white/10">
            <button
              type="button"
              class="w-full flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 py-2.5 text-xs font-extrabold text-white cursor-pointer"
              @click="handleLogout"
            >
              <LogOut class="h-4 w-4" />
              Keluar
            </button>
          </div>
        </aside>
      </div>
    </Teleport>

    <!-- Main Dashboard Content Area -->
    <div class="flex-1 lg:pl-72 print:pl-0 min-w-0 flex flex-col">
      <!-- Top Bar -->
      <header class="sticky top-0 z-30 print:hidden bg-[#f4f1ea]/90 backdrop-blur-md border-b border-[#e5dfd2] px-4 sm:px-6 lg:px-8 py-3.5">
        <div class="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <button
              type="button"
              class="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-[#e3dccd] text-[#162221] cursor-pointer"
              aria-label="Buka Menu"
              @click="mobileSidebarOpen = true"
            >
              <Menu class="h-5 w-5" />
            </button>

            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span
                  class="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold"
                  :class="roleBadgeStyle"
                >
                  <ShieldAlert v-if="user?.role === 'admin'" class="h-3 w-3" />
                  <ShieldCheck v-else class="h-3 w-3" />
                  Role Aktif: {{ getRoleLabel(user?.role) }}
                </span>
                <span class="hidden sm:inline text-xs font-medium text-[#5c6b69] truncate">
                  {{ user?.email }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <NuxtLink
              to="/trips"
              class="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white border border-[#e3dccd] px-3.5 py-2 text-xs font-bold text-[#162221] hover:border-[#1f6f6d] hover:text-[#1f6f6d] transition"
            >
              <Compass class="h-3.5 w-3.5" />
              Katalog Trip
            </NuxtLink>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-full bg-orange-50 border border-orange-200 px-3.5 py-2 text-xs font-bold text-orange-800 hover:bg-orange-600 hover:text-white transition cursor-pointer"
              @click="handleLogout"
            >
              <LogOut class="h-3.5 w-3.5" />
              <span class="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <!-- Page Slot -->
      <main class="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div class="max-w-7xl mx-auto">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

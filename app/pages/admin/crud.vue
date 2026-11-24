<script setup lang="ts">
import {
  Award,
  Backpack,
  BedDouble,
  ClipboardList,
  Compass,
  Database,
  Gavel,
  History,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserCog,
  Users,
  X
} from 'lucide-vue-next'
import type { AdminOverviewResponse, AdminResourceName } from '#shared/types/admin'
import { ADRENALINE_LEVELS, TRIP_CATEGORIES } from '#shared/types/trip'
import { HOTEL_TYPES } from '#shared/types/hotel'
import { formatDateID, formatRupiah } from '~/utils/format'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  allowedRoles: ['admin']
})

useSeoMeta({
  title: 'Admin Management Console — CRUD Seluruh Fitur | JejakNusa',
  description:
    'Pusat manajemen CRUD terpadu untuk Open Trips, Hotel, Booking, Users, Gear Add-Ons, Komunitas, Custom Trip, Passport Rewards, dan Audit Log Database.'
})

const { user: adminUser, logout } = useAuth()
const router = useRouter()

async function handleAdminLogout() {
  await logout()
  await router.push('/login?role=admin')
}

type AdminTab = AdminResourceName | 'audit'

const activeTab = ref<AdminTab>('trips')
const searchTerm = ref('')
const feedbackMsg = ref('')
const errorMsg = ref('')
const busy = ref(false)

const { data: overview, pending, refresh } = await useFetch<AdminOverviewResponse>('/api/admin/overview')

// Create / Edit Modal State
interface AdminFormState {
  id?: string
  title?: string
  name?: string
  email?: string
  password?: string
  role?: 'explorer' | 'guide' | 'admin'
  origin?: string
  points?: number
  verified?: boolean
  location?: string
  province?: string
  category?: string
  adrenalineLevel?: string
  pricePerPerson?: number
  duration?: string
  nextDepartureDate?: string
  totalQuota?: number
  remainingQuota?: number
  featured?: boolean
  shortDescription?: string
  type?: string
  stars?: number
  pricePerNight?: number
  distanceToBasecamp?: string
  leaderName?: string
  leaderOrigin?: string
  tripTitle?: string
  tripSlug?: string
  departureDate?: string
  participantsCount?: number
  paymentScheme?: 'DP 30%' | 'Lunas 100%'
  paymentStatus?: string
  bookingStatus?: string
  totalAmount?: number
  emergencyContact?: string
  price?: number
  unit?: string
  description?: string
  authorName?: string
  authorOrigin?: string
  travelStyle?: string
  slotsLookingFor?: number
  note?: string
  destination?: string
  preferredDate?: string
  groupSize?: number
  budgetPerPerson?: number
  requesterName?: string
  notes?: string
  status?: string
  pointsCost?: number
  badgeText?: string
}

const modalOpen = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const editingId = ref<string>('')
const formState = ref<AdminFormState>({})

const tabs: { key: AdminTab; label: string; icon: typeof Compass; countKey: keyof AdminOverviewResponse['counts'] }[] = [
  { key: 'trips', label: 'Open Trips', icon: Compass, countKey: 'trips' },
  { key: 'hotels', label: 'Hotels', icon: BedDouble, countKey: 'hotels' },
  { key: 'bookings', label: 'Bookings', icon: ClipboardList, countKey: 'bookings' },
  { key: 'users', label: 'Users & Guides', icon: UserCog, countKey: 'users' },
  { key: 'addons', label: 'Gear Add-Ons', icon: Backpack, countKey: 'addons' },
  { key: 'community', label: 'Komunitas', icon: Users, countKey: 'community' },
  { key: 'custom-trips', label: 'Custom Trips', icon: Gavel, countKey: 'customTrips' },
  { key: 'rewards', label: 'Rewards', icon: Award, countKey: 'rewards' },
  { key: 'audit', label: 'Audit Log', icon: History, countKey: 'auditLogs' }
]

function filterRows<T extends object>(items: T[]): T[] {
  const q = searchTerm.value.trim().toLowerCase()
  if (!q) return items
  return items.filter((item) => JSON.stringify(item).toLowerCase().includes(q))
}

const filteredTrips = computed(() => filterRows(overview.value?.trips ?? []))
const filteredHotels = computed(() => filterRows(overview.value?.hotels ?? []))
const filteredBookings = computed(() => filterRows(overview.value?.bookings ?? []))
const filteredUsers = computed(() => filterRows(overview.value?.users ?? []))
const filteredAddons = computed(() => filterRows(overview.value?.addons ?? []))
const filteredCommunity = computed(() => filterRows(overview.value?.community ?? []))
const filteredCustomTrips = computed(() => filterRows(overview.value?.customTrips ?? []))
const filteredRewards = computed(() => filterRows(overview.value?.rewards ?? []))
const filteredAuditLogs = computed(() => filterRows(overview.value?.auditLogs ?? []))

function openCreateModal() {
  if (activeTab.value === 'audit') return
  modalMode.value = 'create'
  editingId.value = ''
  errorMsg.value = ''

  switch (activeTab.value) {
    case 'trips':
      formState.value = {
        title: '',
        location: '',
        province: '',
        category: 'Trekking',
        adrenalineLevel: 'Menengah',
        pricePerPerson: 950000,
        duration: '2 Hari 1 Malam',
        nextDepartureDate: '2026-12-27',
        totalQuota: 10,
        remainingQuota: 10,
        featured: false,
        shortDescription: ''
      }
      break
    case 'hotels':
      formState.value = {
        name: '',
        location: '',
        province: '',
        type: 'Eco Lodge',
        stars: 4,
        pricePerNight: 650000,
        distanceToBasecamp: '10 menit ke basecamp',
        featured: false,
        shortDescription: ''
      }
      break
    case 'bookings':
      formState.value = {
        leaderName: '',
        leaderOrigin: 'Jakarta',
        tripTitle: overview.value?.trips[0]?.title || 'Open Trip JejakNusa',
        tripSlug: overview.value?.trips[0]?.slug || '',
        departureDate: '2026-12-20',
        participantsCount: 2,
        paymentScheme: 'DP 30%',
        paymentStatus: 'DP 30% Lunas',
        bookingStatus: 'Menunggu Konfirmasi',
        totalAmount: 1900000,
        emergencyContact: 'Kontak Keluarga — 0812-0000-0000'
      }
      break
    case 'users':
      formState.value = {
        name: '',
        email: '',
        password: 'password123',
        role: 'explorer',
        origin: 'Jakarta',
        points: 500,
        verified: true
      }
      break
    case 'addons':
      formState.value = {
        name: '',
        category: 'Perlengkapan',
        price: 60000,
        unit: 'per orang',
        description: ''
      }
      break
    case 'community':
      formState.value = {
        authorName: 'Explorer Nusantara',
        authorOrigin: 'Jakarta',
        location: 'Bali',
        travelStyle: 'Solo Traveler',
        slotsLookingFor: 2,
        note: ''
      }
      break
    case 'custom-trips':
      formState.value = {
        title: '',
        destination: '',
        category: 'Canyoning',
        preferredDate: '2026-12-28',
        groupSize: 6,
        budgetPerPerson: 1000000,
        requesterName: 'Grup Private',
        notes: ''
      }
      break
    case 'rewards':
      formState.value = {
        title: '',
        pointsCost: 700,
        badgeText: 'Member Reward',
        description: ''
      }
      break
  }

  modalOpen.value = true
}

function openEditModal(item: Record<string, unknown>) {
  if (activeTab.value === 'audit') return
  modalMode.value = 'edit'
  editingId.value = String(item.id || '')
  errorMsg.value = ''
  formState.value = { ...(item as AdminFormState) }
  modalOpen.value = true
}

async function saveModalRecord() {
  if (activeTab.value === 'audit') return
  busy.value = true
  errorMsg.value = ''
  feedbackMsg.value = ''
  try {
    if (modalMode.value === 'create') {
      await $fetch(`/api/admin/${activeTab.value}`, {
        method: 'POST',
        body: formState.value
      })
      feedbackMsg.value = `Data baru berhasil ditambahkan ke tabel "${activeTab.value}".`
    } else {
      await $fetch(`/api/admin/${activeTab.value}/${editingId.value}`, {
        method: 'PATCH',
        body: formState.value
      })
      feedbackMsg.value = `Data "${editingId.value}" berhasil diperbarui.`
    }
    modalOpen.value = false
    await refresh()
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }; message?: string }
    errorMsg.value = e?.data?.statusMessage || e?.message || 'Gagal menyimpan perubahan.'
  } finally {
    busy.value = false
  }
}

async function deleteRecord(resource: AdminResourceName, id: string, label: string) {
  if (typeof window !== 'undefined' && !window.confirm(`Hapus permanen "${label}" dari database?`)) {
    return
  }
  busy.value = true
  feedbackMsg.value = ''
  errorMsg.value = ''
  try {
    await $fetch(`/api/admin/${resource}/${id}`, { method: 'DELETE' })
    feedbackMsg.value = `Data "${label}" berhasil dihapus.`
    await refresh()
  } catch {
    errorMsg.value = `Gagal menghapus "${label}".`
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Top Database & Console Banner -->
    <section class="teal-card rounded-[32px] p-6 sm:p-8 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-5">
      <div class="space-y-2.5">
        <div class="flex flex-wrap items-center gap-2">
          <span class="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-amber-200">
            <Database class="h-3.5 w-3.5" />
            Database: {{ overview?.databaseName || 'jejaknusa' }} (Non-Sys)
          </span>
          <span
            class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
            :class="
              overview?.storageMode === 'tidb'
                ? 'bg-emerald-400/20 text-emerald-100 border border-emerald-300/40'
                : 'bg-amber-400/25 text-amber-100 border border-amber-300/40'
            "
          >
            <span
              class="h-2 w-2 rounded-full"
              :class="overview?.storageMode === 'tidb' ? 'bg-emerald-300 animate-pulse' : 'bg-amber-300'"
            />
            {{
              overview?.storageMode === 'tidb'
                ? 'TiDB Cloud Serverless Aktif'
                : 'Mode Fallback (Perbarui TIDB_PASSWORD di .env)'
            }}
          </span>
        </div>

        <h2 class="font-editorial text-2xl sm:text-4xl font-bold leading-tight">
          Pusat Manajemen CRUD Semua Fitur
        </h2>
        <p class="text-xs sm:text-sm text-teal-100/90 max-w-2xl">
          Kelola seluruh tabel aplikasi — Open Trips, Penginapan Hotel, Reservasi Booking, Users/Guides, Gear Add-Ons, Komunitas, Custom Trip, Passport Rewards, dan Audit Log — dari satu dashboard terpadu.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/25 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/25 transition cursor-pointer"
          @click="refresh()"
        >
          <RefreshCw class="h-3.5 w-3.5" :class="pending ? 'animate-spin' : ''" />
          Muat Ulang DB
        </button>

        <button
          v-if="activeTab !== 'audit'"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-5 py-2.5 text-xs font-extrabold text-[#103f3e] hover:bg-amber-300 transition shadow-md cursor-pointer"
          @click="openCreateModal"
        >
          <Plus class="h-4 w-4" />
          Tambah Data Baru
        </button>

        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-full bg-white/12 border border-white/25 px-4 py-2.5 text-xs font-bold text-white hover:bg-orange-600 hover:border-orange-500 transition cursor-pointer"
          :title="`Keluar dari akun ${adminUser?.name || 'Admin'}`"
          @click="handleAdminLogout"
        >
          <LogOut class="h-3.5 w-3.5" />
          Keluar Admin
        </button>
      </div>
    </section>

    <!-- DB Warning if Fallback -->
    <div
      v-if="overview?.storageMode === 'fallback' && overview?.dbError"
      class="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-950"
    >
      <strong>Info Koneksi TiDB Cloud:</strong> {{ overview.dbError }}. Begitu `TIDB_PASSWORD` pada file `.env` diperbarui dari tombol Copy TiDB Cloud, semua 11 tabel otomatis dibuat di database baru <code>{{ overview.databaseName }}</code> (bukan <code>sys</code>).
    </div>

    <!-- Feedback Banners -->
    <div
      v-if="feedbackMsg"
      class="rounded-2xl bg-[#eef7f6] border border-[#c7e4e0] px-4 py-3 text-xs font-bold text-[#175957]"
    >
      {{ feedbackMsg }}
    </div>
    <div
      v-if="errorMsg"
      class="rounded-2xl bg-orange-50 border border-orange-200 px-4 py-3 text-xs font-bold text-orange-800"
    >
      {{ errorMsg }}
    </div>

    <!-- Resource Tabs Strip -->
    <div class="flex flex-wrap items-center gap-2">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition cursor-pointer"
        :class="
          activeTab === tab.key
            ? 'bg-[#1f6f6d] text-white shadow-sm'
            : 'glass-pill text-[#3f4f4d] hover:bg-white'
        "
        @click="activeTab = tab.key; searchTerm = ''"
      >
        <component :is="tab.icon" class="h-3.5 w-3.5" />
        <span>{{ tab.label }}</span>
        <span
          class="rounded-full px-1.5 py-0.5 text-[10px] font-extrabold"
          :class="activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-[#e8e2d5] text-[#354442]'"
        >
          {{ overview?.counts?.[tab.countKey] ?? 0 }}
        </span>
      </button>
    </div>

    <!-- Main CRUD Data Table Card -->
    <section class="rounded-[28px] glass-surface p-5 sm:p-6 space-y-5">
      <!-- Toolbar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="relative flex-1 max-w-md">
          <Search class="h-4 w-4 text-[#7a8785] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Cari data pada tabel aktif..."
            class="w-full rounded-full border border-[#e3dccd] bg-white pl-10 pr-4 py-2 text-xs sm:text-sm text-[#162221] focus:border-[#1f6f6d] focus:outline-none"
          >
        </div>

        <button
          v-if="activeTab !== 'audit'"
          type="button"
          class="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#1f6f6d] px-4 py-2 text-xs font-bold text-white hover:bg-[#175957] transition cursor-pointer self-start sm:self-auto"
          @click="openCreateModal"
        >
          <Plus class="h-4 w-4" />
          Tambah {{ tabs.find((t) => t.key === activeTab)?.label }}
        </button>
      </div>

      <!-- 1. TRIPS TABLE -->
      <div v-if="activeTab === 'trips'" class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr class="border-b border-[#e8e2d5] text-[11px] uppercase tracking-wider text-[#667472]">
              <th class="py-3 pr-4">Open Trip</th>
              <th class="py-3 px-3">Kategori &amp; Level</th>
              <th class="py-3 px-3">Harga</th>
              <th class="py-3 px-3">Kuota</th>
              <th class="py-3 pl-3 text-right">Aksi CRUD</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#efe9dc]">
            <tr v-for="t in filteredTrips" :key="t.id" class="hover:bg-white/70">
              <td class="py-3.5 pr-4">
                <p class="font-bold text-[#162221]">{{ t.title }}</p>
                <p class="text-xs text-[#5c6b69]">{{ t.location }} &bull; {{ formatDateID(t.nextDepartureDate) }}</p>
              </td>
              <td class="py-3.5 px-3 whitespace-nowrap">
                <span class="rounded-full bg-[#eef7f6] px-2.5 py-0.5 text-[11px] font-bold text-[#175957]">
                  {{ t.category }}
                </span>
                <span class="ml-1 text-xs text-[#5c6b69]">{{ t.adrenalineLevel }}</span>
              </td>
              <td class="py-3.5 px-3 font-extrabold text-[#162221] whitespace-nowrap">
                {{ formatRupiah(t.pricePerPerson) }}
              </td>
              <td class="py-3.5 px-3 whitespace-nowrap">
                Sisa <strong>{{ t.remainingQuota }}</strong> / {{ t.totalQuota }}
              </td>
              <td class="py-3.5 pl-3 text-right whitespace-nowrap space-x-1.5">
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-full bg-white border border-[#e3dccd] px-3 py-1 text-xs font-bold text-[#1f6f6d] hover:bg-[#eef7f6] cursor-pointer"
                  @click="openEditModal(t as unknown as Record<string, unknown>)"
                >
                  <Pencil class="h-3 w-3" /> Edit
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-full bg-white border border-orange-200 px-3 py-1 text-xs font-bold text-orange-700 hover:bg-orange-50 cursor-pointer"
                  @click="deleteRecord('trips', t.id, t.title)"
                >
                  <Trash2 class="h-3 w-3" /> Hapus
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 2. HOTELS TABLE -->
      <div v-else-if="activeTab === 'hotels'" class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr class="border-b border-[#e8e2d5] text-[11px] uppercase tracking-wider text-[#667472]">
              <th class="py-3 pr-4">Penginapan &amp; Hotel</th>
              <th class="py-3 px-3">Tipe &amp; Bintang</th>
              <th class="py-3 px-3">Tarif / Malam</th>
              <th class="py-3 pl-3 text-right">Aksi CRUD</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#efe9dc]">
            <tr v-for="h in filteredHotels" :key="h.id" class="hover:bg-white/70">
              <td class="py-3.5 pr-4">
                <p class="font-bold text-[#162221]">{{ h.name }}</p>
                <p class="text-xs text-[#5c6b69]">{{ h.location }} &bull; {{ h.distanceToBasecamp }}</p>
              </td>
              <td class="py-3.5 px-3 whitespace-nowrap">
                <span class="rounded-full bg-[#eef7f6] px-2.5 py-0.5 text-[11px] font-bold text-[#175957]">{{ h.type }}</span>
                <span class="ml-1.5 text-amber-500">{{ '★'.repeat(h.stars) }}</span>
              </td>
              <td class="py-3.5 px-3 font-extrabold text-[#162221] whitespace-nowrap">
                {{ formatRupiah(h.pricePerNight) }}
              </td>
              <td class="py-3.5 pl-3 text-right whitespace-nowrap space-x-1.5">
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-full bg-white border border-[#e3dccd] px-3 py-1 text-xs font-bold text-[#1f6f6d] hover:bg-[#eef7f6] cursor-pointer"
                  @click="openEditModal(h as unknown as Record<string, unknown>)"
                >
                  <Pencil class="h-3 w-3" /> Edit
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-full bg-white border border-orange-200 px-3 py-1 text-xs font-bold text-orange-700 hover:bg-orange-50 cursor-pointer"
                  @click="deleteRecord('hotels', h.id, h.name)"
                >
                  <Trash2 class="h-3 w-3" /> Hapus
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 3. BOOKINGS TABLE -->
      <div v-else-if="activeTab === 'bookings'" class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr class="border-b border-[#e8e2d5] text-[11px] uppercase tracking-wider text-[#667472]">
              <th class="py-3 pr-4">Kode &amp; Pemesan</th>
              <th class="py-3 px-3">Trip &amp; Peserta</th>
              <th class="py-3 px-3">Status</th>
              <th class="py-3 px-3">Total / Dibayar</th>
              <th class="py-3 pl-3 text-right">Aksi CRUD</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#efe9dc]">
            <tr v-for="b in filteredBookings" :key="b.id" class="hover:bg-white/70">
              <td class="py-3.5 pr-4">
                <span class="font-mono text-xs font-bold text-[#1f6f6d]">{{ b.bookingCode }}</span>
                <p class="font-bold text-[#162221]">{{ b.leaderName }}</p>
              </td>
              <td class="py-3.5 px-3">
                <p class="font-semibold text-[#162221]">{{ b.tripTitle }}</p>
                <p class="text-xs text-[#5c6b69]">{{ b.participantsCount }} peserta &bull; {{ formatDateID(b.departureDate) }}</p>
              </td>
              <td class="py-3.5 px-3 whitespace-nowrap space-y-1">
                <span class="block w-fit rounded-full bg-[#eef7f6] px-2.5 py-0.5 text-[10px] font-bold text-[#175957]">
                  {{ b.bookingStatus }}
                </span>
                <span class="block text-[11px] text-[#5c6b69]">{{ b.paymentStatus }}</span>
              </td>
              <td class="py-3.5 px-3 whitespace-nowrap">
                <p class="font-extrabold text-[#162221]">{{ formatRupiah(b.paidAmount) }}</p>
                <p class="text-[11px] text-[#5c6b69]">Total: {{ formatRupiah(b.totalAmount) }}</p>
              </td>
              <td class="py-3.5 pl-3 text-right whitespace-nowrap space-x-1.5">
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-full bg-white border border-[#e3dccd] px-3 py-1 text-xs font-bold text-[#1f6f6d] hover:bg-[#eef7f6] cursor-pointer"
                  @click="openEditModal(b as unknown as Record<string, unknown>)"
                >
                  <Pencil class="h-3 w-3" /> Edit
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-full bg-white border border-orange-200 px-3 py-1 text-xs font-bold text-orange-700 hover:bg-orange-50 cursor-pointer"
                  @click="deleteRecord('bookings', b.id, b.bookingCode)"
                >
                  <Trash2 class="h-3 w-3" /> Hapus
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 4. USERS TABLE -->
      <div v-else-if="activeTab === 'users'" class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr class="border-b border-[#e8e2d5] text-[11px] uppercase tracking-wider text-[#667472]">
              <th class="py-3 pr-4">Pengguna</th>
              <th class="py-3 px-3">Role</th>
              <th class="py-3 px-3">Asal</th>
              <th class="py-3 px-3">Poin Passport</th>
              <th class="py-3 pl-3 text-right">Aksi CRUD</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#efe9dc]">
            <tr v-for="u in filteredUsers" :key="u.id" class="hover:bg-white/70">
              <td class="py-3.5 pr-4">
                <p class="font-bold text-[#162221]">{{ u.name }}</p>
                <p class="text-xs text-[#5c6b69]">{{ u.email }}</p>
              </td>
              <td class="py-3.5 px-3">
                <span
                  class="rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase"
                  :class="u.role === 'guide' ? 'bg-amber-100 text-amber-900' : 'bg-[#eef7f6] text-[#175957]'"
                >
                  {{ u.role }}
                </span>
              </td>
              <td class="py-3.5 px-3 text-[#4a5957]">{{ u.origin }}</td>
              <td class="py-3.5 px-3 font-extrabold text-[#1f6f6d]">{{ u.points }} pts</td>
              <td class="py-3.5 pl-3 text-right whitespace-nowrap space-x-1.5">
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-full bg-white border border-[#e3dccd] px-3 py-1 text-xs font-bold text-[#1f6f6d] hover:bg-[#eef7f6] cursor-pointer"
                  @click="openEditModal(u as unknown as Record<string, unknown>)"
                >
                  <Pencil class="h-3 w-3" /> Edit
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-full bg-white border border-orange-200 px-3 py-1 text-xs font-bold text-orange-700 hover:bg-orange-50 cursor-pointer"
                  @click="deleteRecord('users', u.id, u.name)"
                >
                  <Trash2 class="h-3 w-3" /> Hapus
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 5. GEAR ADD-ONS TABLE -->
      <div v-else-if="activeTab === 'addons'" class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr class="border-b border-[#e8e2d5] text-[11px] uppercase tracking-wider text-[#667472]">
              <th class="py-3 pr-4">Nama Add-On</th>
              <th class="py-3 px-3">Kategori</th>
              <th class="py-3 px-3">Harga &amp; Unit</th>
              <th class="py-3 pl-3 text-right">Aksi CRUD</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#efe9dc]">
            <tr v-for="a in filteredAddons" :key="a.id" class="hover:bg-white/70">
              <td class="py-3.5 pr-4">
                <p class="font-bold text-[#162221]">{{ a.name }}</p>
                <p class="text-xs text-[#5c6b69]">{{ a.description }}</p>
              </td>
              <td class="py-3.5 px-3">
                <span class="rounded-full bg-[#eef7f6] px-2.5 py-0.5 text-[11px] font-bold text-[#175957]">{{ a.category }}</span>
              </td>
              <td class="py-3.5 px-3 font-extrabold text-[#162221] whitespace-nowrap">
                {{ formatRupiah(a.price) }} <span class="text-xs font-normal text-[#5c6b69]">/ {{ a.unit }}</span>
              </td>
              <td class="py-3.5 pl-3 text-right whitespace-nowrap space-x-1.5">
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-full bg-white border border-[#e3dccd] px-3 py-1 text-xs font-bold text-[#1f6f6d] hover:bg-[#eef7f6] cursor-pointer"
                  @click="openEditModal(a as unknown as Record<string, unknown>)"
                >
                  <Pencil class="h-3 w-3" /> Edit
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-full bg-white border border-orange-200 px-3 py-1 text-xs font-bold text-orange-700 hover:bg-orange-50 cursor-pointer"
                  @click="deleteRecord('addons', a.id, a.name)"
                >
                  <Trash2 class="h-3 w-3" /> Hapus
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 6. COMMUNITY TABLE -->
      <div v-else-if="activeTab === 'community'" class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr class="border-b border-[#e8e2d5] text-[11px] uppercase tracking-wider text-[#667472]">
              <th class="py-3 pr-4">Penulis &amp; Gaya</th>
              <th class="py-3 px-3">Pesan Ajakan</th>
              <th class="py-3 px-3">Likes</th>
              <th class="py-3 pl-3 text-right">Aksi CRUD</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#efe9dc]">
            <tr v-for="c in filteredCommunity" :key="c.id" class="hover:bg-white/70">
              <td class="py-3.5 pr-4 whitespace-nowrap">
                <p class="font-bold text-[#162221]">{{ c.authorName }}</p>
                <span class="text-[11px] text-[#1f6f6d] font-bold">{{ c.travelStyle }}</span>
              </td>
              <td class="py-3.5 px-3 text-xs text-[#43514f] max-w-md">{{ c.note }}</td>
              <td class="py-3.5 px-3 font-bold">{{ c.likes }}</td>
              <td class="py-3.5 pl-3 text-right whitespace-nowrap space-x-1.5">
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-full bg-white border border-[#e3dccd] px-3 py-1 text-xs font-bold text-[#1f6f6d] hover:bg-[#eef7f6] cursor-pointer"
                  @click="openEditModal(c as unknown as Record<string, unknown>)"
                >
                  <Pencil class="h-3 w-3" /> Edit
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-full bg-white border border-orange-200 px-3 py-1 text-xs font-bold text-orange-700 hover:bg-orange-50 cursor-pointer"
                  @click="deleteRecord('community', c.id, c.authorName)"
                >
                  <Trash2 class="h-3 w-3" /> Hapus
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 7. CUSTOM TRIPS TABLE -->
      <div v-else-if="activeTab === 'custom-trips'" class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr class="border-b border-[#e8e2d5] text-[11px] uppercase tracking-wider text-[#667472]">
              <th class="py-3 pr-4">Permintaan Custom Trip</th>
              <th class="py-3 px-3">Grup &amp; Budget</th>
              <th class="py-3 px-3">Status</th>
              <th class="py-3 pl-3 text-right">Aksi CRUD</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#efe9dc]">
            <tr v-for="ct in filteredCustomTrips" :key="ct.id" class="hover:bg-white/70">
              <td class="py-3.5 pr-4">
                <p class="font-bold text-[#162221]">{{ ct.title }}</p>
                <p class="text-xs text-[#5c6b69]">{{ ct.destination }} &bull; {{ ct.bids.length }} penawaran guide</p>
              </td>
              <td class="py-3.5 px-3 whitespace-nowrap">
                <p class="font-bold text-[#162221]">{{ ct.groupSize }} orang</p>
                <p class="text-xs text-[#5c6b69]">{{ formatRupiah(ct.budgetPerPerson) }}/org</p>
              </td>
              <td class="py-3.5 px-3">
                <span class="rounded-full bg-[#eef7f6] px-2.5 py-0.5 text-[11px] font-bold text-[#175957]">{{ ct.status }}</span>
              </td>
              <td class="py-3.5 pl-3 text-right whitespace-nowrap space-x-1.5">
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-full bg-white border border-[#e3dccd] px-3 py-1 text-xs font-bold text-[#1f6f6d] hover:bg-[#eef7f6] cursor-pointer"
                  @click="openEditModal(ct as unknown as Record<string, unknown>)"
                >
                  <Pencil class="h-3 w-3" /> Edit
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-full bg-white border border-orange-200 px-3 py-1 text-xs font-bold text-orange-700 hover:bg-orange-50 cursor-pointer"
                  @click="deleteRecord('custom-trips', ct.id, ct.title)"
                >
                  <Trash2 class="h-3 w-3" /> Hapus
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 8. PASSPORT REWARDS TABLE -->
      <div v-else-if="activeTab === 'rewards'" class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr class="border-b border-[#e8e2d5] text-[11px] uppercase tracking-wider text-[#667472]">
              <th class="py-3 pr-4">Reward &amp; Voucher</th>
              <th class="py-3 px-3">Biaya Poin</th>
              <th class="py-3 px-3">Kode Redeem</th>
              <th class="py-3 pl-3 text-right">Aksi CRUD</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#efe9dc]">
            <tr v-for="r in filteredRewards" :key="r.id" class="hover:bg-white/70">
              <td class="py-3.5 pr-4">
                <p class="font-bold text-[#162221]">{{ r.title }}</p>
                <p class="text-xs text-[#5c6b69]">{{ r.description }}</p>
              </td>
              <td class="py-3.5 px-3 font-extrabold text-[#1f6f6d] whitespace-nowrap">{{ r.pointsCost }} pts</td>
              <td class="py-3.5 px-3 font-mono text-xs">{{ r.redeemedCode || 'Belum ditukar' }}</td>
              <td class="py-3.5 pl-3 text-right whitespace-nowrap space-x-1.5">
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-full bg-white border border-[#e3dccd] px-3 py-1 text-xs font-bold text-[#1f6f6d] hover:bg-[#eef7f6] cursor-pointer"
                  @click="openEditModal(r as unknown as Record<string, unknown>)"
                >
                  <Pencil class="h-3 w-3" /> Edit
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-full bg-white border border-orange-200 px-3 py-1 text-xs font-bold text-orange-700 hover:bg-orange-50 cursor-pointer"
                  @click="deleteRecord('rewards', r.id, r.title)"
                >
                  <Trash2 class="h-3 w-3" /> Hapus
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 9. AUDIT LOGS TABLE -->
      <div v-else class="space-y-3">
        <div
          v-for="log in filteredAuditLogs"
          :key="log.id"
          class="rounded-2xl bg-white/95 border border-[#ebe5d8] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
        >
          <div class="flex items-start gap-3">
            <span
              class="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold shrink-0"
              :class="
                log.action === 'CREATE'
                  ? 'bg-emerald-100 text-emerald-800'
                  : log.action === 'UPDATE'
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-orange-100 text-orange-800'
              "
            >
              {{ log.action }}
            </span>
            <div>
              <p class="font-bold text-[#162221]">{{ log.summary }}</p>
              <p class="text-[11px] text-[#5c6b69]">
                Tabel: <code>{{ log.resource }}</code> &bull; ID: <code>{{ log.recordId }}</code> &bull; Oleh: {{ log.actor }}
              </p>
            </div>
          </div>
          <span class="text-[11px] text-[#7a8785] shrink-0">{{ log.createdAt.slice(0, 19).replace('T', ' ') }}</span>
        </div>
      </div>
    </section>

    <!-- Dynamic Create / Edit Modal -->
    <Teleport to="body">
      <div
        v-if="modalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-[#102625]/50 backdrop-blur-xs p-4"
        @click.self="modalOpen = false"
      >
        <div class="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-[28px] bg-[#fbf9f5] border border-white p-6 shadow-2xl space-y-5">
          <div class="flex items-center justify-between pb-3 border-b border-[#e8e2d5]">
            <h3 class="font-editorial text-xl font-bold text-[#162221]">
              {{ modalMode === 'create' ? 'Tambah Data Baru' : 'Edit Data' }} — {{ activeTab }}
            </h3>
            <button
              type="button"
              class="rounded-full p-1.5 text-stone-400 hover:bg-stone-200/70 cursor-pointer"
              @click="modalOpen = false"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <form class="space-y-3.5 text-xs" @submit.prevent="saveModalRecord">
            <!-- TRIPS FORM -->
            <template v-if="activeTab === 'trips'">
              <label class="block space-y-1">
                <span class="font-bold text-[#5c6b69]">Judul Open Trip</span>
                <input v-model="formState.title" required class="w-full rounded-full border border-[#e3dccd] bg-white px-4 py-2.5 text-sm">
              </label>
              <div class="grid grid-cols-2 gap-3">
                <label class="block space-y-1">
                  <span class="font-bold text-[#5c6b69]">Lokasi</span>
                  <input v-model="formState.location" required class="w-full rounded-full border border-[#e3dccd] bg-white px-4 py-2 text-sm">
                </label>
                <label class="block space-y-1">
                  <span class="font-bold text-[#5c6b69]">Kategori</span>
                  <select v-model="formState.category" class="w-full rounded-full border border-[#e3dccd] bg-white px-3 py-2 text-sm">
                    <option v-for="c in TRIP_CATEGORIES" :key="c" :value="c">{{ c }}</option>
                  </select>
                </label>
                <label class="block space-y-1">
                  <span class="font-bold text-[#5c6b69]">Level Adrenalin</span>
                  <select v-model="formState.adrenalineLevel" class="w-full rounded-full border border-[#e3dccd] bg-white px-3 py-2 text-sm">
                    <option v-for="l in ADRENALINE_LEVELS" :key="l" :value="l">{{ l }}</option>
                  </select>
                </label>
                <label class="block space-y-1">
                  <span class="font-bold text-[#5c6b69]">Harga / Orang (Rp)</span>
                  <input v-model.number="formState.pricePerPerson" type="number" class="w-full rounded-full border border-[#e3dccd] bg-white px-4 py-2 text-sm">
                </label>
                <label class="block space-y-1">
                  <span class="font-bold text-[#5c6b69]">Sisa Kuota</span>
                  <input v-model.number="formState.remainingQuota" type="number" class="w-full rounded-full border border-[#e3dccd] bg-white px-4 py-2 text-sm">
                </label>
                <label class="flex items-center gap-2 pt-5 font-bold text-[#162221]">
                  <input v-model="formState.featured" type="checkbox" class="accent-[#1f6f6d]">
                  Tampilkan di Featured
                </label>
              </div>
            </template>

            <!-- HOTELS FORM -->
            <template v-else-if="activeTab === 'hotels'">
              <label class="block space-y-1">
                <span class="font-bold text-[#5c6b69]">Nama Hotel / Penginapan</span>
                <input v-model="formState.name" required class="w-full rounded-full border border-[#e3dccd] bg-white px-4 py-2.5 text-sm">
              </label>
              <div class="grid grid-cols-2 gap-3">
                <label class="block space-y-1">
                  <span class="font-bold text-[#5c6b69]">Lokasi</span>
                  <input v-model="formState.location" required class="w-full rounded-full border border-[#e3dccd] bg-white px-4 py-2 text-sm">
                </label>
                <label class="block space-y-1">
                  <span class="font-bold text-[#5c6b69]">Tipe Properti</span>
                  <select v-model="formState.type" class="w-full rounded-full border border-[#e3dccd] bg-white px-3 py-2 text-sm">
                    <option v-for="ht in HOTEL_TYPES" :key="ht" :value="ht">{{ ht }}</option>
                  </select>
                </label>
                <label class="block space-y-1">
                  <span class="font-bold text-[#5c6b69]">Tarif / Malam (Rp)</span>
                  <input v-model.number="formState.pricePerNight" type="number" class="w-full rounded-full border border-[#e3dccd] bg-white px-4 py-2 text-sm">
                </label>
                <label class="block space-y-1">
                  <span class="font-bold text-[#5c6b69]">Bintang (1–5)</span>
                  <input v-model.number="formState.stars" type="number" min="1" max="5" class="w-full rounded-full border border-[#e3dccd] bg-white px-4 py-2 text-sm">
                </label>
              </div>
            </template>

            <!-- BOOKINGS FORM -->
            <template v-else-if="activeTab === 'bookings'">
              <label v-if="modalMode === 'create'" class="block space-y-1">
                <span class="font-bold text-[#5c6b69]">Nama Pemesan / Ketua Grup</span>
                <input v-model="formState.leaderName" required class="w-full rounded-full border border-[#e3dccd] bg-white px-4 py-2.5 text-sm">
              </label>
              <div class="grid grid-cols-2 gap-3">
                <label class="block space-y-1">
                  <span class="font-bold text-[#5c6b69]">Status Booking</span>
                  <select v-model="formState.bookingStatus" class="w-full rounded-full border border-[#e3dccd] bg-white px-3 py-2 text-sm">
                    <option value="Menunggu Konfirmasi">Menunggu Konfirmasi</option>
                    <option value="Terkonfirmasi">Terkonfirmasi</option>
                    <option value="Check-in Selesai">Check-in Selesai</option>
                  </select>
                </label>
                <label class="block space-y-1">
                  <span class="font-bold text-[#5c6b69]">Status Pembayaran</span>
                  <select v-model="formState.paymentStatus" class="w-full rounded-full border border-[#e3dccd] bg-white px-3 py-2 text-sm">
                    <option value="DP 30% Lunas">DP 30% Lunas</option>
                    <option value="Lunas 100%">Lunas 100%</option>
                    <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                  </select>
                </label>
                <label class="block space-y-1">
                  <span class="font-bold text-[#5c6b69]">Jumlah Peserta</span>
                  <input v-model.number="formState.participantsCount" type="number" min="1" class="w-full rounded-full border border-[#e3dccd] bg-white px-4 py-2 text-sm">
                </label>
                <label v-if="modalMode === 'create'" class="block space-y-1">
                  <span class="font-bold text-[#5c6b69]">Total Tagihan (Rp)</span>
                  <input v-model.number="formState.totalAmount" type="number" class="w-full rounded-full border border-[#e3dccd] bg-white px-4 py-2 text-sm">
                </label>
              </div>
            </template>

            <!-- USERS FORM -->
            <template v-else-if="activeTab === 'users'">
              <label class="block space-y-1">
                <span class="font-bold text-[#5c6b69]">Nama Lengkap</span>
                <input v-model="formState.name" required class="w-full rounded-full border border-[#e3dccd] bg-white px-4 py-2.5 text-sm">
              </label>
              <label v-if="modalMode === 'create'" class="block space-y-1">
                <span class="font-bold text-[#5c6b69]">Email</span>
                <input v-model="formState.email" type="email" required class="w-full rounded-full border border-[#e3dccd] bg-white px-4 py-2.5 text-sm">
              </label>
              <div class="grid grid-cols-2 gap-3">
                <label class="block space-y-1">
                  <span class="font-bold text-[#5c6b69]">Role</span>
                  <select v-model="formState.role" class="w-full rounded-full border border-[#e3dccd] bg-white px-3 py-2 text-sm">
                    <option value="explorer">Explorer</option>
                    <option value="guide">Guide (Pemandu)</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                <label class="block space-y-1">
                  <span class="font-bold text-[#5c6b69]">Saldo Poin</span>
                  <input v-model.number="formState.points" type="number" class="w-full rounded-full border border-[#e3dccd] bg-white px-4 py-2 text-sm">
                </label>
                <label class="col-span-2 block space-y-1">
                  <span class="font-bold text-[#5c6b69]">Kota Asal</span>
                  <input v-model="formState.origin" class="w-full rounded-full border border-[#e3dccd] bg-white px-4 py-2 text-sm">
                </label>
              </div>
            </template>

            <!-- ADDONS FORM -->
            <template v-else-if="activeTab === 'addons'">
              <label class="block space-y-1">
                <span class="font-bold text-[#5c6b69]">Nama Perlengkapan / Add-On</span>
                <input v-model="formState.name" required class="w-full rounded-full border border-[#e3dccd] bg-white px-4 py-2.5 text-sm">
              </label>
              <div class="grid grid-cols-3 gap-2.5">
                <label class="block space-y-1">
                  <span class="font-bold text-[#5c6b69]">Kategori</span>
                  <select v-model="formState.category" class="w-full rounded-full border border-[#e3dccd] bg-white px-3 py-2 text-xs">
                    <option value="Perlengkapan">Perlengkapan</option>
                    <option value="Dokumentasi">Dokumentasi</option>
                    <option value="Logistik">Logistik</option>
                  </select>
                </label>
                <label class="block space-y-1">
                  <span class="font-bold text-[#5c6b69]">Harga (Rp)</span>
                  <input v-model.number="formState.price" type="number" class="w-full rounded-full border border-[#e3dccd] bg-white px-3 py-2 text-xs">
                </label>
                <label class="block space-y-1">
                  <span class="font-bold text-[#5c6b69]">Satuan</span>
                  <input v-model="formState.unit" class="w-full rounded-full border border-[#e3dccd] bg-white px-3 py-2 text-xs">
                </label>
              </div>
              <label class="block space-y-1">
                <span class="font-bold text-[#5c6b69]">Deskripsi</span>
                <textarea v-model="formState.description" rows="2" class="w-full rounded-2xl border border-[#e3dccd] bg-white px-3.5 py-2 text-sm" />
              </label>
            </template>

            <!-- COMMUNITY FORM -->
            <template v-else-if="activeTab === 'community'">
              <label v-if="modalMode === 'create'" class="block space-y-1">
                <span class="font-bold text-[#5c6b69]">Nama Penulis</span>
                <input v-model="formState.authorName" required class="w-full rounded-full border border-[#e3dccd] bg-white px-4 py-2 text-sm">
              </label>
              <label class="block space-y-1">
                <span class="font-bold text-[#5c6b69]">Gaya Jalan</span>
                <select v-model="formState.travelStyle" class="w-full rounded-full border border-[#e3dccd] bg-white px-3 py-2 text-sm">
                  <option value="Solo Traveler">Solo Traveler</option>
                  <option value="Cari Teman Sharing">Cari Teman Sharing</option>
                  <option value="Fotografi Alam">Fotografi Alam</option>
                  <option value="Pemula Santai">Pemula Santai</option>
                </select>
              </label>
              <label class="block space-y-1">
                <span class="font-bold text-[#5c6b69]">Pesan Ajakan</span>
                <textarea v-model="formState.note" rows="3" required class="w-full rounded-2xl border border-[#e3dccd] bg-white px-3.5 py-2 text-sm" />
              </label>
            </template>

            <!-- CUSTOM TRIPS FORM -->
            <template v-else-if="activeTab === 'custom-trips'">
              <label class="block space-y-1">
                <span class="font-bold text-[#5c6b69]">Judul Permintaan</span>
                <input v-model="formState.title" required class="w-full rounded-full border border-[#e3dccd] bg-white px-4 py-2 text-sm">
              </label>
              <div class="grid grid-cols-2 gap-3">
                <label class="block space-y-1">
                  <span class="font-bold text-[#5c6b69]">Destinasi</span>
                  <input v-model="formState.destination" required class="w-full rounded-full border border-[#e3dccd] bg-white px-4 py-2 text-sm">
                </label>
                <label class="block space-y-1">
                  <span class="font-bold text-[#5c6b69]">Budget / Orang (Rp)</span>
                  <input v-model.number="formState.budgetPerPerson" type="number" class="w-full rounded-full border border-[#e3dccd] bg-white px-4 py-2 text-sm">
                </label>
                <label v-if="modalMode === 'edit'" class="col-span-2 block space-y-1">
                  <span class="font-bold text-[#5c6b69]">Status</span>
                  <select v-model="formState.status" class="w-full rounded-full border border-[#e3dccd] bg-white px-3 py-2 text-sm">
                    <option value="Menerima Penawaran">Menerima Penawaran</option>
                    <option value="Pemandu Dipilih">Pemandu Dipilih</option>
                  </select>
                </label>
              </div>
            </template>

            <!-- REWARDS FORM -->
            <template v-else-if="activeTab === 'rewards'">
              <label class="block space-y-1">
                <span class="font-bold text-[#5c6b69]">Judul Reward / Voucher</span>
                <input v-model="formState.title" required class="w-full rounded-full border border-[#e3dccd] bg-white px-4 py-2 text-sm">
              </label>
              <div class="grid grid-cols-2 gap-3">
                <label class="block space-y-1">
                  <span class="font-bold text-[#5c6b69]">Biaya Poin</span>
                  <input v-model.number="formState.pointsCost" type="number" class="w-full rounded-full border border-[#e3dccd] bg-white px-4 py-2 text-sm">
                </label>
                <label class="block space-y-1">
                  <span class="font-bold text-[#5c6b69]">Label Badge</span>
                  <input v-model="formState.badgeText" class="w-full rounded-full border border-[#e3dccd] bg-white px-4 py-2 text-sm">
                </label>
              </div>
              <label class="block space-y-1">
                <span class="font-bold text-[#5c6b69]">Deskripsi</span>
                <textarea v-model="formState.description" rows="2" class="w-full rounded-2xl border border-[#e3dccd] bg-white px-3.5 py-2 text-sm" />
              </label>
            </template>

            <div class="pt-3 border-t border-[#e8e2d5] flex justify-end gap-2">
              <button
                type="button"
                class="rounded-full px-4 py-2 text-xs font-bold text-[#5c6b69] hover:bg-stone-200/70 cursor-pointer"
                @click="modalOpen = false"
              >
                Batal
              </button>
              <button
                type="submit"
                :disabled="busy"
                class="rounded-full bg-[#1f6f6d] px-5 py-2 text-xs font-extrabold text-white hover:bg-[#175957] disabled:opacity-50 cursor-pointer"
              >
                {{ busy ? 'Menyimpan...' : 'Simpan ke Database' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

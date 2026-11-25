<script setup lang="ts">
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  Download,
  Eye,
  FileBarChart2,
  FileSpreadsheet,
  FileText,
  Filter,
  RefreshCw,
  RotateCcw,
  Search,
  Users,
  Wallet,
  X
} from 'lucide-vue-next'
import type {
  ActivityCategory,
  AdminActivitiesResponse,
  AdminActivityItem
} from '#shared/types/activity'
import { formatRupiah } from '~/utils/format'
import { downloadActivitiesExcel, exportActivitiesPdfViaPrint } from '~/utils/reportExport'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  allowedRoles: ['admin']
})

useSeoMeta({
  title: 'Laporan Semua Aktivitas Masuk — Admin JejakNusa',
  description: 'Rekap lengkap seluruh aktivitas masuk di platform JejakNusa (transaksi, pendaftaran, komunitas, SOS, verifikasi, refund & payout) dengan ekspor Excel (.xlsx) dan PDF.'
})

const { user } = useAuth()
const { data, pending, refresh } = await useFetch<AdminActivitiesResponse>('/api/admin/activities')

const activities = computed(() => data.value?.activities ?? [])
const summary = computed(() => data.value?.summary)
const generatedAt = computed(() => data.value?.generatedAt || '-')

const selectedCategory = ref<'ALL' | ActivityCategory>('ALL')
const searchQuery = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const selectedItem = ref<AdminActivityItem | null>(null)
const exportFeedback = ref('')

const categoryOptions: Array<{ key: 'ALL' | ActivityCategory; label: string }> = [
  { key: 'ALL', label: 'Semua Aktivitas' },
  { key: 'booking', label: 'Transaksi Booking' },
  { key: 'registration', label: 'Pendaftaran Akun' },
  { key: 'community', label: 'Komunitas Buddy' },
  { key: 'sos', label: 'Darurat SOS' },
  { key: 'verification', label: 'Verifikasi Pemandu' },
  { key: 'refund', label: 'Refund Cuaca' },
  { key: 'payout', label: 'Payout Pemandu' },
  { key: 'chat', label: 'Chat Lobby' },
  { key: 'audit', label: 'Audit Admin' }
]

const filteredActivities = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return activities.value.filter((item) => {
    if (selectedCategory.value !== 'ALL' && item.category !== selectedCategory.value) return false
    if (dateFrom.value && item.dateOnly < dateFrom.value) return false
    if (dateTo.value && item.dateOnly > dateTo.value) return false
    if (q) {
      const hay = `${item.title} ${item.actor} ${item.actorContact} ${item.referenceCode} ${item.description} ${item.status} ${item.categoryLabel}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
})

const filteredTotalAmount = computed(() =>
  filteredActivities.value.reduce((sum, item) => sum + (item.amount ?? 0), 0)
)

const activeFilterLabel = computed(() => {
  const parts: string[] = []
  const cat = categoryOptions.find((c) => c.key === selectedCategory.value)
  parts.push(cat ? cat.label : 'Semua Aktivitas')
  if (dateFrom.value || dateTo.value) {
    parts.push(`Periode ${dateFrom.value || 'awal'} s.d. ${dateTo.value || 'sekarang'}`)
  }
  if (searchQuery.value.trim()) {
    parts.push(`Kata kunci: "${searchQuery.value.trim()}"`)
  }
  return parts.join(' • ')
})

function categoryCount(key: 'ALL' | ActivityCategory): number {
  if (key === 'ALL') return activities.value.length
  return summary.value?.byCategory?.[key] ?? 0
}

function resetFilters() {
  selectedCategory.value = 'ALL'
  searchQuery.value = ''
  dateFrom.value = ''
  dateTo.value = ''
}

function categoryBadgeClass(category: ActivityCategory): string {
  switch (category) {
    case 'booking':
      return 'bg-[#eef7f6] text-[#175957] border-[#c7e4e0]'
    case 'registration':
      return 'bg-sky-50 text-sky-800 border-sky-200'
    case 'community':
      return 'bg-violet-50 text-violet-800 border-violet-200'
    case 'sos':
      return 'bg-rose-100 text-rose-800 border-rose-300'
    case 'verification':
      return 'bg-amber-50 text-amber-900 border-amber-200'
    case 'refund':
      return 'bg-orange-50 text-orange-800 border-orange-200'
    case 'payout':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200'
    case 'chat':
      return 'bg-stone-100 text-stone-700 border-stone-200'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

function statusBadgeClass(severity: AdminActivityItem['severity']): string {
  switch (severity) {
    case 'success':
      return 'bg-emerald-100 text-emerald-800'
    case 'warning':
      return 'bg-amber-100 text-amber-900'
    case 'danger':
      return 'bg-rose-100 text-rose-800'
    default:
      return 'bg-[#eef7f6] text-[#175957]'
  }
}

function handleExportExcel() {
  if (filteredActivities.value.length === 0) return
  downloadActivitiesExcel(filteredActivities.value, {
    generatedAt: generatedAt.value,
    filterLabel: activeFilterLabel.value,
    exportedBy: user.value?.name || 'Admin JejakNusa'
  })
  exportFeedback.value = `Berhasil mengunduh file Excel (.xlsx) berisi ${filteredActivities.value.length} aktivitas masuk.`
  setTimeout(() => {
    exportFeedback.value = ''
  }, 5000)
}

function handleExportPdf() {
  if (filteredActivities.value.length === 0) return
  exportFeedback.value = 'Menyiapkan tampilan cetak PDF (pilih "Save as PDF" / "Simpan sebagai PDF" pada dialog cetak).'
  exportActivitiesPdfViaPrint()
  setTimeout(() => {
    exportFeedback.value = ''
  }, 5000)
}
</script>

<template>
  <div class="space-y-6">
    <!-- ==================== INTERACTIVE SCREEN VIEW ==================== -->
    <div class="space-y-6 print:hidden">
      <!-- Hero Banner -->
      <section class="rounded-[28px] teal-card p-6 sm:p-7 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div class="space-y-1.5">
          <span class="inline-flex items-center gap-1.5 rounded-full bg-amber-300/20 border border-amber-300/35 px-3 py-1 text-[11px] font-extrabold text-amber-200">
            <FileBarChart2 class="h-3.5 w-3.5" />
            Pusat Laporan &amp; Rekap Aktivitas Platform
          </span>
          <h1 class="font-editorial text-2xl sm:text-3xl font-bold">
            Laporan Semua Aktivitas Masuk
          </h1>
          <p class="text-xs sm:text-sm text-teal-100/90 max-w-2xl">
            Rekap real-time seluruh aktivitas masuk: transaksi booking, pendaftaran akun peserta, postingan komunitas, sinyal SOS, verifikasi pemandu, refund cuaca, payout, dan log audit. Siap diekspor ke Excel (.xlsx) maupun PDF.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            :disabled="filteredActivities.length === 0"
            class="inline-flex items-center gap-1.5 rounded-full bg-emerald-400 px-4 py-2.5 text-xs font-extrabold text-[#0f2f2e] hover:bg-emerald-300 disabled:opacity-50 shadow-sm transition cursor-pointer"
            @click="handleExportExcel"
          >
            <FileSpreadsheet class="h-4 w-4" />
            Ekspor Excel (.xlsx)
          </button>

          <button
            type="button"
            :disabled="filteredActivities.length === 0"
            class="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-4 py-2.5 text-xs font-extrabold text-[#162221] hover:bg-amber-300 disabled:opacity-50 shadow-sm transition cursor-pointer"
            @click="handleExportPdf"
          >
            <FileText class="h-4 w-4" />
            Ekspor PDF
          </button>

          <button
            type="button"
            :disabled="pending"
            class="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/25 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-white/25 transition cursor-pointer"
            @click="() => refresh()"
          >
            <RefreshCw class="h-3.5 w-3.5" :class="pending ? 'animate-spin' : ''" />
            Muat Ulang
          </button>
        </div>
      </section>

      <!-- Feedback Banner -->
      <div
        v-if="exportFeedback"
        class="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-bold text-emerald-900 flex items-center gap-2"
      >
        <Download class="h-4 w-4 text-emerald-700 shrink-0" />
        <span>{{ exportFeedback }}</span>
      </div>

      <!-- KPI Summary Cards -->
      <div v-if="summary" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div class="min-w-0 rounded-[24px] bg-white border border-[#e5dfd2] p-5 flex flex-col justify-between gap-3 shadow-xs">
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs font-bold text-[#5c6b69]">Total Aktivitas Masuk</p>
            <span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eef7f6] text-[#1f6f6d]">
              <Activity class="h-4.5 w-4.5" />
            </span>
          </div>
          <div>
            <p class="text-2xl font-extrabold tabular-nums text-[#162221]">
              {{ summary.totalActivities }}
            </p>
            <p class="text-[11px] font-medium text-[#6d7a78] mt-0.5">
              Menampilkan {{ filteredActivities.length }} sesuai filter aktif
            </p>
          </div>
        </div>

        <div class="min-w-0 rounded-[24px] bg-white border border-[#e5dfd2] p-5 flex flex-col justify-between gap-3 shadow-xs">
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs font-bold text-[#5c6b69]">Nilai Transaksi Masuk</p>
            <span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Wallet class="h-4.5 w-4.5" />
            </span>
          </div>
          <div>
            <p class="text-xl 2xl:text-2xl font-extrabold tabular-nums text-emerald-800 break-words">
              {{ formatRupiah(summary.totalFinancialValue) }}
            </p>
            <p class="text-[11px] font-medium text-[#6d7a78] mt-0.5">
              {{ summary.totalBookings }} transaksi &bull; {{ summary.totalBookingParticipants }} peserta
            </p>
          </div>
        </div>

        <div class="min-w-0 rounded-[24px] bg-white border border-[#e5dfd2] p-5 flex flex-col justify-between gap-3 shadow-xs">
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs font-bold text-[#5c6b69]">Akun &amp; Komunitas</p>
            <span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
              <Users class="h-4.5 w-4.5" />
            </span>
          </div>
          <div>
            <p class="text-2xl font-extrabold tabular-nums text-[#162221]">
              {{ summary.totalRegistrations }}
              <span class="text-sm font-bold text-[#4a5f5d]">Akun</span>
            </p>
            <p class="text-[11px] font-medium text-[#6d7a78] mt-0.5">
              {{ summary.totalCommunityPosts }} postingan Buddy Finder
            </p>
          </div>
        </div>

        <div
          class="min-w-0 rounded-[24px] border p-5 flex flex-col justify-between gap-3 shadow-xs"
          :class="summary.activeSosCount > 0 ? 'bg-rose-50 border-rose-300' : 'bg-white border-[#e5dfd2]'"
        >
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs font-bold" :class="summary.activeSosCount > 0 ? 'text-rose-900' : 'text-[#5c6b69]'">
              SOS &amp; Antrean Proses
            </p>
            <span
              class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              :class="summary.activeSosCount > 0 ? 'bg-rose-600 text-white' : 'bg-amber-50 text-amber-700'"
            >
              <AlertTriangle class="h-4.5 w-4.5" />
            </span>
          </div>
          <div>
            <p
              class="text-2xl font-extrabold tabular-nums"
              :class="summary.activeSosCount > 0 ? 'text-rose-700' : 'text-[#162221]'"
            >
              {{ summary.activeSosCount }} SOS
              <span class="text-sm font-bold text-[#5c6b69]">/ {{ summary.pendingQueueCount }} Antre</span>
            </p>
            <p class="text-[11px] font-medium text-[#6d7a78] mt-0.5">
              Verifikasi, refund cuaca &amp; payout menunggu
            </p>
          </div>
        </div>
      </div>

      <!-- Category Filter Pills -->
      <div class="rounded-[24px] bg-white border border-[#e5dfd2] p-4 space-y-3.5">
        <div class="flex items-center justify-between gap-2">
          <span class="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#5c6b69]">
            <Filter class="h-3.5 w-3.5 text-[#1f6f6d]" />
            Filter Kategori Aktivitas
          </span>
          <span class="text-[11px] text-[#6d7a78]">Diperbarui: {{ generatedAt }}</span>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            v-for="cat in categoryOptions"
            :key="cat.key"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold border transition cursor-pointer"
            :class="
              selectedCategory === cat.key
                ? 'bg-[#103f3e] text-white border-[#103f3e] shadow-xs'
                : 'bg-[#fbf9f5] text-[#354442] border-[#e3dccd] hover:border-[#1f6f6d] hover:text-[#1f6f6d]'
            "
            @click="selectedCategory = cat.key"
          >
            <span>{{ cat.label }}</span>
            <span
              class="rounded-full px-1.5 py-0.2 text-[10px] font-extrabold"
              :class="selectedCategory === cat.key ? 'bg-white/20 text-white' : 'bg-[#ece6d9] text-[#455553]'"
            >
              {{ categoryCount(cat.key) }}
            </span>
          </button>
        </div>

        <!-- Search & Date Range Row -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-[#efe9dc]">
          <div class="md:col-span-5 relative">
            <Search class="h-4 w-4 text-[#7a8785] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari pelaku, invoice, judul aktivitas, status..."
              class="w-full rounded-full border border-[#e3dccd] bg-[#fbf9f5] pl-10 pr-4 py-2 text-xs sm:text-sm text-[#162221] focus:border-[#1f6f6d] focus:outline-none"
            >
          </div>

          <div class="md:col-span-3 flex items-center gap-2">
            <label for="rep-date-from" class="text-[11px] font-bold text-[#5c6b69] shrink-0 inline-flex items-center gap-1">
              <Calendar class="h-3.5 w-3.5 text-[#1f6f6d]" /> Dari
            </label>
            <input
              id="rep-date-from"
              v-model="dateFrom"
              type="date"
              class="w-full rounded-full border border-[#e3dccd] bg-[#fbf9f5] px-3 py-1.5 text-xs font-semibold text-[#162221]"
            >
          </div>

          <div class="md:col-span-3 flex items-center gap-2">
            <label for="rep-date-to" class="text-[11px] font-bold text-[#5c6b69] shrink-0">Sampai</label>
            <input
              id="rep-date-to"
              v-model="dateTo"
              type="date"
              class="w-full rounded-full border border-[#e3dccd] bg-[#fbf9f5] px-3 py-1.5 text-xs font-semibold text-[#162221]"
            >
          </div>

          <div class="md:col-span-1 flex items-center justify-end">
            <button
              type="button"
              title="Reset semua filter"
              class="w-full md:w-auto inline-flex items-center justify-center gap-1 rounded-full border border-[#dfd8c8] bg-white px-3 py-2 text-xs font-bold text-[#455553] hover:border-[#1f6f6d] hover:text-[#1f6f6d] cursor-pointer"
              @click="resetFilters"
            >
              <RotateCcw class="h-3.5 w-3.5" />
              <span class="md:hidden">Reset</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Main Activity Report Table -->
      <div class="rounded-[28px] bg-white border border-[#e5dfd2] overflow-hidden shadow-xs">
        <div class="px-5 py-4 border-b border-[#ebe5d8] flex flex-wrap items-center justify-between gap-2 bg-[#fbf9f5]">
          <div>
            <h2 class="font-editorial text-lg font-bold text-[#162221]">
              Log Aktivitas Masuk ({{ filteredActivities.length }})
            </h2>
            <p class="text-[11px] text-[#5c6b69]">
              Filter aktif: <strong>{{ activeFilterLabel }}</strong>
              <template v-if="filteredTotalAmount > 0">
                &bull; Total nominal terfilter: <strong class="text-[#1f6f6d]">{{ formatRupiah(filteredTotalAmount) }}</strong>
              </template>
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              :disabled="filteredActivities.length === 0"
              class="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-[11px] font-extrabold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 cursor-pointer"
              @click="handleExportExcel"
            >
              <FileSpreadsheet class="h-3.5 w-3.5" />
              Excel
            </button>
            <button
              type="button"
              :disabled="filteredActivities.length === 0"
              class="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-[11px] font-extrabold text-amber-900 hover:bg-amber-100 disabled:opacity-50 cursor-pointer"
              @click="handleExportPdf"
            >
              <FileText class="h-3.5 w-3.5" />
              PDF
            </button>
          </div>
        </div>

        <div v-if="filteredActivities.length === 0" class="p-10 text-center space-y-2">
          <p class="text-sm font-bold text-[#354442]">Tidak ada aktivitas yang cocok dengan filter saat ini.</p>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-full bg-[#1f6f6d] px-4 py-2 text-xs font-extrabold text-white cursor-pointer"
            @click="resetFilters"
          >
            <RotateCcw class="h-3.5 w-3.5" />
            Tampilkan Semua Aktivitas
          </button>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-[#f4f1ea] text-[#455553] uppercase tracking-wider text-[10px]">
              <tr>
                <th class="px-4 py-3.5 font-extrabold">Waktu</th>
                <th class="px-4 py-3.5 font-extrabold">Kategori</th>
                <th class="px-4 py-3.5 font-extrabold">Aktivitas &amp; Rincian</th>
                <th class="px-4 py-3.5 font-extrabold">Pelaku / Akun</th>
                <th class="px-4 py-3.5 font-extrabold">Referensi</th>
                <th class="px-4 py-3.5 font-extrabold text-right">Nominal</th>
                <th class="px-4 py-3.5 font-extrabold">Status</th>
                <th class="px-4 py-3.5 font-extrabold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#ebe5d8]">
              <tr
                v-for="item in filteredActivities"
                :key="item.id"
                class="hover:bg-[#fbf9f5] transition cursor-pointer"
                @click="selectedItem = item"
              >
                <td class="px-4 py-3.5 whitespace-nowrap">
                  <span class="font-bold text-[#162221]">{{ item.dateOnly }}</span>
                  <span class="block text-[10px] text-[#6d7a78]">{{ item.timestamp }}</span>
                </td>

                <td class="px-4 py-3.5 whitespace-nowrap">
                  <span
                    class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold"
                    :class="categoryBadgeClass(item.category)"
                  >
                    {{ item.categoryLabel }}
                  </span>
                </td>

                <td class="px-4 py-3.5 max-w-[300px]">
                  <p class="font-extrabold text-[#162221] line-clamp-1">{{ item.title }}</p>
                  <p class="text-[11px] text-[#5c6b69] line-clamp-2 mt-0.5">{{ item.description }}</p>
                </td>

                <td class="px-4 py-3.5">
                  <p class="font-bold text-[#162221]">{{ item.actor }}</p>
                  <p class="text-[10px] text-[#5c6b69] max-w-[200px] truncate">{{ item.actorContact }}</p>
                </td>

                <td class="px-4 py-3.5 whitespace-nowrap">
                  <span class="font-mono text-[11px] font-bold text-[#1f6f6d]">{{ item.referenceCode }}</span>
                </td>

                <td class="px-4 py-3.5 whitespace-nowrap text-right font-extrabold tabular-nums text-[#162221]">
                  {{ item.amount !== null ? formatRupiah(item.amount) : '—' }}
                </td>

                <td class="px-4 py-3.5 whitespace-nowrap">
                  <span
                    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold"
                    :class="statusBadgeClass(item.severity)"
                  >
                    {{ item.status }}
                  </span>
                </td>

                <td class="px-4 py-3.5 text-right whitespace-nowrap" @click.stop>
                  <button
                    type="button"
                    class="inline-flex items-center gap-1 rounded-full border border-[#dfd8c8] bg-white px-2.5 py-1 text-[11px] font-bold text-[#162221] hover:border-[#1f6f6d] hover:text-[#1f6f6d] cursor-pointer"
                    @click="selectedItem = item"
                  >
                    <Eye class="h-3 w-3" /> Detail
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Activity Detail Modal -->
      <Teleport to="body">
        <div
          v-if="selectedItem"
          class="fixed inset-0 z-50 flex items-center justify-center bg-[#0d2423]/60 backdrop-blur-xs p-4 print:hidden"
          @click.self="selectedItem = null"
        >
          <div class="w-full max-w-lg rounded-[28px] bg-[#fbf9f5] border border-white p-6 shadow-2xl space-y-4">
            <div class="flex items-start justify-between gap-3 pb-3 border-b border-[#e5dfd2]">
              <div class="space-y-1">
                <span
                  class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold"
                  :class="categoryBadgeClass(selectedItem.category)"
                >
                  {{ selectedItem.categoryLabel }}
                </span>
                <h3 class="font-editorial text-xl font-bold text-[#162221]">
                  {{ selectedItem.title }}
                </h3>
                <p class="text-xs text-[#5c6b69]">{{ selectedItem.timestamp }}</p>
              </div>
              <button
                type="button"
                class="rounded-full p-1.5 text-stone-500 hover:bg-stone-200 cursor-pointer"
                @click="selectedItem = null"
              >
                <X class="h-5 w-5" />
              </button>
            </div>

            <div class="rounded-2xl bg-white border border-[#e5dfd2] p-4 space-y-2 text-xs">
              <div class="flex justify-between gap-3">
                <span class="text-[#5c6b69]">Pelaku / Akun</span>
                <strong class="text-[#162221] text-right">{{ selectedItem.actor }}</strong>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-[#5c6b69]">Kontak / Info</span>
                <span class="text-[#354442] text-right">{{ selectedItem.actorContact }}</span>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-[#5c6b69]">Kode Referensi</span>
                <strong class="font-mono text-[#1f6f6d]">{{ selectedItem.referenceCode }}</strong>
              </div>
              <div class="flex justify-between gap-3">
                <span class="text-[#5c6b69]">Status</span>
                <span
                  class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold"
                  :class="statusBadgeClass(selectedItem.severity)"
                >
                  {{ selectedItem.status }}
                </span>
              </div>
              <div v-if="selectedItem.amount !== null" class="flex justify-between gap-3 pt-2 border-t border-dashed border-[#dfd8c8]">
                <span class="text-[#5c6b69] font-bold">Nominal Tercatat</span>
                <strong class="text-sm text-[#1f6f6d]">{{ formatRupiah(selectedItem.amount) }}</strong>
              </div>
            </div>

            <div class="rounded-2xl bg-white border border-[#e5dfd2] p-4 space-y-1 text-xs">
              <p class="text-[11px] font-extrabold uppercase tracking-wider text-[#5c6b69]">Rincian Aktivitas</p>
              <p class="text-[#22302e] leading-relaxed">{{ selectedItem.description }}</p>
            </div>

            <div class="flex items-center justify-between gap-2 pt-1">
              <NuxtLink
                v-if="selectedItem.detailLink"
                :to="selectedItem.detailLink"
                class="inline-flex items-center gap-1.5 rounded-full bg-[#1f6f6d] px-4 py-2 text-xs font-extrabold text-white hover:bg-[#175957]"
              >
                Buka Halaman Terkait
                <ArrowUpRight class="h-3.5 w-3.5" />
              </NuxtLink>
              <button
                type="button"
                class="rounded-full border border-[#dfd8c8] bg-white px-4 py-2 text-xs font-bold text-[#455553] cursor-pointer ml-auto"
                @click="selectedItem = null"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </Teleport>
    </div>

    <!-- ==================== DEDICATED PRINT / PDF REPORT LAYOUT ==================== -->
    <section class="hidden print:block text-[#162221] space-y-4">
      <!-- Official PDF Report Header -->
      <div class="flex items-start justify-between border-b-2 border-[#103f3e] pb-3">
        <div>
          <p class="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#1f6f6d]">
            JEJAKNUSA &bull; PLATFORM OPEN TRIP NUSANTARA
          </p>
          <h1 class="text-xl font-bold text-[#103f3e] mt-0.5">
            LAPORAN SEMUA AKTIVITAS MASUK
          </h1>
          <p class="text-[11px] text-[#455553] mt-0.5">
            Filter Aktif: <strong>{{ activeFilterLabel }}</strong>
          </p>
        </div>

        <div class="text-right text-[10px] text-[#455553] space-y-0.5">
          <p><strong>Tanggal Cetak:</strong> {{ generatedAt }}</p>
          <p><strong>Dicetak Oleh:</strong> {{ user?.name || 'Admin JejakNusa' }}</p>
          <p><strong>Jumlah Baris:</strong> {{ filteredActivities.length }} aktivitas</p>
        </div>
      </div>

      <!-- Executive Summary Strip for PDF -->
      <div class="grid grid-cols-4 gap-2 text-[10px]">
        <div class="rounded-lg border border-[#c7e4e0] bg-[#eef7f6] p-2.5">
          <p class="font-bold text-[#455553]">Total Aktivitas (Filter)</p>
          <p class="text-base font-extrabold text-[#103f3e]">{{ filteredActivities.length }}</p>
        </div>
        <div class="rounded-lg border border-[#c7e4e0] bg-[#eef7f6] p-2.5">
          <p class="font-bold text-[#455553]">Total Nominal Tercatat</p>
          <p class="text-base font-extrabold text-[#103f3e]">{{ formatRupiah(filteredTotalAmount) }}</p>
        </div>
        <div class="rounded-lg border border-[#dfd8c8] bg-[#fbf9f5] p-2.5">
          <p class="font-bold text-[#455553]">Transaksi / Peserta</p>
          <p class="text-base font-extrabold text-[#162221]">
            {{ summary?.totalBookings || 0 }} / {{ summary?.totalBookingParticipants || 0 }} org
          </p>
        </div>
        <div class="rounded-lg border border-[#dfd8c8] bg-[#fbf9f5] p-2.5">
          <p class="font-bold text-[#455553]">SOS Aktif / Antrean</p>
          <p class="text-base font-extrabold text-[#162221]">
            {{ summary?.activeSosCount || 0 }} / {{ summary?.pendingQueueCount || 0 }}
          </p>
        </div>
      </div>

      <!-- Full Activity Table for PDF -->
      <table class="w-full border-collapse text-[9.5px]">
        <thead>
          <tr class="bg-[#103f3e] text-white">
            <th class="border border-[#103f3e] px-2 py-1.5 text-left">No</th>
            <th class="border border-[#103f3e] px-2 py-1.5 text-left">Waktu</th>
            <th class="border border-[#103f3e] px-2 py-1.5 text-left">Kategori</th>
            <th class="border border-[#103f3e] px-2 py-1.5 text-left">Aktivitas &amp; Rincian</th>
            <th class="border border-[#103f3e] px-2 py-1.5 text-left">Pelaku / Kontak</th>
            <th class="border border-[#103f3e] px-2 py-1.5 text-left">Referensi</th>
            <th class="border border-[#103f3e] px-2 py-1.5 text-right">Nominal (Rp)</th>
            <th class="border border-[#103f3e] px-2 py-1.5 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in filteredActivities" :key="`pdf-${item.id}`" class="break-inside-avoid">
            <td class="border border-[#d9d2c5] px-2 py-1.5 align-top">{{ idx + 1 }}</td>
            <td class="border border-[#d9d2c5] px-2 py-1.5 align-top whitespace-nowrap">{{ item.timestamp }}</td>
            <td class="border border-[#d9d2c5] px-2 py-1.5 align-top font-bold whitespace-nowrap">{{ item.categoryLabel }}</td>
            <td class="border border-[#d9d2c5] px-2 py-1.5 align-top">
              <p class="font-bold text-[#162221]">{{ item.title }}</p>
              <p class="text-[#455553]">{{ item.description }}</p>
            </td>
            <td class="border border-[#d9d2c5] px-2 py-1.5 align-top">
              <p class="font-bold">{{ item.actor }}</p>
              <p class="text-[#5c6b69]">{{ item.actorContact }}</p>
            </td>
            <td class="border border-[#d9d2c5] px-2 py-1.5 align-top font-mono whitespace-nowrap">{{ item.referenceCode }}</td>
            <td class="border border-[#d9d2c5] px-2 py-1.5 align-top text-right font-bold whitespace-nowrap">
              {{ item.amount !== null ? formatRupiah(item.amount) : '—' }}
            </td>
            <td class="border border-[#d9d2c5] px-2 py-1.5 align-top font-bold whitespace-nowrap">{{ item.status }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="bg-[#eef7f6] font-extrabold">
            <td colspan="6" class="border border-[#103f3e] px-2 py-2 text-right text-[#103f3e]">
              TOTAL NOMINAL TERCATAT ({{ filteredActivities.length }} AKTIVITAS)
            </td>
            <td class="border border-[#103f3e] px-2 py-2 text-right text-[#103f3e] whitespace-nowrap">
              {{ formatRupiah(filteredTotalAmount) }}
            </td>
            <td class="border border-[#103f3e] px-2 py-2" />
          </tr>
        </tfoot>
      </table>

      <!-- Official Footer -->
      <div class="pt-3 border-t border-[#d9d2c5] flex items-center justify-between text-[9px] text-[#5c6b69]">
        <span>Dokumen resmi dihasilkan secara otomatis oleh JejakNusa Admin Command Center.</span>
        <span>Diverifikasi Sistem • {{ generatedAt }}</span>
      </div>
    </section>
  </div>
</template>

<style scoped>
@media print {
  @page {
    size: A4 landscape;
    margin: 10mm;
  }
}
</style>

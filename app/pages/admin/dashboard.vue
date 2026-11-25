<script setup lang="ts">
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Compass,
  FileBarChart2,
  MapPin,
  Radio,
  ShieldCheck,
  Sliders,
  TrendingUp,
  Users,
  Wallet
} from 'lucide-vue-next'
import type { CustomerBookingRecord, PlatformFeatureFlags, SosAlertRecord } from '#shared/types/booking'
import type { GuideManagedTripItem } from '#shared/types/guide'
import { formatDateID, formatRupiah } from '~/utils/format'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  allowedRoles: ['admin']
})

useSeoMeta({
  title: 'Admin Command Center — Monitoring Destinasi & Transaksi | JejakNusa',
  description: 'Monitoring destinasi pilihan pelanggan secara real-time, analitik GMV, komisi platform, dan Live SOS Monitor.'
})

interface PopularDestinationStat {
  tripSlug: string
  tripTitle: string
  location: string
  guideName: string
  bookingsCount: number
  participantsCount: number
  totalRevenue: number
  paidCount: number
}

interface AdminAnalyticsResponse {
  metrics: {
    totalGmv: number
    platformCommission: number
    commissionPercent: number
    totalTransactions: number
    totalBookedParticipants: number
    activeTripsCount: number
    activeSosCount: number
    pendingVerifications: number
    pendingPayouts: number
    pendingRefunds: number
  }
  popularDestinations: PopularDestinationStat[]
  recentBookings: CustomerBookingRecord[]
  features: PlatformFeatureFlags
  sosAlerts: SosAlertRecord[]
  liveTrips: GuideManagedTripItem[]
}

const { data, refresh } = await useFetch<AdminAnalyticsResponse>('/api/admin/analytics')

const metrics = computed(() => data.value?.metrics)
const popularDestinations = computed(() => data.value?.popularDestinations ?? [])
const recentBookings = computed(() => data.value?.recentBookings ?? [])
const sosAlerts = computed(() => data.value?.sosAlerts ?? [])
const liveTrips = computed(() => data.value?.liveTrips ?? [])

const resolvingId = ref('')
async function resolveSos(id: string) {
  resolvingId.value = id
  try {
    await $fetch(`/api/sos/${id}`, { method: 'PATCH' })
    await refresh()
  } finally {
    resolvingId.value = ''
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Command Center Hero -->
    <div class="rounded-[28px] teal-card p-6 sm:p-7 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div class="space-y-1.5">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-amber-300/20 border border-amber-300/35 px-3 py-1 text-[11px] font-extrabold text-amber-200">
          <Activity class="h-3.5 w-3.5" />
          Admin Command Center &amp; Real-Time Monitoring
        </span>
        <h1 class="font-editorial text-2xl sm:text-3xl font-bold">
          Pusat Kontrol Platform JejakNusa
        </h1>
        <p class="text-xs sm:text-sm text-teal-100/90 max-w-2xl">
          Pantau destinasi yang sedang dipilih pelanggan secara real-time, verifikasi transaksi QRIS, kelola toggle fitur platform, dan awasi sinyal darurat SOS.
        </p>
      </div>

      <div class="flex flex-wrap gap-2 shrink-0">
        <NuxtLink
          to="/admin/reports"
          class="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-4 py-2.5 text-xs font-extrabold text-[#162221] hover:bg-amber-300 transition shadow-sm"
        >
          <FileBarChart2 class="h-4 w-4" />
          Laporan Aktivitas (PDF/Excel)
        </NuxtLink>
        <NuxtLink
          to="/admin/bookings"
          class="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-xs font-extrabold text-[#103f3e] hover:bg-amber-50 transition"
        >
          <ClipboardList class="h-4 w-4" />
          Semua Transaksi ({{ metrics?.totalTransactions || 0 }})
        </NuxtLink>
        <NuxtLink
          to="/admin/features"
          class="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/25 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-white/25 transition"
        >
          <Sliders class="h-4 w-4" />
          Manajemen Fitur
        </NuxtLink>
        <NuxtLink
          to="/admin/verifications"
          class="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/25 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-white/25 transition"
        >
          <ShieldCheck class="h-4 w-4" />
          Verifikasi ({{ metrics?.pendingVerifications || 0 }})
        </NuxtLink>
      </div>
    </div>

    <!-- KPI Analytics Cards -->
    <div v-if="metrics" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <div class="min-w-0 rounded-[24px] bg-white border border-[#e5dfd2] p-5 flex flex-col justify-between gap-3 shadow-xs">
        <div class="flex items-center justify-between gap-2">
          <p class="text-xs font-bold text-[#5c6b69]">Total GMV Platform</p>
          <span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eef7f6] text-[#1f6f6d]">
            <TrendingUp class="h-4.5 w-4.5" />
          </span>
        </div>
        <div class="min-w-0 space-y-1">
          <p class="text-xl 2xl:text-2xl font-extrabold tracking-tight tabular-nums text-[#162221] leading-snug break-words">
            {{ formatRupiah(metrics.totalGmv) }}
          </p>
          <p class="text-[11px] font-medium text-[#6d7a78]">
            {{ metrics.totalTransactions }} transaksi &bull; {{ metrics.totalBookedParticipants }} peserta
          </p>
        </div>
      </div>

      <div class="min-w-0 rounded-[24px] bg-white border border-[#e5dfd2] p-5 flex flex-col justify-between gap-3 shadow-xs">
        <div class="flex items-center justify-between gap-2">
          <p class="text-xs font-bold text-[#5c6b69]">Komisi Platform ({{ metrics.commissionPercent }}%)</p>
          <span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Wallet class="h-4.5 w-4.5" />
          </span>
        </div>
        <div class="min-w-0 space-y-1">
          <p class="text-xl 2xl:text-2xl font-extrabold tracking-tight tabular-nums text-emerald-800 leading-snug break-words">
            {{ formatRupiah(metrics.platformCommission) }}
          </p>
          <p class="text-[11px] font-medium text-[#6d7a78]">
            {{ metrics.pendingPayouts }} payout &bull; {{ metrics.pendingRefunds }} refund menunggu
          </p>
        </div>
      </div>

      <div class="min-w-0 rounded-[24px] bg-white border border-[#e5dfd2] p-5 flex flex-col justify-between gap-3 shadow-xs">
        <div class="flex items-center justify-between gap-2">
          <p class="text-xs font-bold text-[#5c6b69]">Destinasi Dipilih</p>
          <span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <Compass class="h-4.5 w-4.5" />
          </span>
        </div>
        <div class="min-w-0 space-y-1">
          <p class="text-xl 2xl:text-2xl font-extrabold tracking-tight tabular-nums text-[#162221] leading-snug">
            {{ popularDestinations.length }}
            <span class="text-sm font-bold text-[#4a5f5d]">Destinasi</span>
          </p>
          <p class="text-[11px] font-medium text-[#6d7a78]">Terpantau real-time dari checkout</p>
        </div>
      </div>

      <div
        class="min-w-0 rounded-[24px] border p-5 flex flex-col justify-between gap-3 shadow-xs"
        :class="metrics.activeSosCount > 0 ? 'bg-rose-50 border-rose-300' : 'bg-white border-[#e5dfd2]'"
      >
        <div class="flex items-center justify-between gap-2">
          <p class="text-xs font-bold" :class="metrics.activeSosCount > 0 ? 'text-rose-900' : 'text-[#5c6b69]'">
            Emergency SOS Aktif
          </p>
          <span
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            :class="metrics.activeSosCount > 0 ? 'bg-rose-600 text-white' : 'bg-emerald-50 text-emerald-700'"
          >
            <Radio class="h-4.5 w-4.5" />
          </span>
        </div>
        <div class="min-w-0 space-y-1">
          <p
            class="text-xl 2xl:text-2xl font-extrabold tracking-tight tabular-nums leading-snug"
            :class="metrics.activeSosCount > 0 ? 'text-rose-700' : 'text-emerald-700'"
          >
            {{ metrics.activeSosCount }}
            <span class="text-sm font-bold">Sinyal Aktif</span>
          </p>
          <p class="text-[11px] font-medium" :class="metrics.activeSosCount > 0 ? 'text-rose-800' : 'text-[#6d7a78]'">
            {{ metrics.activeSosCount > 0 ? 'Segera tindak lanjuti di bawah!' : 'Seluruh trip terpantau aman' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Real-Time Widget: Destinasi Sedang Dipilih Pelanggan -->
    <section class="rounded-[28px] bg-white border border-[#e5dfd2] p-6 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span class="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#1f6f6d]">
            <Compass class="h-4 w-4" />
            Monitoring Real-Time Destinasi Populer
          </span>
          <h2 class="font-editorial text-xl font-bold text-[#162221] mt-0.5">
            Destinasi yang Sedang Dipilih &amp; Dipesan Pelanggan
          </h2>
        </div>

        <button
          type="button"
          class="rounded-full border border-[#dfd8c8] bg-[#fbf9f5] px-4 py-1.5 text-xs font-bold text-[#354442] hover:border-[#1f6f6d] cursor-pointer self-start sm:self-auto"
          @click="() => refresh()"
        >
          Refresh Monitoring
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="(dest, idx) in popularDestinations"
          :key="dest.tripSlug"
          class="rounded-2xl border border-[#e5dfd2] bg-[#fbf9f5] p-4 space-y-2.5"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="rounded-full bg-[#1f6f6d] px-2.5 py-0.5 text-[10px] font-extrabold text-white">
              #{{ idx + 1 }} Terpilih
            </span>
            <span class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800">
              <Users class="h-3 w-3" />
              {{ dest.participantsCount }} Peserta
            </span>
          </div>

          <div>
            <h3 class="text-sm font-extrabold text-[#162221] line-clamp-1">{{ dest.tripTitle }}</h3>
            <p class="text-xs text-[#5c6b69]">{{ dest.location }} &bull; Pemandu: {{ dest.guideName }}</p>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-[#e8e2d5] text-xs">
            <span class="text-[#5c6b69]">{{ dest.bookingsCount }} pesanan ({{ dest.paidCount }} terbayar)</span>
            <span class="font-extrabold text-[#1f6f6d]">{{ formatRupiah(dest.totalRevenue) }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Real-Time Customer Transactions Preview -->
    <section class="rounded-[28px] bg-white border border-[#e5dfd2] p-6 space-y-4">
      <div class="flex items-center justify-between gap-2">
        <div>
          <h2 class="font-editorial text-xl font-bold text-[#162221]">
            Log Pemesanan &amp; Transaksi Terbaru ({{ recentBookings.length }})
          </h2>
          <p class="text-xs text-[#5c6b69]">Setiap transaksi QRIS dari pelanggan otomatis tercatat di sini secara real-time.</p>
        </div>
        <NuxtLink to="/admin/bookings" class="text-xs font-extrabold text-[#1f6f6d] hover:underline">
          Buka Tabel Lengkap &rarr;
        </NuxtLink>
      </div>

      <div class="overflow-x-auto rounded-2xl border border-[#e5dfd2]">
        <table class="w-full text-left text-xs">
          <thead class="bg-[#f4f1ea] text-[#455553] uppercase tracking-wider text-[10px]">
            <tr>
              <th class="px-4 py-3 font-extrabold">Invoice</th>
              <th class="px-4 py-3 font-extrabold">Pelanggan</th>
              <th class="px-4 py-3 font-extrabold">Destinasi &amp; Pemandu</th>
              <th class="px-4 py-3 font-extrabold">Nominal</th>
              <th class="px-4 py-3 font-extrabold">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#ebe5d8]">
            <tr v-for="bk in recentBookings" :key="bk.id" class="hover:bg-[#fbf9f5]">
              <td class="px-4 py-3 font-mono font-bold text-[#162221]">
                <NuxtLink :to="`/customer/transactions/${bk.id}`" class="text-[#1f6f6d] hover:underline">
                  {{ bk.invoiceNumber }}
                </NuxtLink>
              </td>
              <td class="px-4 py-3">
                <p class="font-extrabold text-[#162221]">{{ bk.leaderName }}</p>
                <p class="text-[11px] text-[#5c6b69]">{{ bk.participantsCount }} peserta &bull; {{ bk.customerPhone }}</p>
              </td>
              <td class="px-4 py-3">
                <p class="font-bold text-[#162221] line-clamp-1">{{ bk.tripTitle }}</p>
                <p class="text-[11px] text-[#5c6b69]">Pemandu: {{ bk.guideName }}</p>
              </td>
              <td class="px-4 py-3 font-extrabold text-[#162221]">
                {{ formatRupiah(bk.totalAmount) }}
                <span class="block text-[10px] font-semibold text-[#5c6b69]">{{ bk.paymentMethod }}</span>
              </td>
              <td class="px-4 py-3">
                <span
                  class="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold"
                  :class="
                    bk.paymentStatus === 'LUNAS'
                      ? 'bg-emerald-100 text-emerald-800'
                      : bk.paymentStatus === 'DP 30% Lunas'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-orange-100 text-orange-800'
                  "
                >
                  {{ bk.paymentStatus }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Live Trip Monitor & Emergency SOS Panel -->
    <section class="rounded-[28px] bg-white border border-[#e5dfd2] p-6 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span class="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-rose-700">
            <AlertTriangle class="h-4 w-4" />
            Live Trip Monitor — Emergency SOS Alerts
          </span>
          <h2 class="font-editorial text-xl font-bold text-[#162221] mt-0.5">
            Pantauan Sinyal Darurat Lapangan ({{ sosAlerts.length }})
          </h2>
        </div>
      </div>

      <div class="space-y-3">
        <div
          v-for="alert in sosAlerts"
          :key="alert.id"
          class="rounded-2xl border p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
          :class="alert.status === 'ACTIVE' ? 'border-rose-300 bg-rose-50/70' : 'border-emerald-200 bg-emerald-50/40'"
        >
          <div class="space-y-1.5">
            <div class="flex flex-wrap items-center gap-2">
              <span
                class="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold"
                :class="alert.status === 'ACTIVE' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'"
              >
                {{ alert.status === 'ACTIVE' ? 'SOS AKTIF — BUTUH RESPON' : 'TERTANGANI (RESOLVED)' }}
              </span>
              <span class="text-xs font-bold text-[#455553]">{{ alert.createdAt }}</span>
            </div>

            <h3 class="text-sm sm:text-base font-extrabold text-[#162221]">
              {{ alert.tripTitle }} — Pelapor: {{ alert.reporterName }}
            </h3>
            <p class="text-xs text-[#3c4a48]">{{ alert.message }}</p>
            <p class="text-xs font-bold text-rose-900 inline-flex items-center gap-1.5">
              <MapPin class="h-3.5 w-3.5 text-rose-600" />
              {{ alert.locationLabel }} &bull; GPS: {{ alert.latitude }}, {{ alert.longitude }}
            </p>
          </div>

          <div class="shrink-0">
            <button
              v-if="alert.status === 'ACTIVE'"
              type="button"
              :disabled="resolvingId === alert.id"
              class="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-rose-700 disabled:opacity-60 transition cursor-pointer"
              @click="resolveSos(alert.id)"
            >
              <CheckCircle2 class="h-4 w-4" />
              {{ resolvingId === alert.id ? 'Memproses...' : 'Tandai Tertangani' }}
            </button>
            <span
              v-else
              class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3.5 py-1.5 text-xs font-extrabold text-emerald-800"
            >
              <CheckCircle2 class="h-4 w-4" />
              Selesai
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- Active Trips Trail Status Overview -->
    <section class="rounded-[28px] bg-white border border-[#e5dfd2] p-6 space-y-4">
      <h2 class="font-editorial text-xl font-bold text-[#162221]">
        Status Jalur &amp; Cuaca Trip Berjalan ({{ liveTrips.length }})
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          v-for="trip in liveTrips"
          :key="trip.id"
          class="rounded-2xl border border-[#e5dfd2] bg-[#fbf9f5] p-4 space-y-2"
        >
          <div class="flex items-center justify-between gap-2">
            <span
              class="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold"
              :class="
                trip.trailWeatherStatus === 'Buka'
                  ? 'bg-emerald-100 text-emerald-800'
                  : trip.trailWeatherStatus === 'Waspada Hujan'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
              "
            >
              {{ trip.trailWeatherStatus }}
            </span>
            <span class="text-[11px] font-bold text-[#5c6b69]">{{ formatDateID(trip.nextDepartureDate) }}</span>
          </div>
          <p class="text-sm font-extrabold text-[#162221] line-clamp-1">{{ trip.title }}</p>
          <p class="text-xs text-[#5c6b69]">{{ trip.location }} &bull; {{ trip.bookedCount }}/{{ trip.totalQuota }} pax</p>
        </div>
      </div>
    </section>
  </div>
</template>

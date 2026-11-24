<script setup lang="ts">
import {
  BadgeCheck,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Phone,
  PlusCircle,
  ShieldAlert,
  TrendingUp,
  UserCheck,
  Users,
  Wallet
} from 'lucide-vue-next'
import type { CustomerBookingRecord } from '#shared/types/booking'
import type { GuideManagedTripItem, GuidePayoutRecord } from '#shared/types/guide'
import { formatDateID, formatRupiah } from '~/utils/format'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  allowedRoles: ['guide']
})

useSeoMeta({
  title: 'Dashboard Pemandu Lokal — JejakNusa',
  description: 'Ringkasan pendapatan bersih, pelanggan yang memilih Anda sebagai pemandu, dan jadwal keberangkatan.'
})

interface GuideTripsOverview {
  guide: {
    name: string
    origin: string
    verified: boolean
    verificationStatus: 'approved' | 'pending' | 'rejected'
    certification: string
  }
  stats: {
    commissionPercent: number
    grossRevenue: number
    platformCommission: number
    netRevenue: number
    totalParticipants: number
    myCustomersCount: number
    openTripsCount: number
    totalTripsCount: number
  }
  myBookings: CustomerBookingRecord[]
  allBookings: CustomerBookingRecord[]
  trips: GuideManagedTripItem[]
  payouts: GuidePayoutRecord[]
}

const { data, refresh } = await useFetch<GuideTripsOverview>('/api/guide/trips')

const guideInfo = computed(() => data.value?.guide)
const stats = computed(() => data.value?.stats)
const trips = computed(() => data.value?.trips ?? [])
const recentCustomers = computed(() => {
  const own = data.value?.myBookings ?? []
  const all = data.value?.allBookings ?? []
  return own.length ? [...own, ...all.filter((a) => !own.some((o) => o.id === a.id))].slice(0, 5) : all.slice(0, 5)
})
</script>

<template>
  <div class="space-y-6">
    <!-- Verification Status & Hero Banner -->
    <div class="rounded-[28px] teal-card p-6 sm:p-7 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-5">
      <div class="space-y-2">
        <div class="flex flex-wrap items-center gap-2">
          <span
            v-if="guideInfo?.verified"
            class="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 border border-emerald-300/40 px-3 py-1 text-xs font-extrabold text-emerald-100"
          >
            <BadgeCheck class="h-4 w-4 text-emerald-300" />
            Terverifikasi — {{ guideInfo.certification }}
          </span>
          <span
            v-else
            class="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 border border-amber-300/40 px-3 py-1 text-xs font-extrabold text-amber-100"
          >
            <Clock class="h-4 w-4 text-amber-300" />
            Status Verifikasi: Menunggu Persetujuan Admin ({{ guideInfo?.certification }})
          </span>
        </div>

        <h1 class="font-editorial text-2xl sm:text-3xl font-bold">
          Portal Operasional — {{ guideInfo?.name }}
        </h1>
        <p class="text-xs sm:text-sm text-teal-100/90 max-w-2xl">
          Pantau pelanggan yang baru saja membayar via QRIS secara real-time, kelola kuota &amp; cuaca jalur, serta hitung pendapatan bersih otomatis sesuai konfigurasi komisi platform.
        </p>
      </div>

      <div class="flex flex-wrap gap-2.5 shrink-0">
        <NuxtLink
          to="/guide/customers"
          class="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-xs font-extrabold text-[#103f3e] hover:bg-amber-50 transition"
        >
          <UserCheck class="h-4 w-4" />
          Daftar Peserta ({{ recentCustomers.length }})
        </NuxtLink>
        <NuxtLink
          to="/guide/trips/create"
          class="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/25 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-white/25 transition"
        >
          <PlusCircle class="h-4 w-4" />
          Buat Paket Trip
        </NuxtLink>
      </div>
    </div>

    <!-- Pending Notice if Newly Registered Guide -->
    <div
      v-if="guideInfo && !guideInfo.verified"
      class="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3 text-xs text-amber-900"
    >
      <ShieldAlert class="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
      <div>
        <p class="font-extrabold">Lisensi Anda Sedang Ditinjau Administrator</p>
        <p class="mt-0.5">
          Dokumen sertifikasi Anda sudah masuk ke halaman <code>/admin/verifications</code>. Begitu Admin menekan <strong>Setujui (Approve)</strong>, lencana Terverifikasi Anda akan aktif otomatis.
        </p>
      </div>
    </div>

    <!-- KPI Metrics Grid -->
    <div v-if="stats" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <div class="min-w-0 rounded-[24px] bg-white border border-[#e5dfd2] p-5 flex flex-col justify-between gap-3 shadow-xs">
        <div class="flex items-center justify-between gap-2">
          <p class="text-xs font-bold text-[#5c6b69]">Pendapatan Bersih ({{ 100 - stats.commissionPercent }}%)</p>
          <span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Wallet class="h-4.5 w-4.5" />
          </span>
        </div>
        <div class="min-w-0 space-y-1">
          <p class="text-xl 2xl:text-2xl font-extrabold tracking-tight tabular-nums text-[#162221] leading-snug break-words">
            {{ formatRupiah(stats.netRevenue) }}
          </p>
          <p class="text-[11px] font-medium text-[#6d7a78]">Pasca komisi platform {{ stats.commissionPercent }}%</p>
        </div>
      </div>

      <div class="min-w-0 rounded-[24px] bg-white border border-[#e5dfd2] p-5 flex flex-col justify-between gap-3 shadow-xs">
        <div class="flex items-center justify-between gap-2">
          <p class="text-xs font-bold text-[#5c6b69]">Pendapatan Kotor (GMV)</p>
          <span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eef7f6] text-[#1f6f6d]">
            <TrendingUp class="h-4.5 w-4.5" />
          </span>
        </div>
        <div class="min-w-0 space-y-1">
          <p class="text-xl 2xl:text-2xl font-extrabold tracking-tight tabular-nums text-[#162221] leading-snug break-words">
            {{ formatRupiah(stats.grossRevenue) }}
          </p>
          <p class="text-[11px] font-medium text-[#6d7a78]">Komisi ({{ stats.commissionPercent }}%): {{ formatRupiah(stats.platformCommission) }}</p>
        </div>
      </div>

      <div class="min-w-0 rounded-[24px] bg-white border border-[#e5dfd2] p-5 flex flex-col justify-between gap-3 shadow-xs">
        <div class="flex items-center justify-between gap-2">
          <p class="text-xs font-bold text-[#5c6b69]">Total Peserta Masuk</p>
          <span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <Users class="h-4.5 w-4.5" />
          </span>
        </div>
        <div class="min-w-0 space-y-1">
          <p class="text-xl 2xl:text-2xl font-extrabold tracking-tight tabular-nums text-[#162221] leading-snug">
            {{ stats.totalParticipants }}
            <span class="text-sm font-bold text-[#4a5f5d]">Orang</span>
          </p>
          <p class="text-[11px] font-medium text-[#6d7a78]">{{ stats.myCustomersCount }} pesanan memilih Anda langsung</p>
        </div>
      </div>

      <div class="min-w-0 rounded-[24px] bg-white border border-[#e5dfd2] p-5 flex flex-col justify-between gap-3 shadow-xs">
        <div class="flex items-center justify-between gap-2">
          <p class="text-xs font-bold text-[#5c6b69]">Paket Trip Dibuka</p>
          <span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
            <Briefcase class="h-4.5 w-4.5" />
          </span>
        </div>
        <div class="min-w-0 space-y-1">
          <p class="text-xl 2xl:text-2xl font-extrabold tracking-tight tabular-nums text-[#162221] leading-snug">
            {{ stats.openTripsCount }} / {{ stats.totalTripsCount }}
            <span class="text-sm font-bold text-[#4a5f5d]">Paket</span>
          </p>
          <p class="text-[11px] font-medium text-[#6d7a78]">Status kuota aktif</p>
        </div>
      </div>
    </div>

    <!-- Real-Time Customers Selecting This Guide -->
    <section class="rounded-[28px] bg-white border border-[#e5dfd2] p-6 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span class="text-xs font-extrabold uppercase tracking-wider text-[#1f6f6d]">
            Sinkronisasi Transaksi Real-Time
          </span>
          <h2 class="font-editorial text-xl font-bold text-[#162221]">
            Pelanggan Terbaru yang Memilih Paket Anda
          </h2>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="rounded-full border border-[#dfd8c8] bg-[#fbf9f5] px-3.5 py-1.5 text-xs font-bold text-[#354442] hover:border-[#1f6f6d] cursor-pointer"
            @click="() => refresh()"
          >
            Refresh Data
          </button>
          <NuxtLink
            to="/guide/customers"
            class="rounded-full bg-[#1f6f6d] px-4 py-1.5 text-xs font-extrabold text-white hover:bg-[#175957]"
          >
            Kelola Semua Peserta &rarr;
          </NuxtLink>
        </div>
      </div>

      <div class="space-y-3">
        <div
          v-for="cust in recentCustomers"
          :key="cust.id"
          class="rounded-2xl border p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
          :class="
            cust.guideName === guideInfo?.name
              ? 'border-[#c7e4e0] bg-[#eef7f6]/60'
              : 'border-[#e8e2d5] bg-[#fbf9f5]'
          "
        >
          <div class="space-y-1">
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="rounded-full bg-white border border-[#dfd8c8] px-2.5 py-0.5 text-[10px] font-mono font-extrabold text-[#162221]">
                {{ cust.invoiceNumber }}
              </span>
              <span
                class="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold"
                :class="
                  cust.paymentStatus === 'LUNAS'
                    ? 'bg-emerald-100 text-emerald-800'
                    : cust.paymentStatus === 'DP 30% Lunas'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-orange-100 text-orange-800'
                "
              >
                {{ cust.paymentStatus }}
              </span>
              <span
                v-if="cust.guideName === guideInfo?.name"
                class="rounded-full bg-[#1f6f6d] px-2.5 py-0.5 text-[10px] font-extrabold text-white"
              >
                Memilih Anda
              </span>
              <span
                v-if="cust.checkedIn"
                class="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white"
              >
                <CheckCircle2 class="h-3 w-3" /> Check-in
              </span>
            </div>
            <p class="text-sm font-extrabold text-[#162221]">
              {{ cust.leaderName }} ({{ cust.participantsCount }} peserta) — {{ cust.tripTitle }}
            </p>
            <p class="text-xs text-[#5c6b69] flex flex-wrap items-center gap-3">
              <span class="inline-flex items-center gap-1"><Phone class="h-3.5 w-3.5 text-[#1f6f6d]" /> {{ cust.customerPhone }}</span>
              <span class="inline-flex items-center gap-1"><Calendar class="h-3.5 w-3.5 text-[#1f6f6d]" /> {{ formatDateID(cust.departureDate) }}</span>
              <span>Pemandu: <strong>{{ cust.guideName }}</strong></span>
            </p>
            <p class="text-[11px] text-[#455553]">Catatan: {{ cust.specialNotes }}</p>
          </div>

          <div class="flex items-center gap-3 shrink-0">
            <div class="text-right">
              <span class="block text-[10px] text-[#5c6b69]">Dibayar ({{ cust.paymentMethod }})</span>
              <span class="text-sm font-extrabold text-[#1f6f6d]">{{ formatRupiah(cust.paidAmount) }}</span>
            </div>
            <NuxtLink
              to="/guide/customers"
              class="rounded-full border border-[#1f6f6d] bg-white px-3.5 py-1.5 text-xs font-extrabold text-[#1f6f6d] hover:bg-[#1f6f6d] hover:text-white transition"
            >
              Detail
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Upcoming Departures List -->
    <section class="rounded-[28px] bg-white border border-[#e5dfd2] p-6 space-y-4">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h2 class="font-editorial text-xl font-bold text-[#162221]">Jadwal Keberangkatan Terdekat</h2>
          <p class="text-xs text-[#5c6b69]">Ringkasan status kuota dan kondisi jalur/cuaca paket open trip Anda.</p>
        </div>
        <NuxtLink to="/guide/trips" class="text-xs font-extrabold text-[#1f6f6d] hover:underline">
          Kelola Semua Paket &rarr;
        </NuxtLink>
      </div>

      <div class="space-y-3">
        <div
          v-for="trip in trips"
          :key="trip.id"
          class="rounded-2xl border border-[#e8e2d5] bg-[#fbf9f5] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div class="flex items-center gap-3.5 min-w-0">
            <img :src="trip.coverImage" :alt="trip.title" class="h-16 w-20 rounded-xl object-cover shrink-0">
            <div class="min-w-0 space-y-1">
              <div class="flex flex-wrap items-center gap-1.5">
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
                  Jalur: {{ trip.trailWeatherStatus }}
                </span>
                <span
                  class="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold"
                  :class="trip.quotaOpen ? 'bg-teal-100 text-teal-800' : 'bg-stone-200 text-stone-700'"
                >
                  {{ trip.quotaOpen ? 'Kuota Dibuka' : 'Kuota Ditutup' }}
                </span>
              </div>
              <p class="text-sm font-extrabold text-[#162221] truncate">{{ trip.title }}</p>
              <p class="text-xs text-[#5c6b69]">
                {{ formatDateID(trip.nextDepartureDate) }} &bull; {{ trip.bookedCount }}/{{ trip.totalQuota }} peserta
              </p>
            </div>
          </div>

          <NuxtLink
            to="/guide/trips"
            class="rounded-full border border-[#1f6f6d] px-3.5 py-1.5 text-xs font-extrabold text-[#1f6f6d] hover:bg-[#1f6f6d] hover:text-white transition self-start sm:self-center"
          >
            Atur Jalur
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  Award,
  CheckCircle2,
  Compass,
  Gift,
  MapPin,
  Sparkles,
  Stamp,
  Trophy
} from 'lucide-vue-next'
import type { CustomerBookingRecord } from '#shared/types/booking'
import type { PassportProfileResponse } from '#shared/types/ecosystem'
import { formatDateID } from '~/utils/format'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  allowedRoles: ['customer']
})

useSeoMeta({
  title: 'Adventure Passport & Lencana — JejakNusa',
  description: 'Lihat koleksi stempel digital, lencana pencapaian, poin loyalitas, sertifikat trip, dan peta jejak Nusantara Anda.'
})

const { user } = useAuth()

const [{ data: passportData, refresh }, { data: bookingsData }] = await Promise.all([
  useFetch<PassportProfileResponse>('/api/passport'),
  useFetch<{ bookings: CustomerBookingRecord[] }>('/api/bookings')
])

const eligibleTripBookings = computed(() =>
  (bookingsData.value?.bookings ?? []).filter(
    (b) => b.bookingType !== 'hotel' && b.paymentStatus !== 'MENUNGGU PEMBAYARAN'
  )
)
const claimedCertificates = computed(() =>
  eligibleTripBookings.value.filter((b) => b.certificateClaimed)
)
const claimableTrips = computed(() =>
  eligibleTripBookings.value.filter(
    (b) => b.bookingStatus === 'Selesai' && b.certificateSent && !b.certificateClaimed
  )
)

const passport = computed(() => passportData.value ?? null)
const redeemMessage = ref('')
const redeemError = ref('')
const redeemingId = ref('')

async function handleRedeem(rewardId: string) {
  redeemMessage.value = ''
  redeemError.value = ''
  redeemingId.value = rewardId
  try {
    const res = await $fetch<{ message?: string }>('/api/passport/redeem', {
      method: 'POST',
      body: { rewardId }
    })
    redeemMessage.value = res.message || 'Hadiah berhasil ditukar dengan poin loyalitas!'
    await refresh()
  } catch (err: unknown) {
    if (err && typeof err === 'object') {
      const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
      redeemError.value = e.data?.statusMessage || e.statusMessage || 'Gagal menukar poin.'
    } else {
      redeemError.value = 'Gagal menukar poin.'
    }
  } finally {
    redeemingId.value = ''
  }
}

const mapProvinces = [
  { id: 'sumatra', label: 'Sumatra', cx: 115, cy: 110, provinces: ['Sumatera Barat', 'Sumatera Utara', 'Aceh'] },
  { id: 'jawa', label: 'Jawa & DIY', cx: 235, cy: 180, provinces: ['Jawa Tengah', 'Jawa Barat', 'DI Yogyakarta', 'Jawa Timur'] },
  { id: 'bali', label: 'Bali', cx: 315, cy: 192, provinces: ['Bali'] },
  { id: 'ntb', label: 'NTB (Lombok)', cx: 358, cy: 196, provinces: ['Nusa Tenggara Barat'] },
  { id: 'ntt', label: 'NTT (Komodo)', cx: 425, cy: 198, provinces: ['Nusa Tenggara Timur'] },
  { id: 'kalimantan', label: 'Kalimantan', cx: 290, cy: 95, provinces: ['Kalimantan Timur', 'Kalimantan Barat'] },
  { id: 'sulawesi', label: 'Sulawesi', cx: 405, cy: 108, provinces: ['Sulawesi Selatan', 'Sulawesi Utara'] },
  { id: 'papua', label: 'Papua', cx: 555, cy: 135, provinces: ['Papua Barat Daya', 'Papua'] }
]

function isRegionVisited(provinces: string[]): boolean {
  const visited = passport.value?.visitedProvinces ?? []
  return provinces.some((p) => visited.includes(p))
}
</script>

<template>
  <div v-if="passport" class="space-y-6">
    <!-- Top Passport Summary Card -->
    <div class="rounded-[28px] teal-card p-6 sm:p-8 text-white grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
      <div class="lg:col-span-7 space-y-2">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-amber-200">
          <Trophy class="h-3.5 w-3.5" />
          Tier Member: {{ passport.tier }}
        </span>
        <h1 class="font-editorial text-2xl sm:text-3xl font-bold">
          Adventure Passport — {{ user?.name || passport.explorerName }}
        </h1>
        <p class="text-xs sm:text-sm text-teal-100/90">
          Setiap trip yang selesai memberikan stempel destinasi, lencana digital, dan poin loyalitas untuk diskon maupun akses lebih awal (early access).
        </p>
      </div>

      <div class="lg:col-span-5 grid grid-cols-3 gap-3">
        <div class="rounded-2xl bg-white/12 border border-white/20 p-3.5 text-center">
          <span class="block text-2xl font-extrabold text-amber-300">{{ passport.points }}</span>
          <span class="text-[10px] font-bold uppercase tracking-wider text-teal-100">Poin Aktif</span>
        </div>
        <div class="rounded-2xl bg-white/12 border border-white/20 p-3.5 text-center">
          <span class="block text-2xl font-extrabold text-white">{{ passport.stamps.length }}</span>
          <span class="text-[10px] font-bold uppercase tracking-wider text-teal-100">Stempel Trip</span>
        </div>
        <div class="rounded-2xl bg-white/12 border border-white/20 p-3.5 text-center">
          <span class="block text-2xl font-extrabold text-white">{{ passport.visitedProvinces.length }}</span>
          <span class="text-[10px] font-bold uppercase tracking-wider text-teal-100">Provinsi</span>
        </div>
      </div>
    </div>

    <!-- Interactive Indonesia Travel Map -->
    <section class="rounded-[28px] bg-white border border-[#e5dfd2] p-6 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span class="text-xs font-extrabold uppercase tracking-wider text-[#1f6f6d] flex items-center gap-1.5">
            <MapPin class="h-4 w-4" />
            Peta Jejak Pribadi Nusantara
          </span>
          <h2 class="font-editorial text-xl font-bold text-[#162221]">Wilayah yang Sudah Dijelajahi</h2>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-if="!passport.visitedProvinces.length"
            class="rounded-full bg-[#f4f1ea] border border-[#e3dccd] px-3 py-1 text-[11px] font-bold text-[#6d7a78]"
          >
            0 Provinsi — Belum ada perjalanan selesai
          </span>
          <span
            v-for="prov in passport.visitedProvinces"
            :key="prov"
            class="rounded-full bg-[#eef7f6] border border-[#c7e4e0] px-2.5 py-1 text-[11px] font-bold text-[#175957]"
          >
            ✓ {{ prov }}
          </span>
        </div>
      </div>

      <div class="rounded-2xl bg-[#eef7f6] border border-[#c7e4e0] p-4 overflow-x-auto">
        <svg viewBox="0 0 660 250" class="w-full min-w-[520px] h-52">
          <!-- Stylized Archipelago Paths -->
          <path d="M70 75 Q115 90 155 150 Q140 165 90 135 Z" fill="#cde5e2" stroke="#1f6f6d" stroke-width="1.5" />
          <path d="M175 170 Q240 175 295 186 Q285 198 180 185 Z" fill="#cde5e2" stroke="#1f6f6d" stroke-width="1.5" />
          <path d="M250 70 Q315 65 335 125 Q295 140 255 118 Z" fill="#cde5e2" stroke="#1f6f6d" stroke-width="1.5" />
          <path d="M385 82 Q425 75 430 135 Q395 145 385 110 Z" fill="#cde5e2" stroke="#1f6f6d" stroke-width="1.5" />
          <path d="M500 105 Q585 95 620 150 Q575 168 510 148 Z" fill="#cde5e2" stroke="#1f6f6d" stroke-width="1.5" />

          <g v-for="region in mapProvinces" :key="region.id">
            <circle
              :cx="region.cx"
              :cy="region.cy"
              :r="isRegionVisited(region.provinces) ? 14 : 9"
              :fill="isRegionVisited(region.provinces) ? '#ea580c' : '#94b8b5'"
              :opacity="isRegionVisited(region.provinces) ? 0.22 : 0.3"
            />
            <circle
              :cx="region.cx"
              :cy="region.cy"
              r="6"
              :fill="isRegionVisited(region.provinces) ? '#ea580c' : '#5f7e7b'"
              stroke="#ffffff"
              stroke-width="2"
            />
            <text
              :x="region.cx"
              :y="region.cy + 20"
              text-anchor="middle"
              class="text-[10px] font-bold fill-[#162221]"
            >
              {{ region.label }}
            </text>
          </g>
        </svg>
      </div>
    </section>

    <!-- Digital Badges & Stamps Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Digital Badges -->
      <section class="lg:col-span-7 rounded-[28px] bg-white border border-[#e5dfd2] p-6 space-y-4">
        <h2 class="font-editorial text-xl font-bold text-[#162221] flex items-center gap-2">
          <Award class="h-5 w-5 text-[#1f6f6d]" />
          Koleksi Lencana Digital (Badges)
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="badge in passport.badges"
            :key="badge.id"
            class="rounded-2xl border p-4 space-y-1.5"
            :class="badge.unlocked ? 'border-[#c7e4e0] bg-[#eef7f6]/70' : 'border-[#e5dfd2] bg-[#fbf9f5] opacity-70'"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm font-extrabold text-[#162221]">{{ badge.title }}</span>
              <span
                class="rounded-full px-2 py-0.5 text-[10px] font-extrabold"
                :class="badge.unlocked ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'"
              >
                {{ badge.unlocked ? 'Terbuka' : 'Terkunci' }}
              </span>
            </div>
            <p class="text-xs text-[#5c6b69]">{{ badge.subtitle }}</p>
            <p class="text-[10px] font-bold text-[#1f6f6d]">{{ badge.progressText }}</p>
          </div>
        </div>
      </section>

      <!-- Loyalty Rewards Redemption -->
      <section class="lg:col-span-5 rounded-[28px] bg-white border border-[#e5dfd2] p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="font-editorial text-xl font-bold text-[#162221] flex items-center gap-2">
            <Gift class="h-5 w-5 text-orange-600" />
            Tukar Poin Loyalitas
          </h2>
          <span class="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-900">
            {{ passport.points }} Poin
          </span>
        </div>

        <div
          v-if="redeemMessage"
          class="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 flex items-center gap-2"
        >
          <CheckCircle2 class="h-4 w-4 shrink-0" />
          {{ redeemMessage }}
        </div>
        <div
          v-if="redeemError"
          class="rounded-xl bg-orange-50 border border-orange-200 p-3 text-xs font-bold text-orange-800"
        >
          {{ redeemError }}
        </div>

        <div class="space-y-3">
          <div
            v-for="reward in passport.rewards"
            :key="reward.id"
            class="rounded-2xl border border-[#e5dfd2] bg-[#fbf9f5] p-4 space-y-2"
          >
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-xs sm:text-sm font-extrabold text-[#162221]">{{ reward.title }}</p>
                <p class="text-[11px] text-[#5c6b69] mt-0.5">{{ reward.description }}</p>
              </div>
              <span class="rounded-full bg-[#eef7f6] px-2.5 py-0.5 text-[11px] font-extrabold text-[#175957] shrink-0">
                {{ reward.pointsCost }} pts
              </span>
            </div>
            <button
              type="button"
              :disabled="Boolean(reward.redeemedCode) || passport.points < reward.pointsCost || redeemingId === reward.id"
              class="w-full rounded-full py-2 text-xs font-extrabold transition cursor-pointer"
              :class="
                reward.redeemedCode
                  ? 'bg-emerald-100 text-emerald-800 cursor-default'
                  : 'bg-[#1f6f6d] text-white hover:bg-[#175957] disabled:opacity-45'
              "
              @click="handleRedeem(reward.id)"
            >
              {{
                reward.redeemedCode
                  ? `Ditukar (${reward.redeemedCode}) ✓`
                  : redeemingId === reward.id
                    ? 'Memproses...'
                    : 'Tukar Poin Sekarang'
              }}
            </button>
          </div>
        </div>
      </section>
    </div>

    <!-- Trip Certificates Section -->
    <section class="rounded-[28px] bg-white border border-[#e5dfd2] p-6 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 class="font-editorial text-xl font-bold text-[#162221] flex items-center gap-2">
            <Award class="h-5 w-5 text-amber-600" />
            Sertifikat Penyelesaian Trip ({{ claimedCertificates.length }})
          </h2>
          <p class="text-xs text-[#5c6b69]">
            Sertifikat resmi bernomor seri untuk setiap ekspedisi Open Trip yang telah Anda selesaikan.
          </p>
        </div>
        <span
          v-if="claimableTrips.length"
          class="rounded-full bg-amber-100 border border-amber-300 px-3 py-1 text-[11px] font-extrabold text-amber-900 self-start sm:self-auto"
        >
          {{ claimableTrips.length }} Trip Siap Diklaim Sertifikatnya
        </span>
      </div>

      <div
        v-if="!eligibleTripBookings.length"
        class="rounded-2xl border border-dashed border-[#dfd8c8] bg-[#fbf9f5] p-6 text-center text-xs text-[#5c6b69]"
      >
        Belum ada sertifikat trip (0 sertifikat). Selesaikan kegiatan Open Trip pertama Anda lalu klaim sertifikat resmi dan +500 poin loyalitas di sini!
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="bk in eligibleTripBookings"
          :key="bk.id"
          class="rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          :class="
            bk.certificateClaimed
              ? 'border-[#c7e4e0] bg-[#eef7f6]/60'
              : 'border-amber-200 bg-amber-50/60'
          "
        >
          <div class="space-y-1 min-w-0">
            <span
              class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold"
              :class="
                bk.certificateClaimed
                  ? 'bg-emerald-100 text-emerald-800'
                  : bk.bookingStatus === 'Selesai' && bk.certificateSent
                    ? 'bg-amber-200 text-amber-950'
                    : 'bg-stone-200 text-stone-700'
              "
            >
              <Award class="h-3 w-3" />
              {{
                bk.certificateClaimed
                  ? bk.certificateId
                  : bk.bookingStatus === 'Selesai' && bk.certificateSent
                    ? 'Dikirim Admin — Siap Diklaim (+500 Poin)'
                    : bk.bookingStatus === 'Selesai'
                      ? 'Selesai — Menunggu Kirim Admin'
                      : 'Trip Belum Selesai'
              }}
            </span>
            <p class="text-sm font-extrabold text-[#162221] truncate">{{ bk.tripTitle }}</p>
            <p class="text-[11px] text-[#5c6b69]">
              {{ bk.location }} &bull; {{ formatDateID(bk.departureDate) }}
            </p>
          </div>

          <NuxtLink
            v-if="bk.certificateClaimed"
            :to="`/customer/certificates/${bk.id}`"
            class="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#1f6f6d] px-4 py-2 text-xs font-extrabold text-white hover:bg-[#175957] transition shrink-0"
          >
            <Award class="h-3.5 w-3.5" />
            Lihat / Cetak
          </NuxtLink>
          <NuxtLink
            v-else-if="bk.bookingStatus === 'Selesai' && bk.certificateSent"
            :to="`/customer/certificates/${bk.id}`"
            class="inline-flex items-center justify-center gap-1.5 rounded-full bg-amber-500 px-4 py-2 text-xs font-extrabold text-[#162221] hover:bg-amber-400 transition shrink-0"
          >
            <Award class="h-3.5 w-3.5" />
            Klaim Sertifikat
          </NuxtLink>
          <span
            v-else
            class="inline-flex items-center justify-center rounded-full bg-stone-200/80 px-3.5 py-2 text-[11px] font-bold text-stone-600 shrink-0"
          >
            Menunggu Admin
          </span>
        </div>
      </div>
    </section>

    <!-- Adventure Stamps History -->
    <section class="rounded-[28px] bg-white border border-[#e5dfd2] p-6 space-y-4">
      <h2 class="font-editorial text-xl font-bold text-[#162221] flex items-center gap-2">
        <Stamp class="h-5 w-5 text-[#1f6f6d]" />
        Riwayat Stempel Destinasi ({{ passport.stamps.length }})
      </h2>
      <div
        v-if="!passport.stamps.length"
        class="rounded-2xl border border-dashed border-[#dfd8c8] bg-[#fbf9f5] p-6 text-center text-xs text-[#5c6b69]"
      >
        Belum ada stempel destinasi (0 trip selesai). Ikuti open trip pertama Anda untuk mulai mengumpulkan stempel digital, lencana, dan poin loyalitas!
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          v-for="stamp in passport.stamps"
          :key="stamp.id"
          class="rounded-2xl border border-dashed border-[#1f6f6d]/40 bg-[#fbf9f5] p-4 space-y-1.5"
        >
          <div class="flex items-center justify-between text-[11px] font-extrabold text-[#1f6f6d]">
            <span class="inline-flex items-center gap-1">
              <Sparkles class="h-3.5 w-3.5" />
              {{ stamp.category }}
            </span>
            <span>{{ stamp.destination }}</span>
          </div>
          <p class="text-sm font-extrabold text-[#162221]">{{ stamp.tripTitle }}</p>
          <p class="text-xs text-[#5c6b69]">{{ stamp.province }} &bull; {{ formatDateID(stamp.date) }}</p>
          <p class="text-[11px] font-bold text-emerald-700 pt-1">Pemandu: {{ stamp.guideName }}</p>
        </div>
      </div>

      <div class="pt-1">
        <NuxtLink
          to="/trips"
          class="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#1f6f6d] hover:underline"
        >
          <Compass class="h-4 w-4" />
          Tambah stempel baru dari Katalog Open Trip &rarr;
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

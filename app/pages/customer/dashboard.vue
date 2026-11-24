<script setup lang="ts">
import {
  AlertTriangle,
  Award,
  Backpack,
  BedDouble,
  Check,
  CheckCircle2,
  ClipboardCopy,
  Compass,
  MapPin,
  MessageCircle,
  Radio,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet
} from 'lucide-vue-next'
import type {
  CustomerBookingRecord,
  SosAlertRecord,
  TripLobbyMessage
} from '#shared/types/booking'
import type { PassportProfileResponse } from '#shared/types/ecosystem'
import { formatDateID, formatRupiah } from '~/utils/format'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  allowedRoles: ['customer']
})

useSeoMeta({
  title: 'Dashboard Pelanggan — JejakNusa',
  description: 'Kelola trip & hotel aktif, status split payment, gear checklist, Trip Lobby Chat, dan Emergency SOS.'
})

const { user } = useAuth()

const [{ data: bookingsData }, { data: passportData }] = await Promise.all([
  useFetch<{ bookings: CustomerBookingRecord[] }>('/api/bookings'),
  useFetch<PassportProfileResponse>('/api/passport')
])

const bookings = ref<CustomerBookingRecord[]>(
  (bookingsData.value?.bookings ?? []).map((b) => ({
    ...b,
    gearChecklist: b.gearChecklist.map((g) => ({ ...g }))
  }))
)

watch(bookingsData, (val) => {
  if (val?.bookings) {
    bookings.value = val.bookings.map((b) => ({
      ...b,
      gearChecklist: b.gearChecklist.map((g) => ({ ...g }))
    }))
  }
})

const selectedBookingId = ref(bookings.value[0]?.id || '')

const activeBooking = computed(
  () => bookings.value.find((b) => b.id === selectedBookingId.value) ?? bookings.value[0] ?? null
)

// Certificates sent by Admin awaiting claim
const sentUnclaimedCertificates = computed(() =>
  bookings.value.filter(
    (b) =>
      b.bookingType !== 'hotel' &&
      b.bookingStatus === 'Selesai' &&
      b.certificateSent &&
      !b.certificateClaimed
  )
)

// Real per-customer summary metrics (all 0 for brand-new customers!)
const customerStats = computed(() => {
  const tripCount = bookings.value.filter((b) => b.bookingType !== 'hotel').length
  const hotelCount = bookings.value.filter((b) => b.bookingType === 'hotel' || b.bookingType === 'trip+hotel').length
  const totalSpent = bookings.value.reduce((sum, b) => sum + b.paidAmount, 0)
  const points = passportData.value?.points ?? 0
  return { tripCount, hotelCount, totalSpent, points }
})

const gearReadiness = computed(() => {
  const list = activeBooking.value?.gearChecklist ?? []
  if (!list.length) return { done: 0, total: 0, percent: 0 }
  const done = list.filter((item) => item.checked).length
  return {
    done,
    total: list.length,
    percent: Math.round((done / list.length) * 100)
  }
})

const copiedBookingId = ref('')
async function copySplitLink(booking: CustomerBookingRecord) {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(booking.splitPaymentLink)
    }
    copiedBookingId.value = booking.id
    setTimeout(() => {
      copiedBookingId.value = ''
    }, 2200)
  } catch {
    copiedBookingId.value = ''
  }
}

// Trip Lobby Chat
const lobbyTripSlug = computed(() => activeBooking.value?.tripSlug || '')
const { data: lobbyData, refresh: refreshLobby } = await useFetch<{ messages: TripLobbyMessage[] }>(
  '/api/lobby',
  {
    query: computed(() => ({ tripSlug: lobbyTripSlug.value || 'none' }))
  }
)
const lobbyMessages = computed(() => (lobbyTripSlug.value ? lobbyData.value?.messages ?? [] : []))
const newChatText = ref('')
const sendingChat = ref(false)

async function sendLobbyMessage() {
  if (!lobbyTripSlug.value || newChatText.value.trim().length < 2) return
  sendingChat.value = true
  try {
    await $fetch('/api/lobby', {
      method: 'POST',
      body: {
        tripSlug: lobbyTripSlug.value,
        message: newChatText.value
      }
    })
    newChatText.value = ''
    await refreshLobby()
  } finally {
    sendingChat.value = false
  }
}

// Emergency SOS
const sosMessage = ref('')
const sosLocationLabel = ref('Pos Lapangan / Titik Jalur Aktif')
const sosSending = ref(false)
const lastSentSos = ref<SosAlertRecord | null>(null)
const gpsCoords = ref<{ lat: number; lng: number }>({ lat: -8.19842, lng: 115.13426 })
const gpsStatus = ref('GPS siap digunakan (koordinat lapangan terdeteksi)')

function detectLocation() {
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    gpsStatus.value = 'Mengambil titik GPS akurat...'
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        gpsCoords.value = {
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5))
        }
        gpsStatus.value = `GPS Live aktif (${gpsCoords.value.lat}, ${gpsCoords.value.lng})`
      },
      () => {
        gpsCoords.value = { lat: -8.19842, lng: 115.13426 }
        gpsStatus.value = 'Menggunakan koordinat basecamp terakhir (-8.19842, 115.13426)'
      },
      { timeout: 4000 }
    )
  }
}

async function triggerEmergencySos() {
  sosSending.value = true
  try {
    const res = await $fetch<{ ok: boolean; alert: SosAlertRecord }>('/api/sos', {
      method: 'POST',
      body: {
        tripSlug: activeBooking.value?.tripSlug || 'general-sos',
        tripTitle: activeBooking.value?.tripTitle || 'Laporan Darurat Pelanggan',
        latitude: gpsCoords.value.lat,
        longitude: gpsCoords.value.lng,
        locationLabel: sosLocationLabel.value,
        message:
          sosMessage.value.trim() ||
          'Sinyal Darurat SOS dari peserta — mohon hubungi pemandu dan kirim bantuan ke titik koordinat GPS ini.'
      }
    })
    lastSentSos.value = res.alert
    sosMessage.value = ''
  } finally {
    sosSending.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Hero Greeting Banner -->
    <div class="rounded-[28px] teal-card p-6 sm:p-7 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="space-y-1.5">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-amber-200">
          <Sparkles class="h-3.5 w-3.5" />
          Dashboard Perjalanan Pelanggan
        </span>
        <h1 class="font-editorial text-2xl sm:text-3xl font-bold">
          Halo, {{ user?.name || 'Petualang' }}!
        </h1>
        <p class="text-xs sm:text-sm text-teal-100/90 max-w-2xl">
          Kelola pesanan Open Trip, paket gabungan Trip + Hotel, maupun reservasi penginapan Anda beserta Invoice QRIS, Gear Checklist, dan Lobby Chat.
        </p>
      </div>

      <div class="flex flex-wrap gap-2.5 shrink-0">
        <NuxtLink
          to="/trips"
          class="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-xs font-extrabold text-[#103f3e] hover:bg-amber-50 transition"
        >
          <Compass class="h-4 w-4" />
          Cari Open Trip
        </NuxtLink>
        <NuxtLink
          to="/hotels"
          class="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/25 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-white/25 transition"
        >
          <BedDouble class="h-4 w-4" />
          Pesan Hotel Saja
        </NuxtLink>
      </div>
    </div>

    <!-- Inbox Banner: Certificates Sent by Admin Ready to Claim -->
    <section
      v-if="sentUnclaimedCertificates.length"
      class="rounded-[26px] bg-gradient-to-r from-amber-50 via-yellow-50 to-emerald-50 border-2 border-amber-300 p-5 space-y-3 shadow-sm"
    >
      <div class="flex items-center gap-2.5">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-[#162221] shadow">
          <Award class="h-5 w-5" />
        </span>
        <div>
          <p class="text-sm sm:text-base font-extrabold text-[#162221]">
            Admin Mengirimkan {{ sentUnclaimedCertificates.length }} Sertifikat Trip untuk Anda!
          </p>
          <p class="text-xs text-[#455553]">
            Kegiatan trip Anda telah ditandai selesai oleh Admin JejakNusa. Klik tombol klaim untuk menerbitkan sertifikat resmi &amp; menerima +500 poin Adventure Passport.
          </p>
        </div>
      </div>

      <div class="space-y-2">
        <div
          v-for="certBk in sentUnclaimedCertificates"
          :key="certBk.id"
          class="rounded-2xl bg-white border border-amber-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div class="min-w-0 space-y-0.5">
            <p class="text-xs sm:text-sm font-extrabold text-[#162221] truncate">
              {{ certBk.tripTitle }}
              <span class="font-mono text-[11px] font-bold text-[#1f6f6d]">({{ certBk.certificateId }})</span>
            </p>
            <p class="text-[11px] text-[#5c6b69]">
              {{ certBk.certificateAdminNote || 'Sertifikat resmi siap diklaim.' }}
            </p>
          </div>
          <NuxtLink
            :to="`/customer/certificates/${certBk.id}`"
            class="inline-flex items-center justify-center gap-1.5 rounded-full bg-amber-500 px-4 py-2 text-xs font-extrabold text-[#162221] hover:bg-amber-400 transition shrink-0"
          >
            <Award class="h-3.5 w-3.5" />
            Klaim Sertifikat Sekarang
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Real-Time Customer Stats (All 0 for brand-new customer!) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <div class="min-w-0 rounded-[22px] bg-white border border-[#e5dfd2] p-4 flex flex-col justify-between gap-2.5 shadow-xs">
        <div class="flex items-center justify-between gap-2">
          <p class="text-xs font-bold text-[#5c6b69]">Open Trip Aktif</p>
          <span class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#eef7f6] text-[#1f6f6d]">
            <Compass class="h-4 w-4" />
          </span>
        </div>
        <p class="text-xl 2xl:text-2xl font-extrabold tabular-nums text-[#162221]">{{ customerStats.tripCount }}</p>
      </div>

      <div class="min-w-0 rounded-[22px] bg-white border border-[#e5dfd2] p-4 flex flex-col justify-between gap-2.5 shadow-xs">
        <div class="flex items-center justify-between gap-2">
          <p class="text-xs font-bold text-[#5c6b69]">Hotel Dipesan</p>
          <span class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <BedDouble class="h-4 w-4" />
          </span>
        </div>
        <p class="text-xl 2xl:text-2xl font-extrabold tabular-nums text-[#162221]">{{ customerStats.hotelCount }}</p>
      </div>

      <div class="min-w-0 rounded-[22px] bg-white border border-[#e5dfd2] p-4 flex flex-col justify-between gap-2.5 shadow-xs">
        <div class="flex items-center justify-between gap-2">
          <p class="text-xs font-bold text-[#5c6b69]">Total Terbayar</p>
          <span class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Wallet class="h-4 w-4" />
          </span>
        </div>
        <p class="text-xl 2xl:text-2xl font-extrabold tracking-tight tabular-nums text-[#162221] break-words">{{ formatRupiah(customerStats.totalSpent) }}</p>
      </div>

      <div class="min-w-0 rounded-[22px] bg-white border border-[#e5dfd2] p-4 flex flex-col justify-between gap-2.5 shadow-xs">
        <div class="flex items-center justify-between gap-2">
          <p class="text-xs font-bold text-[#5c6b69]">Poin Passport</p>
          <span class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
            <Award class="h-4 w-4" />
          </span>
        </div>
        <p class="text-xl 2xl:text-2xl font-extrabold tabular-nums text-[#162221]">{{ customerStats.points }}</p>
      </div>
    </div>

    <!-- Empty State for Brand-New Customer (0 bookings!) -->
    <section
      v-if="!bookings.length"
      class="rounded-[28px] bg-white border border-dashed border-[#c7d7d4] p-8 sm:p-10 text-center space-y-4"
    >
      <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef7f6] text-[#1f6f6d]">
        <Compass class="h-7 w-7" />
      </span>
      <div class="space-y-1 max-w-lg mx-auto">
        <h2 class="font-editorial text-2xl font-bold text-[#162221]">
          Belum Ada Riwayat Trip atau Reservasi Hotel
        </h2>
        <p class="text-xs sm:text-sm text-[#5c6b69]">
          Akun baru Anda masih bersih (0 trip, 0 hotel, 0 poin). Mulailah petualangan pertama Anda dengan memilih destinasi Open Trip (bisa digabung dengan hotel dekat basecamp) atau memesan hotel saja lewat QRIS!
        </p>
      </div>
      <div class="flex flex-wrap items-center justify-center gap-3 pt-1">
        <NuxtLink
          to="/trips"
          class="inline-flex items-center gap-2 rounded-full bg-[#1f6f6d] px-5 py-3 text-xs font-extrabold text-white shadow-md hover:bg-[#175957] transition"
        >
          <Compass class="h-4 w-4" />
          Pilih Destinasi Open Trip (+Hotel)
        </NuxtLink>
        <NuxtLink
          to="/hotels"
          class="inline-flex items-center gap-2 rounded-full border border-[#1f6f6d] bg-white px-5 py-3 text-xs font-extrabold text-[#1f6f6d] hover:bg-[#eef7f6] transition"
        >
          <BedDouble class="h-4 w-4" />
          Pesan Penginapan / Hotel Saja
        </NuxtLink>
      </div>
    </section>

    <!-- Active Bookings List -->
    <section v-else class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="font-editorial text-xl font-bold text-[#162221]">
          Pesanan Trip &amp; Hotel Saya ({{ bookings.length }})
        </h2>
        <span class="text-xs font-semibold text-[#5c6b69]">Klik kartu untuk membuka Gear Checklist &amp; Lobby Chat</span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          v-for="bk in bookings"
          :key="bk.id"
          class="rounded-[24px] bg-white border p-5 space-y-4 transition cursor-pointer"
          :class="
            activeBooking?.id === bk.id
              ? 'border-[#1f6f6d] ring-2 ring-[#1f6f6d]/20 shadow-md'
              : 'border-[#e5dfd2] hover:border-[#1f6f6d]/50'
          "
          @click="selectedBookingId = bk.id"
        >
          <div class="flex items-start gap-3.5">
            <img :src="bk.coverImage" :alt="bk.tripTitle" class="h-20 w-24 rounded-2xl object-cover shrink-0">
            <div class="min-w-0 flex-1 space-y-1">
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="rounded-full bg-[#eef7f6] px-2.5 py-0.5 text-[10px] font-extrabold text-[#175957]">
                  {{ bk.bookingType === 'trip+hotel' ? 'Trip + Hotel' : bk.bookingType === 'hotel' ? 'Hotel Saja' : 'Open Trip' }}
                </span>
                <span
                  class="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold"
                  :class="bk.paymentStatus === 'LUNAS' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
                >
                  {{ bk.paymentStatus }}
                </span>
                <span
                  v-if="bk.bookingStatus === 'Selesai'"
                  class="rounded-full bg-teal-100 px-2.5 py-0.5 text-[10px] font-extrabold text-teal-900"
                >
                  Trip Selesai
                </span>
                <span
                  v-if="bk.certificateClaimed"
                  class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-900"
                >
                  <Award class="h-3 w-3" /> Sertifikat Terbit
                </span>
              </div>
              <h3 class="text-sm font-extrabold text-[#162221] line-clamp-1">{{ bk.tripTitle }}</h3>
              <p class="text-xs text-[#5c6b69]">
                {{ bk.location }} &bull; {{ formatDateID(bk.departureDate) }}
              </p>
              <p v-if="bk.hotelName" class="text-[11px] font-bold text-amber-800 truncate">
                Hotel: {{ bk.hotelName }} ({{ bk.hotelRooms }} kmr &times; {{ bk.hotelNights }} mlm)
              </p>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2 rounded-2xl bg-[#f7f4ee] p-3 text-xs">
            <div>
              <span class="block text-[10px] text-[#5c6b69]">Total ({{ bk.participantsCount }} org)</span>
              <span class="font-extrabold text-[#162221]">{{ formatRupiah(bk.totalAmount) }}</span>
            </div>
            <div>
              <span class="block text-[10px] text-[#5c6b69]">Terbayar</span>
              <span class="font-extrabold text-emerald-700">{{ formatRupiah(bk.paidAmount) }}</span>
            </div>
            <div>
              <span class="block text-[10px] text-[#5c6b69]">Sisa</span>
              <span class="font-extrabold" :class="bk.remainingAmount > 0 ? 'text-orange-700' : 'text-[#1f6f6d]'">
                {{ formatRupiah(bk.remainingAmount) }}
              </span>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#fff7ec] border border-amber-200/80 px-3 py-2">
            <div class="min-w-0 flex-1">
              <span class="block text-[10px] font-extrabold uppercase tracking-wider text-orange-700">
                Invoice {{ bk.invoiceNumber }}
              </span>
              <span class="block text-[11px] font-mono text-[#354442] truncate">{{ bk.splitPaymentLink }}</span>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <NuxtLink
                :to="`/customer/transactions/${bk.id}`"
                class="inline-flex items-center gap-1 rounded-full bg-[#1f6f6d] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#175957] transition"
                @click.stop
              >
                Lihat Invoice
              </NuxtLink>
              <NuxtLink
                :to="`/customer/transactions/${bk.id}?autoprint=1`"
                class="inline-flex items-center gap-1 rounded-full border border-[#1f6f6d] bg-white px-3 py-1.5 text-[11px] font-bold text-[#1f6f6d] hover:bg-[#eef7f6] transition"
                @click.stop
              >
                Cetak Bukti
              </NuxtLink>
              <button
                type="button"
                class="inline-flex items-center gap-1 rounded-full bg-white border border-orange-300 px-3 py-1.5 text-[11px] font-bold text-orange-700 hover:bg-orange-600 hover:text-white transition cursor-pointer"
                @click.stop="copySplitLink(bk)"
              >
                <Check v-if="copiedBookingId === bk.id" class="h-3.5 w-3.5" />
                <ClipboardCopy v-else class="h-3.5 w-3.5" />
                {{ copiedBookingId === bk.id ? 'Tersalin!' : 'Salin' }}
              </button>
            </div>
          </div>

          <!-- Certificate Claim / View Row for Paid Non-Hotel Open Trips -->
          <div
            v-if="bk.bookingType !== 'hotel' && bk.paymentStatus !== 'MENUNGGU PEMBAYARAN'"
            class="flex flex-wrap items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 border"
            :class="
              bk.certificateClaimed
                ? 'bg-emerald-50/80 border-emerald-200'
                : bk.bookingStatus === 'Selesai' && bk.certificateSent
                  ? 'bg-amber-50 border-amber-300'
                  : 'bg-[#f7f4ee] border-[#e5dfd2]'
            "
          >
            <div class="flex items-center gap-2 min-w-0">
              <Award
                class="h-4 w-4 shrink-0"
                :class="
                  bk.certificateClaimed
                    ? 'text-emerald-700'
                    : bk.bookingStatus === 'Selesai' && bk.certificateSent
                      ? 'text-amber-700'
                      : 'text-[#6d7a78]'
                "
              />
              <div class="min-w-0 text-[11px]">
                <p class="font-extrabold text-[#162221] truncate">
                  {{
                    bk.certificateClaimed
                      ? `Sertifikat Resmi: ${bk.certificateId}`
                      : bk.bookingStatus === 'Selesai' && bk.certificateSent
                        ? 'Sertifikat dikirim Admin! Siap diklaim (+500 Poin)'
                        : bk.bookingStatus === 'Selesai'
                          ? 'Trip selesai — menunggu Admin mengirim sertifikat'
                          : 'Sertifikat terkunci (menunggu trip selesai)'
                  }}
                </p>
                <p class="text-[10px] text-[#5c6b69] truncate">
                  {{
                    bk.certificateClaimed
                      ? `Atas nama ${bk.certificateHolderName || bk.leaderName} — Siap cetak PDF`
                      : bk.bookingStatus === 'Selesai' && bk.certificateSent
                        ? `Dikirim ${bk.certificateSentAt || ''} — Klik tombol untuk klaim`
                        : 'Admin akan menandai trip selesai dan mengirim sertifikat ke akun Anda'
                  }}
                </p>
              </div>
            </div>

            <NuxtLink
              v-if="bk.certificateClaimed"
              :to="`/customer/certificates/${bk.id}`"
              class="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-3.5 py-1.5 text-[11px] font-extrabold text-white hover:bg-emerald-800 transition shrink-0"
              @click.stop
            >
              <Award class="h-3.5 w-3.5" />
              Lihat &amp; Cetak Sertifikat
            </NuxtLink>
            <NuxtLink
              v-else-if="bk.bookingStatus === 'Selesai' && bk.certificateSent"
              :to="`/customer/certificates/${bk.id}`"
              class="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3.5 py-1.5 text-[11px] font-extrabold text-[#162221] hover:bg-amber-400 shadow-xs transition shrink-0"
              @click.stop
            >
              <Award class="h-3.5 w-3.5" />
              Klaim Sertifikat
            </NuxtLink>
            <span
              v-else
              class="inline-flex items-center gap-1 rounded-full bg-stone-200/80 px-3 py-1 text-[10px] font-bold text-stone-600 shrink-0"
            >
              Menunggu Admin
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- Bottom Interactive Grid (Only when user has an active booking) -->
    <div v-if="activeBooking" class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Interactive Gear Checklist -->
      <section class="lg:col-span-5 rounded-[28px] bg-white border border-[#e5dfd2] p-6 space-y-4">
        <div class="flex items-start justify-between gap-2">
          <div>
            <span class="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#1f6f6d]">
              <Backpack class="h-4 w-4" />
              Interactive Gear Checklist
            </span>
            <h3 class="font-editorial text-lg font-bold text-[#162221] mt-0.5">
              Persiapan: {{ activeBooking.tripTitle }}
            </h3>
          </div>
          <span class="rounded-full bg-[#eef7f6] px-3 py-1 text-xs font-extrabold text-[#175957]">
            {{ gearReadiness.done }}/{{ gearReadiness.total }} Siap
          </span>
        </div>

        <div class="h-2.5 rounded-full bg-[#ebe5d8] overflow-hidden">
          <div class="h-full rounded-full bg-[#1f6f6d] transition-all duration-300" :style="{ width: `${gearReadiness.percent}%` }" />
        </div>

        <div class="space-y-2.5">
          <label
            v-for="gear in activeBooking.gearChecklist"
            :key="gear.id"
            class="flex items-start gap-3 rounded-2xl border p-3.5 cursor-pointer transition"
            :class="gear.checked ? 'border-emerald-300 bg-emerald-50/70' : 'border-[#e5dfd2] bg-[#fbf9f5]'"
          >
            <input v-model="gear.checked" type="checkbox" class="mt-0.5 h-4 w-4 rounded accent-[#1f6f6d] cursor-pointer">
            <div class="flex-1 min-w-0">
              <p class="text-xs sm:text-sm font-bold" :class="gear.checked ? 'line-through text-emerald-800/80' : 'text-[#162221]'">
                {{ gear.item }}
              </p>
              <span
                class="inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-extrabold"
                :class="gear.mandatory ? 'bg-orange-100 text-orange-800' : 'bg-stone-200/80 text-stone-600'"
              >
                {{ gear.mandatory ? 'Wajib' : 'Opsional' }}
              </span>
            </div>
          </label>
        </div>
      </section>

      <!-- Trip Lobby Chat -->
      <section class="lg:col-span-7 rounded-[28px] bg-white border border-[#e5dfd2] p-6 flex flex-col justify-between space-y-4">
        <div class="flex items-center justify-between gap-2 pb-3 border-b border-[#ebe5d8]">
          <div>
            <span class="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#1f6f6d]">
              <MessageCircle class="h-4 w-4" />
              Trip Lobby Chat
            </span>
            <h3 class="font-editorial text-lg font-bold text-[#162221] mt-0.5">
              {{ activeBooking.tripTitle }}
            </h3>
          </div>
          <span class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800">
            <Users class="h-3.5 w-3.5" />
            Grup Aktif
          </span>
        </div>

        <div class="space-y-3 max-h-72 overflow-y-auto rail-scroll pr-1">
          <div v-if="!lobbyMessages.length" class="text-xs text-[#6d7a78] text-center py-6">
            Belum ada pesan di grup ini. Mulai sapa pemandu &amp; peserta lain!
          </div>
          <div v-for="msg in lobbyMessages" :key="msg.id" class="flex items-start gap-2.5">
            <img :src="msg.senderAvatar" :alt="msg.senderName" class="h-8 w-8 rounded-full object-cover shrink-0 mt-0.5">
            <div class="flex-1 rounded-2xl px-3.5 py-2.5 text-xs" :class="msg.senderRole === 'guide' ? 'bg-[#eef7f6] border border-[#c7e4e0]' : 'bg-[#f7f4ee]'">
              <div class="flex items-center justify-between gap-2 mb-1">
                <span class="font-extrabold text-[#162221]">{{ msg.senderName }}</span>
                <span class="text-[10px] text-[#6d7a78]">{{ msg.createdAt }}</span>
              </div>
              <p class="text-[#354442] leading-relaxed">{{ msg.message }}</p>
            </div>
          </div>
        </div>

        <form class="flex items-center gap-2 pt-2 border-t border-[#ebe5d8]" @submit.prevent="sendLobbyMessage">
          <input
            v-model="newChatText"
            type="text"
            placeholder="Kirim pesan ke grup..."
            class="flex-1 rounded-full border border-[#e3dccd] bg-[#fbf9f5] px-4 py-2.5 text-xs sm:text-sm text-[#162221]"
          >
          <button
            type="submit"
            :disabled="sendingChat || newChatText.trim().length < 2"
            class="inline-flex items-center gap-1.5 rounded-full bg-[#1f6f6d] px-4 py-2.5 text-xs font-extrabold text-white hover:bg-[#175957] disabled:opacity-50 cursor-pointer"
          >
            <Send class="h-3.5 w-3.5" />
            Kirim
          </button>
        </form>
      </section>
    </div>

    <!-- Emergency SOS -->
    <section class="rounded-[28px] bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 border-2 border-rose-200 p-6 space-y-4">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div class="flex items-start gap-3">
          <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-lg">
            <Radio class="h-6 w-6" />
          </span>
          <div>
            <span class="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-rose-800">
              <AlertTriangle class="h-3 w-3" />
              Emergency SOS &amp; Live GPS Location
            </span>
            <h2 class="font-editorial text-xl font-bold text-rose-950 mt-0.5">
              Tombol Darurat Terhubung ke Admin Command Center
            </h2>
          </div>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-full bg-white border border-rose-300 px-4 py-2 text-xs font-extrabold text-rose-800 hover:bg-rose-100 cursor-pointer self-start md:self-center"
          @click="detectLocation"
        >
          <MapPin class="h-3.5 w-3.5" />
          Deteksi GPS
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <div class="md:col-span-4 space-y-1">
          <label class="block text-[11px] font-bold text-rose-950">Titik Lokasi</label>
          <input v-model="sosLocationLabel" type="text" class="w-full rounded-xl border border-rose-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-[#162221]">
        </div>
        <div class="md:col-span-5 space-y-1">
          <label class="block text-[11px] font-bold text-rose-950">Keterangan Kondisi Darurat</label>
          <input v-model="sosMessage" type="text" placeholder="Mis. Peserta butuh bantuan medis di pos 2..." class="w-full rounded-xl border border-rose-200 bg-white px-3.5 py-2.5 text-xs text-[#162221]">
        </div>
        <div class="md:col-span-3">
          <button
            type="button"
            :disabled="sosSending"
            class="w-full inline-flex items-center justify-center gap-2 rounded-full bg-rose-600 px-5 py-3 text-xs font-extrabold text-white hover:bg-rose-700 cursor-pointer"
            @click="triggerEmergencySos"
          >
            <AlertTriangle class="h-4 w-4" />
            {{ sosSending ? 'Mengirim...' : 'KIRIM EMERGENCY SOS' }}
          </button>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-2 text-[11px] text-rose-900/80">
        <span>Status GPS: <strong>{{ gpsStatus }}</strong></span>
        <span class="inline-flex items-center gap-1 font-bold text-emerald-800">
          <ShieldCheck class="h-3.5 w-3.5" />
          Terhubung 24/7 ke Admin Live Trip Monitor
        </span>
      </div>

      <div v-if="lastSentSos" class="rounded-2xl bg-white border border-rose-300 p-4 flex items-start gap-3 text-xs text-rose-950">
        <CheckCircle2 class="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
        <p><strong>Sinyal SOS Terkirim!</strong> (ID: {{ lastSentSos.id }}) — Koordinat {{ lastSentSos.latitude }}, {{ lastSentSos.longitude }} telah masuk ke Admin Command Center.</p>
      </div>
    </section>
  </div>
</template>

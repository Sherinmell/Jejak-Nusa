<script setup lang="ts">
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  BedDouble,
  Calendar,
  Car,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  HeartPulse,
  IdCard,
  Leaf,
  Lock,
  Mail,
  MapPin,
  Minus,
  Phone,
  Plus,
  ShieldCheck,
  ShieldPlus,
  StickyNote,
  User,
  Users
} from 'lucide-vue-next'
import { ADVENTURE_INSURANCE_FEE, resolveTripRequirements, type Trip } from '#shared/types/trip'
import { SHUTTLE_TRANSFER_FEE, type Hotel, type HotelsApiResponse } from '#shared/types/hotel'
import { CARBON_OFFSET_FEE } from '#shared/types/ecosystem'
import type { BookingParticipant, CustomerBookingRecord } from '#shared/types/booking'
import { formatDateID, formatRupiah } from '~/utils/format'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  allowedRoles: ['customer']
})

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const { features, fetchFeatures, createCheckoutBooking, confirmBookingPayment } = useMarketplace()

const slug = computed(() => String(route.params.slug || ''))

const [{ data: tripData }, { data: hotelsData }] = await Promise.all([
  useFetch<Trip>(() => `/api/trips/${slug.value}`),
  useFetch<HotelsApiResponse>('/api/hotels'),
  fetchFeatures(true)
])

const trip = computed(() => tripData.value ?? null)

// Sort partner hotels so the hotel closest to this trip appears FIRST!
const nearbyHotels = computed<Hotel[]>(() => {
  const all = hotelsData.value?.hotels ?? []
  const currentTrip = trip.value
  if (!currentTrip) return all
  return [...all].sort((a, b) => {
    const aExact = a.nearTripSlug === currentTrip.slug ? 2 : a.province === currentTrip.province ? 1 : 0
    const bExact = b.nearTripSlug === currentTrip.slug ? 2 : b.province === currentTrip.province ? 1 : 0
    return bExact - aExact || b.rating - a.rating
  })
})

useSeoMeta({
  title: () => (trip.value ? `Checkout Trip & Hotel QRIS — ${trip.value.title}` : 'Checkout Open Trip — JejakNusa')
})

const initialPax = Number(route.query.pax)
const participants = ref<number>(
  Number.isFinite(initialPax) && initialPax >= 1
    ? Math.min(initialPax, Math.max(1, trip.value?.remainingQuota || 10))
    : 1
)
const leaderName = ref(user.value?.name || '')
const customerPhone = ref('0812-8890-4411')
const customerEmail = ref(user.value?.email || 'pelanggan@jejaknusa.id')
const specialNotes = ref('')

// Trip requirements & dynamic per-participant safety manifest
const tripRequirements = computed(() => (trip.value ? resolveTripRequirements(trip.value) : null))
const agreementAccepted = ref(false)

function createEmptyParticipant(index: number): BookingParticipant {
  return {
    fullName: index === 0 ? leaderName.value : '',
    idNumber: '',
    emergencyContact: '',
    medicalNotes: '',
    agreementAccepted: false
  }
}

const participantForms = ref<BookingParticipant[]>(
  Array.from({ length: participants.value }, (_, idx) => createEmptyParticipant(idx))
)

watch(
  participants,
  (count) => {
    const next = [...participantForms.value]
    while (next.length < count) {
      next.push(createEmptyParticipant(next.length))
    }
    if (next.length > count) {
      next.length = count
    }
    participantForms.value = next
  },
  { immediate: true }
)

watch(leaderName, (newName, oldName) => {
  if (participantForms.value[0] && (!participantForms.value[0].fullName || participantForms.value[0].fullName === oldName)) {
    participantForms.value[0].fullName = newName
  }
})

// Combined Hotel Bundle State
const initialHotelSlug = typeof route.query.hotel === 'string' ? route.query.hotel : ''
const includeHotel = ref<boolean>(Boolean(initialHotelSlug))
const selectedHotelSlug = ref<string>(initialHotelSlug || nearbyHotels.value[0]?.slug || '')

watch(
  nearbyHotels,
  (list) => {
    if (!selectedHotelSlug.value && list[0]) {
      selectedHotelSlug.value = list[0].slug
    }
  },
  { immediate: true }
)

const selectedHotel = computed<Hotel | null>(
  () => nearbyHotels.value.find((h) => h.slug === selectedHotelSlug.value) ?? nearbyHotels.value[0] ?? null
)

const selectedRoomId = ref<string>('')
watch(
  selectedHotel,
  (h) => {
    if (h?.rooms?.[0]) {
      selectedRoomId.value = h.rooms[0].id
    }
  },
  { immediate: true }
)

const selectedRoom = computed(
  () => selectedHotel.value?.rooms.find((r) => r.id === selectedRoomId.value) ?? selectedHotel.value?.rooms[0] ?? null
)

const hotelCheckIn = ref(trip.value?.nextDepartureDate || '2026-12-05')
const hotelNights = ref<number>(1)
const hotelRooms = ref<number>(1)
const includeShuttle = ref<boolean>(false)

const hotelCheckOut = computed(() => {
  const base = new Date(`${hotelCheckIn.value}T00:00:00`)
  if (Number.isNaN(base.getTime())) return hotelCheckIn.value
  base.setDate(base.getDate() + hotelNights.value)
  return base.toISOString().slice(0, 10)
})

const includeInsurance = ref(features.value.instantInsuranceEnabled)
const includeCarbonOffset = ref(features.value.carbonOffsetEnabled)
const paymentScheme = ref<'Lunas 100%' | 'DP 30%'>('Lunas 100%')
const paymentMethod = ref<'QRIS Instant Payment' | 'Transfer Virtual Account'>(
  features.value.qrisEnabled ? 'QRIS Instant Payment' : 'Transfer Virtual Account'
)

watch(
  features,
  (f) => {
    if (!f.instantInsuranceEnabled) includeInsurance.value = false
    if (!f.carbonOffsetEnabled) includeCarbonOffset.value = false
    if (!f.splitBillDpEnabled) paymentScheme.value = 'Lunas 100%'
    if (!f.qrisEnabled) paymentMethod.value = 'Transfer Virtual Account'
  },
  { immediate: true, deep: true }
)

const maxParticipants = computed(() => Math.max(1, trip.value?.remainingQuota || 10))

const packageSubtotal = computed(() => (trip.value?.pricePerPerson || 0) * participants.value)
const hotelSubtotal = computed(() => {
  if (!includeHotel.value || !selectedHotel.value) return 0
  const nightly = selectedRoom.value?.pricePerNight ?? selectedHotel.value.pricePerNight
  return nightly * hotelNights.value * hotelRooms.value
})
const shuttleFee = computed(() => (includeHotel.value && includeShuttle.value ? SHUTTLE_TRANSFER_FEE : 0))
const insuranceFee = computed(() =>
  features.value.instantInsuranceEnabled && includeInsurance.value
    ? ADVENTURE_INSURANCE_FEE * participants.value
    : 0
)
const carbonOffsetFee = computed(() =>
  features.value.carbonOffsetEnabled && includeCarbonOffset.value ? CARBON_OFFSET_FEE : 0
)
const serviceFee = computed(() => features.value.serviceFeeAmount)
const totalAmount = computed(
  () =>
    packageSubtotal.value +
    hotelSubtotal.value +
    shuttleFee.value +
    insuranceFee.value +
    carbonOffsetFee.value +
    serviceFee.value
)
const dueToday = computed(() =>
  features.value.splitBillDpEnabled && paymentScheme.value === 'DP 30%'
    ? Math.ceil(totalAmount.value * 0.3)
    : totalAmount.value
)
const splitPerPerson = computed(() => Math.ceil(totalAmount.value / participants.value))

const isIdentityRequired = computed(
  () =>
    features.value.requireIdentityAndHealthCert &&
    Boolean(tripRequirements.value?.requiresIdCard || includeHotel.value)
)

const isHealthCertRequired = computed(
  () =>
    features.value.requireIdentityAndHealthCert &&
    Boolean(tripRequirements.value?.requiresHealthCert)
)

const activeAccommodationRules = computed<string[]>(() => {
  const tripRules = tripRequirements.value?.accommodationRules ?? []
  if (tripRules.length) return tripRules
  if (includeHotel.value) {
    return [
      'Waktu Check-in hotel mulai pukul 14.00 dan Check-out maksimal pukul 12.00 waktu setempat.',
      'Wajib menunjukkan KTP/Paspor asli sesuai data peserta saat check-in resepsionis.',
      'Sharing room solo traveler dipisah sesuai gender; pasangan wajib menunjukkan identitas resmi / bukti nikah sesuai ketentuan properti.',
      'Deposit keamanan kunci kamar (Rp100.000/kamar) dikembalikan penuh saat check-out tanpa kerusakan.'
    ]
  }
  return []
})

const checkoutValidationIssues = computed<string[]>(() => {
  const issues: string[] = []
  if (leaderName.value.trim().length < 2) issues.push('Nama lengkap pemesan wajib diisi.')
  if (customerPhone.value.trim().length < 6) issues.push('Nomor WhatsApp aktif wajib diisi.')
  if (!customerEmail.value.includes('@')) issues.push('Email bukti invoice belum valid.')

  participantForms.value.forEach((p, idx) => {
    const num = idx + 1
    if (p.fullName.trim().length < 2) issues.push(`Nama lengkap Peserta ${num} (sesuai KTP/Paspor) belum diisi.`)
    if (isIdentityRequired.value && p.idNumber.trim().length < 6) {
      issues.push(`Nomor NIK/Paspor Peserta ${num} wajib diisi (minimal 6 karakter).`)
    }
    if (p.emergencyContact.trim().length < 6) issues.push(`Nomor Kontak Darurat Peserta ${num} belum diisi.`)
    if (!p.medicalNotes.trim()) issues.push(`Catatan riwayat penyakit/alergi Peserta ${num} wajib diisi.`)
  })

  if (!agreementAccepted.value) {
    issues.push('Centang kotak persetujuan Syarat Perjalanan, Ketentuan Menginap & Waiver Keselamatan.')
  }
  return issues
})

const isCheckoutFormValid = computed(() => checkoutValidationIssues.value.length === 0)

const pendingBooking = ref<CustomerBookingRecord | null>(null)
const submitting = ref(false)
const confirming = ref(false)
const errorMessage = ref('')

async function createPendingOrder() {
  if (!trip.value) return
  if (!isCheckoutFormValid.value) {
    errorMessage.value = checkoutValidationIssues.value[0] || 'Lengkapi seluruh data peserta dan centang persetujuan terlebih dahulu.'
    return
  }
  errorMessage.value = ''
  submitting.value = true
  try {
    const normalizedParticipants: BookingParticipant[] = participantForms.value.map((p) => ({
      fullName: p.fullName.trim(),
      idNumber: p.idNumber.trim() || '-',
      emergencyContact: p.emergencyContact.trim(),
      medicalNotes: p.medicalNotes.trim(),
      agreementAccepted: agreementAccepted.value
    }))

    pendingBooking.value = await createCheckoutBooking({
      bookingType: includeHotel.value && selectedHotel.value ? 'trip+hotel' : 'trip',
      tripSlug: trip.value.slug,
      leaderName: leaderName.value,
      customerPhone: customerPhone.value,
      customerEmail: customerEmail.value,
      specialNotes: specialNotes.value || 'Tidak ada catatan khusus.',
      participantsCount: participants.value,
      rosterNames: normalizedParticipants.map((p) => p.fullName),
      participants: normalizedParticipants,
      agreementAccepted: agreementAccepted.value,
      includeInsurance: includeInsurance.value,
      includeCarbonOffset: includeCarbonOffset.value,
      paymentScheme: paymentScheme.value,
      paymentMethod: paymentMethod.value,
      markPaidImmediately: false,
      hotelSlug: includeHotel.value ? selectedHotel.value?.slug : undefined,
      hotelRoomId: includeHotel.value ? selectedRoom.value?.id : undefined,
      hotelCheckIn: includeHotel.value ? hotelCheckIn.value : undefined,
      hotelCheckOut: includeHotel.value ? hotelCheckOut.value : undefined,
      hotelNights: includeHotel.value ? hotelNights.value : undefined,
      hotelRooms: includeHotel.value ? hotelRooms.value : undefined,
      includeShuttle: includeHotel.value ? includeShuttle.value : false
    })
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  } catch (err: unknown) {
    if (err && typeof err === 'object') {
      const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
      errorMessage.value = e.data?.statusMessage || e.statusMessage || 'Gagal membuat pesanan.'
    } else {
      errorMessage.value = 'Gagal membuat pesanan.'
    }
  } finally {
    submitting.value = false
  }
}

async function handleSimulatePaid() {
  if (!pendingBooking.value) return
  confirming.value = true
  try {
    const confirmed = await confirmBookingPayment(pendingBooking.value.id)
    await router.push(`/customer/transactions/${confirmed.id}?paid=1`)
  } finally {
    confirming.value = false
  }
}
</script>

<template>
  <div v-if="trip" class="space-y-6">
    <!-- Top Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <NuxtLink
          :to="`/trips/${trip.slug}`"
          class="inline-flex items-center gap-1.5 text-xs font-bold text-[#1f6f6d] hover:underline mb-1"
        >
          <ArrowLeft class="h-3.5 w-3.5" />
          Kembali ke Detail Destinasi
        </NuxtLink>
        <h1 class="font-editorial text-2xl sm:text-3xl font-bold text-[#162221]">
          {{ pendingBooking ? 'QRIS Pembayaran Siap Dipindai' : 'Checkout Open Trip & Gabung Penginapan' }}
        </h1>
        <p class="text-xs sm:text-sm text-[#5c6b69]">
          Anda dapat memesan trip saja atau langsung menggabungkannya dengan hotel terdekat dalam satu QRIS pembayaran.
        </p>
      </div>
    </div>

    <div
      v-if="errorMessage"
      class="rounded-2xl bg-orange-50 border border-orange-200 px-4 py-3 text-xs font-bold text-orange-800"
    >
      {{ errorMessage }}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Left Column: Form OR Immediate QRIS Payment Card -->
      <div class="lg:col-span-7 space-y-5">
        <template v-if="pendingBooking">
          <QrisPaymentCard
            v-if="features.qrisEnabled && paymentMethod === 'QRIS Instant Payment'"
            :invoice-number="pendingBooking.invoiceNumber"
            :payment-reference="pendingBooking.paymentReference"
            :amount="dueToday"
            :loading="confirming"
            @confirm-paid="handleSimulatePaid"
          />

          <div v-else class="rounded-[28px] bg-white border-2 border-[#1f6f6d]/25 p-6 space-y-4">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-900">
              Transfer Virtual Account (Mode QRIS sedang dinonaktifkan Admin)
            </span>
            <h2 class="font-editorial text-2xl font-bold text-[#162221]">
              Nomor VA: 8801-{{ pendingBooking.invoiceNumber.slice(-8) }}
            </h2>
            <p class="text-sm text-[#5c6b69]">
              Total yang harus dibayarkan: <strong class="text-[#1f6f6d]">{{ formatRupiah(dueToday) }}</strong>
            </p>
            <button
              type="button"
              :disabled="confirming"
              class="w-full inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3.5 text-sm font-extrabold text-white hover:bg-emerald-700 transition cursor-pointer"
              @click="handleSimulatePaid"
            >
              <CheckCircle2 class="h-4.5 w-4.5" />
              {{ confirming ? 'Memverifikasi...' : 'Simulasi Konfirmasi Sudah Bayar (LUNAS)' }}
            </button>
          </div>
        </template>

        <form v-else class="space-y-5" @submit.prevent="createPendingOrder">
          <!-- 1. Data Pemesan -->
          <section class="rounded-[28px] bg-white border border-[#e5dfd2] p-6 space-y-4">
            <h2 class="font-editorial text-xl font-bold text-[#162221]">1. Data Pemesan &amp; Jumlah Peserta</h2>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="sm:col-span-2 space-y-1">
                <label class="block text-xs font-bold text-[#5c6b69]">Nama Lengkap Pemesan / Ketua Grup</label>
                <div class="relative">
                  <User class="h-4 w-4 text-[#7a8785] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    v-model="leaderName"
                    type="text"
                    required
                    minlength="2"
                    class="w-full rounded-xl border border-[#e3dccd] bg-[#fbf9f5] pl-10 pr-4 py-2.5 text-sm text-[#162221]"
                  >
                </div>
              </div>

              <div class="space-y-1">
                <label class="block text-xs font-bold text-[#5c6b69]">Nomor WhatsApp Aktif</label>
                <div class="relative">
                  <Phone class="h-4 w-4 text-[#7a8785] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    v-model="customerPhone"
                    type="tel"
                    required
                    class="w-full rounded-xl border border-[#e3dccd] bg-[#fbf9f5] pl-10 pr-4 py-2.5 text-sm text-[#162221]"
                  >
                </div>
              </div>

              <div class="space-y-1">
                <label class="block text-xs font-bold text-[#5c6b69]">Email Bukti Invoice</label>
                <div class="relative">
                  <Mail class="h-4 w-4 text-[#7a8785] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    v-model="customerEmail"
                    type="email"
                    required
                    class="w-full rounded-xl border border-[#e3dccd] bg-[#fbf9f5] pl-10 pr-4 py-2.5 text-sm text-[#162221]"
                  >
                </div>
              </div>
            </div>

            <div class="flex items-center justify-between rounded-2xl bg-[#fbf9f5] border border-[#e5dfd2] p-4">
              <div>
                <p class="text-sm font-extrabold text-[#162221]">Jumlah Peserta Trip</p>
                <p class="text-xs text-[#5c6b69]">Sisa kuota tersedia: {{ maxParticipants }} orang</p>
              </div>
              <div class="flex items-center gap-3">
                <button
                  type="button"
                  :disabled="participants <= 1"
                  class="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[#dfd8c8] hover:bg-[#1f6f6d] hover:text-white disabled:opacity-40 cursor-pointer"
                  @click="participants -= 1"
                >
                  <Minus class="h-4 w-4" />
                </button>
                <span class="w-8 text-center text-lg font-extrabold text-[#162221]">{{ participants }}</span>
                <button
                  type="button"
                  :disabled="participants >= maxParticipants"
                  class="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[#dfd8c8] hover:bg-[#1f6f6d] hover:text-white disabled:opacity-40 cursor-pointer"
                  @click="participants += 1"
                >
                  <Plus class="h-4 w-4" />
                </button>
              </div>
            </div>

            <div class="space-y-1">
              <label class="block text-xs font-bold text-[#5c6b69] flex items-center gap-1.5">
                <StickyNote class="h-3.5 w-3.5 text-[#1f6f6d]" />
                Catatan Khusus Tambahan (Ukuran Alat, Permintaan Kamar, dll.)
              </label>
              <textarea
                v-model="specialNotes"
                rows="2"
                placeholder="Mis. Ukuran wetsuit M & L, request early check-in..."
                class="w-full rounded-xl border border-[#e3dccd] bg-[#fbf9f5] px-3.5 py-2.5 text-sm text-[#162221]"
              />
            </div>
          </section>

          <!-- 2. FORM DATA DIRI & KESELAMATAN PESERTA DINAMIS -->
          <section class="rounded-[28px] bg-white border border-[#e5dfd2] p-6 space-y-4">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div>
                <span class="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#1f6f6d]">
                  <IdCard class="h-4 w-4" />
                  Manifest Simaksi, Check-in &amp; Mitigasi Risiko
                </span>
                <h2 class="font-editorial text-xl font-bold text-[#162221] mt-0.5">
                  2. Data Diri Peserta ({{ participants }} Orang)
                </h2>
                <p class="text-xs text-[#5c6b69]">
                  Isi identitas resmi, kontak darurat, dan riwayat medis/alergi setiap peserta. Data ini diteruskan ke Pemandu Lokal untuk keselamatan di lapangan.
                </p>
              </div>
              <span
                class="rounded-full px-3 py-1 text-[10px] font-extrabold"
                :class="
                  features.requireIdentityAndHealthCert
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-stone-200 text-stone-700'
                "
              >
                {{ features.requireIdentityAndHealthCert ? 'NIK/Paspor & Syarat Sehat: Wajib' : 'NIK/Paspor: Opsional (Admin)' }}
              </span>
            </div>

            <div
              v-if="isHealthCertRequired"
              class="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs text-rose-950 flex items-start gap-2.5"
            >
              <HeartPulse class="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <p>
                <strong>Syarat Kesehatan Aktif:</strong> Trip ini mensyaratkan <strong>Surat Keterangan Sehat (maks. H-3)</strong> dari Klinik/Puskesmas/RS untuk ditunjukkan saat registrasi di basecamp, serta batas usia minimal <strong>{{ tripRequirements?.minAge }} tahun</strong>.
              </p>
            </div>

            <div class="space-y-4">
              <div
                v-for="(participant, idx) in participantForms"
                :key="idx"
                class="rounded-2xl bg-[#fbf9f5] border border-[#e5dfd2] p-4 space-y-3"
              >
                <div class="flex items-center justify-between gap-2 pb-2 border-b border-[#ebe5d8]">
                  <span class="text-xs font-extrabold text-[#103f3e] inline-flex items-center gap-1.5">
                    <Users class="h-3.5 w-3.5 text-[#1f6f6d]" />
                    Peserta {{ idx + 1 }} {{ idx === 0 ? '(Ketua Grup)' : '' }}
                  </span>
                  <span
                    class="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold"
                    :class="
                      participant.fullName.trim().length >= 2 &&
                      (!isIdentityRequired || participant.idNumber.trim().length >= 6) &&
                      participant.emergencyContact.trim().length >= 6 &&
                      participant.medicalNotes.trim().length > 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-900'
                    "
                  >
                    {{
                      participant.fullName.trim().length >= 2 &&
                      (!isIdentityRequired || participant.idNumber.trim().length >= 6) &&
                      participant.emergencyContact.trim().length >= 6 &&
                      participant.medicalNotes.trim().length > 0
                        ? 'Data Lengkap ✓'
                        : 'Belum Lengkap'
                    }}
                  </span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div class="space-y-1">
                    <label class="block text-[11px] font-bold text-[#5c6b69]">
                      Nama Lengkap sesuai KTP/Paspor <span class="text-rose-600">*</span>
                    </label>
                    <input
                      v-model="participant.fullName"
                      type="text"
                      required
                      placeholder="Nama sesuai kartu identitas"
                      class="w-full rounded-xl border border-[#e3dccd] bg-white px-3.5 py-2 text-xs sm:text-sm text-[#162221]"
                    >
                  </div>

                  <div class="space-y-1">
                    <label class="block text-[11px] font-bold text-[#5c6b69]">
                      Nomor NIK / Paspor
                      <span v-if="isIdentityRequired" class="text-rose-600">*</span>
                      <span v-else class="text-[#7a8785] font-normal">(Opsional)</span>
                    </label>
                    <input
                      v-model="participant.idNumber"
                      type="text"
                      :required="isIdentityRequired"
                      placeholder="Mis. 317405xxxxxxxxxx / A1234567"
                      class="w-full rounded-xl border border-[#e3dccd] bg-white px-3.5 py-2 text-xs sm:text-sm font-mono text-[#162221]"
                    >
                  </div>

                  <div class="space-y-1">
                    <label class="block text-[11px] font-bold text-[#5c6b69]">
                      Nomor Kontak Darurat (Keluarga/Kerabat) <span class="text-rose-600">*</span>
                    </label>
                    <input
                      v-model="participant.emergencyContact"
                      type="text"
                      required
                      placeholder="Mis. 0812-xxxx-xxxx (Ibu / Pasangan)"
                      class="w-full rounded-xl border border-[#e3dccd] bg-white px-3.5 py-2 text-xs sm:text-sm text-[#162221]"
                    >
                  </div>

                  <div class="space-y-1">
                    <div class="flex items-center justify-between gap-2">
                      <label class="block text-[11px] font-bold text-[#5c6b69]">
                        Riwayat Penyakit / Alergi <span class="text-rose-600">*</span>
                      </label>
                      <button
                        type="button"
                        class="text-[10px] font-extrabold text-[#1f6f6d] hover:underline cursor-pointer"
                        @click="participant.medicalNotes = 'Tidak ada riwayat penyakit maupun alergi'"
                      >
                        Isi &ldquo;Tidak ada&rdquo;
                      </button>
                    </div>
                    <input
                      v-model="participant.medicalNotes"
                      type="text"
                      required
                      placeholder="Mis. Asma ringan, alergi udang, atau Tidak ada"
                      class="w-full rounded-xl border border-[#e3dccd] bg-white px-3.5 py-2 text-xs sm:text-sm text-[#162221]"
                    >
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- 3. GABUNG PENGINAPAN / HOTEL DEKAT TRIP INI -->
          <section class="rounded-[28px] bg-white border-2 p-6 space-y-4 transition" :class="includeHotel ? 'border-[#1f6f6d] shadow-sm' : 'border-[#e5dfd2]'">
            <div class="flex items-start justify-between gap-3">
              <div>
                <span class="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#1f6f6d]">
                  <BedDouble class="h-4 w-4" />
                  Paket Gabungan Trip + Hotel Dekat Basecamp
                </span>
                <h2 class="font-editorial text-xl font-bold text-[#162221] mt-0.5">
                  3. Gabung Penginapan di Dekat {{ trip.location }}
                </h2>
                <p class="text-xs text-[#5c6b69]">
                  Pilih hotel / eco-lodge terdekat agar berangkat lebih santai &amp; bayar sekaligus dalam 1 QRIS.
                </p>
              </div>

              <label class="inline-flex items-center gap-2 rounded-full bg-[#eef7f6] border border-[#c7e4e0] px-3.5 py-2 text-xs font-extrabold text-[#175957] cursor-pointer shrink-0">
                <input v-model="includeHotel" type="checkbox" class="h-4 w-4 accent-[#1f6f6d]">
                <span>{{ includeHotel ? 'Digabung ✓' : 'Tambahkan Hotel' }}</span>
              </label>
            </div>

            <div v-if="includeHotel" class="space-y-4 pt-2 border-t border-[#ebe5d8]">
              <!-- Nearby Hotels Quick Cards -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  v-for="(h, idx) in nearbyHotels.slice(0, 4)"
                  :key="h.id"
                  type="button"
                  class="rounded-2xl border p-3 text-left transition cursor-pointer flex gap-3 items-center"
                  :class="
                    selectedHotelSlug === h.slug
                      ? 'border-[#1f6f6d] bg-[#eef7f6] ring-2 ring-[#1f6f6d]/20'
                      : 'border-[#e5dfd2] bg-[#fbf9f5] hover:border-[#1f6f6d]/50'
                  "
                  @click="selectedHotelSlug = h.slug"
                >
                  <img :src="h.coverImage" :alt="h.name" class="h-14 w-16 rounded-xl object-cover shrink-0">
                  <div class="min-w-0 flex-1">
                    <span
                      v-if="idx === 0 || h.nearTripSlug === trip.slug"
                      class="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-extrabold text-amber-900 mb-0.5"
                    >
                      Terdekat Basecamp
                    </span>
                    <p class="text-xs font-extrabold text-[#162221] truncate">{{ h.name }}</p>
                    <p class="text-[10px] text-[#5c6b69] truncate">{{ h.distanceToBasecamp }}</p>
                    <p class="text-xs font-extrabold text-[#1f6f6d] mt-0.5">{{ formatRupiah(h.pricePerNight) }}/mlm</p>
                  </div>
                </button>
              </div>

              <!-- Selected Hotel Room & Nights Controls -->
              <div v-if="selectedHotel" class="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl bg-[#fbf9f5] border border-[#e5dfd2] p-4">
                <div class="sm:col-span-2 space-y-1">
                  <label class="block text-[11px] font-bold uppercase tracking-wider text-[#5c6b69]">Tipe Kamar di {{ selectedHotel.name }}</label>
                  <select
                    v-model="selectedRoomId"
                    class="w-full rounded-xl border border-[#e3dccd] bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-[#162221]"
                  >
                    <option v-for="room in selectedHotel.rooms" :key="room.id" :value="room.id">
                      {{ room.name }} — {{ formatRupiah(room.pricePerNight) }}/malam (maks. {{ room.capacity }} org)
                    </option>
                  </select>
                </div>

                <div class="space-y-1">
                  <label class="block text-[11px] font-bold text-[#5c6b69]">Tanggal Check-in</label>
                  <input
                    v-model="hotelCheckIn"
                    type="date"
                    class="w-full rounded-xl border border-[#e3dccd] bg-white px-3 py-2 text-xs font-semibold text-[#162221]"
                  >
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <div class="space-y-1">
                    <label class="block text-[11px] font-bold text-[#5c6b69]">Malam</label>
                    <input
                      v-model.number="hotelNights"
                      type="number"
                      min="1"
                      max="7"
                      class="w-full rounded-xl border border-[#e3dccd] bg-white px-3 py-2 text-xs font-bold text-[#162221]"
                    >
                  </div>
                  <div class="space-y-1">
                    <label class="block text-[11px] font-bold text-[#5c6b69]">Kamar</label>
                    <input
                      v-model.number="hotelRooms"
                      type="number"
                      min="1"
                      max="5"
                      class="w-full rounded-xl border border-[#e3dccd] bg-white px-3 py-2 text-xs font-bold text-[#162221]"
                    >
                  </div>
                </div>

                <label class="sm:col-span-2 flex items-center justify-between gap-2 rounded-xl bg-white border border-[#e3dccd] px-3 py-2.5 text-xs cursor-pointer">
                  <span class="flex items-center gap-2 font-bold text-[#162221]">
                    <input v-model="includeShuttle" type="checkbox" class="accent-[#1f6f6d]">
                    <Car class="h-3.5 w-3.5 text-[#1f6f6d]" />
                    Shuttle Antar-Jemput Hotel &harr; Basecamp Trip
                  </span>
                  <span class="font-extrabold text-[#1f6f6d]">+{{ formatRupiah(SHUTTLE_TRANSFER_FEE) }}</span>
                </label>
              </div>
            </div>
          </section>

          <!-- 4. Opsi Tambahan & Skema Pembayaran -->
          <section class="rounded-[28px] bg-white border border-[#e5dfd2] p-6 space-y-4">
            <h2 class="font-editorial text-xl font-bold text-[#162221]">4. Opsi Tambahan &amp; Skema Pembayaran</h2>

            <div class="space-y-2">
              <span class="text-xs font-bold uppercase tracking-wider text-[#5c6b69] flex items-center gap-1.5">
                <CreditCard class="h-3.5 w-3.5 text-[#1f6f6d]" />
                Skema Pembayaran
              </span>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  class="rounded-2xl border p-3.5 text-left transition cursor-pointer"
                  :class="paymentScheme === 'Lunas 100%' ? 'border-[#1f6f6d] bg-[#eef7f6]' : 'border-[#e3dccd] bg-white'"
                  @click="paymentScheme = 'Lunas 100%'"
                >
                  <span class="block text-sm font-extrabold text-[#162221]">Bayar Lunas 100%</span>
                  <span class="block text-xs text-[#5c6b69]">Langsung terkonfirmasi &amp; dapat Invoice Lunas</span>
                </button>

                <button
                  v-if="features.splitBillDpEnabled"
                  type="button"
                  class="rounded-2xl border p-3.5 text-left transition cursor-pointer"
                  :class="paymentScheme === 'DP 30%' ? 'border-[#1f6f6d] bg-[#eef7f6]' : 'border-[#e3dccd] bg-white'"
                  @click="paymentScheme = 'DP 30%'"
                >
                  <span class="block text-sm font-extrabold text-[#162221]">DP 30% + Split Bill</span>
                  <span class="block text-xs text-[#5c6b69]">Kunci kuota sekarang, sisa pelunasan H-7</span>
                </button>
              </div>
            </div>

            <label
              v-if="features.instantInsuranceEnabled"
              class="flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition"
              :class="includeInsurance ? 'border-[#1f6f6d] bg-[#eef7f6]' : 'border-[#e3dccd] bg-white'"
            >
              <input v-model="includeInsurance" type="checkbox" class="mt-1 h-4 w-4 accent-[#1f6f6d]">
              <div class="flex-1 text-xs sm:text-sm">
                <div class="flex items-center justify-between gap-2">
                  <span class="font-extrabold text-[#162221] inline-flex items-center gap-1.5">
                    <ShieldPlus class="h-4 w-4 text-[#1f6f6d]" />
                    Asuransi Perjalanan Instan
                  </span>
                  <span class="font-extrabold text-[#175957]">+{{ formatRupiah(ADVENTURE_INSURANCE_FEE) }}/org</span>
                </div>
                <p class="text-xs text-[#5c6b69] mt-0.5">Perlindungan evakuasi medis darurat, kecelakaan outdoor, dan cuaca ekstrem.</p>
              </div>
            </label>

            <label
              v-if="features.carbonOffsetEnabled"
              class="flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition"
              :class="includeCarbonOffset ? 'border-emerald-600 bg-emerald-50/70' : 'border-[#e3dccd] bg-white'"
            >
              <input v-model="includeCarbonOffset" type="checkbox" class="mt-1 h-4 w-4 accent-emerald-700">
              <div class="flex-1 text-xs sm:text-sm">
                <div class="flex items-center justify-between gap-2">
                  <span class="font-extrabold text-[#162221] inline-flex items-center gap-1.5">
                    <Leaf class="h-4 w-4 text-emerald-700" />
                    Donasi Carbon Offset &amp; Konservasi Lokal
                  </span>
                  <span class="font-extrabold text-emerald-800">+{{ formatRupiah(CARBON_OFFSET_FEE) }}</span>
                </div>
              </div>
            </label>

            <!-- 5. Kotak Persetujuan Wajib (Informed Consent / Waiver) -->
            <div class="rounded-2xl bg-[#fbf9f5] border-2 border-[#c7e4e0] p-5 space-y-3.5 mt-2">
              <div class="flex items-center gap-2">
                <ClipboardCheck class="h-5 w-5 text-[#1f6f6d] shrink-0" />
                <h3 class="font-editorial text-lg font-bold text-[#162221]">
                  5. Persetujuan Keselamatan &amp; Ketentuan Menginap (Waiver)
                </h3>
              </div>

              <div class="space-y-2 text-xs text-[#455553]">
                <p class="font-bold text-[#103f3e]">Ringkasan Poin Pernyataan Keselamatan:</p>
                <ul class="space-y-1 pl-1">
                  <li class="flex items-start gap-1.5">
                    <ShieldCheck class="h-3.5 w-3.5 text-[#1f6f6d] shrink-0 mt-0.5" />
                    <span>Seluruh peserta berusia minimal <strong>{{ tripRequirements?.minAge || 12 }} tahun</strong>, dalam kondisi fisik sehat, dan mengikuti seluruh arahan Pemandu Lokal tersertifikasi.</span>
                  </li>
                  <li v-if="isHealthCertRequired" class="flex items-start gap-1.5">
                    <ShieldCheck class="h-3.5 w-3.5 text-[#1f6f6d] shrink-0 mt-0.5" />
                    <span>Peserta bersedia menunjukkan KTP/Paspor asli serta Surat Keterangan Sehat (maks. H-3) saat registrasi ulang di basecamp.</span>
                  </li>
                  <li class="flex items-start gap-1.5">
                    <ShieldCheck class="h-3.5 w-3.5 text-[#1f6f6d] shrink-0 mt-0.5" />
                    <span>Peserta memahami risiko aktivitas alam bebas &amp; memberikan data medis serta kontak darurat secara jujur untuk mitigasi keselamatan.</span>
                  </li>
                </ul>

                <div v-if="activeAccommodationRules.length" class="pt-2 border-t border-[#e5dfd2] space-y-1">
                  <p class="font-bold text-amber-900">Ringkasan Ketentuan Menginap ({{ includeHotel ? 'Hotel Gabungan' : tripRequirements?.accommodationType }}):</p>
                  <ul class="space-y-1 pl-1 text-amber-950/90">
                    <li v-for="(rule, rIdx) in activeAccommodationRules" :key="rIdx" class="flex items-start gap-1.5">
                      <BedDouble class="h-3.5 w-3.5 text-amber-700 shrink-0 mt-0.5" />
                      <span>{{ rule }}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <label
                class="flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition"
                :class="agreementAccepted ? 'border-emerald-400 bg-emerald-50/80' : 'border-amber-300 bg-amber-50/60'"
              >
                <input
                  v-model="agreementAccepted"
                  type="checkbox"
                  class="mt-0.5 h-4 w-4 accent-[#1f6f6d] shrink-0 cursor-pointer"
                >
                <span class="text-xs font-bold text-[#162221] leading-relaxed">
                  Saya menyatakan data peserta sudah benar (sesuai KTP/Paspor), dalam kondisi fisik sehat, dan menyetujui seluruh Syarat Perjalanan, Ketentuan Menginap, serta Pelepasan Tanggung Jawab Keselamatan.
                </span>
              </label>

              <div
                v-if="!isCheckoutFormValid"
                class="rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2.5 text-[11px] text-amber-950 flex items-start gap-2"
              >
                <AlertTriangle class="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Lengkapi untuk melanjutkan:</strong> {{ checkoutValidationIssues[0] }}
                  <span v-if="checkoutValidationIssues.length > 1" class="text-amber-800">
                    (+{{ checkoutValidationIssues.length - 1 }} poin lainnya)
                  </span>
                </span>
              </div>
            </div>

            <button
              type="submit"
              :disabled="submitting || !isCheckoutFormValid"
              class="w-full rounded-full bg-[#1f6f6d] px-6 py-4 text-sm font-extrabold text-white shadow-lg shadow-[#1f6f6d]/25 hover:bg-[#175957] disabled:opacity-45 disabled:cursor-not-allowed transition cursor-pointer"
            >
              {{
                submitting
                  ? 'Menyiapkan Kode QRIS...'
                  : `Lanjut ke Pembayaran QRIS (${formatRupiah(dueToday)})`
              }}
            </button>
          </section>
        </form>
      </div>

      <!-- Right Column: Sticky Order Summary -->
      <aside class="lg:col-span-5 rounded-[28px] bg-white border border-[#e5dfd2] overflow-hidden shadow-sm lg:sticky lg:top-24">
        <div class="relative h-44">
          <img :src="trip.coverImage" :alt="trip.title" class="h-full w-full object-cover">
          <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex flex-col justify-end p-5 text-white">
            <span class="text-[11px] font-extrabold uppercase tracking-wider text-amber-300">
              {{ includeHotel ? 'PAKET GABUNGAN TRIP + HOTEL' : `${trip.category} • ${trip.adrenalineLevel}` }}
            </span>
            <h3 class="font-editorial text-xl font-bold leading-snug">{{ trip.title }}</h3>
          </div>
        </div>

        <div class="p-6 space-y-4">
          <div class="space-y-2 text-xs text-[#455553]">
            <p class="flex items-center gap-2"><MapPin class="h-4 w-4 text-[#1f6f6d]" /> {{ trip.location }} ({{ trip.province }})</p>
            <p class="flex items-center gap-2"><Calendar class="h-4 w-4 text-[#1f6f6d]" /> Berangkat {{ formatDateID(trip.nextDepartureDate) }} ({{ trip.duration }})</p>
            <p class="flex items-center gap-2"><Users class="h-4 w-4 text-[#1f6f6d]" /> {{ participants }} Peserta</p>
          </div>

          <!-- Bundled Hotel Summary Pill -->
          <div v-if="includeHotel && selectedHotel" class="rounded-2xl bg-amber-50 border border-amber-200 p-3.5 text-xs space-y-1">
            <p class="font-extrabold text-amber-900 flex items-center gap-1.5">
              <BedDouble class="h-4 w-4" />
              Hotel Digabung: {{ selectedHotel.name }}
            </p>
            <p class="text-amber-900/80">
              {{ selectedRoom?.name }} &bull; {{ hotelRooms }} kamar &times; {{ hotelNights }} malam ({{ formatDateID(hotelCheckIn) }} – {{ formatDateID(hotelCheckOut) }})
            </p>
          </div>

          <div class="rounded-2xl bg-[#eef7f6] border border-[#c7e4e0] p-3.5 flex items-center gap-3">
            <img :src="trip.guide.avatar" :alt="trip.guide.name" class="h-11 w-11 rounded-xl object-cover shrink-0">
            <div class="min-w-0">
              <p class="text-xs font-extrabold text-[#162221] flex items-center gap-1 truncate">
                {{ trip.guide.name }}
                <BadgeCheck class="h-3.5 w-3.5 text-[#1f6f6d] shrink-0" />
              </p>
              <p class="text-[11px] text-[#4a5f5d] truncate">{{ trip.guide.certifications[0] }}</p>
            </div>
          </div>

          <!-- Cost Breakdown -->
          <div class="space-y-2 pt-3 border-t border-[#e8e2d5] text-xs sm:text-sm">
            <div class="flex justify-between text-[#5c6b69]">
              <span>Paket Trip ({{ formatRupiah(trip.pricePerPerson) }} &times; {{ participants }})</span>
              <span class="font-bold text-[#162221]">{{ formatRupiah(packageSubtotal) }}</span>
            </div>

            <div v-if="includeHotel && hotelSubtotal > 0" class="flex justify-between text-[#5c6b69]">
              <span>Hotel ({{ hotelRooms }} kmr &times; {{ hotelNights }} mlm)</span>
              <span class="font-bold text-[#1f6f6d]">{{ formatRupiah(hotelSubtotal) }}</span>
            </div>

            <div v-if="shuttleFee > 0" class="flex justify-between text-[#5c6b69]">
              <span>Shuttle Hotel &harr; Basecamp</span>
              <span class="font-bold text-[#162221]">{{ formatRupiah(shuttleFee) }}</span>
            </div>

            <div v-if="features.instantInsuranceEnabled" class="flex justify-between text-[#5c6b69]">
              <span>Asuransi Perjalanan Instan</span>
              <span class="font-bold text-[#162221]">{{ formatRupiah(insuranceFee) }}</span>
            </div>

            <div v-if="features.carbonOffsetEnabled" class="flex justify-between text-[#5c6b69]">
              <span>Donasi Carbon Offset</span>
              <span class="font-bold text-emerald-700">{{ formatRupiah(carbonOffsetFee) }}</span>
            </div>

            <div class="flex justify-between text-[#5c6b69]">
              <span>Biaya Layanan Platform</span>
              <span class="font-bold text-[#162221]">{{ formatRupiah(serviceFee) }}</span>
            </div>

            <div class="flex justify-between items-baseline pt-3 border-t border-dashed border-[#dfd8c8]">
              <span class="font-extrabold text-[#162221]">Total Tagihan</span>
              <span class="text-xl font-extrabold text-[#1f6f6d]">{{ formatRupiah(totalAmount) }}</span>
            </div>

            <div
              v-if="features.splitBillDpEnabled && paymentScheme === 'DP 30%'"
              class="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs space-y-1"
            >
              <div class="flex justify-between font-extrabold text-amber-900">
                <span>Bayar DP 30% Sekarang</span>
                <span>{{ formatRupiah(dueToday) }}</span>
              </div>
              <div class="flex justify-between text-amber-800">
                <span>Patungan Total / Orang</span>
                <span>{{ formatRupiah(splitPerPerson) }}</span>
              </div>
            </div>
          </div>

          <p class="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#5c6b69] pt-1">
            <Lock class="h-3.5 w-3.5 text-[#1f6f6d]" />
            Dana dilindungi Escrow JejakNusa
          </p>
        </div>
      </aside>
    </div>
  </div>
</template>

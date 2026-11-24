<script setup lang="ts">
import {
  BedDouble,
  Car,
  Check,
  ClipboardCopy,
  Minus,
  Phone,
  Plus,
  QrCode,
  Sparkles,
  User,
  X
} from 'lucide-vue-next'
import { SHUTTLE_TRANSFER_FEE, type Hotel, type HotelRoom } from '#shared/types/hotel'
import type { CustomerBookingRecord } from '#shared/types/booking'
import { formatDateID, formatRupiah } from '~/utils/format'

interface Props {
  hotel: Hotel
  selectedRoomId?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:selectedRoomId': [roomId: string]
}>()

const router = useRouter()
const { user } = useAuth()
const { features, fetchFeatures, createCheckoutBooking, confirmBookingPayment } = useMarketplace()
void fetchFeatures()

const activeRoomId = computed({
  get: () => props.selectedRoomId || props.hotel.rooms[0]?.id || '',
  set: (val: string) => emit('update:selectedRoomId', val)
})

const selectedRoom = computed<HotelRoom | undefined>(
  () => props.hotel.rooms.find((r) => r.id === activeRoomId.value) ?? props.hotel.rooms[0]
)

const guestName = ref(user.value?.name || '')
const guestPhone = ref('0812-8890-4411')
const checkIn = ref('2026-12-05')
const checkOut = ref('2026-12-07')
const roomCount = ref(1)
const guests = ref(2)
const includeShuttle = ref(true)
const specialNotes = ref('')
const copied = ref(false)

const pendingHotelBooking = ref<CustomerBookingRecord | null>(null)
const creatingOrder = ref(false)
const confirmingPaid = ref(false)
const errorMessage = ref('')

const nights = computed(() => {
  const start = new Date(`${checkIn.value}T00:00:00`)
  const end = new Date(`${checkOut.value}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1
  const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(1, diffDays)
})

const maxRooms = computed(() => Math.max(1, selectedRoom.value?.availableRooms ?? 1))
const maxGuests = computed(() => Math.max(1, (selectedRoom.value?.capacity ?? 2) * roomCount.value))

watch(maxGuests, (limit) => {
  if (guests.value > limit) guests.value = limit
})
watch(maxRooms, (limit) => {
  if (roomCount.value > limit) roomCount.value = limit
})

const roomPricePerNight = computed(() => selectedRoom.value?.pricePerNight ?? props.hotel.pricePerNight)
const roomSubtotal = computed(() => roomPricePerNight.value * roomCount.value * nights.value)
const shuttleCost = computed(() => (includeShuttle.value ? SHUTTLE_TRANSFER_FEE : 0))
const serviceFee = computed(() => features.value.serviceFeeAmount)
const totalCost = computed(() => roomSubtotal.value + shuttleCost.value + serviceFee.value)
const splitPerGuest = computed(() => Math.ceil(totalCost.value / Math.max(1, guests.value)))

const splitBillText = computed(() => {
  return [
    `[Rincian Patungan Hotel — JejakNusa]`,
    `Penginapan: ${props.hotel.name} (${props.hotel.location})`,
    `Kamar: ${selectedRoom.value?.name ?? '-'} (${roomCount.value} kamar x ${nights.value} malam)`,
    `Check-in / Check-out: ${formatDateID(checkIn.value)} – ${formatDateID(checkOut.value)}`,
    `Biaya Kamar: ${formatRupiah(roomSubtotal.value)}`,
    includeShuttle.value ? `Shuttle Trip: ${formatRupiah(SHUTTLE_TRANSFER_FEE)}` : '',
    `Biaya Layanan: ${formatRupiah(serviceFee.value)}`,
    `Total: ${formatRupiah(totalCost.value)} (${formatRupiah(splitPerGuest.value)}/tamu)`
  ]
    .filter(Boolean)
    .join('\n')
})

async function copySplitBill() {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(splitBillText.value)
    }
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2200)
  } catch {
    copied.value = false
  }
}

// Book Hotel Only -> Immediately pop up QRIS Payment!
async function handleBookHotelQris() {
  errorMessage.value = ''
  creatingOrder.value = true
  try {
    pendingHotelBooking.value = await createCheckoutBooking({
      bookingType: 'hotel',
      hotelSlug: props.hotel.slug,
      hotelRoomId: selectedRoom.value?.id,
      hotelCheckIn: checkIn.value,
      hotelCheckOut: checkOut.value,
      hotelNights: nights.value,
      hotelRooms: roomCount.value,
      includeShuttle: includeShuttle.value,
      leaderName: guestName.value.trim() || user.value?.name || 'Tamu Pelanggan',
      customerPhone: guestPhone.value.trim() || '0812-8890-4411',
      customerEmail: user.value?.email || 'pelanggan@jejaknusa.id',
      specialNotes: specialNotes.value.trim() || `Reservasi ${roomCount.value} kamar (${selectedRoom.value?.name})`,
      participantsCount: guests.value,
      paymentMethod: features.value.qrisEnabled ? 'QRIS Instant Payment' : 'Transfer Virtual Account',
      markPaidImmediately: false
    })
  } catch (err: unknown) {
    if (err && typeof err === 'object') {
      const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
      errorMessage.value = e.data?.statusMessage || e.statusMessage || 'Gagal membuat reservasi hotel.'
    } else {
      errorMessage.value = 'Gagal membuat reservasi hotel.'
    }
  } finally {
    creatingOrder.value = false
  }
}

async function handleConfirmHotelQrisPaid() {
  if (!pendingHotelBooking.value) return
  confirmingPaid.value = true
  try {
    const confirmed = await confirmBookingPayment(pendingHotelBooking.value.id)
    pendingHotelBooking.value = null
    await router.push(`/customer/transactions/${confirmed.id}?paid=1`)
  } finally {
    confirmingPaid.value = false
  }
}
</script>

<template>
  <div class="rounded-[28px] glass-surface overflow-hidden">
    <!-- Teal Header -->
    <div class="teal-card px-6 py-5 text-white">
      <div class="flex items-baseline justify-between gap-2">
        <div>
          <p class="text-xs font-medium text-teal-100/90">Tarif Kamar Dipilih</p>
          <div class="mt-0.5 flex items-baseline gap-1.5">
            <span class="text-2xl font-extrabold tracking-tight">{{ formatRupiah(roomPricePerNight) }}</span>
            <span class="text-xs text-teal-100/80">/ malam</span>
          </div>
        </div>
        <span class="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold">
          <BedDouble class="h-3.5 w-3.5" />
          {{ nights }} malam
        </span>
      </div>
      <p class="mt-2 text-xs text-teal-100/90 truncate">{{ selectedRoom?.name }}</p>
    </div>

    <div class="p-6 space-y-4">
      <div
        v-if="errorMessage"
        class="rounded-2xl bg-orange-50 border border-orange-200 px-3.5 py-2.5 text-xs font-bold text-orange-800"
      >
        {{ errorMessage }}
      </div>

      <!-- Guest Name & Phone -->
      <div class="grid grid-cols-1 gap-2.5">
        <div class="relative">
          <User class="h-3.5 w-3.5 text-[#7a8785] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            v-model="guestName"
            type="text"
            placeholder="Nama Tamu"
            class="w-full rounded-xl border border-[#e3dccd] bg-white pl-9 pr-3 py-2 text-xs font-semibold text-[#162221]"
          >
        </div>
        <div class="relative">
          <Phone class="h-3.5 w-3.5 text-[#7a8785] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            v-model="guestPhone"
            type="tel"
            placeholder="WhatsApp Aktif"
            class="w-full rounded-xl border border-[#e3dccd] bg-white pl-9 pr-3 py-2 text-xs font-semibold text-[#162221]"
          >
        </div>
      </div>

      <!-- Room Selector -->
      <div class="space-y-1">
        <label for="hotel-room-select" class="block text-[11px] font-bold uppercase tracking-wider text-[#5c6b69]">
          Tipe Kamar
        </label>
        <select
          id="hotel-room-select"
          v-model="activeRoomId"
          class="w-full rounded-xl border border-[#e3dccd] bg-white px-3 py-2.5 text-xs sm:text-sm font-semibold text-[#162221]"
        >
          <option v-for="room in hotel.rooms" :key="room.id" :value="room.id">
            {{ room.name }} — {{ formatRupiah(room.pricePerNight) }}/mlm
          </option>
        </select>
      </div>

      <!-- Check-in & Check-out -->
      <div class="grid grid-cols-2 gap-2.5">
        <div class="space-y-1">
          <label class="block text-[11px] font-bold uppercase tracking-wider text-[#5c6b69]">Check-in</label>
          <input v-model="checkIn" type="date" class="w-full rounded-xl border border-[#e3dccd] bg-white px-2.5 py-2 text-xs font-semibold text-[#162221]">
        </div>
        <div class="space-y-1">
          <label class="block text-[11px] font-bold uppercase tracking-wider text-[#5c6b69]">Check-out</label>
          <input v-model="checkOut" type="date" :min="checkIn" class="w-full rounded-xl border border-[#e3dccd] bg-white px-2.5 py-2 text-xs font-semibold text-[#162221]">
        </div>
      </div>

      <!-- Rooms & Guests -->
      <div class="grid grid-cols-2 gap-3">
        <div class="space-y-1">
          <span class="block text-[11px] font-bold uppercase tracking-wider text-[#5c6b69]">Kamar</span>
          <div class="flex items-center justify-between rounded-full border border-[#e3dccd] bg-white p-1">
            <button type="button" class="flex h-7 w-7 items-center justify-center rounded-full bg-[#f4f1ea] hover:bg-[#1f6f6d] hover:text-white disabled:opacity-40 cursor-pointer" :disabled="roomCount <= 1" @click="roomCount -= 1">
              <Minus class="h-3 w-3" />
            </button>
            <span class="text-xs font-extrabold text-[#162221]">{{ roomCount }}</span>
            <button type="button" class="flex h-7 w-7 items-center justify-center rounded-full bg-[#f4f1ea] hover:bg-[#1f6f6d] hover:text-white disabled:opacity-40 cursor-pointer" :disabled="roomCount >= maxRooms" @click="roomCount += 1">
              <Plus class="h-3 w-3" />
            </button>
          </div>
        </div>

        <div class="space-y-1">
          <span class="block text-[11px] font-bold uppercase tracking-wider text-[#5c6b69]">Tamu</span>
          <div class="flex items-center justify-between rounded-full border border-[#e3dccd] bg-white p-1">
            <button type="button" class="flex h-7 w-7 items-center justify-center rounded-full bg-[#f4f1ea] hover:bg-[#1f6f6d] hover:text-white disabled:opacity-40 cursor-pointer" :disabled="guests <= 1" @click="guests -= 1">
              <Minus class="h-3 w-3" />
            </button>
            <span class="text-xs font-extrabold text-[#162221]">{{ guests }}</span>
            <button type="button" class="flex h-7 w-7 items-center justify-center rounded-full bg-[#f4f1ea] hover:bg-[#1f6f6d] hover:text-white disabled:opacity-40 cursor-pointer" :disabled="guests >= maxGuests" @click="guests += 1">
              <Plus class="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      <!-- Shuttle Option -->
      <label class="flex items-center justify-between gap-2 rounded-2xl border p-3 text-xs cursor-pointer" :class="includeShuttle ? 'border-[#1f6f6d] bg-[#eef7f6]' : 'border-[#e3dccd] bg-white'">
        <span class="flex items-center gap-2 font-bold text-[#162221]">
          <input v-model="includeShuttle" type="checkbox" class="accent-[#1f6f6d]">
          <Car class="h-3.5 w-3.5 text-[#1f6f6d]" />
          Shuttle Basecamp Trip
        </span>
        <span class="font-extrabold text-[#175957]">+{{ formatRupiah(SHUTTLE_TRANSFER_FEE) }}</span>
      </label>

      <!-- Cost Breakdown -->
      <div class="space-y-1.5 pt-2 border-t border-[#e8e2d5] text-xs">
        <div class="flex justify-between text-[#5c6b69]">
          <span>{{ roomCount }} kamar &times; {{ nights }} malam</span>
          <span class="font-bold text-[#162221]">{{ formatRupiah(roomSubtotal) }}</span>
        </div>
        <div v-if="includeShuttle" class="flex justify-between text-[#5c6b69]">
          <span>Shuttle Basecamp</span>
          <span class="font-bold text-[#162221]">{{ formatRupiah(shuttleCost) }}</span>
        </div>
        <div class="flex justify-between text-[#5c6b69]">
          <span>Biaya Layanan Aplikasi</span>
          <span class="font-bold text-[#162221]">{{ formatRupiah(serviceFee) }}</span>
        </div>
        <div class="flex justify-between items-baseline pt-2 border-t border-dashed border-[#dfd8c8]">
          <span class="font-extrabold text-[#162221]">Total Bayar Hotel</span>
          <span class="text-lg font-extrabold text-[#1f6f6d]">{{ formatRupiah(totalCost) }}</span>
        </div>
      </div>

      <!-- Primary Instant QRIS Button for Hotel Only -->
      <button
        type="button"
        :disabled="creatingOrder"
        class="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#1f6f6d] px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#1f6f6d]/25 hover:bg-[#175957] disabled:opacity-60 transition cursor-pointer"
        @click="handleBookHotelQris"
      >
        <QrCode class="h-4.5 w-4.5" />
        <span>{{ creatingOrder ? 'Menyiapkan QRIS...' : `Pesan Hotel & Bayar QRIS (${formatRupiah(totalCost)})` }}</span>
      </button>

      <!-- Bundle Shortcut to Nearby Trip + This Hotel -->
      <NuxtLink
        v-if="hotel.nearTripSlug"
        :to="`/customer/checkout/${hotel.nearTripSlug}?hotel=${hotel.slug}`"
        class="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-[#1f6f6d] bg-[#eef7f6] px-4 py-2.5 text-xs font-extrabold text-[#175957] hover:bg-[#1f6f6d] hover:text-white transition"
      >
        <Sparkles class="h-3.5 w-3.5" />
        Gabung dengan Open Trip Terdekat (+Hotel)
      </NuxtLink>

      <!-- Split Bill Copy -->
      <button
        type="button"
        class="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-orange-300 bg-white px-4 py-2 text-xs font-bold text-orange-700 hover:bg-orange-600 hover:text-white transition cursor-pointer"
        @click="copySplitBill"
      >
        <Check v-if="copied" class="h-3.5 w-3.5" />
        <ClipboardCopy v-else class="h-3.5 w-3.5" />
        {{ copied ? 'Patungan Tersalin!' : `Salin Split Bill (${formatRupiah(splitPerGuest)}/tamu)` }}
      </button>
    </div>

    <!-- Immediate QRIS Modal Popup right after clicking Pesan Hotel! -->
    <Teleport to="body">
      <div
        v-if="pendingHotelBooking"
        class="fixed inset-0 z-50 flex items-center justify-center bg-[#0d2423]/65 backdrop-blur-xs p-4"
        @click.self="pendingHotelBooking = null"
      >
        <div class="w-full max-w-md max-h-[92vh] overflow-y-auto relative">
          <button
            type="button"
            class="absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#162221] shadow cursor-pointer hover:bg-white"
            aria-label="Tutup QRIS"
            @click="pendingHotelBooking = null"
          >
            <X class="h-4 w-4" />
          </button>

          <QrisPaymentCard
            :invoice-number="pendingHotelBooking.invoiceNumber"
            :payment-reference="pendingHotelBooking.paymentReference"
            :merchant-name="`JEJAKNUSA STAY — ${hotel.name.toUpperCase()}`"
            :amount="pendingHotelBooking.totalAmount"
            :loading="confirmingPaid"
            @confirm-paid="handleConfirmHotelQrisPaid"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>

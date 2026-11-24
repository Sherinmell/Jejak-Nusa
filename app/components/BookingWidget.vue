<script setup lang="ts">
import {
  Backpack,
  Check,
  CheckCircle2,
  ClipboardCopy,
  CreditCard,
  Leaf,
  Lock,
  Minus,
  Plus,
  ShieldPlus,
  Sparkles,
  Users
} from 'lucide-vue-next'
import { ADVENTURE_INSURANCE_FEE, type Trip } from '#shared/types/trip'
import { GEAR_ADDONS } from '#shared/types/adventure'
import { CARBON_OFFSET_FEE } from '#shared/types/ecosystem'
import { formatDateID, formatRupiah } from '~/utils/format'

interface Props {
  trip: Trip
  selectedAddonIds?: string[]
  includeCarbonOffset?: boolean
  ecoPledgeAccepted?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selectedAddonIds: () => [],
  includeCarbonOffset: false,
  ecoPledgeAccepted: true
})

const emit = defineEmits<{
  'update:includeCarbonOffset': [val: boolean]
}>()

const { user } = useAuth()
const router = useRouter()
const { features, fetchFeatures } = useMarketplace()
void fetchFeatures()

const participants = ref<number>(Math.min(2, Math.max(1, props.trip.remainingQuota)))
const includeInsurance = ref<boolean>(true)
const paymentScheme = ref<'full' | 'dp30'>('dp30')
const copied = ref<boolean>(false)
const bookingSubmitted = ref<boolean>(false)
const showGroupTracker = ref<boolean>(true)

interface GroupMember {
  name: string
  paid: boolean
}

const groupMembers = ref<GroupMember[]>([])

function syncGroupMembers(count: number) {
  const firstLabel = user.value?.name?.split(' ')[0] || 'Anda (Ketua Grup)'
  const next: GroupMember[] = []
  for (let i = 0; i < count; i++) {
    const existing = groupMembers.value[i]
    next.push({
      name: existing?.name || (i === 0 ? firstLabel : `Teman ${i + 1}`),
      paid: existing?.paid ?? i === 0
    })
  }
  groupMembers.value = next
}

syncGroupMembers(participants.value)

const maxParticipants = computed(() => Math.max(1, props.trip.remainingQuota))

function decrementParticipants() {
  if (participants.value > 1) {
    participants.value -= 1
    bookingSubmitted.value = false
  }
}

function incrementParticipants() {
  if (participants.value < maxParticipants.value) {
    participants.value += 1
    bookingSubmitted.value = false
  }
}

watch(participants, (val) => {
  if (!Number.isFinite(val) || val < 1) {
    participants.value = 1
  } else if (val > maxParticipants.value) {
    participants.value = maxParticipants.value
  }
  syncGroupMembers(participants.value)
})

const selectedAddons = computed(() =>
  GEAR_ADDONS.filter((addon) => props.selectedAddonIds.includes(addon.id))
)

const addonsSubtotal = computed(() =>
  selectedAddons.value.reduce((sum, addon) => {
    const multiplier = addon.unit === 'per orang' ? participants.value : 1
    return sum + addon.price * multiplier
  }, 0)
)

const packageSubtotal = computed(() => props.trip.pricePerPerson * participants.value)

const insuranceSubtotal = computed(() =>
  includeInsurance.value ? ADVENTURE_INSURANCE_FEE * participants.value : 0
)

const carbonOffsetSubtotal = computed(() => (props.includeCarbonOffset ? CARBON_OFFSET_FEE : 0))

const totalCost = computed(
  () => packageSubtotal.value + insuranceSubtotal.value + addonsSubtotal.value + carbonOffsetSubtotal.value
)

const dueToday = computed(() =>
  paymentScheme.value === 'dp30' ? Math.ceil(totalCost.value * 0.3) : totalCost.value
)

const remainingBalance = computed(() => Math.max(0, totalCost.value - dueToday.value))

const splitPerPerson = computed(() => Math.ceil(totalCost.value / participants.value))
const dpSplitPerPerson = computed(() => Math.ceil(dueToday.value / participants.value))

const paidMembersCount = computed(() => groupMembers.value.filter((m) => m.paid).length)

const splitBillText = computed(() => {
  const insuranceLine = includeInsurance.value
    ? `• Asuransi Petualangan Instan (${formatRupiah(ADVENTURE_INSURANCE_FEE)} x ${participants.value}): ${formatRupiah(insuranceSubtotal.value)}`
    : '• Asuransi Petualangan Instan: Tidak diambil'

  const addonLines = selectedAddons.value.length
    ? selectedAddons.value.map(
        (a) =>
          `• Add-On ${a.name} (${a.unit === 'per orang' ? `${formatRupiah(a.price)} x ${participants.value}` : 'per grup'}): ${formatRupiah(a.unit === 'per orang' ? a.price * participants.value : a.price)}`
      )
    : []

  const memberLines = groupMembers.value.map(
    (m, i) => `  ${i + 1}. ${m.name} — ${m.paid ? 'Sudah Transfer ✅' : 'Belum Bayar ⏳'}`
  )

  return [
    `[Rincian Split Bill & Manajemen Grup — JejakNusa]`,
    `Trip: ${props.trip.title}`,
    `Lokasi: ${props.trip.location}`,
    `Keberangkatan: ${formatDateID(props.trip.nextDepartureDate)} (${props.trip.duration})`,
    `Pemandu Terverifikasi: ${props.trip.guide.name}`,
    ``,
    `Rincian Biaya (${participants.value} peserta):`,
    `• Paket Trip (${formatRupiah(props.trip.pricePerPerson)} x ${participants.value}): ${formatRupiah(packageSubtotal.value)}`,
    insuranceLine,
    props.includeCarbonOffset ? `• Donasi Carbon Offset & Konservasi Lokal: ${formatRupiah(CARBON_OFFSET_FEE)}` : '',
    ...addonLines,
    `--------------------------------`,
    `Total Tagihan Grup: ${formatRupiah(totalCost.value)}`,
    `Patungan Total / Orang: ${formatRupiah(splitPerPerson.value)}`,
    paymentScheme.value === 'dp30'
      ? `Skema DP 30% Hari Ini: ${formatRupiah(dueToday.value)} (${formatRupiah(dpSplitPerPerson.value)}/orang) | Sisa H-7: ${formatRupiah(remainingBalance.value)}`
      : `Skema Bayar Lunas 100%: ${formatRupiah(dueToday.value)}`,
    ``,
    `Status Patungan Grup (${paidMembersCount.value}/${participants.value} lunas):`,
    ...memberLines
  ].join('\n')
})

async function copySplitBill() {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(splitBillText.value)
    } else if (typeof document !== 'undefined') {
      const textarea = document.createElement('textarea')
      textarea.value = splitBillText.value
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }

    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2500)
  } catch {
    copied.value = false
  }
}

const splitLinkCopied = ref(false)
const generatedSplitUrl = computed(() => {
  const code = bookingCodeResult.value || `DRAFT-${props.trip.slug.slice(0, 6).toUpperCase()}-${participants.value}P`
  return `https://jejaknusa.id/split/${code}?pax=${participants.value}&per_person=${splitPerPerson.value}`
})

async function copySplitPaymentLink() {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(generatedSplitUrl.value)
    }
    splitLinkCopied.value = true
    setTimeout(() => {
      splitLinkCopied.value = false
    }, 2500)
  } catch {
    splitLinkCopied.value = false
  }
}

const bookingCodeResult = ref('')
const bookingLoading = ref(false)

function goToCheckoutPage() {
  router.push({
    path: `/customer/checkout/${props.trip.slug}`,
    query: { pax: String(participants.value) }
  })
}

async function handleBookingSubmit() {
  bookingLoading.value = true
  try {
    const res = await $fetch<{ booking?: { bookingCode?: string } }>('/api/bookings', {
      method: 'POST',
      body: {
        tripSlug: props.trip.slug,
        tripTitle: props.trip.title,
        departureDate: props.trip.nextDepartureDate,
        leaderName: groupMembers.value.map((m) => m.name).join(', '),
        participantsCount: participants.value,
        isSoloTraveler: participants.value === 1,
        hasInsurance: includeInsurance.value,
        addonsSummary: selectedAddons.value.map((a) => a.name),
        paymentScheme: paymentScheme.value === 'dp30' ? 'DP 30%' : 'Lunas 100%',
        paymentStatus: paymentScheme.value === 'dp30' ? 'DP 30% Lunas' : 'Lunas 100%',
        totalAmount: totalCost.value,
        paidAmount: dueToday.value
      }
    })
    bookingCodeResult.value = res.booking?.bookingCode || ''
    bookingSubmitted.value = true
  } finally {
    bookingLoading.value = false
  }
}
</script>

<template>
  <div class="rounded-[28px] glass-surface overflow-hidden">
    <!-- Deep Tropical Teal Header -->
    <div class="teal-card px-6 py-5 text-white">
      <div class="flex items-baseline justify-between gap-2">
        <div>
          <p class="text-xs font-medium text-teal-100/90">Harga Open Trip</p>
          <div class="mt-0.5 flex items-baseline gap-1.5">
            <span class="text-2xl font-extrabold tracking-tight">{{ formatRupiah(trip.pricePerPerson) }}</span>
            <span class="text-xs text-teal-100/80">/ orang</span>
          </div>
        </div>
        <span
          class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
          :class="trip.remainingQuota <= 3 ? 'bg-orange-500 text-white' : 'bg-white/15 text-white'"
        >
          <Users class="h-3.5 w-3.5" />
          Sisa {{ trip.remainingQuota }} slot
        </span>
      </div>
      <p class="mt-2 text-xs text-teal-100/90">
        Keberangkatan terdekat: <strong class="text-white">{{ formatDateID(trip.nextDepartureDate) }}</strong>
      </p>
    </div>

    <div class="p-6 space-y-5">
      <!-- Participant Counter -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label for="participants-input" class="text-sm font-bold text-[#162221]">
            Jumlah Peserta
          </label>
          <span class="text-xs text-[#667472]">Maks. {{ maxParticipants }} orang</span>
        </div>

        <div class="flex items-center justify-between rounded-full border border-[#e3dccd] bg-white p-1.5">
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4f1ea] text-[#2d3b39] hover:bg-[#1f6f6d] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            :disabled="participants <= 1"
            aria-label="Kurangi peserta"
            @click="decrementParticipants"
          >
            <Minus class="h-4 w-4" />
          </button>

          <div class="flex items-center gap-1.5">
            <input
              id="participants-input"
              v-model.number="participants"
              type="number"
              :min="1"
              :max="maxParticipants"
              class="w-12 bg-transparent text-center text-lg font-extrabold text-[#162221] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            >
            <span class="text-sm font-semibold text-[#667472]">orang</span>
          </div>

          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4f1ea] text-[#2d3b39] hover:bg-[#1f6f6d] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            :disabled="participants >= maxParticipants"
            aria-label="Tambah peserta"
            @click="incrementParticipants"
          >
            <Plus class="h-4 w-4" />
          </button>
        </div>
      </div>

      <!-- Payment Scheme Selector (DP 30% vs Full) -->
      <div class="space-y-2">
        <span class="text-xs font-bold uppercase tracking-wider text-[#5c6b69] flex items-center gap-1.5">
          <CreditCard class="h-3.5 w-3.5 text-[#1f6f6d]" />
          Skema Pembayaran Fleksibel
        </span>
        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            class="rounded-2xl border p-2.5 text-left transition cursor-pointer"
            :class="
              paymentScheme === 'dp30'
                ? 'border-[#1f6f6d] bg-[#eef7f6]'
                : 'border-[#e3dccd] bg-white hover:border-[#1f6f6d]/40'
            "
            @click="paymentScheme = 'dp30'"
          >
            <span class="block text-xs font-extrabold text-[#162221]">DP Ringan 30%</span>
            <span class="block text-[10px] text-[#5c6b69]">Kunci slot, lunasi H-7</span>
          </button>

          <button
            type="button"
            class="rounded-2xl border p-2.5 text-left transition cursor-pointer"
            :class="
              paymentScheme === 'full'
                ? 'border-[#1f6f6d] bg-[#eef7f6]'
                : 'border-[#e3dccd] bg-white hover:border-[#1f6f6d]/40'
            "
            @click="paymentScheme = 'full'"
          >
            <span class="block text-xs font-extrabold text-[#162221]">Bayar Lunas</span>
            <span class="block text-[10px] text-[#5c6b69]">Sekali transaksi beres</span>
          </button>
        </div>
      </div>

      <!-- Instant Adventure Insurance Checkbox -->
      <label
        class="flex items-start gap-3 rounded-2xl border p-3.5 cursor-pointer transition"
        :class="
          includeInsurance
            ? 'border-[#1f6f6d] bg-[#eef7f6]'
            : 'border-[#e3dccd] bg-white/80 hover:border-[#1f6f6d]/40'
        "
      >
        <input
          v-model="includeInsurance"
          type="checkbox"
          class="mt-1 h-4 w-4 rounded border-stone-300 text-[#1f6f6d] focus:ring-[#1f6f6d] accent-[#1f6f6d] cursor-pointer"
        >
        <div class="flex-1 text-sm">
          <div class="flex items-center justify-between gap-2">
            <span class="font-bold text-[#162221] inline-flex items-center gap-1.5 text-xs sm:text-sm">
              <ShieldPlus class="h-4 w-4 text-[#1f6f6d] shrink-0" />
              Asuransi Petualangan Instan
            </span>
            <span class="text-xs font-extrabold text-[#175957] whitespace-nowrap">
              +{{ formatRupiah(ADVENTURE_INSURANCE_FEE) }}/org
            </span>
          </div>
          <p class="mt-1 text-[11px] text-[#576664] leading-relaxed">
            Perlindungan evakuasi medis darurat, kecelakaan outdoor, dan cuaca ekstrem.
          </p>
        </div>
      </label>

      <!-- Carbon Offset Micro-Donation Toggle -->
      <label
        class="flex items-start gap-3 rounded-2xl border p-3 cursor-pointer transition"
        :class="
          includeCarbonOffset
            ? 'border-emerald-600 bg-emerald-50/80'
            : 'border-[#e3dccd] bg-white/80 hover:border-emerald-400'
        "
      >
        <input
          type="checkbox"
          :checked="includeCarbonOffset"
          class="mt-0.5 h-4 w-4 rounded accent-emerald-700 cursor-pointer"
          @change="emit('update:includeCarbonOffset', ($event.target as HTMLInputElement).checked)"
        >
        <div class="flex-1 text-xs">
          <div class="flex items-center justify-between gap-2">
            <span class="font-bold text-[#162221] inline-flex items-center gap-1.5">
              <Leaf class="h-3.5 w-3.5 text-emerald-700 shrink-0" />
              Carbon Offset &amp; Konservasi
            </span>
            <span class="font-extrabold text-emerald-800 whitespace-nowrap">+{{ formatRupiah(CARBON_OFFSET_FEE) }}</span>
          </div>
          <p class="mt-0.5 text-[11px] text-[#576664]">Tanam pohon / adopsi terumbu karang di lokasi trip.</p>
        </div>
      </label>

      <!-- Selected Gear Add-Ons Summary -->
      <div
        v-if="selectedAddons.length"
        class="rounded-2xl bg-white border border-[#e3dccd] p-3.5 space-y-1.5 text-xs"
      >
        <span class="font-extrabold text-[#1f6f6d] flex items-center gap-1.5">
          <Backpack class="h-3.5 w-3.5" />
          Add-On Perlengkapan Dipilih ({{ selectedAddons.length }})
        </span>
        <div
          v-for="addon in selectedAddons"
          :key="addon.id"
          class="flex items-center justify-between text-[#4a5957]"
        >
          <span class="truncate pr-2">{{ addon.name }}</span>
          <span class="font-bold text-[#162221] shrink-0">
            {{ formatRupiah(addon.unit === 'per orang' ? addon.price * participants : addon.price) }}
          </span>
        </div>
      </div>

      <!-- Cost Breakdown -->
      <div class="space-y-2 pt-2 border-t border-[#e8e2d5] text-xs sm:text-sm">
        <div class="flex items-center justify-between text-[#576664]">
          <span>Paket ({{ formatRupiah(trip.pricePerPerson) }} &times; {{ participants }})</span>
          <span class="font-semibold text-[#162221]">{{ formatRupiah(packageSubtotal) }}</span>
        </div>

        <div class="flex items-center justify-between text-[#576664]">
          <span>Asuransi Petualangan {{ includeInsurance ? `(${participants} org)` : '' }}</span>
          <span class="font-semibold" :class="includeInsurance ? 'text-[#162221]' : 'text-[#9aa5a3]'">
            {{ includeInsurance ? formatRupiah(insuranceSubtotal) : 'Rp0' }}
          </span>
        </div>

        <div v-if="addonsSubtotal > 0" class="flex items-center justify-between text-[#576664]">
          <span>Sewa Gear &amp; Add-On</span>
          <span class="font-semibold text-[#162221]">{{ formatRupiah(addonsSubtotal) }}</span>
        </div>

        <div v-if="carbonOffsetSubtotal > 0" class="flex items-center justify-between text-emerald-800">
          <span>Carbon Offset &amp; Konservasi</span>
          <span class="font-semibold">{{ formatRupiah(carbonOffsetSubtotal) }}</span>
        </div>

        <div class="flex items-center justify-between pt-3 border-t border-dashed border-[#dfd8c8]">
          <span class="font-bold text-[#162221]">Total Biaya Grup</span>
          <span class="text-lg font-extrabold text-[#162221]">{{ formatRupiah(totalCost) }}</span>
        </div>

        <div v-if="paymentScheme === 'dp30'" class="rounded-xl bg-[#eef7f6] px-3 py-2 text-xs space-y-1">
          <div class="flex items-center justify-between font-extrabold text-[#175957]">
            <span>Bayar DP 30% Hari Ini</span>
            <span>{{ formatRupiah(dueToday) }}</span>
          </div>
          <div class="flex items-center justify-between text-[#556a68]">
            <span>Sisa Pelunasan (H-7)</span>
            <span>{{ formatRupiah(remainingBalance) }}</span>
          </div>
        </div>
      </div>

      <!-- Split Bill & Group Management Box -->
      <div class="rounded-2xl bg-[#fff7ec] border border-amber-200/90 p-4 space-y-3">
        <div class="flex items-center justify-between gap-2">
          <span class="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-orange-700">
            <Sparkles class="h-3.5 w-3.5" />
            Split Bill &amp; Manajemen Grup
          </span>
          <button
            type="button"
            class="text-[11px] font-bold text-[#1f6f6d] hover:underline cursor-pointer"
            @click="showGroupTracker = !showGroupTracker"
          >
            {{ showGroupTracker ? 'Sembunyikan' : 'Atur Anggota' }}
          </button>
        </div>

        <div class="flex items-baseline justify-between gap-2">
          <span class="text-xs font-medium text-[#576664]">
            {{ paymentScheme === 'dp30' ? 'Patungan DP / orang' : 'Patungan total / orang' }}
          </span>
          <div class="text-right">
            <span class="text-xl font-extrabold text-orange-700">
              {{ formatRupiah(paymentScheme === 'dp30' ? dpSplitPerPerson : splitPerPerson) }}
            </span>
            <span class="text-xs font-semibold text-orange-700/80"> / org</span>
          </div>
        </div>

        <p v-if="paymentScheme === 'dp30'" class="text-[11px] text-[#667472]">
          Total per orang hingga lunas: <strong class="text-[#162221]">{{ formatRupiah(splitPerPerson) }}</strong>
        </p>

        <!-- Group Roster & Payment Status Tracker -->
        <div v-if="showGroupTracker" class="space-y-2 pt-2 border-t border-amber-200/70">
          <div class="flex items-center justify-between text-[11px] font-bold text-[#5c6b69]">
            <span>Daftar Anggota Grup</span>
            <span class="text-[#1f6f6d]">{{ paidMembersCount }}/{{ participants }} lunas</span>
          </div>

          <div class="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
            <div
              v-for="(member, idx) in groupMembers"
              :key="idx"
              class="flex items-center gap-2 rounded-xl bg-white/90 border border-amber-200/60 px-2.5 py-1.5"
            >
              <input
                v-model="member.name"
                type="text"
                :aria-label="`Nama peserta ${idx + 1}`"
                class="flex-1 min-w-0 bg-transparent text-xs font-semibold text-[#162221] focus:outline-none"
              >
              <button
                type="button"
                class="rounded-full px-2.5 py-0.5 text-[10px] font-bold transition cursor-pointer shrink-0"
                :class="
                  member.paid
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-stone-200/80 text-stone-600 hover:bg-amber-100'
                "
                @click="member.paid = !member.paid"
              >
                {{ member.paid ? 'Sudah Bayar' : 'Belum' }}
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          class="w-full inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-xs font-bold transition cursor-pointer"
          :class="
            copied
              ? 'border-[#1f6f6d] bg-[#1f6f6d] text-white'
              : 'border-orange-300 bg-white text-orange-700 hover:bg-orange-600 hover:text-white hover:border-orange-600'
          "
          @click="copySplitBill"
        >
          <Check v-if="copied" class="h-4 w-4" />
          <ClipboardCopy v-else class="h-4 w-4" />
          <span>{{ copied ? 'Rincian Tagihan Grup Tersalin!' : 'Salin Rincian Tagihan' }}</span>
        </button>

        <!-- Split Payment Link Generator -->
        <div class="rounded-xl bg-white/95 border border-amber-200/80 p-2.5 space-y-1.5">
          <p class="text-[10px] font-extrabold uppercase tracking-wider text-[#1f6f6d]">
            Generator Split Payment Link
          </p>
          <div class="flex items-center gap-1.5">
            <input
              type="text"
              readonly
              :value="generatedSplitUrl"
              aria-label="Split Payment Link"
              class="flex-1 min-w-0 rounded-lg bg-[#f4f1ea] px-2.5 py-1.5 text-[11px] font-mono text-[#162221] focus:outline-none"
            >
            <button
              type="button"
              class="rounded-lg bg-[#1f6f6d] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#175957] transition cursor-pointer shrink-0"
              @click="copySplitPaymentLink"
            >
              {{ splitLinkCopied ? 'Tersalin!' : 'Salin Link' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Primary Checkout CTA -->
      <button
        type="button"
        class="w-full rounded-full bg-[#1f6f6d] px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#1f6f6d]/25 hover:bg-[#175957] active:scale-[0.99] transition cursor-pointer"
        @click="goToCheckoutPage"
      >
        Pesan Destinasi Ini &amp; Bayar {{ features.qrisEnabled ? 'QRIS' : 'Instan' }}
      </button>

      <button
        type="button"
        class="w-full rounded-full border border-[#1f6f6d] bg-white px-5 py-2.5 text-xs font-extrabold text-[#1f6f6d] hover:bg-[#eef7f6] transition cursor-pointer"
        @click="handleBookingSubmit"
      >
        {{
          paymentScheme === 'dp30'
            ? `Quick Reserve DP 30% (${formatRupiah(dueToday)})`
            : `Quick Reserve Lunas (${formatRupiah(dueToday)})`
        }}
      </button>

      <!-- Escrow Trust Footer -->
      <p class="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#5c6b69]">
        <Lock class="h-3.5 w-3.5 text-[#1f6f6d]" />
        Dana dilindungi Rekening Bersama (Escrow) JejakNusa
      </p>

      <!-- Booking Confirmation Feedback -->
      <div
        v-if="bookingSubmitted"
        class="rounded-2xl bg-[#eef7f6] border border-[#c7e4e0] p-4 text-xs text-[#175957] space-y-1.5"
      >
        <div class="flex items-center gap-2 font-extrabold text-[#103f3e]">
          <CheckCircle2 class="h-4 w-4 shrink-0" />
          Booking Tersimpan ke Database {{ bookingCodeResult ? `(${bookingCodeResult})` : '!' }}
        </div>
        <p class="leading-relaxed">
          {{ participants }} slot ({{ groupMembers.map((m) => m.name).join(', ') }}) untuk
          <strong>{{ trip.title }}</strong> — pembayaran hari ini
          <strong>{{ formatRupiah(dueToday) }}</strong> siap dikonfirmasi oleh
          <strong>{{ trip.guide.name }}</strong> di Guide Portal.
        </p>
      </div>
    </div>
  </div>
</template>

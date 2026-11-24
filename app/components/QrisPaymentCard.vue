<script setup lang="ts">
import { CheckCircle2, Clock, QrCode, ShieldCheck } from 'lucide-vue-next'
import { formatRupiah } from '~/utils/format'

interface Props {
  invoiceNumber: string
  paymentReference: string
  merchantName?: string
  nmid?: string
  amount: number
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  merchantName: 'JEJAKNUSA OPEN TRIP INDONESIA',
  nmid: 'ID1026008842109',
  loading: false
})

const emit = defineEmits<{
  'confirm-paid': []
}>()

// Live 15-minute payment countdown timer
const remainingSeconds = ref(15 * 60)
let timerHandle: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  timerHandle = setInterval(() => {
    if (remainingSeconds.value > 0) {
      remainingSeconds.value -= 1
    }
  }, 1000)
})

onUnmounted(() => {
  if (timerHandle) clearInterval(timerHandle)
})

const formattedTimer = computed(() => {
  const mins = Math.floor(remainingSeconds.value / 60)
  const secs = remainingSeconds.value % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
})

// Generate deterministic 21x21 QR-style matrix with 3 authentic finder squares
const qrCells = computed(() => {
  const size = 21
  const seedStr = `${props.invoiceNumber}-${props.paymentReference}-${props.amount}`
  let hash = 2166136261
  for (let i = 0; i < seedStr.length; i++) {
    hash ^= seedStr.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }

  function isFinder(r: number, c: number, top: number, left: number): number | null {
    const dr = r - top
    const dc = c - left
    if (dr < 0 || dr > 6 || dc < 0 || dc > 6) return null
    if (dr === 0 || dr === 6 || dc === 0 || dc === 6) return 1
    if (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4) return 1
    return 0
  }

  const cells: { x: number; y: number; dark: boolean }[] = []
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const f1 = isFinder(r, c, 0, 0)
      const f2 = isFinder(r, c, 0, size - 7)
      const f3 = isFinder(r, c, size - 7, 0)

      let dark = false
      if (f1 !== null) {
        dark = f1 === 1
      } else if (f2 !== null) {
        dark = f2 === 1
      } else if (f3 !== null) {
        dark = f3 === 1
      } else if (r === 7 || c === 7) {
        dark = (r + c) % 3 === 0
      } else if (r === 6 || c === 6) {
        dark = (r + c) % 2 === 0
      } else {
        const bitSeed = Math.imul(hash ^ (r * 31 + c * 17), 2654435761) >>> 0
        dark = (bitSeed & 3) === 0 || (bitSeed & 7) === 1
      }

      if (dark) {
        cells.push({ x: c, y: r, dark: true })
      }
    }
  }
  return cells
})
</script>

<template>
  <div class="rounded-[28px] bg-white border-2 border-[#1f6f6d]/25 shadow-xl overflow-hidden">
    <!-- Top Official-Style QRIS Header -->
    <div class="bg-gradient-to-r from-[#103f3e] via-[#1f6f6d] to-[#175957] px-6 py-4 text-white flex items-center justify-between gap-3">
      <div class="flex items-center gap-2.5">
        <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#103f3e] font-black text-xs tracking-tight">
          QRIS
        </span>
        <div>
          <p class="text-xs font-extrabold tracking-wide uppercase">QRIS Instant Payment</p>
          <p class="text-[11px] text-teal-100/90">Mendukung GoPay, OVO, DANA, ShopeePay, BCA, Mandiri, BRI</p>
        </div>
      </div>

      <div class="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 border border-amber-300/40 px-3 py-1 text-xs font-extrabold text-amber-200 shrink-0">
        <Clock class="h-3.5 w-3.5" />
        <span>{{ formattedTimer }}</span>
      </div>
    </div>

    <div class="p-6 space-y-5">
      <!-- Merchant & Exact Amount -->
      <div class="text-center space-y-1">
        <p class="text-xs font-extrabold uppercase tracking-wider text-[#162221]">
          {{ merchantName }}
        </p>
        <p class="text-[11px] font-mono text-[#5c6b69]">
          NMID: {{ nmid }} &bull; Ref: {{ paymentReference }}
        </p>
        <div class="pt-2">
          <span class="block text-[11px] font-bold text-[#5c6b69]">Total Tagihan Tepat</span>
          <span class="font-editorial text-3xl font-extrabold text-[#1f6f6d] tracking-tight">
            {{ formatRupiah(amount) }}
          </span>
        </div>
      </div>

      <!-- Crisp SVG Dynamic QR Code -->
      <div class="mx-auto w-fit rounded-3xl bg-white p-4 border-2 border-[#e5dfd2] shadow-inner">
        <svg
          viewBox="-1 -1 23 23"
          class="h-52 w-52 sm:h-56 sm:w-56"
          role="img"
          :aria-label="`Kode QRIS untuk ${invoiceNumber}`"
        >
          <rect x="-1" y="-1" width="23" height="23" fill="#ffffff" />
          <rect
            v-for="(cell, idx) in qrCells"
            :key="idx"
            :x="cell.x"
            :y="cell.y"
            width="0.96"
            height="0.96"
            rx="0.14"
            fill="#102827"
          />
          <!-- Center QRIS Emblem -->
          <rect x="8.2" y="8.2" width="4.6" height="4.6" rx="0.9" fill="#ffffff" stroke="#1f6f6d" stroke-width="0.35" />
          <text
            x="10.5"
            y="11.1"
            text-anchor="middle"
            font-size="1.5"
            font-weight="900"
            fill="#1f6f6d"
            font-family="sans-serif"
          >
            QRIS
          </text>
        </svg>
      </div>

      <div class="rounded-2xl bg-[#eef7f6] border border-[#c7e4e0] p-3.5 text-xs text-[#175957] space-y-1">
        <p class="font-extrabold flex items-center gap-1.5">
          <QrCode class="h-4 w-4 shrink-0" />
          Cara Bayar Instan:
        </p>
        <p class="text-[11px] leading-relaxed text-[#355250]">
          Scan kode QR di atas dengan aplikasi mobile banking atau e-wallet Anda. Nominal tagihan <strong>{{ formatRupiah(amount) }}</strong> otomatis terisi tanpa perlu input manual.
        </p>
      </div>

      <!-- Simulation Button -->
      <button
        type="button"
        :disabled="loading"
        class="w-full inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 disabled:opacity-60 transition cursor-pointer"
        @click="emit('confirm-paid')"
      >
        <CheckCircle2 class="h-4.5 w-4.5" />
        <span>{{ loading ? 'Memverifikasi Pembayaran QRIS...' : 'Simulasi Konfirmasi Sudah Bayar (LUNAS)' }}</span>
      </button>

      <p class="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#5c6b69]">
        <ShieldCheck class="h-3.5 w-3.5 text-[#1f6f6d]" />
        Transaksi terverifikasi otomatis masuk ke Dashboard Pemandu Lokal &amp; Admin
      </p>
    </div>
  </div>
</template>

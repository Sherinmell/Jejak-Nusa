<script setup lang="ts">
import { CheckCircle2, HeartHandshake, Leaf, Sprout, TreePine } from 'lucide-vue-next'
import type { Trip } from '#shared/types/trip'
import { CARBON_OFFSET_FEE } from '#shared/types/ecosystem'
import { formatRupiah } from '~/utils/format'

interface Props {
  trip: Trip
  includeCarbonOffset: boolean
  ecoPledgeAccepted: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:includeCarbonOffset': [val: boolean]
  'update:ecoPledgeAccepted': [val: boolean]
}>()

const estimatedCarbonKg = computed(() => {
  switch (props.trip.category) {
    case 'Diving':
      return '24,6 kg CO₂e'
    case 'Trekking':
      return '16,2 kg CO₂e'
    case 'Canyoning':
      return '12,8 kg CO₂e'
    case 'Caving':
      return '14,1 kg CO₂e'
  }
})

const conservationProgram = computed(() => {
  switch (props.trip.category) {
    case 'Diving':
      return 'Adopsi 1 fragmen transplantasi terumbu karang bersama nelayan lokal'
    case 'Trekking':
      return 'Penanaman 2 bibit cemara gunung & dukungan program Zero-Waste gunung'
    case 'Canyoning':
      return 'Konservasi vegetasi daerah aliran sungai & pembersihan ngarai desa adat'
    case 'Caving':
      return 'Pelestarian ekosistem karst & edukasi konservasi gua bawah tanah'
  }
})

const localBreakdown = [
  { label: 'Pemandu Lokal & Porter Desa', percent: 44, color: 'bg-[#1f6f6d]' },
  { label: 'Homestay & Penginapan Warga', percent: 18, color: 'bg-[#2e948f]' },
  { label: 'Konsumsi & UMKM Kuliner Lokal', percent: 12, color: 'bg-amber-500' },
  { label: 'Kas Konservasi & Desa Adat', percent: 8, color: 'bg-emerald-600' },
  { label: 'Operasional Platform & Escrow', percent: 18, color: 'bg-[#c9c1b2]' }
]

const leaveNoTraceRules = computed(() => {
  const base = [
    'Bawa kembali 100% sampah pribadi (termasuk tisu basah dan bungkus camilan) hingga titik buang resmi.',
    'Hormati aturan adat, tempat suci, serta izin fotografi sebelum memotret warga lokal.'
  ]
  if (props.trip.category === 'Diving') {
    return [
      ...base,
      'Wajib gunakan sunscreen reef-safe serta dilarang menyentuh karang, penyu, atau pari manta.'
    ]
  }
  if (props.trip.category === 'Trekking') {
    return [
      ...base,
      'Tetap di jalur resmi, dilarang memetik flora endemik (seperti edelweiss), dan gunakan botol minum isi ulang.'
    ]
  }
  return [
    ...base,
    'Gunakan sabun ramah lingkungan saat bilas dan jaga ketenangan habitat satwa liar di sekitar lokasi.'
  ]
})
</script>

<template>
  <section class="rounded-[28px] glass-surface p-6 sm:p-7 space-y-6 border-emerald-200/80">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e8e2d5]">
      <div class="flex items-start gap-3">
        <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
          <Leaf class="h-5 w-5" />
        </span>
        <div>
          <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            Eco-Tourism &amp; Dampak Lokal
          </span>
          <h2 class="font-editorial text-2xl font-bold text-[#162221]">
            Keberlanjutan &amp; Transparansi Biaya
          </h2>
        </div>
      </div>

      <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-200 px-3.5 py-1 text-xs font-extrabold text-emerald-900 self-start">
        <HeartHandshake class="h-3.5 w-3.5" />
        82% Langsung ke Warga Lokal
      </span>
    </div>

    <!-- Carbon Footprint + Offset Toggle -->
    <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
      <div class="md:col-span-5 rounded-2xl bg-white/95 border border-[#ebe5d8] p-4 space-y-2">
        <span class="text-[11px] font-bold uppercase tracking-wider text-[#5c6b69] flex items-center gap-1.5">
          <TreePine class="h-4 w-4 text-emerald-700" />
          Estimasi Jejak Karbon
        </span>
        <p class="text-2xl font-extrabold text-[#162221]">{{ estimatedCarbonKg }}</p>
        <p class="text-xs text-[#5c6b69] leading-relaxed">
          Per peserta (transportasi lokal &amp; logistik lapangan selama {{ trip.duration }}).
        </p>
      </div>

      <label
        class="md:col-span-7 rounded-2xl border p-4 cursor-pointer transition flex items-start gap-3"
        :class="
          includeCarbonOffset
            ? 'border-emerald-600 bg-emerald-50/90'
            : 'border-[#ebe5d8] bg-white/95 hover:border-emerald-400'
        "
      >
        <input
          type="checkbox"
          :checked="includeCarbonOffset"
          class="mt-1 h-4 w-4 rounded accent-emerald-700 cursor-pointer"
          @change="emit('update:includeCarbonOffset', ($event.target as HTMLInputElement).checked)"
        >
        <div class="flex-1 space-y-1">
          <div class="flex items-center justify-between gap-2">
            <span class="text-sm font-extrabold text-[#162221] inline-flex items-center gap-1.5">
              <Sprout class="h-4 w-4 text-emerald-700" />
              Tambahkan Carbon Offset
            </span>
            <span class="rounded-full bg-emerald-700 px-2.5 py-0.5 text-xs font-extrabold text-white">
              +{{ formatRupiah(CARBON_OFFSET_FEE) }}
            </span>
          </div>
          <p class="text-xs text-[#43514f] leading-relaxed">
            {{ conservationProgram }} di {{ trip.location }}. Otomatis ditambahkan ke kalkulator Booking &amp; Split Bill.
          </p>
        </div>
      </label>
    </div>

    <!-- Local Economic Impact Transparency Bar -->
    <div class="space-y-3">
      <div class="flex items-center justify-between text-xs">
        <span class="font-extrabold uppercase tracking-wider text-[#4a5957]">
          Transparansi Alokasi Biaya Trip Anda
        </span>
        <span class="font-bold text-[#1f6f6d]">82% Ekonomi Lokal &bull; 18% Platform</span>
      </div>

      <div class="flex h-3.5 w-full overflow-hidden rounded-full bg-[#e6dfd1]">
        <div
          v-for="item in localBreakdown"
          :key="item.label"
          :class="item.color"
          :style="{ width: `${item.percent}%` }"
          :title="`${item.label}: ${item.percent}%`"
        />
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
        <div
          v-for="item in localBreakdown"
          :key="item.label"
          class="rounded-xl bg-white/90 border border-[#ebe5d8] p-2.5 space-y-0.5"
        >
          <div class="flex items-center gap-1.5 font-extrabold text-[#162221]">
            <span class="h-2 w-2 rounded-full shrink-0" :class="item.color" />
            <span>{{ item.percent }}%</span>
          </div>
          <p class="text-[#5c6b69] leading-tight">{{ item.label }}</p>
        </div>
      </div>
    </div>

    <!-- Leave No Trace Ethics Guide & Mandatory Pledge -->
    <div class="rounded-2xl bg-[#fbf9f5] border border-[#e3dccd] p-4 sm:p-5 space-y-3">
      <h3 class="text-sm font-extrabold text-[#162221]">
        Panduan Etika Lingkungan (Leave No Trace) — {{ trip.location }}
      </h3>
      <ul class="space-y-2 text-xs text-[#43514f]">
        <li v-for="(rule, idx) in leaveNoTraceRules" :key="idx" class="flex items-start gap-2 leading-relaxed">
          <CheckCircle2 class="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
          <span>{{ rule }}</span>
        </li>
      </ul>

      <label
        class="mt-2 flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs font-bold cursor-pointer transition"
        :class="
          ecoPledgeAccepted
            ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
            : 'border-orange-200 bg-orange-50/70 text-orange-900'
        "
      >
        <input
          type="checkbox"
          :checked="ecoPledgeAccepted"
          class="h-4 w-4 rounded accent-emerald-700 cursor-pointer"
          @change="emit('update:ecoPledgeAccepted', ($event.target as HTMLInputElement).checked)"
        >
        <span>
          Saya menyetujui etika Leave No Trace dan aturan adat lokal di {{ trip.location }} sebelum berangkat.
        </span>
      </label>
    </div>
  </section>
</template>

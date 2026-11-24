<script setup lang="ts">
import { RotateCcw, Search, SlidersHorizontal } from 'lucide-vue-next'
import {
  ADRENALINE_LEVELS,
  TRIP_CATEGORIES,
  type AdrenalineLevel,
  type TripCategory,
  type TripFilterState
} from '#shared/types/trip'
import { formatRupiah } from '~/utils/format'

interface Props {
  modelValue: TripFilterState
  maxLimitPrice?: number
  totalResults?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxLimitPrice: 4000000,
  totalResults: 0
})

const emit = defineEmits<{
  'update:modelValue': [value: TripFilterState]
  reset: []
}>()

function updateField<K extends keyof TripFilterState>(key: K, value: TripFilterState[K]) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value
  })
}

function toggleCategory(cat: TripCategory) {
  const next = props.modelValue.category === cat ? '' : cat
  updateField('category', next)
}

function toggleLevel(lvl: AdrenalineLevel) {
  const next = props.modelValue.level === lvl ? '' : lvl
  updateField('level', next)
}

const hasActiveFilters = computed(() => {
  return Boolean(
    props.modelValue.q.trim() ||
      props.modelValue.category ||
      props.modelValue.level ||
      props.modelValue.date ||
      props.modelValue.maxPrice < props.maxLimitPrice
  )
})
</script>

<template>
  <aside class="rounded-[28px] glass-surface p-5 sm:p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between gap-2 pb-4 border-b border-[#e8e2d5]">
      <div class="flex items-center gap-2">
        <span class="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eef7f6] text-[#1f6f6d]">
          <SlidersHorizontal class="h-4 w-4" />
        </span>
        <h2 class="font-editorial text-lg font-bold text-[#162221]">Filter Petualangan</h2>
      </div>
      <button
        v-if="hasActiveFilters"
        type="button"
        class="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
        @click="emit('reset')"
      >
        <RotateCcw class="h-3.5 w-3.5" />
        Reset
      </button>
    </div>

    <!-- Search Keyword / Location -->
    <div class="space-y-2">
      <label for="filter-q" class="block text-[11px] font-bold uppercase tracking-wider text-[#667472]">
        Destinasi / Kata Kunci
      </label>
      <div class="relative">
        <Search class="h-4 w-4 text-[#7d8a88] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          id="filter-q"
          :value="modelValue.q"
          type="text"
          placeholder="Rinjani, Bali, Komodo..."
          class="w-full rounded-full border border-[#e3dccd] bg-white pl-10 pr-4 py-2.5 text-sm text-[#1c2423] placeholder:text-[#98a3a0] focus:border-[#1f6f6d] focus:outline-none focus:ring-2 focus:ring-[#1f6f6d]/20 transition"
          @input="updateField('q', ($event.target as HTMLInputElement).value)"
        >
      </div>
    </div>

    <!-- Category Filter -->
    <div class="space-y-2.5">
      <span class="block text-[11px] font-bold uppercase tracking-wider text-[#667472]">
        Kategori Aktivitas
      </span>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="cat in TRIP_CATEGORIES"
          :key="cat"
          type="button"
          class="rounded-2xl border px-3 py-2.5 text-xs font-bold transition text-center cursor-pointer"
          :class="
            modelValue.category === cat
              ? 'border-[#1f6f6d] bg-[#1f6f6d] text-white shadow-sm shadow-[#1f6f6d]/25'
              : 'border-[#e3dccd] bg-white/80 text-[#3f4f4d] hover:border-[#1f6f6d]/50 hover:bg-[#eef7f6]'
          "
          @click="toggleCategory(cat)"
        >
          {{ cat }}
        </button>
      </div>
    </div>

    <!-- Adrenaline Level Filter -->
    <div class="space-y-2.5">
      <span class="block text-[11px] font-bold uppercase tracking-wider text-[#667472]">
        Level Adrenalin
      </span>
      <div class="flex flex-col gap-2">
        <button
          v-for="lvl in ADRENALINE_LEVELS"
          :key="lvl"
          type="button"
          class="flex items-center justify-between rounded-2xl border px-3.5 py-2.5 text-sm font-semibold transition cursor-pointer"
          :class="
            modelValue.level === lvl
              ? 'border-orange-500 bg-orange-50/90 text-orange-900'
              : 'border-[#e3dccd] bg-white/80 text-[#33413f] hover:border-[#1f6f6d]/40 hover:bg-white'
          "
          @click="toggleLevel(lvl)"
        >
          <span class="flex items-center gap-2">
            <span
              class="h-2.5 w-2.5 rounded-full"
              :class="
                lvl === 'Pemula'
                  ? 'bg-emerald-600'
                  : lvl === 'Menengah'
                    ? 'bg-amber-500'
                    : 'bg-orange-600'
              "
            />
            {{ lvl }}
          </span>
          <span class="text-[11px] font-medium text-[#6f7d7b]">
            {{ lvl === 'Pemula' ? 'Ramah baru' : lvl === 'Menengah' ? 'Aktif' : 'Tantangan tinggi' }}
          </span>
        </button>
      </div>
    </div>

    <!-- Max Price Slider -->
    <div class="space-y-3">
      <div class="flex items-center justify-between gap-2">
        <label for="filter-max-price" class="text-[11px] font-bold uppercase tracking-wider text-[#667472]">
          Harga Maksimal
        </label>
        <span class="rounded-full bg-[#eef7f6] px-2.5 py-1 text-xs font-extrabold text-[#175957] border border-[#c7e4e0]">
          {{ formatRupiah(modelValue.maxPrice) }}
        </span>
      </div>

      <input
        id="filter-max-price"
        type="range"
        class="adventure-range w-full h-2 rounded-lg bg-[#e2dacb] cursor-pointer"
        :min="500000"
        :max="maxLimitPrice"
        :step="100000"
        :value="modelValue.maxPrice"
        @input="updateField('maxPrice', Number(($event.target as HTMLInputElement).value))"
      >

      <div class="flex justify-between text-[11px] font-medium text-[#7f8c8a]">
        <span>Rp500 rb</span>
        <span>{{ formatRupiah(maxLimitPrice) }}</span>
      </div>
    </div>

    <!-- Departure Date Filter -->
    <div class="space-y-2">
      <label for="filter-date" class="block text-[11px] font-bold uppercase tracking-wider text-[#667472]">
        Berangkat Mulai Tanggal
      </label>
      <input
        id="filter-date"
        :value="modelValue.date"
        type="date"
        class="w-full rounded-2xl border border-[#e3dccd] bg-white px-3.5 py-2.5 text-sm text-[#1c2423] focus:border-[#1f6f6d] focus:outline-none focus:ring-2 focus:ring-[#1f6f6d]/20 transition"
        @input="updateField('date', ($event.target as HTMLInputElement).value)"
      >
    </div>

    <!-- Summary Count -->
    <div class="pt-3 border-t border-[#e8e2d5] text-xs text-[#667472] flex items-center justify-between">
      <span>Menampilkan hasil</span>
      <span class="font-extrabold text-[#1f6f6d]">{{ totalResults }} paket trip</span>
    </div>
  </aside>
</template>

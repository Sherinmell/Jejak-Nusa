<script setup lang="ts">
import { ArrowUpDown, BedDouble, Coffee, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-vue-next'
import {
  HOTEL_TYPES,
  type HotelFilterState,
  type HotelsApiResponse,
  type HotelSortOption,
  type HotelType
} from '#shared/types/hotel'
import { formatRupiah } from '~/utils/format'

useSeoMeta({
  title: 'Penginapan & Hotel Partner Petualangan — JejakNusa',
  description:
    'Temukan eco-lodge, villa, glamping, dan boutique hotel terverifikasi yang dekat dengan basecamp open trip di seluruh Indonesia.'
})

const route = useRoute()
const router = useRouter()

const DEFAULT_MAX_PRICE = 2500000

function parseQuery(): HotelFilterState {
  const q = typeof route.query.q === 'string' ? route.query.q : ''
  const type =
    typeof route.query.type === 'string' && HOTEL_TYPES.includes(route.query.type as HotelType)
      ? (route.query.type as HotelType)
      : ''
  const maxPriceNum = Number(route.query.maxPrice)
  const maxPrice =
    Number.isFinite(maxPriceNum) && maxPriceNum >= 400000 && maxPriceNum <= DEFAULT_MAX_PRICE
      ? maxPriceNum
      : DEFAULT_MAX_PRICE
  const breakfastOnly = route.query.breakfastOnly === 'true'
  const sort = (typeof route.query.sort === 'string' ? route.query.sort : 'recommended') as HotelSortOption

  return { q, type, maxPrice, breakfastOnly, sort }
}

const filters = ref<HotelFilterState>(parseQuery())

watch(
  () => route.query,
  () => {
    const parsed = parseQuery()
    if (JSON.stringify(parsed) !== JSON.stringify(filters.value)) {
      filters.value = parsed
    }
  }
)

watch(
  filters,
  (val) => {
    const nextQuery: Record<string, string> = {}
    if (val.q.trim()) nextQuery.q = val.q.trim()
    if (val.type) nextQuery.type = val.type
    if (val.maxPrice < DEFAULT_MAX_PRICE) nextQuery.maxPrice = String(val.maxPrice)
    if (val.breakfastOnly) nextQuery.breakfastOnly = 'true'
    if (val.sort && val.sort !== 'recommended') nextQuery.sort = val.sort

    if (JSON.stringify(route.query) !== JSON.stringify(nextQuery)) {
      router.replace({ query: nextQuery })
    }
  },
  { deep: true }
)

const apiQuery = computed(() => {
  const query: Record<string, string | number> = {}
  if (filters.value.q.trim()) query.q = filters.value.q.trim()
  if (filters.value.type) query.type = filters.value.type
  if (filters.value.maxPrice < DEFAULT_MAX_PRICE) query.maxPrice = filters.value.maxPrice
  if (filters.value.breakfastOnly) query.breakfastOnly = 'true'
  if (filters.value.sort) query.sort = filters.value.sort
  return query
})

const { data, pending } = await useFetch<HotelsApiResponse>('/api/hotels', {
  query: apiQuery,
  watch: [apiQuery]
})

const hotels = computed(() => data.value?.hotels ?? [])
const totalHotels = computed(() => data.value?.total ?? 0)

function resetFilters() {
  filters.value = {
    q: '',
    type: '',
    maxPrice: DEFAULT_MAX_PRICE,
    breakfastOnly: false,
    sort: 'recommended'
  }
}

const hasActiveFilters = computed(() =>
  Boolean(
    filters.value.q.trim() ||
      filters.value.type ||
      filters.value.breakfastOnly ||
      filters.value.maxPrice < DEFAULT_MAX_PRICE
  )
)
</script>

<template>
  <div class="space-y-6">
    <!-- Top Type Pills & Sort Bar -->
    <div class="rounded-[26px] glass-surface px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="rounded-full px-4 py-2 text-xs font-bold transition cursor-pointer"
          :class="
            !filters.type
              ? 'bg-[#1f6f6d] text-white shadow-sm'
              : 'bg-white border border-[#e3dccd] text-[#3f4f4d] hover:border-[#1f6f6d]'
          "
          @click="filters.type = ''"
        >
          Semua Properti
        </button>

        <button
          v-for="t in HOTEL_TYPES"
          :key="t"
          type="button"
          class="rounded-full px-4 py-2 text-xs font-bold transition cursor-pointer"
          :class="
            filters.type === t
              ? 'bg-[#1f6f6d] text-white shadow-sm'
              : 'bg-white border border-[#e3dccd] text-[#3f4f4d] hover:border-[#1f6f6d]'
          "
          @click="filters.type = filters.type === t ? '' : t"
        >
          {{ t }}
        </button>
      </div>

      <div class="relative flex items-center self-start sm:self-auto">
        <ArrowUpDown class="h-3.5 w-3.5 text-[#6d7a78] absolute left-3.5 pointer-events-none" />
        <select
          v-model="filters.sort"
          aria-label="Urutkan penginapan"
          class="rounded-full border border-[#e3dccd] bg-white pl-9 pr-7 py-2 text-xs font-bold text-[#162221] focus:border-[#1f6f6d] focus:outline-none cursor-pointer"
        >
          <option value="recommended">Urutkan: Rekomendasi</option>
          <option value="price-asc">Tarif: Termurah</option>
          <option value="price-desc">Tarif: Termahal</option>
          <option value="rating-desc">Rating Tertinggi</option>
        </select>
      </div>
    </div>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Filter Sidebar -->
      <aside class="lg:col-span-3 rounded-[28px] glass-surface p-5 sm:p-6 space-y-5 lg:sticky lg:top-6">
        <div class="flex items-center justify-between pb-3.5 border-b border-[#e8e2d5]">
          <div class="flex items-center gap-2">
            <span class="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eef7f6] text-[#1f6f6d]">
              <SlidersHorizontal class="h-4 w-4" />
            </span>
            <h2 class="font-editorial text-lg font-bold text-[#162221]">Filter Hotel</h2>
          </div>
          <button
            v-if="hasActiveFilters"
            type="button"
            class="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:underline cursor-pointer"
            @click="resetFilters"
          >
            <RotateCcw class="h-3.5 w-3.5" />
            Reset
          </button>
        </div>

        <!-- Search -->
        <div class="space-y-1.5">
          <label for="hotel-search-q" class="block text-[11px] font-bold uppercase tracking-wider text-[#667472]">
            Lokasi / Nama Hotel
          </label>
          <div class="relative">
            <Search class="h-4 w-4 text-[#7d8a88] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="hotel-search-q"
              v-model="filters.q"
              type="text"
              placeholder="Bali, Rinjani, Labuan Bajo..."
              class="w-full rounded-full border border-[#e3dccd] bg-white pl-10 pr-4 py-2.5 text-sm text-[#162221] placeholder:text-[#98a3a0] focus:border-[#1f6f6d] focus:outline-none"
            >
          </div>
        </div>

        <!-- Max Price -->
        <div class="space-y-2.5">
          <div class="flex items-center justify-between">
            <label for="hotel-max-price" class="text-[11px] font-bold uppercase tracking-wider text-[#667472]">
              Maks. / Malam
            </label>
            <span class="rounded-full bg-[#eef7f6] px-2.5 py-1 text-xs font-extrabold text-[#175957] border border-[#c7e4e0]">
              {{ formatRupiah(filters.maxPrice) }}
            </span>
          </div>
          <input
            id="hotel-max-price"
            v-model.number="filters.maxPrice"
            type="range"
            min="400000"
            :max="DEFAULT_MAX_PRICE"
            step="100000"
            class="adventure-range w-full h-2 rounded-lg bg-[#e2dacb] cursor-pointer"
          >
          <div class="flex justify-between text-[11px] text-[#7f8c8a]">
            <span>Rp400 rb</span>
            <span>{{ formatRupiah(DEFAULT_MAX_PRICE) }}</span>
          </div>
        </div>

        <!-- Breakfast Filter -->
        <label
          class="flex items-center gap-3 rounded-2xl border p-3.5 cursor-pointer transition"
          :class="
            filters.breakfastOnly
              ? 'border-[#1f6f6d] bg-[#eef7f6]'
              : 'border-[#e3dccd] bg-white/80 hover:border-[#1f6f6d]/40'
          "
        >
          <input
            v-model="filters.breakfastOnly"
            type="checkbox"
            class="h-4 w-4 rounded accent-[#1f6f6d] cursor-pointer"
          >
          <span class="text-xs font-bold text-[#162221] inline-flex items-center gap-1.5">
            <Coffee class="h-4 w-4 text-[#1f6f6d]" />
            Termasuk Sarapan Gratis
          </span>
        </label>

        <div class="pt-3 border-t border-[#e8e2d5] text-xs text-[#667472] flex items-center justify-between">
          <span>Hasil ditemukan</span>
          <span class="font-extrabold text-[#1f6f6d]">{{ totalHotels }} penginapan</span>
        </div>
      </aside>

      <!-- Hotels List -->
      <div class="lg:col-span-9">
        <div v-if="pending" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          <div v-for="n in 6" :key="n" class="h-[380px] rounded-[24px] bg-[#e9e3d7] animate-pulse" />
        </div>

        <div v-else-if="hotels.length > 0" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          <HotelCard v-for="hotel in hotels" :key="hotel.id" :hotel="hotel" />
        </div>

        <div v-else class="rounded-[28px] glass-surface p-12 text-center space-y-4">
          <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef7f6] text-[#1f6f6d]">
            <BedDouble class="h-7 w-7" />
          </div>
          <h2 class="font-editorial text-2xl font-bold text-[#162221]">Penginapan tidak ditemukan</h2>
          <p class="text-sm text-[#5c6b69] max-w-md mx-auto">
            Coba naikkan batas harga per malam atau hapus filter tipe properti untuk melihat pilihan lainnya.
          </p>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-full bg-[#1f6f6d] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#175957] transition cursor-pointer"
            @click="resetFilters"
          >
            <X class="h-4 w-4" />
            Reset Filter Hotel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

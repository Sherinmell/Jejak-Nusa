<script setup lang="ts">
import { ArrowUpDown, Compass, Heart, SlidersHorizontal, X } from 'lucide-vue-next'
import {
  ADRENALINE_LEVELS,
  TRIP_CATEGORIES,
  type AdrenalineLevel,
  type TripCategory,
  type TripFilterState,
  type TripsApiResponse,
  type TripSortOption
} from '#shared/types/trip'
import { formatDateID, formatRupiah } from '~/utils/format'

useSeoMeta({
  title: 'Katalog Open Trip Indonesia — JejakNusa',
  description:
    'Cari dan filter open trip trekking, canyoning, diving, dan caving berdasarkan level adrenalin dan anggaran Anda.'
})

const route = useRoute()
const router = useRouter()
const { savedIds } = useSavedTrips()

const DEFAULT_MAX_PRICE = 4000000
const mobileFilterOpen = ref(false)
const savedOnly = computed(() => route.query.saved === 'true')

function parseQueryToFilters(): TripFilterState {
  const q = typeof route.query.q === 'string' ? route.query.q : ''
  const category =
    typeof route.query.category === 'string' &&
    TRIP_CATEGORIES.includes(route.query.category as TripCategory)
      ? (route.query.category as TripCategory)
      : ''
  const level =
    typeof route.query.level === 'string' &&
    ADRENALINE_LEVELS.includes(route.query.level as AdrenalineLevel)
      ? (route.query.level as AdrenalineLevel)
      : ''
  const maxPriceNum = Number(route.query.maxPrice)
  const maxPrice =
    Number.isFinite(maxPriceNum) && maxPriceNum >= 500000 && maxPriceNum <= DEFAULT_MAX_PRICE
      ? maxPriceNum
      : DEFAULT_MAX_PRICE
  const date = typeof route.query.date === 'string' ? route.query.date : ''
  const sort = (typeof route.query.sort === 'string' ? route.query.sort : 'recommended') as TripSortOption

  return { q, category, level, maxPrice, date, sort }
}

const filters = ref<TripFilterState>(parseQueryToFilters())

watch(
  () => route.query,
  () => {
    const parsed = parseQueryToFilters()
    if (JSON.stringify(parsed) !== JSON.stringify(filters.value)) {
      filters.value = parsed
    }
  }
)

watch(
  filters,
  (val) => {
    const nextQuery: Record<string, string> = {}
    if (savedOnly.value) nextQuery.saved = 'true'
    if (val.q.trim()) nextQuery.q = val.q.trim()
    if (val.category) nextQuery.category = val.category
    if (val.level) nextQuery.level = val.level
    if (val.maxPrice < DEFAULT_MAX_PRICE) nextQuery.maxPrice = String(val.maxPrice)
    if (val.date) nextQuery.date = val.date
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
  if (filters.value.category) query.category = filters.value.category
  if (filters.value.level) query.level = filters.value.level
  if (filters.value.maxPrice < DEFAULT_MAX_PRICE) query.maxPrice = filters.value.maxPrice
  if (filters.value.date) query.date = filters.value.date
  if (filters.value.sort) query.sort = filters.value.sort
  return query
})

const { data, pending, refresh } = await useFetch<TripsApiResponse>('/api/trips', {
  query: apiQuery,
  watch: [apiQuery]
})

const trips = computed(() => {
  const list = data.value?.trips ?? []
  if (savedOnly.value) {
    return list.filter((trip) => savedIds.value.includes(trip.id))
  }
  return list
})

const totalTrips = computed(() => trips.value.length)

function resetFilters() {
  filters.value = {
    q: '',
    category: '',
    level: '',
    maxPrice: DEFAULT_MAX_PRICE,
    date: '',
    sort: 'recommended'
  }
  if (savedOnly.value) {
    router.replace({ path: '/trips' })
  }
}

const activeFilterChips = computed(() => {
  const chips: { key: string; label: string }[] = []
  if (savedOnly.value) chips.push({ key: 'saved', label: 'Hanya Favorit Tersimpan' })
  if (filters.value.q.trim()) chips.push({ key: 'q', label: `Cari: "${filters.value.q.trim()}"` })
  if (filters.value.category) chips.push({ key: 'category', label: `Kategori: ${filters.value.category}` })
  if (filters.value.level) chips.push({ key: 'level', label: `Level: ${filters.value.level}` })
  if (filters.value.maxPrice < DEFAULT_MAX_PRICE) {
    chips.push({ key: 'maxPrice', label: `Maks: ${formatRupiah(filters.value.maxPrice)}` })
  }
  if (filters.value.date) chips.push({ key: 'date', label: `Mulai: ${formatDateID(filters.value.date)}` })
  return chips
})

function clearSingleFilter(key: string) {
  if (key === 'saved') {
    const rest = { ...route.query }
    delete rest.saved
    router.replace({ query: rest })
  } else if (key === 'maxPrice') {
    filters.value.maxPrice = DEFAULT_MAX_PRICE
  } else if (key === 'sort') {
    filters.value.sort = 'recommended'
  } else if (key in filters.value) {
    filters.value[key as keyof TripFilterState] = '' as never
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Top Controls Bar -->
    <div class="rounded-[26px] glass-surface px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="rounded-full px-4 py-2 text-xs font-bold transition cursor-pointer"
          :class="
            !filters.category && !savedOnly
              ? 'bg-[#1f6f6d] text-white shadow-sm'
              : 'bg-white border border-[#e3dccd] text-[#3f4f4d] hover:border-[#1f6f6d]'
          "
          @click="filters.category = ''; if (savedOnly) clearSingleFilter('saved')"
        >
          Semua Trip
        </button>

        <button
          v-for="cat in TRIP_CATEGORIES"
          :key="cat"
          type="button"
          class="rounded-full px-4 py-2 text-xs font-bold transition cursor-pointer"
          :class="
            filters.category === cat
              ? 'bg-[#1f6f6d] text-white shadow-sm'
              : 'bg-white border border-[#e3dccd] text-[#3f4f4d] hover:border-[#1f6f6d]'
          "
          @click="filters.category = filters.category === cat ? '' : cat"
        >
          {{ cat }}
        </button>

        <NuxtLink
          :to="savedOnly ? '/trips' : '/trips?saved=true'"
          class="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition"
          :class="
            savedOnly
              ? 'bg-orange-600 text-white shadow-sm'
              : 'bg-white border border-[#e3dccd] text-[#3f4f4d] hover:border-orange-400'
          "
        >
          <Heart class="h-3.5 w-3.5" :class="savedOnly ? 'fill-current' : ''" />
          Favorit ({{ savedIds.length }})
        </NuxtLink>
      </div>

      <div class="flex items-center gap-2.5 self-start sm:self-auto">
        <button
          type="button"
          class="lg:hidden inline-flex items-center gap-2 rounded-full border border-[#dfd8c8] bg-white px-4 py-2 text-xs font-bold text-[#162221] hover:bg-[#faf8f4] transition cursor-pointer"
          @click="mobileFilterOpen = true"
        >
          <SlidersHorizontal class="h-4 w-4 text-[#1f6f6d]" />
          Filter
          <span
            v-if="activeFilterChips.length"
            class="inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-orange-600 px-1 text-[10px] font-bold text-white"
          >
            {{ activeFilterChips.length }}
          </span>
        </button>

        <div class="relative flex items-center">
          <ArrowUpDown class="h-3.5 w-3.5 text-[#6d7a78] absolute left-3.5 pointer-events-none" />
          <select
            v-model="filters.sort"
            aria-label="Urutkan paket trip"
            class="rounded-full border border-[#e3dccd] bg-white pl-9 pr-7 py-2 text-xs font-bold text-[#162221] focus:border-[#1f6f6d] focus:outline-none transition cursor-pointer"
          >
            <option value="recommended">Urutkan: Rekomendasi</option>
            <option value="price-asc">Harga: Termurah</option>
            <option value="price-desc">Harga: Termahal</option>
            <option value="rating-desc">Rating Tertinggi</option>
            <option value="quota-asc">Kuota Hampir Penuh</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Active Filter Chips -->
    <div v-if="activeFilterChips.length" class="flex flex-wrap items-center gap-2 px-1">
      <span class="text-xs font-semibold text-[#667472] mr-1">Filter aktif:</span>
      <button
        v-for="chip in activeFilterChips"
        :key="chip.key"
        type="button"
        class="inline-flex items-center gap-1.5 rounded-full bg-[#eef7f6] border border-[#c7e4e0] px-3 py-1 text-xs font-bold text-[#175957] hover:bg-[#d5ece9] transition cursor-pointer"
        @click="clearSingleFilter(chip.key)"
      >
        {{ chip.label }}
        <X class="h-3.5 w-3.5 text-[#1f6f6d]" />
      </button>
      <button
        type="button"
        class="text-xs font-bold text-orange-600 hover:underline ml-1 cursor-pointer"
        @click="resetFilters"
      >
        Hapus semua
      </button>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Desktop Filter Sidebar -->
      <div class="hidden lg:block lg:col-span-3 sticky top-6">
        <FilterSidebar
          v-model="filters"
          :max-limit-price="DEFAULT_MAX_PRICE"
          :total-results="totalTrips"
          @reset="resetFilters"
        />
      </div>

      <!-- Trip Cards List -->
      <div class="lg:col-span-9">
        <div class="mb-4 flex items-center justify-between text-xs sm:text-sm text-[#5c6b69] px-1">
          <p>
            Menampilkan <strong class="text-[#162221]">{{ totalTrips }}</strong> paket open trip tersedia
          </p>
        </div>

        <!-- Loading Skeleton -->
        <div v-if="pending" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          <div
            v-for="n in 6"
            :key="n"
            class="h-[380px] rounded-[24px] bg-[#e9e3d7] animate-pulse"
          />
        </div>

        <!-- Results Grid -->
        <div v-else-if="trips.length > 0" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          <TripCard v-for="trip in trips" :key="trip.id" :trip="trip" />
        </div>

        <!-- Empty State -->
        <div
          v-else
          class="rounded-[28px] glass-surface p-12 text-center space-y-4"
        >
          <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef7f6] text-[#1f6f6d]">
            <Compass class="h-7 w-7" />
          </div>
          <h2 class="font-editorial text-2xl font-bold text-[#162221]">Belum ada open trip yang cocok</h2>
          <p class="text-sm text-[#5c6b69] max-w-md mx-auto leading-relaxed">
            Coba longgarkan batas harga maksimal, pilih tanggal lebih awal, atau hapus sebagian filter untuk melihat petualangan seru lainnya.
          </p>
          <div class="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              class="rounded-full bg-[#1f6f6d] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#175957] transition cursor-pointer"
              @click="resetFilters"
            >
              Reset Semua Filter
            </button>
            <button
              type="button"
              class="rounded-full border border-[#dfd8c8] bg-white px-5 py-2.5 text-sm font-bold text-[#3f4f4d] hover:bg-[#faf8f4] transition cursor-pointer"
              @click="refresh()"
            >
              Muat Ulang
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Filter Drawer -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="mobileFilterOpen"
          class="fixed inset-0 z-50 lg:hidden flex justify-end bg-[#102625]/45 backdrop-blur-xs"
          @click.self="mobileFilterOpen = false"
        >
          <div class="relative h-full w-full max-w-sm bg-[#f4f1ea] p-4 overflow-y-auto shadow-2xl">
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-editorial text-lg font-bold text-[#162221]">Filter Open Trip</h2>
              <button
                type="button"
                class="rounded-full p-2 text-[#5c6b69] hover:bg-white transition cursor-pointer"
                aria-label="Tutup filter"
                @click="mobileFilterOpen = false"
              >
                <X class="h-5 w-5" />
              </button>
            </div>

            <FilterSidebar
              v-model="filters"
              :max-limit-price="DEFAULT_MAX_PRICE"
              :total-results="totalTrips"
              @reset="resetFilters"
            />

            <div class="mt-4">
              <button
                type="button"
                class="w-full rounded-full bg-[#1f6f6d] py-3 text-sm font-extrabold text-white hover:bg-[#175957] transition cursor-pointer"
                @click="mobileFilterOpen = false"
              >
                Tampilkan {{ totalTrips }} Trip
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

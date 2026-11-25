<script setup lang="ts">
import {
  ArrowRight,
  Calendar,
  ChevronRight,
  Cloud,
  CloudSun,
  Compass,
  MapPin,
  Moon,
  Navigation,
  Search,
  ShieldCheck,
  Sun,
  Users
} from 'lucide-vue-next'
import { TRIP_CATEGORIES, type TripCategory, type TripsApiResponse } from '#shared/types/trip'
import type { HotelsApiResponse } from '#shared/types/hotel'
import { buildImageSrcSet, formatDateID, optimizeImageUrl } from '~/utils/format'

useSeoMeta({
  title: 'JejakNusa — Marketplace Open Trip & Pemandu Lokal Terverifikasi Indonesia',
  description:
    'Jelajahi open trip trekking, canyoning, diving, dan caving di seluruh Indonesia bersama pemandu lokal terverifikasi. Dilengkapi kalkulator split bill instan.'
})

const router = useRouter()
const showMatchmakerModal = ref(false)

const searchLocation = ref('')
const searchCategory = ref<TripCategory | ''>('')
const searchDate = ref('')

const [{ data: allTripsData, pending: tripsPending }, { data: featuredHotelsData, pending: hotelsPending }] =
  await Promise.all([
    useFetch<TripsApiResponse>('/api/trips'),
    useFetch<HotelsApiResponse>('/api/hotels', {
      query: { featured: 'true' }
    })
  ])

const allTrips = computed(() => allTripsData.value?.trips ?? [])
const featuredTrips = computed(() => allTrips.value.filter((t) => t.featured).slice(0, 4))
const featuredHotels = computed(() => (featuredHotelsData.value?.hotels ?? []).slice(0, 4))

// Destinasi pilihan untuk Featured Destination Card + Weather + Island Map
interface WeatherSpot {
  id: string
  region: string
  tagline: string
  tripSlug: string
  temp: number
  condition: string
  hourly: { label: string; temp: number; icon: 'sun' | 'cloud-sun' | 'cloud' | 'moon' }[]
}

const weatherSpots: WeatherSpot[] = [
  {
    id: 'bali',
    region: 'Bali',
    tagline: 'Island of Serenity',
    tripSlug: 'canyoning-air-terjun-gitgit-bali',
    temp: 28,
    condition: 'Sunny',
    hourly: [
      { label: 'Now', temp: 28, icon: 'sun' },
      { label: '12PM', temp: 29, icon: 'cloud-sun' },
      { label: '3PM', temp: 28, icon: 'cloud-sun' },
      { label: '6PM', temp: 27, icon: 'cloud' },
      { label: '9PM', temp: 25, icon: 'moon' }
    ]
  },
  {
    id: 'lombok',
    region: 'Lombok',
    tagline: 'Summit of the Clouds',
    tripSlug: 'trekking-gunung-rinjani-sembalun-3h2m',
    temp: 22,
    condition: 'Clear Sky',
    hourly: [
      { label: 'Now', temp: 22, icon: 'sun' },
      { label: '12PM', temp: 25, icon: 'sun' },
      { label: '3PM', temp: 23, icon: 'cloud-sun' },
      { label: '6PM', temp: 18, icon: 'cloud' },
      { label: '9PM', temp: 14, icon: 'moon' }
    ]
  },
  {
    id: 'komodo',
    region: 'Komodo',
    tagline: 'Realm of the Mantas',
    tripSlug: 'diving-taman-nasional-komodo-manta-point-3h2m',
    temp: 30,
    condition: 'Bright Sun',
    hourly: [
      { label: 'Now', temp: 30, icon: 'sun' },
      { label: '12PM', temp: 31, icon: 'sun' },
      { label: '3PM', temp: 30, icon: 'cloud-sun' },
      { label: '6PM', temp: 28, icon: 'cloud-sun' },
      { label: '9PM', temp: 26, icon: 'moon' }
    ]
  },
  {
    id: 'jogja',
    region: 'Gunungkidul',
    tagline: 'Karst & Ancient Light',
    tripSlug: 'caving-gua-jomblang-cahaya-surga-gunungkidul',
    temp: 27,
    condition: 'Partly Sunny',
    hourly: [
      { label: 'Now', temp: 27, icon: 'cloud-sun' },
      { label: '12PM', temp: 30, icon: 'sun' },
      { label: '3PM', temp: 28, icon: 'cloud-sun' },
      { label: '6PM', temp: 25, icon: 'cloud' },
      { label: '9PM', temp: 24, icon: 'moon' }
    ]
  }
]

const selectedSpotId = ref<string>('bali')

const activeWeather = computed(
  () => weatherSpots.find((s) => s.id === selectedSpotId.value) ?? weatherSpots[0]!
)

const activeFeaturedTrip = computed(() => {
  const match = allTrips.value.find((t) => t.slug === activeWeather.value.tripSlug)
  return match ?? featuredTrips.value[0] ?? null
})

const upcomingTrip = computed(() => {
  if (!allTrips.value.length) return null
  return [...allTrips.value].sort((a, b) => a.nextDepartureDate.localeCompare(b.nextDepartureDate))[0]
})

const searchDateInputRef = ref<HTMLInputElement | null>(null)

const formattedSearchDate = computed(() => {
  if (!searchDate.value) return ''
  const parts = searchDate.value.split('-')
  if (parts.length !== 3) return searchDate.value
  return `${parts[2]}/${parts[1]}/${parts[0]}`
})

function openSearchDatePicker() {
  const el = searchDateInputRef.value
  if (!el) return
  if (typeof el.showPicker === 'function') {
    try {
      el.showPicker()
      return
    } catch {
      // Fallback to native focus/click
    }
  }
  el.focus()
}

function handleSearchSubmit() {
  const query: Record<string, string> = {}
  if (searchLocation.value.trim()) query.q = searchLocation.value.trim()
  if (searchCategory.value) query.category = searchCategory.value
  if (searchDate.value) query.date = searchDate.value
  router.push({ path: '/trips', query })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Scenic Tropical Dashboard Canvas (Inspired by Reference Layout) -->
    <section class="relative rounded-[26px] sm:rounded-[34px] overflow-hidden pb-6 sm:pb-16">
      <!-- Atmospheric Scenic Backdrop fading into Warm Cream -->
      <div class="absolute inset-0 pointer-events-none">
        <img
          :src="optimizeImageUrl('https://images.unsplash.com/photo-1537996194471-e657df975ab4', 960, 72)"
          :srcset="buildImageSrcSet('https://images.unsplash.com/photo-1537996194471-e657df975ab4', [540, 960, 1440], 72)"
          sizes="(max-width: 640px) 100vw, 1440px"
          alt="Panorama Tebing Pantai Tropis Indonesia"
          decoding="async"
          fetchpriority="high"
          class="h-full w-full object-cover object-center"
        >
        <!-- Soft top & side cream merge like the reference design -->
        <div
          class="absolute inset-0 bg-gradient-to-b from-[#f4f1ea] via-[#f4f1ea]/35 to-transparent"
          style="background: linear-gradient(180deg, #f4f1ea 0%, rgba(244,241,234,0.88) 16%, rgba(244,241,234,0.22) 48%, rgba(16,63,62,0.18) 100%);"
        />
        <div
          class="hidden lg:block absolute inset-y-0 right-0 w-[44%] bg-gradient-to-l from-[#f4f1ea]/92 via-[#f4f1ea]/60 to-transparent"
        />
      </div>

      <!-- Main Bento Grid -->
      <div class="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 p-3 sm:p-5 lg:p-6">
        <!-- LEFT/CENTER COLUMN: Featured Destination Card + Scenic Space + Quick Search Bar -->
        <div class="lg:col-span-7 flex flex-col justify-between gap-4 sm:gap-6 min-w-0">
          <!-- Featured Destination Floating Card -->
          <div
            v-if="activeFeaturedTrip"
            class="rounded-[28px] glass-surface p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-12 gap-5 items-stretch"
          >
            <!-- Left Text Column -->
            <div class="sm:col-span-7 flex flex-col justify-between space-y-4">
              <div>
                <span class="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1f6f6d]">
                  Featured Destination
                </span>
                <h2 class="mt-1.5 font-editorial text-3xl sm:text-[42px] font-bold text-[#14201f] leading-none">
                  {{ activeWeather.region }}
                </h2>
                <p class="mt-1.5 font-editorial text-lg sm:text-xl text-[#4a5957]">
                  {{ activeWeather.tagline }}
                </p>
              </div>

              <!-- 3 Compact Info Metrics -->
              <div class="grid grid-cols-3 gap-2 pt-1">
                <div class="flex items-start gap-1.5">
                  <Calendar class="h-4 w-4 text-[#1f6f6d] shrink-0 mt-0.5" />
                  <div class="leading-tight">
                    <span class="block text-xs font-bold text-[#162221]">{{ activeFeaturedTrip.duration.split(' ')[0] }} {{ activeFeaturedTrip.duration.split(' ')[1] || 'Hari' }}</span>
                    <span class="text-[10px] text-[#667472]">Trip Plan</span>
                  </div>
                </div>
                <div class="flex items-start gap-1.5">
                  <Users class="h-4 w-4 text-[#1f6f6d] shrink-0 mt-0.5" />
                  <div class="leading-tight">
                    <span class="block text-xs font-bold text-[#162221]">{{ activeFeaturedTrip.adrenalineLevel }}</span>
                    <span class="text-[10px] text-[#667472]">Adrenalin</span>
                  </div>
                </div>
                <div class="flex items-start gap-1.5">
                  <ShieldCheck class="h-4 w-4 text-[#1f6f6d] shrink-0 mt-0.5" />
                  <div class="leading-tight">
                    <span class="block text-xs font-bold text-[#162221]">Local</span>
                    <span class="text-[10px] text-[#667472]">Verified Guide</span>
                  </div>
                </div>
              </div>

              <!-- CTA Button + Matchmaker Trigger + Region Pills -->
              <div class="flex flex-wrap items-center gap-2.5 pt-1">
                <NuxtLink
                  :to="`/trips/${activeFeaturedTrip.slug}`"
                  class="inline-flex items-center gap-2 rounded-full bg-[#1f6f6d] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#1f6f6d]/25 hover:bg-[#175957] transition"
                >
                  Explore Now
                  <ArrowRight class="h-4 w-4" />
                </NuxtLink>

                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-300 px-4 py-2.5 text-xs font-extrabold text-amber-900 hover:bg-amber-100 transition cursor-pointer"
                  @click="showMatchmakerModal = true"
                >
                  Adventure Matchmaker
                </button>

                <div class="flex items-center gap-1">
                  <button
                    v-for="spot in weatherSpots"
                    :key="spot.id"
                    type="button"
                    class="h-2.5 rounded-full transition-all cursor-pointer"
                    :class="
                      selectedSpotId === spot.id
                        ? 'w-6 bg-[#1f6f6d]'
                        : 'w-2.5 bg-[#c9d3d1] hover:bg-[#1f6f6d]/50'
                    "
                    :aria-label="`Pilih destinasi ${spot.region}`"
                    @click="selectedSpotId = spot.id"
                  />
                </div>
              </div>
            </div>

            <!-- Right Mini Scenic Card -->
            <NuxtLink
              :to="`/trips/${activeFeaturedTrip.slug}`"
              class="sm:col-span-5 relative min-h-[195px] rounded-[22px] overflow-hidden group block"
            >
              <img
                :src="optimizeImageUrl(activeFeaturedTrip.coverImage, 640, 72)"
                :srcset="buildImageSrcSet(activeFeaturedTrip.coverImage, [400, 640, 960], 72)"
                sizes="(max-width: 640px) 92vw, 360px"
                :alt="activeFeaturedTrip.title"
                decoding="async"
                class="h-full w-full object-cover sm:group-hover:scale-105 transition-transform duration-500"
              >
              <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <span
                class="absolute bottom-2.5 left-2.5 right-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-bold text-[#162221] shadow-sm truncate"
              >
                <MapPin class="h-3.5 w-3.5 text-[#1f6f6d] shrink-0" />
                <span class="truncate">{{ activeFeaturedTrip.location }}</span>
              </span>
            </NuxtLink>
          </div>

          <!-- Scenic Breathing Area + Quick Search Bar (Lokasi, Kategori, Tanggal) -->
          <div class="pt-2 sm:pt-20 lg:pt-36 space-y-3 sm:space-y-4 min-w-0">
            <!-- Signature Adventure Sign Badge -->
            <div class="w-full sm:w-auto inline-flex items-center gap-2.5 rounded-2xl bg-[#102625]/88 lg:bg-[#102625]/78 lg:backdrop-blur-md border border-white/20 px-3.5 py-2.5 text-white shadow-md">
              <Compass class="h-4 w-4 text-amber-300 shrink-0" />
              <div class="min-w-0 text-xs leading-snug">
                <span class="block font-editorial font-bold tracking-wide text-amber-200">NUSANTARA OPEN TRIP</span>
                <span class="block text-[11px] text-white/85">Good Vibes, Bigger Adventures &bull; 100% Pemandu Terverifikasi</span>
              </div>
            </div>

            <!-- Functional Quick Search Bar (Lokasi / Kategori / Tanggal) -->
            <form
              class="rounded-[24px] sm:rounded-[26px] glass-surface p-3 sm:p-3.5 overflow-hidden"
              @submit.prevent="handleSearchSubmit"
            >
              <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                <div class="sm:col-span-4 relative min-w-0 w-full">
                  <MapPin class="h-4 w-4 text-[#1f6f6d] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    v-model="searchLocation"
                    type="text"
                    placeholder="Destinasi (Bali, Rinjani...)"
                    aria-label="Lokasi atau destinasi"
                    class="block h-11 w-full min-w-0 max-w-full rounded-full border border-[#e3dccd] bg-white/95 pl-9 pr-3.5 text-xs sm:text-sm font-medium text-[#1c2423] placeholder:text-[#8c9795] focus:border-[#1f6f6d] focus:outline-none"
                  >
                </div>

                <div class="sm:col-span-3 min-w-0 w-full">
                  <select
                    v-model="searchCategory"
                    aria-label="Kategori aktivitas"
                    class="block h-11 w-full min-w-0 max-w-full rounded-full border border-[#e3dccd] bg-white/95 px-3.5 text-xs sm:text-sm font-medium text-[#1c2423] focus:border-[#1f6f6d] focus:outline-none cursor-pointer"
                  >
                    <option value="">Semua Kategori</option>
                    <option v-for="cat in TRIP_CATEGORIES" :key="cat" :value="cat">
                      {{ cat }}
                    </option>
                  </select>
                </div>

                <div
                  class="sm:col-span-3 relative min-w-0 w-full h-11 rounded-full border border-[#e3dccd] bg-white/95 focus-within:border-[#1f6f6d] overflow-hidden cursor-pointer flex items-center pl-9 pr-3.5"
                  @click="openSearchDatePicker"
                >
                  <Calendar class="h-4 w-4 text-[#1f6f6d] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <span
                    class="text-xs sm:text-sm font-medium truncate pointer-events-none select-none"
                    :class="formattedSearchDate ? 'text-[#1c2423]' : 'text-[#8c9795]'"
                  >
                    {{ formattedSearchDate || 'dd/mm/yyyy' }}
                  </span>
                  <input
                    ref="searchDateInputRef"
                    v-model="searchDate"
                    type="date"
                    aria-label="Tanggal keberangkatan"
                    class="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                  >
                </div>

                <div class="sm:col-span-2 min-w-0 w-full">
                  <button
                    type="submit"
                    class="h-11 w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-[#1f6f6d] px-4 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-[#175957] transition cursor-pointer"
                  >
                    <Search class="h-4 w-4 shrink-0" />
                    Cari
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        <!-- RIGHT COLUMN: Weather Widget + Island Map + Upcoming Trip -->
        <div class="lg:col-span-5 flex flex-col gap-4 sm:gap-5 min-w-0">
          <!-- 1. Teal Weather Card -->
          <div class="teal-card rounded-[24px] sm:rounded-[28px] p-4 sm:p-5 text-white overflow-hidden">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3.5">
                <span class="flex h-13 w-13 items-center justify-center rounded-2xl bg-white/12">
                  <Sun class="h-8 w-8 text-amber-300 fill-amber-300/90" />
                </span>
                <div>
                  <div class="text-4xl font-extrabold leading-none tracking-tight">
                    {{ activeWeather.temp }}&deg;
                  </div>
                  <p class="mt-1 text-xs font-medium text-teal-100">{{ activeWeather.condition }}</p>
                </div>
              </div>

              <div class="text-right">
                <select
                  v-model="selectedSpotId"
                  aria-label="Pilih lokasi cuaca destinasi"
                  class="rounded-full bg-white/12 border border-white/20 px-3 py-1 text-xs font-bold text-white focus:outline-none cursor-pointer"
                >
                  <option
                    v-for="spot in weatherSpots"
                    :key="spot.id"
                    :value="spot.id"
                    class="text-[#162221]"
                  >
                    {{ spot.region }}
                  </option>
                </select>
                <p class="mt-1 text-[11px] text-teal-100/85">Prakiraan Lapangan</p>
              </div>
            </div>

            <!-- Hourly Strip -->
            <div class="mt-5 pt-4 border-t border-white/15 grid grid-cols-5 gap-2 text-center">
              <div v-for="slot in activeWeather.hourly" :key="slot.label" class="space-y-1.5">
                <span class="block text-[11px] font-medium text-teal-100/80">{{ slot.label }}</span>
                <div class="flex justify-center">
                  <Sun v-if="slot.icon === 'sun'" class="h-4.5 w-4.5 text-amber-300" />
                  <CloudSun v-else-if="slot.icon === 'cloud-sun'" class="h-4.5 w-4.5 text-white" />
                  <Cloud v-else-if="slot.icon === 'cloud'" class="h-4.5 w-4.5 text-teal-100" />
                  <Moon v-else class="h-4.5 w-4.5 text-amber-200" />
                </div>
                <span class="block text-xs font-bold">{{ slot.temp }}&deg;</span>
              </div>
            </div>
          </div>

          <!-- 2. Island Map Card -->
          <div class="rounded-[28px] glass-surface p-5 space-y-3.5">
            <div class="flex items-center justify-between">
              <h2 class="font-editorial text-xl font-bold text-[#162221]">Island Map</h2>
              <NuxtLink
                to="/trips"
                class="inline-flex items-center gap-0.5 text-xs font-bold text-[#1f6f6d] hover:underline"
              >
                View All
                <ChevronRight class="h-3.5 w-3.5" />
              </NuxtLink>
            </div>

            <!-- Stylized Tropical Archipelago Map -->
            <div
              class="relative h-[230px] rounded-[22px] overflow-hidden border border-[#b9deda]"
              style="background: radial-gradient(circle at 30% 25%, #67c4bf 0%, #2b8e8c 55%, #196463 100%);"
            >
              <!-- Decorative Islands SVG + Dashed Trail -->
              <svg viewBox="0 0 400 230" class="absolute inset-0 h-full w-full" fill="none">
                <!-- Island shapes -->
                <path
                  d="M40 75 C70 50, 125 48, 158 72 C185 92, 165 135, 130 142 C85 150, 32 115, 40 75 Z"
                  fill="#a6d29c"
                  fill-opacity="0.88"
                  stroke="#e8f3dc"
                  stroke-width="3"
                />
                <path
                  d="M198 66 C235 45, 295 45, 328 76 C355 102, 336 146, 286 150 C234 154, 178 115, 198 66 Z"
                  fill="#9ac990"
                  fill-opacity="0.88"
                  stroke="#e8f3dc"
                  stroke-width="3"
                />
                <path
                  d="M105 168 C130 152, 172 156, 185 178 C196 196, 172 214, 136 212 C106 210, 88 184, 105 168 Z"
                  fill="#b2d9a8"
                  fill-opacity="0.88"
                  stroke="#e8f3dc"
                  stroke-width="2.5"
                />
                <!-- Dashed Expedition Route -->
                <path
                  d="M95 96 Q155 130 245 96 T145 182"
                  stroke="white"
                  stroke-width="2"
                  stroke-dasharray="5 5"
                  stroke-linecap="round"
                  opacity="0.9"
                />
              </svg>

              <!-- Interactive Map Pins -->
              <button
                type="button"
                class="absolute top-4 left-4 group flex items-center gap-2 rounded-2xl bg-white/95 p-1.5 pr-3 shadow-md hover:scale-105 transition cursor-pointer"
                :class="selectedSpotId === 'bali' ? 'ring-2 ring-[#1f6f6d]' : ''"
                @click="selectedSpotId = 'bali'"
              >
                <img
                  src="https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&fm=webp&w=96&q=65"
                  alt="Gitgit Bali"
                  loading="lazy"
                  decoding="async"
                  class="h-8 w-8 rounded-xl object-cover"
                >
                <span class="text-[11px] font-extrabold text-[#162221]">Gitgit, Bali</span>
              </button>

              <button
                type="button"
                class="absolute top-12 right-4 group flex items-center gap-2 rounded-2xl bg-white/95 p-1.5 pr-3 shadow-md hover:scale-105 transition cursor-pointer"
                :class="selectedSpotId === 'lombok' ? 'ring-2 ring-[#1f6f6d]' : ''"
                @click="selectedSpotId = 'lombok'"
              >
                <img
                  src="https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&fm=webp&w=96&q=65"
                  alt="Gunung Rinjani"
                  loading="lazy"
                  decoding="async"
                  class="h-8 w-8 rounded-xl object-cover"
                >
                <span class="text-[11px] font-extrabold text-[#162221]">Rinjani</span>
              </button>

              <button
                type="button"
                class="absolute bottom-4 left-4 group flex items-center gap-2 rounded-2xl bg-white/95 p-1.5 pr-3 shadow-md hover:scale-105 transition cursor-pointer"
                :class="selectedSpotId === 'komodo' ? 'ring-2 ring-[#1f6f6d]' : ''"
                @click="selectedSpotId = 'komodo'"
              >
                <img
                  src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&fm=webp&w=96&q=65"
                  alt="Komodo NTT"
                  loading="lazy"
                  decoding="async"
                  class="h-8 w-8 rounded-xl object-cover"
                >
                <span class="text-[11px] font-extrabold text-[#162221]">Komodo</span>
              </button>

              <!-- Explore Map Pill -->
              <NuxtLink
                to="/trips"
                class="absolute bottom-3.5 right-3.5 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-2 text-xs font-bold text-[#162221] shadow-md hover:bg-[#1f6f6d] hover:text-white transition"
              >
                <Navigation class="h-3.5 w-3.5" />
                Explore Map
              </NuxtLink>
            </div>
          </div>

          <!-- 3. Upcoming Trip Card -->
          <div v-if="upcomingTrip" class="rounded-[28px] glass-surface p-5 space-y-3">
            <div class="flex items-center justify-between">
              <h2 class="font-editorial text-xl font-bold text-[#162221]">Upcoming Trip</h2>
              <NuxtLink
                to="/trips"
                class="inline-flex items-center gap-0.5 text-xs font-bold text-[#1f6f6d] hover:underline"
              >
                See All
                <ChevronRight class="h-3.5 w-3.5" />
              </NuxtLink>
            </div>

            <NuxtLink
              :to="`/trips/${upcomingTrip.slug}`"
              class="group flex items-center gap-3.5 rounded-2xl bg-white/90 p-2.5 border border-[#ece6d9] hover:border-[#1f6f6d]/40 transition"
            >
              <img
                :src="optimizeImageUrl(upcomingTrip.coverImage, 180, 70)"
                :alt="upcomingTrip.title"
                loading="lazy"
                decoding="async"
                class="h-18 w-18 rounded-2xl object-cover shrink-0"
              >
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-extrabold text-[#162221] truncate group-hover:text-[#1f6f6d] transition">
                  {{ upcomingTrip.title }}
                </h3>
                <div class="mt-1.5 space-y-1 text-[11px] font-medium text-[#5c6b69]">
                  <p class="flex items-center gap-1.5">
                    <Calendar class="h-3.5 w-3.5 text-[#1f6f6d]" />
                    {{ formatDateID(upcomingTrip.nextDepartureDate) }}
                  </p>
                  <p class="flex items-center gap-3">
                    <span class="inline-flex items-center gap-1">
                      <Users class="h-3.5 w-3.5 text-[#1f6f6d]" />
                      Sisa {{ upcomingTrip.remainingQuota }} slot
                    </span>
                    <span class="inline-flex items-center gap-1 truncate">
                      <MapPin class="h-3.5 w-3.5 text-[#1f6f6d]" />
                      {{ upcomingTrip.location }}
                    </span>
                  </p>
                </div>
              </div>
              <span
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f4f1ea] text-[#1f6f6d] group-hover:bg-[#1f6f6d] group-hover:text-white transition"
              >
                <ChevronRight class="h-4.5 w-4.5" />
              </span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Popular Experiences / Featured Open Trips Container (Overlapping Sheet Style) -->
    <section class="-mt-12 relative z-20 rounded-[32px] glass-surface p-5 sm:p-7">
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div>
          <h2 class="font-editorial text-2xl sm:text-3xl font-bold text-[#162221]">
            Popular Experiences
          </h2>
          <p class="mt-1 text-xs sm:text-sm text-[#5c6b69]">
            Featured Open Trips dengan kuota terbatas &amp; 100% Pemandu Lokal Terverifikasi
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <NuxtLink
            v-for="cat in TRIP_CATEGORIES"
            :key="cat"
            :to="`/trips?category=${cat}`"
            class="rounded-full bg-white/90 border border-[#e3dccd] px-3.5 py-1.5 text-xs font-bold text-[#3f4f4d] hover:bg-[#1f6f6d] hover:text-white hover:border-[#1f6f6d] transition"
          >
            {{ cat }}
          </NuxtLink>
          <NuxtLink
            to="/trips"
            class="ml-1 inline-flex items-center gap-1 text-xs font-extrabold text-[#1f6f6d] hover:underline"
          >
            View All
            <ChevronRight class="h-3.5 w-3.5" />
          </NuxtLink>
        </div>
      </div>

      <!-- Loading Skeleton -->
      <div v-if="tripsPending" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div
          v-for="n in 4"
          :key="n"
          class="h-[360px] rounded-[24px] bg-[#e9e3d7] animate-pulse"
        />
      </div>

      <!-- 4 Featured Open Trip Cards -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <TripCard v-for="trip in featuredTrips" :key="trip.id" :trip="trip" />
      </div>
    </section>

    <!-- Recommended Stays & Hotels Section -->
    <section class="rounded-[32px] glass-surface p-5 sm:p-7">
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div>
          <span class="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1f6f6d]">
            Curated Adventure Stays
          </span>
          <h2 class="mt-1 font-editorial text-2xl sm:text-3xl font-bold text-[#162221]">
            Penginapan &amp; Hotel Pilihan
          </h2>
          <p class="mt-1 text-xs sm:text-sm text-[#5c6b69]">
            Eco-lodge, villa, dan hotel nyaman yang dekat dengan basecamp open trip — lengkap dengan Split Bill kamar.
          </p>
        </div>

        <NuxtLink
          to="/hotels"
          class="inline-flex items-center gap-1.5 rounded-full bg-[#1f6f6d] px-4 py-2 text-xs font-bold text-white hover:bg-[#175957] transition self-start sm:self-auto"
        >
          Lihat Semua Hotel
          <ChevronRight class="h-3.5 w-3.5" />
        </NuxtLink>
      </div>

      <div v-if="hotelsPending" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div
          v-for="n in 4"
          :key="n"
          class="h-[360px] rounded-[24px] bg-[#e9e3d7] animate-pulse"
        />
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <HotelCard v-for="hotel in featuredHotels" :key="hotel.id" :hotel="hotel" />
      </div>
    </section>

    <!-- Ecosystem Highlights: AI Matchmaker, Passport, Eco-Tourism & Community -->
    <section class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <NuxtLink
        to="/matchmaker"
        class="group rounded-[28px] glass-surface p-6 space-y-3 hover:border-[#1f6f6d]/50 transition"
      >
        <span class="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef7f6] text-[#1f6f6d]">
          <Compass class="h-5 w-5" />
        </span>
        <h3 class="font-editorial text-xl font-bold text-[#162221] group-hover:text-[#1f6f6d] transition">
          AI Adventure Matchmaker Quiz
        </h3>
        <p class="text-xs sm:text-sm text-[#5c6b69] leading-relaxed">
          Bingung pilih trip? Jawab 5 pertanyaan kebugaran, fobia ketinggian/air, &amp; budget untuk rekomendasi instan.
        </p>
        <span class="inline-flex items-center gap-1 text-xs font-extrabold text-[#1f6f6d]">
          Mulai Kuis 30 Detik
          <ChevronRight class="h-3.5 w-3.5" />
        </span>
      </NuxtLink>

      <NuxtLink
        to="/passport"
        class="group rounded-[28px] glass-surface p-6 space-y-3 hover:border-amber-400/70 transition"
      >
        <span class="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff7ec] text-amber-600">
          <ShieldCheck class="h-5 w-5" />
        </span>
        <h3 class="font-editorial text-xl font-bold text-[#162221] group-hover:text-amber-700 transition">
          Adventure Passport &amp; Peta Jejak
        </h3>
        <p class="text-xs sm:text-sm text-[#5c6b69] leading-relaxed">
          Kumpulkan stempel digital destinasi, lencana 3.000 MDPL / Eco-Warrior, poin diskon, dan peta provinsi dijelajahi.
        </p>
        <span class="inline-flex items-center gap-1 text-xs font-extrabold text-amber-700">
          Buka Paspor Saya
          <ChevronRight class="h-3.5 w-3.5" />
        </span>
      </NuxtLink>

      <NuxtLink
        to="/trips/canyoning-air-terjun-gitgit-bali"
        class="group rounded-[28px] glass-surface p-6 space-y-3 hover:border-emerald-500/50 transition"
      >
        <span class="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
          <ShieldCheck class="h-5 w-5" />
        </span>
        <h3 class="font-editorial text-xl font-bold text-[#162221] group-hover:text-emerald-800 transition">
          Eco-Tourism, AI Q&amp;A &amp; Reels
        </h3>
        <p class="text-xs sm:text-sm text-[#5c6b69] leading-relaxed">
          Carbon Offset + 82% transparansi ekonomi lokal, Tanya AI per trip, cuplikan Reels 15–30 detik, dan Shared Album peserta.
        </p>
        <span class="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-800">
          Coba di Detail Trip
          <ChevronRight class="h-3.5 w-3.5" />
        </span>
      </NuxtLink>

      <NuxtLink
        to="/community"
        class="group rounded-[28px] glass-surface p-6 space-y-3 hover:border-orange-400/60 transition"
      >
        <span class="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff7ec] text-orange-600">
          <Users class="h-5 w-5" />
        </span>
        <h3 class="font-editorial text-xl font-bold text-[#162221] group-hover:text-orange-600 transition">
          Komunitas &amp; Buddy Finder
        </h3>
        <p class="text-xs sm:text-sm text-[#5c6b69] leading-relaxed">
          Berangkat sendiri? Cari teman seperjalanan, patungan shuttle atau kamar eco-lodge, dan kenalan pra-trip.
        </p>
        <span class="inline-flex items-center gap-1 text-xs font-extrabold text-orange-600">
          Masuk Komunitas Solo
          <ChevronRight class="h-3.5 w-3.5" />
        </span>
      </NuxtLink>
    </section>

    <AdventureMatchmakerModal
      :open="showMatchmakerModal"
      @close="showMatchmakerModal = false"
    />
  </div>
</template>

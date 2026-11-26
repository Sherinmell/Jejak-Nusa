<script setup lang="ts">
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BedDouble,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coffee,
  Compass,
  MapPin,
  Maximize2,
  ShieldCheck,
  Star,
  Users
} from 'lucide-vue-next'
import type { Hotel } from '#shared/types/hotel'
import { buildImageSrcSet, formatRupiah, optimizeImageUrl } from '~/utils/format'

const route = useRoute()
const slug = computed(() => String(route.params.slug || ''))

const { data: hotel, pending, error } = await useFetch<Hotel>(() => `/api/hotels/${slug.value}`)

const activeImageIndex = ref(0)
const selectedRoomId = ref('')

watch(
  hotel,
  (val) => {
    activeImageIndex.value = 0
    selectedRoomId.value = val?.rooms[0]?.id ?? ''
  },
  { immediate: true }
)

const activeImage = computed(() => {
  if (!hotel.value) return ''
  return hotel.value.gallery[activeImageIndex.value] ?? hotel.value.coverImage
})

useSeoMeta({
  title: () => (hotel.value ? `${hotel.value.name} — Penginapan JejakNusa` : 'Detail Penginapan — JejakNusa'),
  description: () => hotel.value?.shortDescription ?? 'Detail penginapan & hotel partner JejakNusa.'
})
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="pending" class="space-y-6 animate-pulse">
      <div class="h-6 w-60 rounded-full bg-[#e9e3d7]" />
      <div class="h-96 rounded-[30px] bg-[#e9e3d7]" />
    </div>

    <!-- Error -->
    <div
      v-else-if="error || !hotel"
      class="rounded-[28px] glass-surface p-12 text-center space-y-4 max-w-xl mx-auto my-10"
    >
      <h1 class="font-editorial text-2xl font-bold text-[#162221]">Penginapan Tidak Ditemukan</h1>
      <p class="text-sm text-[#5c6b69]">Properti hotel yang Anda cari tidak tersedia.</p>
      <NuxtLink
        to="/hotels"
        class="inline-flex items-center gap-2 rounded-full bg-[#1f6f6d] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#175957] transition"
      >
        <ArrowLeft class="h-4 w-4" />
        Kembali ke Daftar Hotel
      </NuxtLink>
    </div>

    <!-- Main Detail -->
    <div v-else class="space-y-7">
      <!-- Breadcrumb -->
      <nav aria-label="Breadcrumb" class="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-[#667472]">
        <NuxtLink to="/home" class="hover:text-[#1f6f6d] transition">Beranda</NuxtLink>
        <ChevronRight class="h-3.5 w-3.5 text-[#9ba6a4]" />
        <NuxtLink to="/hotels" class="hover:text-[#1f6f6d] transition">Penginapan &amp; Hotel</NuxtLink>
        <ChevronRight class="h-3.5 w-3.5 text-[#9ba6a4]" />
        <span class="text-[#162221] truncate max-w-md">{{ hotel.name }}</span>
      </nav>

      <!-- Header & Gallery -->
      <div class="rounded-[30px] glass-surface p-5 sm:p-7 space-y-5">
        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-full bg-[#1f6f6d] px-3 py-1 text-xs font-bold text-white">
              {{ hotel.type }}
            </span>
            <span class="inline-flex items-center gap-1.5 rounded-full bg-[#eef7f6] border border-[#c7e4e0] px-3 py-1 text-xs font-bold text-[#175957]">
              <BadgeCheck class="h-3.5 w-3.5 text-[#1f6f6d]" />
              Partner Terverifikasi
            </span>
            <span class="text-sm font-bold text-amber-500">{{ '★'.repeat(hotel.stars) }}</span>
          </div>

          <h1 class="font-editorial text-2xl sm:text-4xl font-bold text-[#14201f] leading-tight">
            {{ hotel.name }}
          </h1>

          <div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm text-[#556462]">
            <span class="inline-flex items-center gap-1.5 font-semibold">
              <MapPin class="h-4 w-4 text-[#1f6f6d]" />
              {{ hotel.location }}
            </span>
            <span class="inline-flex items-center gap-1.5 font-bold text-[#162221]">
              <Star class="h-4 w-4 fill-amber-400 text-amber-400" />
              {{ hotel.rating.toFixed(2) }}
              <span class="font-normal text-[#6d7a78]">({{ hotel.reviewCount }} ulasan)</span>
            </span>
            <span class="inline-flex items-center gap-1.5">
              <Clock class="h-4 w-4 text-[#1f6f6d]" />
              Check-in {{ hotel.checkInTime }} &bull; Check-out {{ hotel.checkOutTime }}
            </span>
          </div>
        </div>

        <!-- Photo Gallery -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div class="lg:col-span-9 relative aspect-[16/9] sm:aspect-[16/10] overflow-hidden rounded-[24px] bg-[#144746]">
            <img
              :src="optimizeImageUrl(activeImage, 960, 75)"
              :srcset="buildImageSrcSet(activeImage, [480, 800, 1200], 75)"
              sizes="(max-width: 1024px) 94vw, 880px"
              :alt="hotel.name"
              decoding="async"
              fetchpriority="high"
              class="h-full w-full object-cover"
            >
            <div class="absolute bottom-3.5 right-3.5 rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white">
              Foto {{ activeImageIndex + 1 }} / {{ hotel.gallery.length }}
            </div>
          </div>

          <div class="lg:col-span-3 grid grid-cols-4 lg:grid-cols-1 gap-2.5">
            <button
              v-for="(img, idx) in hotel.gallery"
              :key="img + idx"
              type="button"
              class="relative aspect-[16/10] lg:aspect-auto lg:h-full overflow-hidden rounded-[18px] border-2 transition cursor-pointer"
              :class="
                activeImageIndex === idx
                  ? 'border-[#1f6f6d] ring-2 ring-[#1f6f6d]/30'
                  : 'border-transparent opacity-75 hover:opacity-100'
              "
              @click="activeImageIndex = idx"
            >
              <img
                :src="optimizeImageUrl(img, 240, 68)"
                :alt="`${hotel.name} foto ${idx + 1}`"
                loading="lazy"
                decoding="async"
                class="h-full w-full object-cover"
              >
            </button>
          </div>
        </div>
      </div>

      <!-- Details + Sticky Hotel Booking Widget -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        <div class="lg:col-span-8 space-y-6">
          <!-- Nearby Open Trip Banner -->
          <NuxtLink
            :to="`/trips/${hotel.nearTripSlug}`"
            class="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[26px] teal-card p-5 text-white"
          >
            <div class="flex items-start gap-3.5">
              <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                <Compass class="h-5 w-5 text-amber-300" />
              </span>
              <div>
                <span class="text-[11px] font-bold uppercase tracking-wider text-amber-200">
                  Dekat Basecamp Open Trip
                </span>
                <p class="mt-0.5 text-sm sm:text-base font-extrabold text-white">
                  {{ hotel.nearTripLabel }}
                </p>
                <p class="text-xs text-teal-100/90 mt-0.5">{{ hotel.distanceToBasecamp }}</p>
              </div>
            </div>
            <span class="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-extrabold text-[#162221] group-hover:bg-amber-300 transition self-start sm:self-center shrink-0">
              Lihat Trip
              <ArrowRight class="h-3.5 w-3.5" />
            </span>
          </NuxtLink>

          <!-- Description & Facilities -->
          <section class="rounded-[28px] glass-surface p-6 sm:p-7 space-y-6">
            <div>
              <h2 class="font-editorial text-2xl font-bold text-[#162221]">Tentang Penginapan</h2>
              <p class="mt-3 text-sm sm:text-base text-[#495755] leading-relaxed">
                {{ hotel.description }}
              </p>
            </div>

            <div class="pt-5 border-t border-[#e8e2d5]">
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-[#1f6f6d] mb-3.5">
                Fasilitas Utama
              </h3>
              <ul class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <li
                  v-for="(fac, idx) in hotel.facilities"
                  :key="idx"
                  class="flex items-center gap-2.5 rounded-2xl bg-white/90 border border-[#ebe5d8] px-3.5 py-3 text-sm font-medium text-[#354442]"
                >
                  <CheckCircle2 class="h-4 w-4 text-[#1f6f6d] shrink-0" />
                  <span>{{ fac }}</span>
                </li>
              </ul>
            </div>
          </section>

          <!-- Available Room Types -->
          <section class="rounded-[28px] glass-surface p-6 sm:p-7 space-y-4">
            <h2 class="font-editorial text-2xl font-bold text-[#162221]">Pilihan Tipe Kamar</h2>

            <div class="space-y-4">
              <div
                v-for="room in hotel.rooms"
                :key="room.id"
                class="rounded-[22px] border p-5 transition"
                :class="
                  selectedRoomId === room.id
                    ? 'border-[#1f6f6d] bg-[#eef7f6]/75 shadow-sm'
                    : 'border-[#e8e2d5] bg-white/90 hover:border-[#1f6f6d]/40'
                "
              >
                <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div class="space-y-2">
                    <div class="flex flex-wrap items-center gap-2">
                      <h3 class="text-base font-extrabold text-[#162221]">{{ room.name }}</h3>
                      <span
                        v-if="room.breakfastIncluded"
                        class="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-bold text-amber-800"
                      >
                        <Coffee class="h-3 w-3" />
                        Termasuk Sarapan
                      </span>
                    </div>

                    <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#5c6b69]">
                      <span class="inline-flex items-center gap-1">
                        <Users class="h-3.5 w-3.5 text-[#1f6f6d]" />
                        Maks. {{ room.capacity }} tamu
                      </span>
                      <span class="inline-flex items-center gap-1">
                        <BedDouble class="h-3.5 w-3.5 text-[#1f6f6d]" />
                        {{ room.bedType }}
                      </span>
                      <span class="inline-flex items-center gap-1">
                        <Maximize2 class="h-3.5 w-3.5 text-[#1f6f6d]" />
                        {{ room.sizeSqm }} m&sup2;
                      </span>
                    </div>

                    <div class="flex flex-wrap gap-1.5 pt-1">
                      <span
                        v-for="am in room.amenities"
                        :key="am"
                        class="rounded-full bg-white border border-[#e3dccd] px-2.5 py-0.5 text-[11px] font-medium text-[#4a5957]"
                      >
                        {{ am }}
                      </span>
                    </div>
                  </div>

                  <div class="sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-2">
                    <div>
                      <span class="block text-lg font-extrabold text-[#162221]">
                        {{ formatRupiah(room.pricePerNight) }}
                      </span>
                      <span class="text-[11px] text-[#6d7a78]">per malam &bull; sisa {{ room.availableRooms }}</span>
                    </div>

                    <button
                      type="button"
                      class="rounded-full px-4 py-2 text-xs font-bold transition cursor-pointer"
                      :class="
                        selectedRoomId === room.id
                          ? 'bg-[#1f6f6d] text-white'
                          : 'bg-white border border-[#1f6f6d] text-[#1f6f6d] hover:bg-[#1f6f6d] hover:text-white'
                      "
                      @click="selectedRoomId = room.id"
                    >
                      {{ selectedRoomId === room.id ? 'Kamar Dipilih' : 'Pilih Kamar' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Policies -->
          <section class="rounded-[28px] glass-surface p-6 sm:p-7 space-y-3">
            <h2 class="font-editorial text-xl font-bold text-[#162221] flex items-center gap-2">
              <ShieldCheck class="h-5 w-5 text-[#1f6f6d]" />
              Kebijakan Penginapan
            </h2>
            <ul class="space-y-2 text-sm text-[#495755]">
              <li v-for="(pol, idx) in hotel.policies" :key="idx" class="flex items-start gap-2">
                <span class="mt-2 h-1.5 w-1.5 rounded-full bg-[#1f6f6d] shrink-0" />
                <span>{{ pol }}</span>
              </li>
            </ul>
          </section>
        </div>

        <!-- Sticky Hotel Booking Widget -->
        <aside class="lg:col-span-4 lg:sticky lg:top-6">
          <HotelBookingWidget
            v-model:selected-room-id="selectedRoomId"
            :hotel="hotel"
          />
        </aside>
      </div>
    </div>
  </div>
</template>

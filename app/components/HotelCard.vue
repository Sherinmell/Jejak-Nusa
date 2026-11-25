<script setup lang="ts">
import { BadgeCheck, Compass, MapPin, Star } from 'lucide-vue-next'
import type { Hotel } from '#shared/types/hotel'
import { buildImageSrcSet, formatRupiah, optimizeImageUrl } from '~/utils/format'

interface Props {
  hotel: Hotel
}

defineProps<Props>()
</script>

<template>
  <NuxtLink
    :to="`/hotels/${hotel.slug}`"
    class="perf-card group flex flex-col overflow-hidden rounded-[24px] bg-[#fbf9f5] border border-white/90 shadow-[0_8px_20px_-14px_rgba(16,63,62,0.16)] sm:hover:shadow-[0_22px_40px_-16px_rgba(16,63,62,0.24)] sm:hover:-translate-y-1 transition-all duration-300"
  >
    <!-- Rounded Thumbnail -->
    <div class="p-2.5 pb-0">
      <div class="relative aspect-[4/3] w-full overflow-hidden rounded-[18px] bg-[#144746]">
        <img
          :src="optimizeImageUrl(hotel.coverImage, 640, 72)"
          :srcset="buildImageSrcSet(hotel.coverImage, [380, 640, 900], 72)"
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 320px"
          :alt="hotel.name"
          loading="lazy"
          decoding="async"
          class="h-full w-full object-cover sm:group-hover:scale-105 transition-transform duration-500"
        >
        <div class="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

        <!-- Top Badges -->
        <div class="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
          <span class="rounded-full bg-[#1f6f6d] px-2.5 py-0.5 text-[11px] font-bold text-white">
            {{ hotel.type }}
          </span>

          <span class="inline-flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-0.5 text-[11px] font-bold text-white">
            <Star class="h-3 w-3 fill-amber-400 text-amber-400" />
            {{ hotel.rating.toFixed(1) }}
          </span>
        </div>

        <!-- Bottom Proximity Pill -->
        <div class="absolute bottom-2.5 left-2.5 right-2.5">
          <span
            class="inline-flex items-center gap-1.5 max-w-full rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-[#162221]"
          >
            <Compass class="h-3 w-3 text-[#1f6f6d] shrink-0" />
            <span class="truncate">{{ hotel.distanceToBasecamp }}</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div class="flex flex-1 flex-col px-4 pt-3.5 pb-4">
      <div class="flex items-center justify-between gap-2 text-[11px] font-semibold text-[#5e6e6c]">
        <span class="inline-flex items-center gap-1 truncate">
          <MapPin class="h-3 w-3 text-[#1f6f6d] shrink-0" />
          <span class="truncate">{{ hotel.location }}</span>
        </span>
        <span class="text-amber-500 font-bold shrink-0">{{ '★'.repeat(hotel.stars) }}</span>
      </div>

      <h3
        class="mt-1.5 text-[15px] font-bold text-[#162221] leading-snug line-clamp-2 group-hover:text-[#1f6f6d] transition-colors"
      >
        {{ hotel.name }}
      </h3>

      <p class="mt-1.5 text-xs text-[#5c6b69] line-clamp-2 leading-relaxed">
        {{ hotel.shortDescription }}
      </p>

      <div class="mt-3">
        <span
          class="inline-flex items-center gap-1.5 rounded-full bg-[#eef7f6] px-2.5 py-1 text-[11px] font-bold text-[#175957] border border-[#c7e4e0]"
        >
          <BadgeCheck class="h-3.5 w-3.5 text-[#1f6f6d] shrink-0" />
          Partner Penginapan Terverifikasi
        </span>
      </div>

      <!-- Price Footer -->
      <div class="mt-auto pt-3.5 mt-3.5 border-t border-[#ebe5d8] flex items-center justify-between gap-2">
        <div>
          <span class="block text-[10px] font-semibold uppercase tracking-wider text-[#7a8785]">Mulai dari</span>
          <div class="flex items-baseline gap-1">
            <span class="text-base font-extrabold text-[#162221]">
              {{ formatRupiah(hotel.pricePerNight) }}
            </span>
            <span class="text-[11px] font-medium text-[#6d7a78]">/ malam</span>
          </div>
        </div>

        <span
          class="inline-flex items-center justify-center rounded-full bg-[#eef7f6] px-3 py-1.5 text-xs font-bold text-[#1f6f6d] group-hover:bg-[#1f6f6d] group-hover:text-white transition-colors"
        >
          Pilih Kamar
        </span>
      </div>
    </div>
  </NuxtLink>
</template>

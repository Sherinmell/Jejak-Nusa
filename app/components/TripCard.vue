<script setup lang="ts">
import { Heart, MapPin, Star, Users } from 'lucide-vue-next'
import type { Trip } from '#shared/types/trip'
import {
  buildImageSrcSet,
  formatRupiah,
  getAdrenalineBadgeClass,
  getAdrenalineDotClass,
  optimizeImageUrl
} from '~/utils/format'

interface Props {
  trip: Trip
}

const props = defineProps<Props>()
const { isSaved, toggleSaved } = useSavedTrips()

const saved = computed(() => isSaved(props.trip.id))

function handleToggleSave(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
  toggleSaved(props.trip.id)
}
</script>

<template>
  <NuxtLink
    :to="`/trips/${trip.slug}`"
    class="perf-card group flex flex-col overflow-hidden rounded-[24px] bg-[#fbf9f5] border border-white/90 shadow-[0_8px_20px_-14px_rgba(16,63,62,0.16)] sm:hover:shadow-[0_22px_40px_-16px_rgba(16,63,62,0.24)] sm:hover:-translate-y-1 transition-all duration-300"
  >
    <!-- Rounded Scenic Thumbnail -->
    <div class="p-2.5 pb-0">
      <div class="relative aspect-[4/3] w-full overflow-hidden rounded-[18px] bg-[#144746]">
        <img
          :src="optimizeImageUrl(trip.coverImage, 640, 72)"
          :srcset="buildImageSrcSet(trip.coverImage, [380, 640, 900], 72)"
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 320px"
          :alt="trip.title"
          loading="lazy"
          decoding="async"
          class="h-full w-full object-cover sm:group-hover:scale-105 transition-transform duration-500"
        >
        <div class="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

        <!-- Top Row: Adrenaline Badge & Heart Favorite Button -->
        <div class="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
          <span
            class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold shadow-xs"
            :class="getAdrenalineBadgeClass(trip.adrenalineLevel)"
          >
            <span class="h-1.5 w-1.5 rounded-full" :class="getAdrenalineDotClass(trip.adrenalineLevel)" />
            {{ trip.adrenalineLevel }}
          </span>

          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-full transition cursor-pointer"
            :class="
              saved
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-black/45 text-white hover:bg-white hover:text-orange-500'
            "
            :aria-label="saved ? 'Hapus dari favorit' : 'Simpan ke favorit'"
            @click="handleToggleSave"
          >
            <Heart class="h-4 w-4" :class="saved ? 'fill-current' : ''" />
          </button>
        </div>

        <!-- Bottom Overlay: Quota & Rating -->
        <div class="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
          <span
            class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
            :class="
              trip.remainingQuota <= 3
                ? 'bg-orange-600/95 text-white'
                : 'bg-white/95 text-[#1c2423]'
            "
          >
            <Users class="h-3 w-3" />
            Sisa {{ trip.remainingQuota }} slot
          </span>

          <span class="inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-[11px] font-bold text-white">
            <Star class="h-3 w-3 fill-amber-400 text-amber-400" />
            {{ trip.rating.toFixed(1) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Card Body -->
    <div class="flex flex-1 flex-col px-4 pt-3.5 pb-4">
      <div class="flex items-center justify-between gap-2 text-[11px] font-semibold text-[#5e6e6c]">
        <span class="inline-flex items-center gap-1 truncate">
          <MapPin class="h-3 w-3 text-[#1f6f6d] shrink-0" />
          <span class="truncate">{{ trip.location }}</span>
        </span>
        <span class="rounded-full bg-[#e8e2d5]/80 px-2 py-0.5 text-[10px] font-bold text-[#3b4b49] shrink-0">
          {{ trip.category }}
        </span>
      </div>

      <h3
        class="mt-1.5 text-[15px] font-bold text-[#162221] leading-snug line-clamp-2 group-hover:text-[#1f6f6d] transition-colors"
      >
        {{ trip.title }}
      </h3>

      <div class="mt-3">
        <GuideBadge :guide-name="trip.guide.name" compact />
      </div>

      <!-- Price Footer -->
      <div class="mt-auto pt-3.5 mt-3.5 border-t border-[#ebe5d8] flex items-center justify-between gap-2">
        <div>
          <span class="block text-[10px] font-semibold uppercase tracking-wider text-[#7a8785]">Mulai dari</span>
          <div class="flex items-baseline gap-1">
            <span class="text-base font-extrabold text-[#162221]">
              {{ formatRupiah(trip.pricePerPerson) }}
            </span>
            <span class="text-[11px] font-medium text-[#6d7a78]">/ org</span>
          </div>
        </div>

        <span
          class="inline-flex items-center justify-center rounded-full bg-[#eef7f6] px-3 py-1.5 text-xs font-bold text-[#1f6f6d] group-hover:bg-[#1f6f6d] group-hover:text-white transition-colors"
        >
          Detail
        </span>
      </div>
    </div>
  </NuxtLink>
</template>

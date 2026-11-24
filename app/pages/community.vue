<script setup lang="ts">
import {
  ArrowRight,
  Calendar,
  Compass,
  Heart,
  MapPin,
  MessageSquarePlus,
  Send,
  Sparkles,
  Users
} from 'lucide-vue-next'
import type { BuddyTravelStyle, CommunityBuddyPost } from '#shared/types/adventure'
import type { TripsApiResponse } from '#shared/types/trip'
import { formatDateID } from '~/utils/format'

useSeoMeta({
  title: 'Komunitas Solo Traveler & Buddy Finder — JejakNusa',
  description:
    'Cari teman seperjalanan, patungan shuttle atau kamar hotel, dan kenalan sebelum berangkat open trip di Indonesia.'
})

const { user } = useAuth()

const styles: BuddyTravelStyle[] = [
  'Solo Traveler',
  'Cari Teman Sharing',
  'Fotografi Alam',
  'Pemula Santai'
]

const selectedStyle = ref<BuddyTravelStyle | ''>('')
const likedPostIds = ref<string[]>([])

const { data: tripsData } = await useFetch<TripsApiResponse>('/api/trips')
const trips = computed(() => tripsData.value?.trips ?? [])

const { data: communityData, refresh } = await useFetch<{ posts: CommunityBuddyPost[] }>('/api/community', {
  query: computed(() => (selectedStyle.value ? { style: selectedStyle.value } : {})),
  watch: [selectedStyle]
})

const posts = computed(() => communityData.value?.posts ?? [])

// Create buddy post form
const formTripSlug = ref('')
const formStyle = ref<BuddyTravelStyle>('Solo Traveler')
const formSlots = ref(2)
const formNote = ref('')
const formOrigin = ref(user.value?.origin || '')
const submitting = ref(false)
const formMessage = ref('')
const formError = ref('')

watch(
  trips,
  (list) => {
    if (!formTripSlug.value && list[0]) {
      formTripSlug.value = list[0].slug
    }
  },
  { immediate: true }
)

function toggleLike(post: CommunityBuddyPost) {
  if (likedPostIds.value.includes(post.id)) {
    likedPostIds.value = likedPostIds.value.filter((id) => id !== post.id)
    post.likes -= 1
  } else {
    likedPostIds.value = [...likedPostIds.value, post.id]
    post.likes += 1
  }
}

async function handleCreatePost() {
  formError.value = ''
  formMessage.value = ''
  if (formNote.value.trim().length < 10) {
    formError.value = 'Tuliskan ajakan atau perkenalan minimal 10 karakter.'
    return
  }

  submitting.value = true
  try {
    await $fetch('/api/community', {
      method: 'POST',
      body: {
        tripSlug: formTripSlug.value,
        authorName: user.value?.name || 'Solo Explorer',
        authorOrigin: formOrigin.value.trim() || user.value?.origin || 'Jakarta',
        travelStyle: formStyle.value,
        slotsLookingFor: formSlots.value,
        note: formNote.value.trim()
      }
    })
    formNote.value = ''
    formMessage.value = 'Ajakan barengan berhasil dipublikasikan ke komunitas!'
    await refresh()
  } catch {
    formError.value = 'Gagal mempublikasikan ajakan. Coba lagi.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Hero Strip -->
    <section class="teal-card rounded-[32px] p-6 sm:p-8 text-white relative overflow-hidden">
      <div class="max-w-3xl space-y-3 relative z-10">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-amber-200">
          <Sparkles class="h-3.5 w-3.5" />
          Komunitas Ramah Solo Traveler Indonesia
        </span>
        <h2 class="font-editorial text-2xl sm:text-4xl font-bold leading-tight">
          Berangkat Sendiri, Pulang Membawa Teman Petualangan Baru
        </h2>
        <p class="text-xs sm:text-sm text-teal-100/90 leading-relaxed max-w-2xl">
          Temukan teman sharing shuttle, patungan kamar eco-lodge, atau rekan pacing santai yang berangkat di jadwal open trip yang sama dengan Anda.
        </p>
      </div>
    </section>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Left: Create Buddy Request Form -->
      <aside class="lg:col-span-4 lg:sticky lg:top-6 rounded-[28px] glass-surface p-6 space-y-5">
        <div class="flex items-center gap-2.5 pb-3.5 border-b border-[#e8e2d5]">
          <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef7f6] text-[#1f6f6d]">
            <MessageSquarePlus class="h-4.5 w-4.5" />
          </span>
          <div>
            <h3 class="font-editorial text-lg font-bold text-[#162221]">Buat Ajakan Barengan</h3>
            <p class="text-[11px] text-[#5c6b69]">Posting ke papan Buddy Finder</p>
          </div>
        </div>

        <form class="space-y-4" @submit.prevent="handleCreatePost">
          <div class="space-y-1.5">
            <label for="buddy-trip" class="block text-[11px] font-bold uppercase tracking-wider text-[#5c6b69]">
              Pilih Paket Open Trip
            </label>
            <select
              id="buddy-trip"
              v-model="formTripSlug"
              class="w-full rounded-2xl border border-[#e3dccd] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#162221] focus:border-[#1f6f6d] focus:outline-none cursor-pointer"
            >
              <option v-for="t in trips" :key="t.slug" :value="t.slug">
                {{ t.title }} ({{ formatDateID(t.nextDepartureDate) }})
              </option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-2.5">
            <div class="space-y-1.5">
              <label for="buddy-style" class="block text-[11px] font-bold uppercase tracking-wider text-[#5c6b69]">
                Gaya Jalan
              </label>
              <select
                id="buddy-style"
                v-model="formStyle"
                class="w-full rounded-2xl border border-[#e3dccd] bg-white px-3 py-2.5 text-xs font-semibold text-[#162221] focus:border-[#1f6f6d] focus:outline-none cursor-pointer"
              >
                <option v-for="s in styles" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label for="buddy-slots" class="block text-[11px] font-bold uppercase tracking-wider text-[#5c6b69]">
                Cari Teman
              </label>
              <input
                id="buddy-slots"
                v-model.number="formSlots"
                type="number"
                min="1"
                max="6"
                class="w-full rounded-2xl border border-[#e3dccd] bg-white px-3 py-2.5 text-xs font-bold text-[#162221] focus:border-[#1f6f6d] focus:outline-none"
              >
            </div>
          </div>

          <div class="space-y-1.5">
            <label for="buddy-origin" class="block text-[11px] font-bold uppercase tracking-wider text-[#5c6b69]">
              Berangkat dari Kota
            </label>
            <input
              id="buddy-origin"
              v-model="formOrigin"
              type="text"
              placeholder="Mis. Jakarta, Bandung, Surabaya"
              class="w-full rounded-2xl border border-[#e3dccd] bg-white px-3.5 py-2.5 text-xs font-medium text-[#162221] focus:border-[#1f6f6d] focus:outline-none"
            >
          </div>

          <div class="space-y-1.5">
            <label for="buddy-note" class="block text-[11px] font-bold uppercase tracking-wider text-[#5c6b69]">
              Pesan Perkenalan / Rencana Sharing
            </label>
            <textarea
              id="buddy-note"
              v-model="formNote"
              rows="3"
              placeholder="Ceritakan rencana keberangkatan, sharing shuttle, atau pacing yang kamu suka..."
              class="w-full rounded-2xl border border-[#e3dccd] bg-white px-3.5 py-2.5 text-xs text-[#162221] placeholder:text-[#98a3a0] focus:border-[#1f6f6d] focus:outline-none"
            />
          </div>

          <p v-if="formError" class="text-xs font-semibold text-orange-700">{{ formError }}</p>
          <p v-if="formMessage" class="text-xs font-semibold text-[#175957]">{{ formMessage }}</p>

          <button
            type="submit"
            :disabled="submitting"
            class="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#1f6f6d] px-5 py-3 text-xs font-extrabold text-white shadow-md hover:bg-[#175957] disabled:opacity-60 transition cursor-pointer"
          >
            <Send class="h-3.5 w-3.5" />
            {{ submitting ? 'Mempublikasikan...' : 'Posting Ajakan Barengan' }}
          </button>
        </form>
      </aside>

      <!-- Right: Community Feed -->
      <div class="lg:col-span-8 space-y-5">
        <!-- Filter Pills -->
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="rounded-full px-4 py-2 text-xs font-bold transition cursor-pointer"
            :class="
              !selectedStyle
                ? 'bg-[#1f6f6d] text-white shadow-sm'
                : 'glass-pill text-[#3f4f4d] hover:bg-white'
            "
            @click="selectedStyle = ''"
          >
            Semua Gaya ({{ posts.length }})
          </button>
          <button
            v-for="s in styles"
            :key="s"
            type="button"
            class="rounded-full px-4 py-2 text-xs font-bold transition cursor-pointer"
            :class="
              selectedStyle === s
                ? 'bg-[#1f6f6d] text-white shadow-sm'
                : 'glass-pill text-[#3f4f4d] hover:bg-white'
            "
            @click="selectedStyle = selectedStyle === s ? '' : s"
          >
            {{ s }}
          </button>
        </div>

        <!-- Buddy Cards -->
        <div class="space-y-4">
          <article
            v-for="post in posts"
            :key="post.id"
            class="rounded-[26px] glass-surface p-5 sm:p-6 space-y-4"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="flex items-center gap-3">
                <img
                  :src="post.authorAvatar"
                  :alt="post.authorName"
                  class="h-12 w-12 rounded-2xl object-cover border border-[#c7e4e0]"
                >
                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <h3 class="text-sm font-extrabold text-[#162221]">{{ post.authorName }}</h3>
                    <span class="rounded-full bg-[#eef7f6] border border-[#c7e4e0] px-2.5 py-0.5 text-[10px] font-bold text-[#175957]">
                      {{ post.travelStyle }}
                    </span>
                  </div>
                  <p class="text-xs text-[#5c6b69] mt-0.5">
                    Dari {{ post.authorOrigin }} &bull; Cari {{ post.slotsLookingFor }} teman barengan
                  </p>
                </div>
              </div>

              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition cursor-pointer"
                :class="
                  likedPostIds.includes(post.id)
                    ? 'border-orange-500 bg-orange-500 text-white'
                    : 'border-[#e3dccd] bg-white text-[#4a5957] hover:border-orange-400 hover:text-orange-600'
                "
                @click="toggleLike(post)"
              >
                <Heart class="h-3.5 w-3.5" :class="likedPostIds.includes(post.id) ? 'fill-current' : ''" />
                Minat Gabung ({{ post.likes }})
              </button>
            </div>

            <p class="text-sm text-[#354442] leading-relaxed">
              "{{ post.note }}"
            </p>

            <!-- Linked Open Trip Box -->
            <div class="rounded-2xl bg-white/90 border border-[#ebe5d8] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="space-y-1 min-w-0">
                <p class="text-xs font-extrabold text-[#162221] truncate flex items-center gap-1.5">
                  <Compass class="h-3.5 w-3.5 text-[#1f6f6d] shrink-0" />
                  {{ post.tripTitle }}
                </p>
                <div class="flex flex-wrap items-center gap-3 text-[11px] text-[#5c6b69]">
                  <span class="inline-flex items-center gap-1">
                    <MapPin class="h-3 w-3 text-[#1f6f6d]" />
                    {{ post.location }}
                  </span>
                  <span class="inline-flex items-center gap-1">
                    <Calendar class="h-3 w-3 text-[#1f6f6d]" />
                    Berangkat {{ formatDateID(post.departureDate) }}
                  </span>
                </div>
              </div>

              <NuxtLink
                :to="`/trips/${post.tripSlug}`"
                class="inline-flex items-center gap-1 rounded-full bg-[#eef7f6] px-3.5 py-1.5 text-xs font-bold text-[#1f6f6d] hover:bg-[#1f6f6d] hover:text-white transition shrink-0 self-start sm:self-center"
              >
                Lihat Trip
                <ArrowRight class="h-3.5 w-3.5" />
              </NuxtLink>
            </div>
          </article>
        </div>
      </div>
    </div>
  </div>
</template>

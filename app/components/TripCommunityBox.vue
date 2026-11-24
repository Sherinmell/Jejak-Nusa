<script setup lang="ts">
import { ArrowRight, Heart, MessageCircle, Send, Sparkles, Users } from 'lucide-vue-next'
import type { BuddyTravelStyle, CommunityBuddyPost, TripParticipantPreview } from '#shared/types/adventure'

interface Props {
  tripSlug: string
  tripTitle: string
}

const props = defineProps<Props>()
const { user } = useAuth()

const { data, refresh } = await useFetch<{
  posts: CommunityBuddyPost[]
  participants: TripParticipantPreview[]
}>('/api/community', {
  query: computed(() => ({ tripSlug: props.tripSlug }))
})

const posts = computed(() => data.value?.posts ?? [])
const participants = computed(() => data.value?.participants ?? [])

const newNote = ref('')
const travelStyle = ref<BuddyTravelStyle>('Solo Traveler')
const submitting = ref(false)
const feedback = ref('')

async function submitPost() {
  if (newNote.value.trim().length < 10) {
    feedback.value = 'Tuliskan pesan sapaan minimal 10 karakter.'
    return
  }
  submitting.value = true
  feedback.value = ''
  try {
    await $fetch('/api/community', {
      method: 'POST',
      body: {
        tripSlug: props.tripSlug,
        authorName: user.value?.name || 'Solo Explorer',
        authorOrigin: user.value?.origin || 'Indonesia',
        travelStyle: travelStyle.value,
        slotsLookingFor: 2,
        note: newNote.value.trim()
      }
    })
    newNote.value = ''
    feedback.value = 'Ajakan barengan berhasil dipublikasikan ke grup pra-trip!'
    await refresh()
  } catch {
    feedback.value = 'Gagal mengirim pesan. Coba lagi.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="rounded-[28px] glass-surface p-6 sm:p-7 space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e8e2d5]">
      <div class="flex items-start gap-3">
        <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff7ec] text-orange-600 border border-amber-200">
          <Users class="h-5 w-5" />
        </span>
        <div>
          <span class="text-[11px] font-bold uppercase tracking-wider text-orange-600">
            Ramah Solo Traveler
          </span>
          <h2 class="font-editorial text-2xl font-bold text-[#162221]">
            Komunitas &amp; Teman Seperjalanan
          </h2>
        </div>
      </div>

      <NuxtLink
        to="/community"
        class="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#e3dccd] px-4 py-2 text-xs font-bold text-[#1f6f6d] hover:bg-[#1f6f6d] hover:text-white transition self-start"
      >
        Buka Buddy Finder
        <ArrowRight class="h-3.5 w-3.5" />
      </NuxtLink>
    </div>

    <!-- Who's Already Going -->
    <div class="space-y-3">
      <h3 class="text-xs font-extrabold uppercase tracking-wider text-[#5c6b69]">
        Peserta yang Sudah Bergabung di Jadwal Ini
      </h3>
      <div class="flex flex-wrap gap-3">
        <div
          v-for="person in participants"
          :key="person.id"
          class="inline-flex items-center gap-2.5 rounded-2xl bg-white/95 border border-[#ebe5d8] px-3 py-2"
        >
          <img
            :src="person.avatar"
            :alt="person.name"
            class="h-9 w-9 rounded-full object-cover border border-[#c7e4e0]"
          >
          <div class="leading-tight">
            <p class="text-xs font-extrabold text-[#162221]">{{ person.name }}</p>
            <div class="flex items-center gap-1.5 mt-0.5">
              <span class="text-[10px] text-[#667472]">{{ person.origin }}</span>
              <span
                class="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                :class="
                  person.isSoloTraveler
                    ? 'bg-[#eef7f6] text-[#175957]'
                    : 'bg-amber-50 text-amber-800'
                "
              >
                {{ person.badge }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pre-Trip Discussion Posts -->
    <div class="space-y-3">
      <h3 class="text-xs font-extrabold uppercase tracking-wider text-[#5c6b69] flex items-center gap-1.5">
        <MessageCircle class="h-4 w-4 text-[#1f6f6d]" />
        Obrolan Pra-Trip &amp; Ajakan Patungan Transport
      </h3>

      <div v-if="posts.length" class="space-y-3">
        <article
          v-for="post in posts"
          :key="post.id"
          class="rounded-2xl bg-white/95 border border-[#ebe5d8] p-4 space-y-2"
        >
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <img :src="post.authorAvatar" :alt="post.authorName" class="h-8 w-8 rounded-full object-cover">
              <div>
                <p class="text-xs font-extrabold text-[#162221]">
                  {{ post.authorName }}
                  <span class="font-normal text-[#667472]">&bull; {{ post.authorOrigin }}</span>
                </p>
                <span class="inline-block rounded-full bg-[#eef7f6] px-2 py-0.5 text-[10px] font-bold text-[#175957]">
                  {{ post.travelStyle }}
                </span>
              </div>
            </div>

            <span class="inline-flex items-center gap-1 text-xs font-bold text-orange-600">
              <Heart class="h-3.5 w-3.5 fill-orange-500" />
              {{ post.likes }}
            </span>
          </div>
          <p class="text-xs sm:text-sm text-[#43514f] leading-relaxed">{{ post.note }}</p>
        </article>
      </div>
      <p v-else class="text-xs text-[#667472] italic">
        Jadilah yang pertama menyapa teman seperjalanan untuk trip ini!
      </p>
    </div>

    <!-- Quick Post Form -->
    <form class="rounded-2xl bg-[#fbf9f5] border border-[#e3dccd] p-4 space-y-3" @submit.prevent="submitPost">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-xs font-extrabold text-[#162221] flex items-center gap-1.5">
          <Sparkles class="h-3.5 w-3.5 text-orange-500" />
          Sapa Grup / Cari Teman Sharing
        </span>
        <select
          v-model="travelStyle"
          aria-label="Gaya perjalanan"
          class="rounded-full border border-[#e3dccd] bg-white px-3 py-1 text-[11px] font-bold text-[#354442] focus:outline-none cursor-pointer"
        >
          <option value="Solo Traveler">Solo Traveler</option>
          <option value="Cari Teman Sharing">Cari Teman Sharing</option>
          <option value="Fotografi Alam">Fotografi Alam</option>
          <option value="Pemula Santai">Pemula Santai</option>
        </select>
      </div>

      <div class="flex flex-col sm:flex-row gap-2">
        <input
          v-model="newNote"
          type="text"
          placeholder="Contoh: Aku berangkat solo dari Jakarta, ada yang mau patungan shuttle & kamar hotel?"
          class="flex-1 rounded-full border border-[#e3dccd] bg-white px-4 py-2.5 text-xs sm:text-sm text-[#162221] placeholder:text-[#98a3a0] focus:border-[#1f6f6d] focus:outline-none"
        >
        <button
          type="submit"
          :disabled="submitting"
          class="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#1f6f6d] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#175957] disabled:opacity-60 transition cursor-pointer"
        >
          <Send class="h-3.5 w-3.5" />
          Kirim
        </button>
      </div>

      <p v-if="feedback" class="text-xs font-semibold text-[#175957]">{{ feedback }}</p>
    </form>
  </section>
</template>

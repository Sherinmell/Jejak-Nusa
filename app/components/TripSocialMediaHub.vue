<script setup lang="ts">
import {
  Camera,
  CheckCircle2,
  Download,
  Film,
  KeyRound,
  Lock,
  Pause,
  Play,
  Unlock,
  X
} from 'lucide-vue-next'
import type { Trip } from '#shared/types/trip'

interface Props {
  trip: Trip
}

const props = defineProps<Props>()

interface ReelClip {
  id: string
  title: string
  durationSec: number
  durationLabel: string
  caption: string
  thumbnail: string
  recordedBy: string
}

const reels = computed<ReelClip[]>(() => [
  {
    id: 'reel-1',
    title: 'Kondisi Medan Utama',
    durationSec: 18,
    durationLabel: '0:18',
    caption: `Cuplikan nyata rute ${props.trip.category} di ${props.trip.location} minggu lalu.`,
    thumbnail: props.trip.gallery[0] ?? props.trip.coverImage,
    recordedBy: props.trip.guide.name
  },
  {
    id: 'reel-2',
    title: 'Momen Golden Hour & Grup',
    durationSec: 24,
    durationLabel: '0:24',
    caption: 'Suasana akrab peserta open trip (termasuk solo traveler) di spot favorit.',
    thumbnail: props.trip.gallery[1] ?? props.trip.coverImage,
    recordedBy: 'Tim Dokumentasi JejakNusa'
  },
  {
    id: 'reel-3',
    title: 'Safety Briefing & Basecamp',
    durationSec: 28,
    durationLabel: '0:28',
    caption: `Proses cek perlengkapan dan briefing keselamatan sebelum start di ${props.trip.meetingPoint}.`,
    thumbnail: props.trip.gallery[2] ?? props.trip.coverImage,
    recordedBy: props.trip.guide.name
  }
])

// Interactive Reels Preview Modal
const activeReel = ref<ReelClip | null>(null)
const isPlaying = ref(false)
const elapsedPercent = ref(0)
let playTimer: ReturnType<typeof setInterval> | null = null

function stopTimer() {
  if (playTimer) {
    clearInterval(playTimer)
    playTimer = null
  }
}

function openReel(clip: ReelClip) {
  activeReel.value = clip
  elapsedPercent.value = 0
  isPlaying.value = true
  stopTimer()
  playTimer = setInterval(() => {
    if (!isPlaying.value) return
    elapsedPercent.value += 2
    if (elapsedPercent.value >= 100) {
      elapsedPercent.value = 0
    }
  }, 300)
}

function closeReel() {
  stopTimer()
  isPlaying.value = false
  activeReel.value = null
}

onUnmounted(() => stopTimer())

// Shared Media Album (Participant-Only Access)
const bookingCodeInput = ref('')
const albumUnlocked = ref(false)
const codeError = ref('')
const downloadFeedback = ref('')

function unlockAlbum(demoCode?: string) {
  const code = (demoCode ?? bookingCodeInput.value).trim().toUpperCase()
  bookingCodeInput.value = code
  if (code.startsWith('JN-') && code.length >= 6) {
    albumUnlocked.value = true
    codeError.value = ''
  } else {
    codeError.value = 'Masukkan kode booking valid berawalan JN- (contoh: JN-2612-084).'
  }
}

function simulateDownload(photoLabel: string) {
  downloadFeedback.value = `Mengunduh "${photoLabel}" resolusi penuh (RAW/JPG)...`
  setTimeout(() => {
    downloadFeedback.value = ''
  }, 2500)
}
</script>

<template>
  <section class="rounded-[28px] glass-surface p-6 sm:p-7 space-y-7">
    <!-- Part 1: Reels Preview 15-30s -->
    <div class="space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#e8e2d5]">
        <div class="flex items-start gap-3">
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff7ec] text-orange-600 border border-amber-200">
            <Film class="h-5 w-5" />
          </span>
          <div>
            <span class="text-[11px] font-bold uppercase tracking-wider text-orange-600">
              Social Proof &amp; Preview Medan Nyata
            </span>
            <h2 class="font-editorial text-2xl font-bold text-[#162221]">
              Reels Preview Trip (15–30 Detik)
            </h2>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          v-for="clip in reels"
          :key="clip.id"
          type="button"
          class="group relative aspect-[9/14] overflow-hidden rounded-[22px] bg-[#102625] text-left shadow-md cursor-pointer"
          @click="openReel(clip)"
        >
          <img
            :src="clip.thumbnail"
            :alt="clip.title"
            class="h-full w-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
          >
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/25" />

          <!-- Duration Pill -->
          <span class="absolute top-3 right-3 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-bold text-white">
            {{ clip.durationLabel }}
          </span>

          <!-- Center Play Button -->
          <span
            class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-[#1f6f6d] shadow-xl group-hover:scale-110 transition"
          >
            <Play class="h-5 w-5 fill-current ml-0.5" />
          </span>

          <!-- Bottom Caption -->
          <div class="absolute bottom-3 left-3 right-3 text-white space-y-1">
            <p class="text-xs font-extrabold leading-snug">{{ clip.title }}</p>
            <p class="text-[10px] text-white/80 line-clamp-2">{{ clip.caption }}</p>
          </div>
        </button>
      </div>
    </div>

    <!-- Part 2: Shared Media Album (Official Trip Documentation) -->
    <div class="pt-6 border-t border-[#e8e2d5] space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <Camera class="h-5 w-5 text-[#1f6f6d]" />
          <div>
            <h3 class="font-editorial text-xl font-bold text-[#162221]">
              Galeri Dokumentasi Resmi (Shared Media Album)
            </h3>
            <p class="text-xs text-[#5c6b69]">
              Foto &amp; video HD hasil jepretan pemandu — khusus diunduh oleh peserta yang mengikuti trip.
            </p>
          </div>
        </div>

        <span
          class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold self-start"
          :class="
            albumUnlocked
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-stone-200/80 text-stone-700'
          "
        >
          <Unlock v-if="albumUnlocked" class="h-3.5 w-3.5" />
          <Lock v-else class="h-3.5 w-3.5" />
          {{ albumUnlocked ? 'Akses Peserta Aktif' : 'Terkunci — Khusus Peserta' }}
        </span>
      </div>

      <!-- Access Code Unlock Bar -->
      <div
        v-if="!albumUnlocked"
        class="rounded-2xl bg-[#fbf9f5] border border-[#e3dccd] p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
      >
        <div class="relative flex-1">
          <KeyRound class="h-4 w-4 text-[#7a8785] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            v-model="bookingCodeInput"
            type="text"
            placeholder="Masukkan kode booking peserta (mis. JN-2612-084)"
            class="w-full rounded-full border border-[#e3dccd] bg-white pl-10 pr-4 py-2 text-xs font-semibold text-[#162221] focus:border-[#1f6f6d] focus:outline-none"
          >
        </div>
        <button
          type="button"
          class="rounded-full bg-[#1f6f6d] px-4 py-2 text-xs font-bold text-white hover:bg-[#175957] transition cursor-pointer"
          @click="unlockAlbum()"
        >
          Buka Album
        </button>
        <button
          type="button"
          class="rounded-full border border-[#1f6f6d] bg-white px-4 py-2 text-xs font-bold text-[#1f6f6d] hover:bg-[#eef7f6] transition cursor-pointer"
          @click="unlockAlbum('JN-2612-084')"
        >
          Coba Kode Demo
        </button>
      </div>

      <p v-if="codeError" class="text-xs font-semibold text-orange-700">{{ codeError }}</p>
      <p v-if="downloadFeedback" class="text-xs font-bold text-[#175957] flex items-center gap-1.5">
        <CheckCircle2 class="h-4 w-4 text-[#1f6f6d]" />
        {{ downloadFeedback }}
      </p>

      <!-- Album Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          v-for="(photo, idx) in trip.gallery"
          :key="photo + idx"
          class="relative aspect-square overflow-hidden rounded-2xl bg-[#144746] group"
        >
          <img
            :src="photo"
            :alt="`Dokumentasi resmi ${idx + 1}`"
            class="h-full w-full object-cover transition duration-300"
            :class="albumUnlocked ? 'group-hover:scale-105' : 'blur-[5px] scale-105 opacity-75'"
          >

          <div
            v-if="!albumUnlocked"
            class="absolute inset-0 flex flex-col items-center justify-center bg-black/30 text-white p-2 text-center"
          >
            <Lock class="h-5 w-5 mb-1" />
            <span class="text-[10px] font-bold">Peserta Only</span>
          </div>

          <button
            v-else
            type="button"
            class="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-extrabold text-[#162221] shadow-md hover:bg-[#1f6f6d] hover:text-white transition cursor-pointer"
            @click="simulateDownload(`JejakNusa_${trip.slug}_HD_${idx + 1}.jpg`)"
          >
            <Download class="h-3 w-3" />
            HD
          </button>
        </div>
      </div>
    </div>

    <!-- Vertical Reels Modal Player -->
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
          v-if="activeReel"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          @click.self="closeReel"
        >
          <div class="relative w-full max-w-[340px] aspect-[9/16] rounded-[30px] overflow-hidden bg-black shadow-2xl border border-white/20">
            <img
              :src="activeReel.thumbnail"
              :alt="activeReel.title"
              class="h-full w-full object-cover transition-transform duration-700"
              :class="isPlaying ? 'scale-105' : 'scale-100'"
            >
            <div class="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/85" />

            <!-- Progress Bar -->
            <div class="absolute top-3 left-3 right-3 space-y-2">
              <div class="h-1 w-full rounded-full bg-white/30 overflow-hidden">
                <div
                  class="h-full bg-amber-400 transition-all duration-300"
                  :style="{ width: `${elapsedPercent}%` }"
                />
              </div>
              <div class="flex items-center justify-between text-white">
                <span class="text-xs font-bold">{{ activeReel.recordedBy }}</span>
                <button
                  type="button"
                  class="rounded-full bg-black/45 p-1.5 text-white hover:bg-black/70 cursor-pointer"
                  @click="closeReel"
                >
                  <X class="h-4 w-4" />
                </button>
              </div>
            </div>

            <!-- Play / Pause Control -->
            <button
              type="button"
              class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-14 w-14 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm text-white border border-white/30 hover:scale-105 transition cursor-pointer"
              @click="isPlaying = !isPlaying"
            >
              <Pause v-if="isPlaying" class="h-6 w-6" />
              <Play v-else class="h-6 w-6 ml-0.5" />
            </button>

            <!-- Caption Footer -->
            <div class="absolute bottom-5 left-4 right-4 text-white space-y-1.5">
              <span class="inline-block rounded-full bg-orange-500 px-2.5 py-0.5 text-[10px] font-bold">
                Reels Preview &bull; {{ activeReel.durationLabel }}
              </span>
              <h4 class="text-base font-extrabold leading-snug">{{ activeReel.title }}</h4>
              <p class="text-xs text-white/85 leading-relaxed">{{ activeReel.caption }}</p>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

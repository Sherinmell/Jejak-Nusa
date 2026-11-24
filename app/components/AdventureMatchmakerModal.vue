<script setup lang="ts">
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Compass,
  Sparkles,
  Wand2,
  X
} from 'lucide-vue-next'
import type { MatchmakerAnswers, MatchmakerRecommendation } from '#shared/types/ecosystem'
import { formatRupiah } from '~/utils/format'

interface Props {
  open: boolean
}

defineProps<Props>()
const emit = defineEmits<{ close: [] }>()

const step = ref(1)
const loading = ref(false)
const recommendations = ref<MatchmakerRecommendation[] | null>(null)

const fitness = ref<MatchmakerAnswers['fitness']>('moderate')
const comfort = ref<MatchmakerAnswers['comfort']>('all')
const maxBudget = ref<number>(2500000)
const vibe = ref<MatchmakerAnswers['vibe']>('adrenaline')

function resetQuiz() {
  step.value = 1
  recommendations.value = null
}

async function submitMatchmaker() {
  loading.value = true
  try {
    const res = await $fetch<{ recommendations: MatchmakerRecommendation[] }>('/api/ai/matchmaker', {
      method: 'POST',
      body: {
        fitness: fitness.value,
        comfort: comfort.value,
        maxBudget: maxBudget.value,
        vibe: vibe.value,
        durationPref: maxBudget.value >= 2500000 ? 'multi-day' : 'short'
      } satisfies MatchmakerAnswers
    })
    recommendations.value = res.recommendations
  } finally {
    loading.value = false
  }
}
</script>

<template>
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
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-[#0f2423]/55 backdrop-blur-xs p-4"
        @click.self="emit('close')"
      >
        <div class="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[32px] bg-[#fbf9f5] border border-white p-6 sm:p-8 shadow-2xl space-y-6">
          <!-- Header -->
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1f6f6d] text-amber-300 shadow-md">
                <Wand2 class="h-5 w-5" />
              </span>
              <div>
                <h2 class="font-editorial text-xl sm:text-2xl font-bold text-[#162221]">
                  Adventure Matchmaker AI
                </h2>
                <p class="text-xs text-[#5c6b69]">
                  Kuis cepat 4 langkah untuk mencocokkan open trip terbaik dengan profil Anda
                </p>
              </div>
            </div>
            <button
              type="button"
              class="rounded-full p-2 text-stone-500 hover:bg-stone-200/70 cursor-pointer"
              aria-label="Tutup modal"
              @click="emit('close')"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <!-- Progress Bar -->
          <div v-if="!recommendations" class="space-y-1.5">
            <div class="flex items-center justify-between text-[11px] font-bold text-[#5c6b69]">
              <span>Langkah {{ step }} dari 4</span>
              <span>{{ step * 25 }}%</span>
            </div>
            <div class="h-2 rounded-full bg-[#e6e0d4] overflow-hidden">
              <div
                class="h-full rounded-full bg-[#1f6f6d] transition-all duration-300"
                :style="{ width: `${step * 25}%` }"
              />
            </div>
          </div>

          <!-- Results Screen -->
          <div v-if="recommendations" class="space-y-4">
            <div class="rounded-2xl bg-[#eef7f6] border border-[#c7e4e0] p-4 space-y-1">
              <p class="text-xs font-extrabold text-[#175957] flex items-center gap-1.5">
                <Sparkles class="h-4 w-4" />
                Top 3 Rekomendasi Open Trip untuk Anda
              </p>
              <p class="text-xs text-[#455b59] leading-relaxed">
                Dicocokkan berdasarkan kebugaran fisik, kenyamanan medan, anggaran, dan gaya petualangan Anda.
              </p>
            </div>

            <div class="space-y-3">
              <NuxtLink
                v-for="rec in recommendations"
                :key="rec.trip.id"
                :to="`/trips/${rec.trip.slug}`"
                class="flex flex-col sm:flex-row gap-3.5 rounded-2xl bg-white border border-[#e5dfd2] p-3.5 hover:border-[#1f6f6d] transition"
                @click="emit('close')"
              >
                <img
                  :src="rec.trip.coverImage"
                  :alt="rec.trip.title"
                  class="h-24 w-full sm:w-32 rounded-xl object-cover shrink-0"
                >
                <div class="flex-1 min-w-0 space-y-1">
                  <div class="flex items-center justify-between gap-2">
                    <span class="rounded-full bg-[#eef7f6] px-2.5 py-0.5 text-[10px] font-extrabold text-[#175957]">
                      Cocok {{ rec.matchScore }}%
                    </span>
                    <span class="text-xs font-extrabold text-[#1f6f6d]">
                      {{ formatRupiah(rec.trip.pricePerPerson) }}
                    </span>
                  </div>
                  <p class="text-sm font-extrabold text-[#162221] truncate">{{ rec.trip.title }}</p>
                  <p class="text-[11px] text-[#5c6b69]">{{ rec.trip.location }} &bull; {{ rec.trip.adrenalineLevel }}</p>
                  <p class="text-[11px] text-[#455b59] line-clamp-2">{{ rec.reasons.join(' • ') }}</p>
                </div>
              </NuxtLink>
            </div>

            <div class="flex items-center justify-between pt-2">
              <button
                type="button"
                class="rounded-full border border-[#dfd8c8] bg-white px-4 py-2 text-xs font-bold text-[#354442] hover:border-[#1f6f6d] cursor-pointer"
                @click="resetQuiz"
              >
                Ulangi Kuis
              </button>
              <NuxtLink
                to="/trips"
                class="inline-flex items-center gap-1.5 rounded-full bg-[#1f6f6d] px-5 py-2.5 text-xs font-extrabold text-white hover:bg-[#175957]"
                @click="emit('close')"
              >
                Lihat Semua Trip
                <ArrowRight class="h-3.5 w-3.5" />
              </NuxtLink>
            </div>
          </div>

          <!-- Step 1: Kebugaran Fisik -->
          <div v-else-if="step === 1" class="space-y-3">
            <h3 class="text-base font-extrabold text-[#162221]">1. Bagaimana tingkat kebugaran fisik Anda saat ini?</h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                v-for="opt in ([
                  { key: 'relaxed', label: 'Santai / Pemula', desc: 'Cocok medan ringan hingga pemula.' },
                  { key: 'moderate', label: 'Aktif Rutin', desc: 'Olahraga 2-3x/minggu, siap trekking sedang.' },
                  { key: 'athletic', label: 'Atletik / Ekstrem', desc: 'Stamina kuat untuk puncak tinggi & rappelling.' }
                ] as const)"
                :key="opt.key"
                type="button"
                class="rounded-2xl border p-4 text-left transition cursor-pointer"
                :class="fitness === opt.key ? 'border-[#1f6f6d] bg-[#eef7f6] ring-2 ring-[#1f6f6d]/20' : 'border-[#e3dccd] bg-white'"
                @click="fitness = opt.key"
              >
                <p class="text-sm font-extrabold text-[#162221]">{{ opt.label }}</p>
                <p class="text-[11px] text-[#5c6b69] mt-1">{{ opt.desc }}</p>
              </button>
            </div>
          </div>

          <!-- Step 2: Kenyamanan Medan -->
          <div v-else-if="step === 2" class="space-y-3">
            <h3 class="text-base font-extrabold text-[#162221]">2. Bagaimana kenyamanan Anda terhadap ketinggian &amp; air dalam?</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                v-for="opt in ([
                  { key: 'all', label: 'Bebas Semua Medan', desc: 'Nyaman di ketinggian maupun laut dalam.' },
                  { key: 'no-heights', label: 'Hindari Ketinggian / Tebing', desc: 'Fokus selain rappelling & tebing vertikal.' },
                  { key: 'no-deep-water', label: 'Hindari Laut Dalam', desc: 'Fokus di darat, gunung, dan gua karst.' },
                  { key: 'easy-land', label: 'Jalur Darat Ramah Pemula', desc: 'Utamakan jalur santai & aman untuk pemula.' }
                ] as const)"
                :key="opt.key"
                type="button"
                class="rounded-2xl border p-4 text-left transition cursor-pointer"
                :class="comfort === opt.key ? 'border-[#1f6f6d] bg-[#eef7f6] ring-2 ring-[#1f6f6d]/20' : 'border-[#e3dccd] bg-white'"
                @click="comfort = opt.key"
              >
                <p class="text-sm font-extrabold text-[#162221]">{{ opt.label }}</p>
                <p class="text-[11px] text-[#5c6b69] mt-1">{{ opt.desc }}</p>
              </button>
            </div>
          </div>

          <!-- Step 3: Anggaran -->
          <div v-else-if="step === 3" class="space-y-3">
            <h3 class="text-base font-extrabold text-[#162221]">3. Berapa kisaran anggaran trip per orang?</h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                v-for="b in ([
                  { value: 1000000, label: 'Hemat', desc: 'Hingga Rp1.000.000 / orang' },
                  { value: 2500000, label: 'Menengah', desc: 'Hingga Rp2.500.000 / orang' },
                  { value: 5000000, label: 'Premium', desc: 'Hingga Rp5.000.000+ (Ekspedisi)' }
                ] as const)"
                :key="b.value"
                type="button"
                class="rounded-2xl border p-4 text-left transition cursor-pointer"
                :class="maxBudget === b.value ? 'border-[#1f6f6d] bg-[#eef7f6] ring-2 ring-[#1f6f6d]/20' : 'border-[#e3dccd] bg-white'"
                @click="maxBudget = b.value"
              >
                <p class="text-sm font-extrabold text-[#162221]">{{ b.label }}</p>
                <p class="text-[11px] text-[#5c6b69] mt-1">{{ b.desc }}</p>
              </button>
            </div>
          </div>

          <!-- Step 4: Gaya Liburan -->
          <div v-else-if="step === 4" class="space-y-3">
            <h3 class="text-base font-extrabold text-[#162221]">4. Apa gaya petualangan favorit Anda?</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                v-for="style in ([
                  { key: 'adrenaline', label: 'Adrenalin Air & Canyoning' },
                  { key: 'summit', label: 'Puncak Gunung & Sunrise' },
                  { key: 'ocean', label: 'Eksplorasi Bawah Laut (Diving)' },
                  { key: 'karst', label: 'Gua Karst & Fotografi Alam' }
                ] as const)"
                :key="style.key"
                type="button"
                class="rounded-2xl border p-4 text-left transition cursor-pointer flex items-center justify-between"
                :class="vibe === style.key ? 'border-[#1f6f6d] bg-[#eef7f6] ring-2 ring-[#1f6f6d]/20' : 'border-[#e3dccd] bg-white'"
                @click="vibe = style.key"
              >
                <span class="text-sm font-extrabold text-[#162221]">{{ style.label }}</span>
                <CheckCircle2 v-if="vibe === style.key" class="h-4 w-4 text-[#1f6f6d]" />
              </button>
            </div>
          </div>

          <!-- Wizard Footer Controls -->
          <div v-if="!recommendations" class="flex items-center justify-between pt-2 border-t border-[#e8e2d5]">
            <button
              type="button"
              :disabled="step <= 1"
              class="inline-flex items-center gap-1.5 rounded-full border border-[#dfd8c8] bg-white px-4 py-2 text-xs font-bold text-[#354442] disabled:opacity-40 cursor-pointer"
              @click="step -= 1"
            >
              <ArrowLeft class="h-3.5 w-3.5" />
              Kembali
            </button>

            <button
              v-if="step < 4"
              type="button"
              class="inline-flex items-center gap-1.5 rounded-full bg-[#1f6f6d] px-5 py-2.5 text-xs font-extrabold text-white hover:bg-[#175957] cursor-pointer"
              @click="step += 1"
            >
              Lanjut
              <ArrowRight class="h-3.5 w-3.5" />
            </button>

            <button
              v-else
              type="button"
              :disabled="loading"
              class="inline-flex items-center gap-1.5 rounded-full bg-orange-600 px-5 py-2.5 text-xs font-extrabold text-white hover:bg-orange-700 disabled:opacity-60 cursor-pointer"
              @click="submitMatchmaker"
            >
              <Compass class="h-3.5 w-3.5" />
              {{ loading ? 'Mencocokkan Trip...' : 'Temukan Rekomendasi Trip' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

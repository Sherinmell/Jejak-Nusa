<script setup lang="ts">
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Compass,
  RotateCcw,
  Sparkles,
  Wand2
} from 'lucide-vue-next'
import type { MatchmakerAnswers, MatchmakerRecommendation } from '#shared/types/ecosystem'
import { formatRupiah } from '~/utils/format'

useSeoMeta({
  title: 'Adventure Matchmaker AI — Quiz Pencocokan Open Trip | JejakNusa',
  description:
    'Jawab 5 pertanyaan singkat soal kebugaran, preferensi medan, dan anggaran untuk menemukan paket open trip Indonesia paling cocok untuk Anda.'
})

const step = ref(1)
const totalSteps = 5
const loading = ref(false)
const recommendations = ref<MatchmakerRecommendation[] | null>(null)

const answers = ref<MatchmakerAnswers>({
  fitness: 'moderate',
  comfort: 'all',
  maxBudget: 1500000,
  vibe: 'adrenaline',
  durationPref: 'short'
})

const fitnessOptions = [
  { value: 'relaxed', title: 'Santai / Pemula', desc: 'Baru pertama kali ikut trip alam, lebih suka ritme ringan.' },
  { value: 'moderate', title: 'Aktif Rutin', desc: 'Terbiasa jalan jauh atau olahraga ringan 1–2x seminggu.' },
  { value: 'athletic', title: 'Tahan Banting / Ekstrem', desc: 'Siap tanjakan panjang, summit gunung tinggi, atau jeram kuat.' }
] as const

const comfortOptions = [
  { value: 'all', title: 'Bebas, Tidak Ada Fobia', desc: 'Nyaman di tebing air terjun, puncak tinggi, maupun laut dalam.' },
  { value: 'no-heights', title: 'Hindari Ketinggian / Rappelling', desc: 'Lebih nyaman tanpa tebing curam atau penurunan tali vertikal.' },
  { value: 'no-deep-water', title: 'Hindari Laut Dalam / Diving', desc: 'Lebih suka jalur darat, gunung, atau gua karst.' },
  { value: 'easy-land', title: 'Jalur Darat & Gua Santai', desc: 'Utamakan petualangan alam yang aman bagi pemula.' }
] as const

const budgetOptions = [
  { value: 800000, title: 'Hemat (≤ Rp800.000)', desc: 'Cocok untuk trip 1–2 hari di Jawa & sekitarnya.' },
  { value: 1500000, title: 'Menengah (≤ Rp1.500.000)', desc: 'Canyoning Bali, Pangandaran, hingga Karst Maros.' },
  { value: 2600000, title: 'Ekspedisi (≤ Rp2.600.000)', desc: 'Termasuk pendakian 3H2M seperti Gunung Rinjani.' },
  { value: 4000000, title: 'Fleksibel / Semua Paket', desc: 'Termasuk Liveaboard Komodo & Diving Derawan.' }
] as const

const vibeOptions = [
  { value: 'adrenaline', title: 'Adrenalin & Air Terjun', desc: 'Rappelling ngarai, body rafting, dan lompat tebing alami.' },
  { value: 'summit', title: 'Sunrise & Puncak Gunung', desc: 'Sabana, camping di atas awan, dan panorama kaldera.' },
  { value: 'ocean', title: 'Laut Tropis & Terumbu Karang', desc: 'Berenang bersama pari manta, penyu, dan ubur-ubur purba.' },
  { value: 'karst', title: 'Gua Purba & Geologi Karst', desc: 'Cahaya surga Gua Jomblang & sungai bawah tanah Maros.' }
] as const

const durationOptions = [
  { value: 'short', title: 'Weekend / 1 Hari Penuh', desc: 'Praktis tanpa perlu ambil cuti kerja panjang.' },
  { value: 'multi-day', title: 'Ekspedisi 2–4 Hari', desc: 'Menyelami alam lebih dalam dengan camping atau liveaboard.' }
] as const

async function submitQuiz() {
  loading.value = true
  try {
    const res = await $fetch<{ recommendations: MatchmakerRecommendation[] }>('/api/ai/matchmaker', {
      method: 'POST',
      body: answers.value
    })
    recommendations.value = res.recommendations
  } finally {
    loading.value = false
  }
}

function resetQuiz() {
  recommendations.value = null
  step.value = 1
}
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <!-- Hero Intro -->
    <section class="teal-card rounded-[32px] p-6 sm:p-8 text-white">
      <div class="max-w-2xl space-y-2.5">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-amber-200">
          <Wand2 class="h-3.5 w-3.5" />
          AI-Assisted Adventure Matchmaker
        </span>
        <h2 class="font-editorial text-2xl sm:text-4xl font-bold leading-tight">
          Temukan Open Trip Paling Pas dalam 30 Detik
        </h2>
        <p class="text-xs sm:text-sm text-teal-100/90 leading-relaxed">
          Jawab 5 pertanyaan singkat mengenai stamina, batas kenyamanan medan, anggaran, dan gaya liburan Anda untuk mendapatkan rekomendasi personal.
        </p>
      </div>
    </section>

    <!-- Quiz Stepper Card -->
    <section v-if="!recommendations" class="rounded-[30px] glass-surface p-6 sm:p-8 space-y-6">
      <!-- Progress Bar -->
      <div class="space-y-2">
        <div class="flex items-center justify-between text-xs font-bold">
          <span class="text-[#1f6f6d]">Pertanyaan {{ step }} dari {{ totalSteps }}</span>
          <span class="text-[#5c6b69]">{{ Math.round((step / totalSteps) * 100) }}%</span>
        </div>
        <div class="h-2.5 w-full rounded-full bg-[#e6dfd1] overflow-hidden">
          <div
            class="h-full rounded-full bg-[#1f6f6d] transition-all duration-300"
            :style="{ width: `${(step / totalSteps) * 100}%` }"
          />
        </div>
      </div>

      <!-- Step 1: Fitness -->
      <div v-if="step === 1" class="space-y-4">
        <h3 class="font-editorial text-2xl font-bold text-[#162221]">
          1. Bagaimana tingkat kebugaran fisik Anda saat ini?
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <button
            v-for="opt in fitnessOptions"
            :key="opt.value"
            type="button"
            class="rounded-2xl border p-5 text-left transition cursor-pointer space-y-1.5"
            :class="
              answers.fitness === opt.value
                ? 'border-[#1f6f6d] bg-[#eef7f6] ring-2 ring-[#1f6f6d]/20'
                : 'border-[#e3dccd] bg-white/90 hover:border-[#1f6f6d]/50'
            "
            @click="answers.fitness = opt.value"
          >
            <p class="text-sm font-extrabold text-[#162221]">{{ opt.title }}</p>
            <p class="text-xs text-[#5c6b69] leading-relaxed">{{ opt.desc }}</p>
          </button>
        </div>
      </div>

      <!-- Step 2: Comfort -->
      <div v-else-if="step === 2" class="space-y-4">
        <h3 class="font-editorial text-2xl font-bold text-[#162221]">
          2. Apakah Anda punya batas kenyamanan terhadap ketinggian atau air dalam?
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <button
            v-for="opt in comfortOptions"
            :key="opt.value"
            type="button"
            class="rounded-2xl border p-5 text-left transition cursor-pointer space-y-1.5"
            :class="
              answers.comfort === opt.value
                ? 'border-[#1f6f6d] bg-[#eef7f6] ring-2 ring-[#1f6f6d]/20'
                : 'border-[#e3dccd] bg-white/90 hover:border-[#1f6f6d]/50'
            "
            @click="answers.comfort = opt.value"
          >
            <p class="text-sm font-extrabold text-[#162221]">{{ opt.title }}</p>
            <p class="text-xs text-[#5c6b69] leading-relaxed">{{ opt.desc }}</p>
          </button>
        </div>
      </div>

      <!-- Step 3: Budget -->
      <div v-else-if="step === 3" class="space-y-4">
        <h3 class="font-editorial text-2xl font-bold text-[#162221]">
          3. Berapa kisaran anggaran ideal per orang?
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <button
            v-for="opt in budgetOptions"
            :key="opt.value"
            type="button"
            class="rounded-2xl border p-5 text-left transition cursor-pointer space-y-1.5"
            :class="
              answers.maxBudget === opt.value
                ? 'border-[#1f6f6d] bg-[#eef7f6] ring-2 ring-[#1f6f6d]/20'
                : 'border-[#e3dccd] bg-white/90 hover:border-[#1f6f6d]/50'
            "
            @click="answers.maxBudget = opt.value"
          >
            <p class="text-sm font-extrabold text-[#162221]">{{ opt.title }}</p>
            <p class="text-xs text-[#5c6b69] leading-relaxed">{{ opt.desc }}</p>
          </button>
        </div>
      </div>

      <!-- Step 4: Vibe -->
      <div v-else-if="step === 4" class="space-y-4">
        <h3 class="font-editorial text-2xl font-bold text-[#162221]">
          4. Suasana petualangan apa yang paling bikin Anda bersemangat?
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <button
            v-for="opt in vibeOptions"
            :key="opt.value"
            type="button"
            class="rounded-2xl border p-5 text-left transition cursor-pointer space-y-1.5"
            :class="
              answers.vibe === opt.value
                ? 'border-[#1f6f6d] bg-[#eef7f6] ring-2 ring-[#1f6f6d]/20'
                : 'border-[#e3dccd] bg-white/90 hover:border-[#1f6f6d]/50'
            "
            @click="answers.vibe = opt.value"
          >
            <p class="text-sm font-extrabold text-[#162221]">{{ opt.title }}</p>
            <p class="text-xs text-[#5c6b69] leading-relaxed">{{ opt.desc }}</p>
          </button>
        </div>
      </div>

      <!-- Step 5: Duration -->
      <div v-else class="space-y-4">
        <h3 class="font-editorial text-2xl font-bold text-[#162221]">
          5. Berapa lama waktu yang Anda siapkan untuk trip ini?
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <button
            v-for="opt in durationOptions"
            :key="opt.value"
            type="button"
            class="rounded-2xl border p-5 text-left transition cursor-pointer space-y-1.5"
            :class="
              answers.durationPref === opt.value
                ? 'border-[#1f6f6d] bg-[#eef7f6] ring-2 ring-[#1f6f6d]/20'
                : 'border-[#e3dccd] bg-white/90 hover:border-[#1f6f6d]/50'
            "
            @click="answers.durationPref = opt.value"
          >
            <p class="text-sm font-extrabold text-[#162221]">{{ opt.title }}</p>
            <p class="text-xs text-[#5c6b69] leading-relaxed">{{ opt.desc }}</p>
          </button>
        </div>
      </div>

      <!-- Footer Stepper Buttons -->
      <div class="pt-4 border-t border-[#e8e2d5] flex items-center justify-between gap-3">
        <button
          type="button"
          :disabled="step <= 1"
          class="inline-flex items-center gap-1.5 rounded-full border border-[#e3dccd] bg-white px-5 py-2.5 text-xs font-bold text-[#3f4f4d] hover:bg-[#faf8f4] disabled:opacity-40 cursor-pointer"
          @click="step -= 1"
        >
          <ArrowLeft class="h-4 w-4" />
          Sebelumnya
        </button>

        <button
          v-if="step < totalSteps"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-full bg-[#1f6f6d] px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-[#175957] transition cursor-pointer"
          @click="step += 1"
        >
          Lanjut
          <ArrowRight class="h-4 w-4" />
        </button>

        <button
          v-else
          type="button"
          :disabled="loading"
          class="inline-flex items-center gap-2 rounded-full bg-orange-600 px-6 py-3 text-xs sm:text-sm font-extrabold text-white shadow-md hover:bg-orange-700 disabled:opacity-60 transition cursor-pointer"
          @click="submitQuiz"
        >
          <Sparkles class="h-4 w-4" />
          {{ loading ? 'Mencocokkan Paket...' : 'Lihat Rekomendasi Terbaik' }}
        </button>
      </div>
    </section>

    <!-- Recommendations Result View -->
    <section v-else class="space-y-5">
      <div class="rounded-[26px] glass-surface px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span class="text-xs font-extrabold uppercase tracking-wider text-orange-600 flex items-center gap-1.5">
            <Sparkles class="h-4 w-4" />
            Hasil Analisis Adventure Matchmaker
          </span>
          <h3 class="font-editorial text-2xl font-bold text-[#162221]">
            Top 3 Open Trip Paling Cocok untuk Profil Anda
          </h3>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-full border border-[#e3dccd] bg-white px-4 py-2 text-xs font-bold text-[#1f6f6d] hover:bg-[#eef7f6] transition cursor-pointer self-start"
          @click="resetQuiz"
        >
          <RotateCcw class="h-3.5 w-3.5" />
          Ulangi Kuis
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          v-for="(rec, idx) in recommendations"
          :key="rec.trip.id"
          class="rounded-[26px] glass-surface p-5 flex flex-col justify-between space-y-4"
          :class="idx === 0 ? 'ring-2 ring-[#1f6f6d]' : ''"
        >
          <div class="space-y-3.5">
            <div class="flex items-center justify-between gap-2">
              <span
                class="rounded-full px-3 py-1 text-xs font-extrabold"
                :class="idx === 0 ? 'bg-[#1f6f6d] text-white' : 'bg-[#eef7f6] text-[#175957]'"
              >
                {{ idx === 0 ? '#1 Paling Cocok' : `Rekomendasi #${idx + 1}` }}
              </span>
              <span class="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-900">
                {{ rec.matchScore }}% Match
              </span>
            </div>

            <div class="relative aspect-[16/10] overflow-hidden rounded-[18px]">
              <img :src="rec.trip.coverImage" :alt="rec.trip.title" class="h-full w-full object-cover">
            </div>

            <div>
              <p class="text-[11px] font-bold text-[#1f6f6d]">{{ rec.trip.category }} &bull; {{ rec.trip.location }}</p>
              <h4 class="mt-1 font-editorial text-lg font-bold text-[#162221] leading-snug">
                {{ rec.trip.title }}
              </h4>
              <p class="mt-1 text-sm font-extrabold text-[#162221]">
                {{ formatRupiah(rec.trip.pricePerPerson) }}
                <span class="text-xs font-medium text-[#6d7a78]">/ orang</span>
              </p>
            </div>

            <ul class="space-y-1.5 pt-2 border-t border-[#e8e2d5]">
              <li
                v-for="(reason, rIdx) in rec.reasons"
                :key="rIdx"
                class="flex items-start gap-2 text-xs text-[#43514f]"
              >
                <CheckCircle2 class="h-3.5 w-3.5 text-[#1f6f6d] shrink-0 mt-0.5" />
                <span>{{ reason }}</span>
              </li>
            </ul>
          </div>

          <NuxtLink
            :to="`/trips/${rec.trip.slug}`"
            class="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-[#1f6f6d] px-4 py-2.5 text-xs font-extrabold text-white hover:bg-[#175957] transition"
          >
            <Compass class="h-4 w-4" />
            Lihat Detail &amp; Split Bill
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

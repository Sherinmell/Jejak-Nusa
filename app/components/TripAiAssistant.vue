<script setup lang="ts">
import { Bot, Send, Sparkles, CheckCircle2 } from 'lucide-vue-next'
import type { TripQaResponse } from '#shared/types/ecosystem'

interface Props {
  tripSlug: string
  tripTitle: string
  guideName: string
}

const props = defineProps<Props>()

interface ChatEntry {
  id: string
  question: string
  response: TripQaResponse
}

const questionInput = ref('')
const loading = ref(false)
const history = ref<ChatEntry[]>([])

const quickPrompts = [
  'Apakah jalur ini ramah untuk pemula yang belum pernah ikut sebelumnya?',
  'Apakah ada sinyal seluler di basecamp?',
  'Perlengkapan apa yang sudah termasuk dan apa yang perlu disewa?',
  'Bagaimana kebijakan refund jika cuaca hujan ekstrem?'
]

async function askQuestion(customText?: string) {
  const q = (customText ?? questionInput.value).trim()
  if (!q || loading.value) return

  loading.value = true
  if (!customText) questionInput.value = ''

  try {
    const res = await $fetch<TripQaResponse>('/api/ai/trip-qa', {
      method: 'POST',
      body: {
        slug: props.tripSlug,
        question: q
      }
    })
    history.value.push({
      id: `qa-${Date.now()}`,
      question: q,
      response: res
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="rounded-[28px] glass-surface p-6 sm:p-7 space-y-5 border-[#c7e4e0]">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e8e2d5]">
      <div class="flex items-start gap-3">
        <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl teal-card text-amber-300">
          <Bot class="h-5 w-5" />
        </span>
        <div>
          <span class="text-[11px] font-bold uppercase tracking-wider text-[#1f6f6d] inline-flex items-center gap-1">
            <Sparkles class="h-3.5 w-3.5 text-orange-500" />
            AI-Assisted Contextual Q&amp;A
          </span>
          <h2 class="font-editorial text-2xl font-bold text-[#162221]">
            Tanya Asisten Pintar Tentang Trip Ini
          </h2>
          <p class="text-xs text-[#5c6b69] mt-0.5">
            Jawaban otomatis berbasis itinerary resmi &amp; catatan lapangan pemandu {{ guideName }}.
          </p>
        </div>
      </div>
    </div>

    <!-- Quick Question Chips -->
    <div class="space-y-2">
      <span class="text-[11px] font-bold uppercase tracking-wider text-[#667472]">
        Pertanyaan Populer Calon Peserta
      </span>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="prompt in quickPrompts"
          :key="prompt"
          type="button"
          :disabled="loading"
          class="rounded-full bg-white border border-[#e3dccd] px-3.5 py-1.5 text-xs font-semibold text-[#354442] hover:border-[#1f6f6d] hover:bg-[#eef7f6] hover:text-[#175957] transition cursor-pointer text-left"
          @click="askQuestion(prompt)"
        >
          {{ prompt }}
        </button>
      </div>
    </div>

    <!-- Conversation Thread -->
    <div v-if="history.length" class="space-y-4 max-h-96 overflow-y-auto pr-1">
      <div v-for="entry in history" :key="entry.id" class="space-y-2.5">
        <!-- User Bubble -->
        <div class="flex justify-end">
          <div class="max-w-[85%] rounded-2xl rounded-tr-sm bg-[#1f6f6d] px-4 py-2.5 text-xs sm:text-sm font-medium text-white shadow-xs">
            {{ entry.question }}
          </div>
        </div>

        <!-- AI Response Card -->
        <div class="rounded-2xl rounded-tl-sm bg-white/95 border border-[#cde3df] p-4 space-y-3 shadow-xs">
          <p class="text-xs sm:text-sm text-[#2d3b39] leading-relaxed">
            {{ entry.response.answer }}
          </p>

          <div v-if="entry.response.highlights.length" class="flex flex-wrap gap-1.5">
            <span
              v-for="(hl, idx) in entry.response.highlights"
              :key="idx"
              class="inline-flex items-center gap-1 rounded-full bg-[#eef7f6] px-2.5 py-1 text-[11px] font-bold text-[#175957]"
            >
              <CheckCircle2 class="h-3 w-3 text-[#1f6f6d]" />
              {{ hl }}
            </span>
          </div>

          <p class="text-[10px] font-semibold text-[#7a8785]">
            {{ entry.response.confidenceNote }}
          </p>
        </div>
      </div>
    </div>

    <!-- Question Input -->
    <form class="flex flex-col sm:flex-row gap-2.5" @submit.prevent="askQuestion()">
      <input
        v-model="questionInput"
        type="text"
        :placeholder="`Tanya apa saja soal ${tripTitle}...`"
        class="flex-1 rounded-full border border-[#e3dccd] bg-white px-4 py-3 text-xs sm:text-sm text-[#162221] placeholder:text-[#98a3a0] focus:border-[#1f6f6d] focus:outline-none focus:ring-2 focus:ring-[#1f6f6d]/20"
      >
      <button
        type="submit"
        :disabled="loading || !questionInput.trim()"
        class="inline-flex items-center justify-center gap-2 rounded-full bg-[#1f6f6d] px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-[#175957] disabled:opacity-50 transition cursor-pointer"
      >
        <Send class="h-4 w-4" />
        {{ loading ? 'Menganalisis...' : 'Tanya AI' }}
      </button>
    </form>
  </section>
</template>

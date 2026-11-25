<script setup lang="ts">
import {
  CheckCircle2,
  Clock,
  Headphones,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  ShieldCheck
} from 'lucide-vue-next'
import type {
  SupportListResponse,
  SupportThreadRecord,
  SupportThreadStatus
} from '#shared/types/support'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  allowedRoles: ['admin']
})

useSeoMeta({
  title: 'Pesan Pelanggan & Pusat Bantuan — Admin JejakNusa',
  description: 'Baca dan balas pesan langsung dari pelanggan JejakNusa, pantau status tiket, dan hubungi pelanggan.'
})

const { data, pending, refresh } = await useFetch<SupportListResponse>('/api/support')
const threads = computed(() => data.value?.threads ?? [])
const counts = computed(() => data.value?.counts)

const searchQuery = ref('')
const statusFilter = ref<'ALL' | SupportThreadStatus>('ALL')
const selectedId = ref('')
const replyText = ref('')
const sendingReply = ref(false)
const updatingStatus = ref(false)
const feedback = ref('')
const errorMsg = ref('')

const filteredThreads = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return threads.value.filter((t) => {
    if (statusFilter.value !== 'ALL' && t.status !== statusFilter.value) return false
    if (q) {
      const hay = `${t.ticketCode} ${t.customerName} ${t.customerPhone} ${t.customerEmail} ${t.subject} ${t.category} ${t.bookingReference || ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
})

watch(
  filteredThreads,
  (list) => {
    if (!selectedId.value && list[0]) {
      selectedId.value = list[0].id
    } else if (selectedId.value && !list.some((t) => t.id === selectedId.value)) {
      selectedId.value = list[0]?.id || ''
    }
  },
  { immediate: true }
)

const activeThread = computed<SupportThreadRecord | null>(
  () => filteredThreads.value.find((t) => t.id === selectedId.value) ?? null
)

function statusPillClass(status: SupportThreadStatus) {
  if (status === 'Dibalas Admin') return 'bg-emerald-100 text-emerald-800'
  if (status === 'Selesai') return 'bg-stone-200 text-stone-700'
  return 'bg-amber-100 text-amber-900'
}

async function handleAdminReply() {
  if (!activeThread.value) return
  feedback.value = ''
  errorMsg.value = ''
  if (replyText.value.trim().length < 2) {
    errorMsg.value = 'Tuliskan balasan terlebih dahulu.'
    return
  }

  sendingReply.value = true
  try {
    await $fetch(`/api/support/${activeThread.value.id}/reply`, {
      method: 'POST',
      body: { message: replyText.value.trim() }
    })
    replyText.value = ''
    feedback.value = `Balasan terkirim ke ${activeThread.value.customerName} (${activeThread.value.ticketCode}).`
    await refresh()
  } catch {
    errorMsg.value = 'Gagal mengirim balasan. Coba lagi.'
  } finally {
    sendingReply.value = false
  }
}

async function handleSetStatus(status: SupportThreadStatus) {
  if (!activeThread.value) return
  updatingStatus.value = true
  feedback.value = ''
  errorMsg.value = ''
  try {
    await $fetch(`/api/support/${activeThread.value.id}`, {
      method: 'PATCH',
      body: { status }
    })
    feedback.value = `Status tiket ${activeThread.value.ticketCode} diperbarui menjadi "${status}".`
    await refresh()
  } catch {
    errorMsg.value = 'Gagal mengubah status tiket.'
  } finally {
    updatingStatus.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Hero -->
    <section class="rounded-[28px] teal-card p-6 sm:p-7 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="space-y-1">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-amber-300/20 border border-amber-300/35 px-3 py-1 text-[11px] font-extrabold text-amber-200">
          <Headphones class="h-3.5 w-3.5" />
          Kotak Masuk Bantuan Pelanggan
        </span>
        <h1 class="font-editorial text-2xl sm:text-3xl font-bold">
          Pesan Masuk dari Pelanggan
        </h1>
        <p class="text-xs sm:text-sm text-teal-100/90 max-w-2xl">
          Tanggapi pertanyaan, konfirmasi pembayaran, dan kendala pelanggan secara langsung. Balasan Admin otomatis muncul di halaman Hubungi Admin pelanggan.
        </p>
      </div>

      <button
        type="button"
        :disabled="pending"
        class="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/25 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-white/25 transition cursor-pointer self-start sm:self-auto shrink-0"
        @click="() => refresh()"
      >
        <RefreshCw class="h-3.5 w-3.5" :class="pending ? 'animate-spin' : ''" />
        Muat Ulang Inbox
      </button>
    </section>

    <!-- Counters -->
    <div v-if="counts" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="rounded-[22px] bg-white border border-[#e5dfd2] p-4">
        <p class="text-xs font-bold text-[#5c6b69]">Total Pesan Masuk</p>
        <p class="text-2xl font-extrabold tabular-nums text-[#162221] mt-1">{{ counts.total }}</p>
      </div>
      <div class="rounded-[22px] bg-amber-50 border border-amber-200 p-4">
        <p class="text-xs font-bold text-amber-900">Menunggu Balasan</p>
        <p class="text-2xl font-extrabold tabular-nums text-amber-950 mt-1">{{ counts.waiting }}</p>
      </div>
      <div class="rounded-[22px] bg-emerald-50 border border-emerald-200 p-4">
        <p class="text-xs font-bold text-emerald-800">Sudah Dibalas Admin</p>
        <p class="text-2xl font-extrabold tabular-nums text-emerald-900 mt-1">{{ counts.replied }}</p>
      </div>
      <div class="rounded-[22px] bg-white border border-[#e5dfd2] p-4">
        <p class="text-xs font-bold text-[#5c6b69]">Selesai Ditangani</p>
        <p class="text-2xl font-extrabold tabular-nums text-[#455553] mt-1">{{ counts.resolved }}</p>
      </div>
    </div>

    <div v-if="feedback" class="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-bold text-emerald-900">
      {{ feedback }}
    </div>
    <div v-if="errorMsg" class="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-bold text-rose-800">
      {{ errorMsg }}
    </div>

    <!-- Split Inbox -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <!-- Left: Thread List -->
      <aside class="lg:col-span-4 rounded-[26px] bg-white border border-[#e5dfd2] overflow-hidden shadow-xs">
        <div class="p-4 border-b border-[#ebe5d8] space-y-2.5 bg-[#fbf9f5]">
          <div class="relative">
            <Search class="h-4 w-4 text-[#7a8785] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari nama, no. HP, tiket, subjek..."
              class="w-full rounded-full border border-[#e3dccd] bg-white pl-9 pr-3.5 py-2 text-xs text-[#162221] focus:border-[#1f6f6d] focus:outline-none"
            >
          </div>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="s in (['ALL', 'Menunggu Balasan', 'Dibalas Admin', 'Selesai'] as const)"
              :key="s"
              type="button"
              class="rounded-full px-2.5 py-1 text-[10px] font-extrabold border transition cursor-pointer"
              :class="
                statusFilter === s
                  ? 'bg-[#103f3e] text-white border-[#103f3e]'
                  : 'bg-white text-[#455553] border-[#e3dccd] hover:border-[#1f6f6d]'
              "
              @click="statusFilter = s"
            >
              {{ s === 'ALL' ? 'Semua' : s }}
            </button>
          </div>
        </div>

        <div v-if="filteredThreads.length === 0" class="p-8 text-center text-xs text-[#6d7a78]">
          Tidak ada pesan yang cocok dengan filter.
        </div>

        <div v-else class="divide-y divide-[#efe9dc] max-h-[540px] overflow-y-auto rail-scroll">
          <button
            v-for="t in filteredThreads"
            :key="t.id"
            type="button"
            class="w-full text-left p-4 transition cursor-pointer space-y-1.5"
            :class="selectedId === t.id ? 'bg-[#eef7f6]' : 'hover:bg-[#fbf9f5]'"
            @click="selectedId = t.id"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="font-mono text-[10px] font-extrabold text-[#1f6f6d]">{{ t.ticketCode }}</span>
              <span class="rounded-full px-2 py-0.5 text-[9px] font-extrabold" :class="statusPillClass(t.status)">
                {{ t.status }}
              </span>
            </div>
            <p class="text-xs font-extrabold text-[#162221] line-clamp-1">{{ t.subject }}</p>
            <p class="text-[11px] font-semibold text-[#354442]">
              {{ t.customerName }}
              <span class="font-mono text-[10px] text-[#5c6b69]">• {{ t.customerPhone }}</span>
            </p>
            <p class="text-[10px] text-[#6d7a78] flex items-center justify-between">
              <span>{{ t.category }}</span>
              <span>{{ t.updatedAt }}</span>
            </p>
          </button>
        </div>
      </aside>

      <!-- Right: Conversation & Admin Reply Box -->
      <section class="lg:col-span-8 rounded-[26px] bg-white border border-[#e5dfd2] p-5 sm:p-6 shadow-xs space-y-4">
        <div v-if="!activeThread" class="py-16 text-center space-y-2 text-[#6d7a78]">
          <MessageSquare class="h-8 w-8 mx-auto text-[#9aa8a5]" />
          <p class="text-sm font-bold text-[#354442]">Pilih pesan pelanggan di sebelah kiri untuk membalas.</p>
        </div>

        <template v-else>
          <!-- Ticket Header -->
          <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-[#efe9dc]">
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-mono text-xs font-extrabold text-[#1f6f6d]">{{ activeThread.ticketCode }}</span>
                <span class="rounded-full bg-[#eef7f6] border border-[#c7e4e0] px-2.5 py-0.5 text-[10px] font-bold text-[#175957]">
                  {{ activeThread.category }}
                </span>
                <span v-if="activeThread.bookingReference" class="font-mono text-[10px] font-bold bg-[#f4f1ea] px-2 py-0.5 rounded-full text-[#354442]">
                  Invoice: {{ activeThread.bookingReference }}
                </span>
              </div>
              <h2 class="font-editorial text-xl font-bold text-[#162221]">{{ activeThread.subject }}</h2>
              <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#455553]">
                <strong class="text-[#162221]">{{ activeThread.customerName }}</strong>
                <span class="inline-flex items-center gap-1 font-mono font-bold text-[#1f6f6d]">
                  <Phone class="h-3.5 w-3.5" /> {{ activeThread.customerPhone }}
                </span>
                <span class="inline-flex items-center gap-1">
                  <Mail class="h-3.5 w-3.5 text-[#5c6b69]" /> {{ activeThread.customerEmail }}
                </span>
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <button
                v-if="activeThread.status !== 'Selesai'"
                type="button"
                :disabled="updatingStatus"
                class="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-2 text-xs font-extrabold text-white hover:bg-emerald-700 disabled:opacity-60 cursor-pointer"
                @click="handleSetStatus('Selesai')"
              >
                <CheckCircle2 class="h-3.5 w-3.5" />
                Tandai Selesai
              </button>
              <button
                v-else
                type="button"
                :disabled="updatingStatus"
                class="inline-flex items-center gap-1.5 rounded-full border border-[#dfd8c8] bg-white px-3.5 py-2 text-xs font-extrabold text-[#354442] hover:border-[#1f6f6d] cursor-pointer"
                @click="handleSetStatus('Menunggu Balasan')"
              >
                <RotateCcw class="h-3.5 w-3.5" />
                Buka Kembali
              </button>
            </div>
          </div>

          <!-- Conversation Messages -->
          <div class="space-y-3 max-h-[380px] overflow-y-auto pr-1 rail-scroll">
            <div
              v-for="msg in activeThread.messages"
              :key="msg.id"
              class="flex flex-col"
              :class="msg.senderRole === 'admin' ? 'items-end' : 'items-start'"
            >
              <div
                class="max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed space-y-1"
                :class="
                  msg.senderRole === 'admin'
                    ? 'bg-[#103f3e] text-white rounded-br-sm'
                    : 'bg-[#f4f1ea] border border-[#e3dccd] text-[#162221] rounded-bl-sm'
                "
              >
                <div class="flex items-center gap-1.5 text-[10px] font-extrabold" :class="msg.senderRole === 'admin' ? 'text-amber-300' : 'text-[#1f6f6d]'">
                  <ShieldCheck v-if="msg.senderRole === 'admin'" class="h-3 w-3" />
                  <Clock v-else class="h-3 w-3" />
                  <span>{{ msg.senderName }}</span>
                </div>
                <p class="whitespace-pre-line">{{ msg.message }}</p>
                <p class="text-[9px] text-right" :class="msg.senderRole === 'admin' ? 'text-teal-100/70' : 'text-[#6d7a78]'">
                  {{ msg.createdAt }}
                </p>
              </div>
            </div>
          </div>

          <!-- Admin Reply Form -->
          <form class="pt-3 border-t border-[#efe9dc] space-y-2.5" @submit.prevent="handleAdminReply">
            <label for="admin-reply-input" class="block text-[11px] font-extrabold uppercase tracking-wider text-[#5c6b69]">
              Balas Pesan Pelanggan
            </label>
            <div class="flex flex-col sm:flex-row gap-2">
              <textarea
                id="admin-reply-input"
                v-model="replyText"
                rows="2"
                placeholder="Ketik jawaban resmi dari Admin untuk pelanggan..."
                class="flex-1 rounded-2xl border border-[#e3dccd] bg-[#fbf9f5] px-4 py-2.5 text-xs text-[#162221] focus:border-[#1f6f6d] focus:outline-none"
              />
              <button
                type="submit"
                :disabled="sendingReply"
                class="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-[#1f6f6d] px-5 py-2.5 text-xs font-extrabold text-white hover:bg-[#175957] disabled:opacity-60 cursor-pointer shrink-0"
              >
                <Send class="h-4 w-4" />
                {{ sendingReply ? 'Mengirim...' : 'Kirim Balasan' }}
              </button>
            </div>
          </form>
        </template>
      </section>
    </div>
  </div>
</template>

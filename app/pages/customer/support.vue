<script setup lang="ts">
import {
  CheckCircle2,
  Clock,
  Headphones,
  Mail,
  MessageSquare,
  MessageSquarePlus,
  Phone,
  RefreshCw,
  Send,
  ShieldCheck
} from 'lucide-vue-next'
import type {
  SupportCategory,
  SupportListResponse,
  SupportThreadRecord
} from '#shared/types/support'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth']
})

useSeoMeta({
  title: 'Hubungi Admin & Bantuan Pelanggan — JejakNusa',
  description: 'Kirim pesan langsung ke Admin JejakNusa terkait open trip, pembayaran QRIS, refund cuaca, sertifikat, atau kendala akun.'
})

const { user } = useAuth()
const { bookings, fetchBookings } = useMarketplace()
await fetchBookings()

const { data, pending, refresh } = await useFetch<SupportListResponse>('/api/support', {
  key: () => `support-threads-${user.value?.id || 'guest'}`
})
const threads = computed(() => data.value?.threads ?? [])
const counts = computed(() => data.value?.counts)

const categories: SupportCategory[] = [
  'Pertanyaan Trip',
  'Pembayaran & Invoice',
  'Refund & Reschedule',
  'Sertifikat & Passport',
  'Kendala Akun',
  'Lainnya'
]

const formCategory = ref<SupportCategory>('Pertanyaan Trip')
const formSubject = ref('')
const formBookingRef = ref('')
const formPhone = ref(user.value?.phone || '')
const formMessage = ref('')
const submitting = ref(false)
const formSuccess = ref('')
const formError = ref('')

const activeThreadId = ref('')
const replyText = ref('')
const sendingReply = ref(false)
const replyError = ref('')

watch(
  threads,
  (list) => {
    if (!activeThreadId.value && list[0]) {
      activeThreadId.value = list[0].id
    } else if (activeThreadId.value && !list.some((t) => t.id === activeThreadId.value)) {
      activeThreadId.value = list[0]?.id || ''
    }
  },
  { immediate: true }
)

const activeThread = computed<SupportThreadRecord | null>(
  () => threads.value.find((t) => t.id === activeThreadId.value) ?? null
)

function extractErr(err: unknown, fallback: string) {
  if (err && typeof err === 'object') {
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
    return e.data?.statusMessage || e.statusMessage || fallback
  }
  return fallback
}

async function handleCreateTicket() {
  formError.value = ''
  formSuccess.value = ''

  if (formSubject.value.trim().length < 4) {
    formError.value = 'Tuliskan subjek pesan minimal 4 karakter.'
    return
  }
  if (formMessage.value.trim().length < 8) {
    formError.value = 'Tuliskan isi pesan minimal 8 karakter.'
    return
  }

  submitting.value = true
  try {
    const res = await $fetch<{ thread: SupportThreadRecord; message: string }>('/api/support', {
      method: 'POST',
      body: {
        category: formCategory.value,
        subject: formSubject.value.trim(),
        bookingReference: formBookingRef.value.trim() || undefined,
        phone: formPhone.value.trim() || user.value?.phone || '',
        message: formMessage.value.trim()
      }
    })
    formSuccess.value = res.message
    formSubject.value = ''
    formBookingRef.value = ''
    formMessage.value = ''
    await refresh()
    activeThreadId.value = res.thread.id
  } catch (err) {
    formError.value = extractErr(err, 'Gagal mengirim pesan ke Admin. Coba lagi.')
  } finally {
    submitting.value = false
  }
}

async function handleSendReply() {
  if (!activeThread.value) return
  replyError.value = ''
  if (replyText.value.trim().length < 2) {
    replyError.value = 'Ketik pesan balasan terlebih dahulu.'
    return
  }

  sendingReply.value = true
  try {
    await $fetch(`/api/support/${activeThread.value.id}/reply`, {
      method: 'POST',
      body: { message: replyText.value.trim() }
    })
    replyText.value = ''
    await refresh()
  } catch (err) {
    replyError.value = extractErr(err, 'Gagal mengirim pesan lanjutan.')
  } finally {
    sendingReply.value = false
  }
}

function statusPillClass(status: SupportThreadRecord['status']) {
  if (status === 'Dibalas Admin') return 'bg-emerald-100 text-emerald-800'
  if (status === 'Selesai') return 'bg-stone-200 text-stone-700'
  return 'bg-amber-100 text-amber-900'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Hero Banner -->
    <section class="rounded-[28px] teal-card p-6 sm:p-7 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div class="space-y-1.5">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-amber-300/20 border border-amber-300/35 px-3 py-1 text-[11px] font-extrabold text-amber-200">
          <Headphones class="h-3.5 w-3.5" />
          Pusat Bantuan Pelanggan JejakNusa
        </span>
        <h1 class="font-editorial text-2xl sm:text-3xl font-bold">
          Hubungi Admin JejakNusa
        </h1>
        <p class="text-xs sm:text-sm text-teal-100/90 max-w-2xl">
          Punya pertanyaan seputar jadwal open trip, verifikasi QRIS, klaim sertifikat, atau refund cuaca ekstrem? Kirim pesan langsung ke Admin dan pantau balasannya di sini.
        </p>
      </div>

      <button
        type="button"
        :disabled="pending"
        class="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/25 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-white/25 transition cursor-pointer self-start lg:self-auto shrink-0"
        @click="() => refresh()"
      >
        <RefreshCw class="h-3.5 w-3.5" :class="pending ? 'animate-spin' : ''" />
        Muat Ulang Pesan
      </button>
    </section>

    <!-- Direct Contact Channels Strip -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <a
        href="https://wa.me/6281190004455?text=Halo%20Admin%20JejakNusa%2C%20saya%20ingin%20bertanya%20mengenai%20open%20trip."
        target="_blank"
        rel="noopener noreferrer"
        class="rounded-[22px] bg-white border border-[#e5dfd2] p-4 flex items-center gap-3.5 hover:border-emerald-400 hover:shadow-sm transition"
      >
        <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <Phone class="h-5 w-5" />
        </span>
        <div class="min-w-0">
          <p class="text-xs font-extrabold text-[#162221]">WhatsApp Admin Resmi</p>
          <p class="font-mono text-xs font-bold text-emerald-700 mt-0.5">0811-9000-4455</p>
          <p class="text-[10px] text-[#5c6b69]">Klik untuk chat cepat via WhatsApp</p>
        </div>
      </a>

      <a
        href="mailto:support@jejaknusa.id?subject=Bantuan%20Pelanggan%20JejakNusa"
        class="rounded-[22px] bg-white border border-[#e5dfd2] p-4 flex items-center gap-3.5 hover:border-[#1f6f6d] hover:shadow-sm transition"
      >
        <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef7f6] text-[#1f6f6d]">
          <Mail class="h-5 w-5" />
        </span>
        <div class="min-w-0">
          <p class="text-xs font-extrabold text-[#162221]">Email Layanan Pelanggan</p>
          <p class="text-xs font-bold text-[#1f6f6d] truncate mt-0.5">support@jejaknusa.id</p>
          <p class="text-[10px] text-[#5c6b69]">Respon maksimal 1x24 jam</p>
        </div>
      </a>

      <div class="rounded-[22px] bg-white border border-[#e5dfd2] p-4 flex items-center gap-3.5">
        <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <Clock class="h-5 w-5" />
        </span>
        <div class="min-w-0">
          <p class="text-xs font-extrabold text-[#162221]">Jam Operasional Command Center</p>
          <p class="text-xs font-bold text-[#162221] mt-0.5">Setiap Hari, 07.00 – 22.00 WIB</p>
          <p class="text-[10px] text-[#5c6b69]">Darurat SOS dipantau 24 jam</p>
        </div>
      </div>
    </div>

    <!-- Main Two-Column Grid: Left = New Message Form, Right = Live Conversation Inbox -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Left: Send New Message to Admin -->
      <section class="lg:col-span-5 rounded-[28px] bg-white border border-[#e5dfd2] p-5 sm:p-6 space-y-4 shadow-xs">
        <div class="flex items-center gap-2.5 pb-3 border-b border-[#efe9dc]">
          <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef7f6] text-[#1f6f6d]">
            <MessageSquarePlus class="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 class="font-editorial text-lg font-bold text-[#162221]">Kirim Pesan ke Admin</h2>
            <p class="text-[11px] text-[#5c6b69]">Pesan Anda langsung masuk ke inbox Admin</p>
          </div>
        </div>

        <form class="space-y-3.5" @submit.prevent="handleCreateTicket">
          <div class="space-y-1">
            <label for="sup-category" class="block text-[11px] font-extrabold uppercase tracking-wider text-[#5c6b69]">
              Topik / Kategori
            </label>
            <select
              id="sup-category"
              v-model="formCategory"
              class="w-full rounded-2xl border border-[#e3dccd] bg-[#fbf9f5] px-3.5 py-2.5 text-xs font-bold text-[#162221] focus:border-[#1f6f6d] focus:outline-none"
            >
              <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>

          <div class="space-y-1">
            <label for="sup-subject" class="block text-[11px] font-extrabold uppercase tracking-wider text-[#5c6b69]">
              Subjek Pesan *
            </label>
            <input
              id="sup-subject"
              v-model="formSubject"
              type="text"
              placeholder="Mis. Konfirmasi pembayaran QRIS / jadwal keberangkatan"
              class="w-full rounded-2xl border border-[#e3dccd] bg-[#fbf9f5] px-3.5 py-2.5 text-xs font-semibold text-[#162221] focus:border-[#1f6f6d] focus:outline-none"
            >
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="space-y-1">
              <label for="sup-phone" class="block text-[11px] font-extrabold uppercase tracking-wider text-[#5c6b69]">
                No. WhatsApp / Telepon
              </label>
              <input
                id="sup-phone"
                v-model="formPhone"
                type="tel"
                placeholder="0812-xxxx-xxxx"
                class="w-full rounded-2xl border border-[#e3dccd] bg-[#fbf9f5] px-3.5 py-2.5 text-xs font-semibold text-[#162221] focus:border-[#1f6f6d] focus:outline-none"
              >
            </div>

            <div class="space-y-1">
              <label for="sup-booking" class="block text-[11px] font-extrabold uppercase tracking-wider text-[#5c6b69]">
                No. Invoice (Opsional)
              </label>
              <select
                v-if="bookings.length > 0"
                id="sup-booking"
                v-model="formBookingRef"
                class="w-full rounded-2xl border border-[#e3dccd] bg-[#fbf9f5] px-3 py-2.5 text-xs font-semibold text-[#162221] focus:border-[#1f6f6d] focus:outline-none"
              >
                <option value="">Tidak terkait invoice</option>
                <option v-for="b in bookings" :key="b.id" :value="b.invoiceNumber">
                  {{ b.invoiceNumber }} — {{ b.tripTitle.slice(0, 22) }}
                </option>
              </select>
              <input
                v-else
                id="sup-booking"
                v-model="formBookingRef"
                type="text"
                placeholder="Mis. INV-2026..."
                class="w-full rounded-2xl border border-[#e3dccd] bg-[#fbf9f5] px-3.5 py-2.5 text-xs font-semibold text-[#162221] focus:border-[#1f6f6d] focus:outline-none"
              >
            </div>
          </div>

          <div class="space-y-1">
            <label for="sup-message" class="block text-[11px] font-extrabold uppercase tracking-wider text-[#5c6b69]">
              Isi Pesan untuk Admin *
            </label>
            <textarea
              id="sup-message"
              v-model="formMessage"
              rows="4"
              placeholder="Jelaskan pertanyaan atau kendala Anda secara singkat dan jelas..."
              class="w-full rounded-2xl border border-[#e3dccd] bg-[#fbf9f5] px-3.5 py-2.5 text-xs text-[#162221] focus:border-[#1f6f6d] focus:outline-none"
            />
          </div>

          <p v-if="formError" class="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-bold text-rose-800">
            {{ formError }}
          </p>
          <p v-if="formSuccess" class="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-800">
            {{ formSuccess }}
          </p>

          <button
            type="submit"
            :disabled="submitting"
            class="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#1f6f6d] px-5 py-3 text-xs font-extrabold text-white hover:bg-[#175957] disabled:opacity-60 transition shadow-sm cursor-pointer"
          >
            <Send class="h-3.5 w-3.5" />
            {{ submitting ? 'Mengirim ke Admin...' : 'Kirim Pesan ke Admin' }}
          </button>
        </form>
      </section>

      <!-- Right: My Support Conversations & Admin Replies -->
      <section class="lg:col-span-7 rounded-[28px] bg-white border border-[#e5dfd2] overflow-hidden shadow-xs">
        <div class="px-5 py-4 border-b border-[#ebe5d8] bg-[#fbf9f5] flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 class="font-editorial text-lg font-bold text-[#162221] flex items-center gap-2">
              <MessageSquare class="h-4.5 w-4.5 text-[#1f6f6d]" />
              Riwayat Pesan Saya dengan Admin ({{ counts?.total || 0 }})
            </h2>
            <p class="text-[11px] text-[#5c6b69]">
              Hanya Anda dan Admin JejakNusa yang dapat melihat percakapan ini.
            </p>
          </div>
          <div v-if="counts" class="flex items-center gap-1.5 text-[10px] font-extrabold">
            <span class="rounded-full bg-amber-100 text-amber-900 px-2.5 py-0.5">{{ counts.waiting }} Menunggu</span>
            <span class="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5">{{ counts.replied }} Dibalas</span>
          </div>
        </div>

        <div v-if="threads.length === 0" class="p-10 text-center space-y-2">
          <Headphones class="h-8 w-8 text-[#9aa8a5] mx-auto" />
          <p class="text-sm font-bold text-[#354442]">Belum ada pesan ke Admin</p>
          <p class="text-xs text-[#6d7a78]">Gunakan formulir di sebelah kiri untuk mengirim pertanyaan pertama Anda kepada Admin JejakNusa.</p>
        </div>

        <div v-else class="divide-y divide-[#ebe5d8]">
          <!-- Thread Selector Pills -->
          <div class="p-3.5 bg-[#faf8f4] flex gap-2 overflow-x-auto no-scrollbar">
            <button
              v-for="t in threads"
              :key="t.id"
              type="button"
              class="shrink-0 text-left rounded-2xl border px-3.5 py-2.5 transition cursor-pointer max-w-[240px]"
              :class="
                activeThreadId === t.id
                  ? 'bg-[#103f3e] text-white border-[#103f3e] shadow-xs'
                  : 'bg-white text-[#162221] border-[#e3dccd] hover:border-[#1f6f6d]'
              "
              @click="activeThreadId = t.id"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="font-mono text-[10px] font-bold" :class="activeThreadId === t.id ? 'text-amber-300' : 'text-[#1f6f6d]'">
                  {{ t.ticketCode }}
                </span>
                <span
                  class="rounded-full px-2 py-0.5 text-[9px] font-extrabold"
                  :class="activeThreadId === t.id ? 'bg-white/20 text-white' : statusPillClass(t.status)"
                >
                  {{ t.status }}
                </span>
              </div>
              <p class="text-xs font-extrabold truncate mt-1">{{ t.subject }}</p>
              <p class="text-[10px] truncate mt-0.5" :class="activeThreadId === t.id ? 'text-teal-100/80' : 'text-[#6d7a78]'">
                {{ t.category }} &bull; {{ t.messages.length }} pesan
              </p>
            </button>
          </div>

          <!-- Active Thread Conversation View -->
          <div v-if="activeThread" class="p-5 space-y-4">
            <div class="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-[#efe9dc]">
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <span class="font-mono text-xs font-extrabold text-[#1f6f6d]">{{ activeThread.ticketCode }}</span>
                  <span class="rounded-full bg-[#eef7f6] border border-[#c7e4e0] px-2.5 py-0.5 text-[10px] font-bold text-[#175957]">
                    {{ activeThread.category }}
                  </span>
                  <span v-if="activeThread.bookingReference" class="font-mono text-[10px] font-bold text-[#5c6b69]">
                    Ref: {{ activeThread.bookingReference }}
                  </span>
                </div>
                <h3 class="text-base font-extrabold text-[#162221] mt-1">{{ activeThread.subject }}</h3>
              </div>

              <span class="rounded-full px-3 py-1 text-[10px] font-extrabold" :class="statusPillClass(activeThread.status)">
                {{ activeThread.status }}
              </span>
            </div>

            <!-- Messages Stream -->
            <div class="space-y-3 max-h-[360px] overflow-y-auto pr-1 rail-scroll">
              <div
                v-for="msg in activeThread.messages"
                :key="msg.id"
                class="flex flex-col"
                :class="msg.senderRole === 'customer' ? 'items-end' : 'items-start'"
              >
                <div
                  class="max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed space-y-1"
                  :class="
                    msg.senderRole === 'customer'
                      ? 'bg-[#1f6f6d] text-white rounded-br-sm'
                      : 'bg-[#f4f1ea] border border-[#e3dccd] text-[#162221] rounded-bl-sm'
                  "
                >
                  <div class="flex items-center gap-1.5 text-[10px] font-extrabold" :class="msg.senderRole === 'customer' ? 'text-teal-100' : 'text-[#1f6f6d]'">
                    <ShieldCheck v-if="msg.senderRole === 'admin'" class="h-3 w-3" />
                    <span>{{ msg.senderName }}</span>
                  </div>
                  <p class="whitespace-pre-line">{{ msg.message }}</p>
                  <p class="text-[9px] text-right" :class="msg.senderRole === 'customer' ? 'text-teal-100/75' : 'text-[#6d7a78]'">
                    {{ msg.createdAt }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Follow-up Reply Form -->
            <div v-if="activeThread.status !== 'Selesai'" class="pt-3 border-t border-[#efe9dc] space-y-2">
              <form class="flex gap-2" @submit.prevent="handleSendReply">
                <input
                  v-model="replyText"
                  type="text"
                  placeholder="Tulis balasan lanjutan ke Admin..."
                  class="flex-1 rounded-full border border-[#e3dccd] bg-[#fbf9f5] px-4 py-2.5 text-xs text-[#162221] focus:border-[#1f6f6d] focus:outline-none"
                >
                <button
                  type="submit"
                  :disabled="sendingReply"
                  class="inline-flex items-center gap-1.5 rounded-full bg-[#1f6f6d] px-4 py-2.5 text-xs font-extrabold text-white hover:bg-[#175957] disabled:opacity-60 cursor-pointer shrink-0"
                >
                  <Send class="h-3.5 w-3.5" />
                  Kirim
                </button>
              </form>
              <p v-if="replyError" class="text-[11px] font-bold text-rose-700">{{ replyError }}</p>
            </div>

            <div v-else class="rounded-2xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-xs font-semibold text-emerald-900 flex items-center gap-2">
              <CheckCircle2 class="h-4 w-4 text-emerald-700 shrink-0" />
              Tiket ini telah ditandai selesai oleh Admin. Buat pesan baru di sebelah kiri jika butuh bantuan lagi.
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

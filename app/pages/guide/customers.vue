<script setup lang="ts">
import {
  Award,
  Calendar,
  CheckCircle2,
  FileText,
  Flag,
  HeartPulse,
  Mail,
  MessageCircle,
  Phone,
  Send,
  ShieldAlert,
  StickyNote,
  UserCheck,
  Users,
  X
} from 'lucide-vue-next'
import type { CustomerBookingRecord } from '#shared/types/booking'
import { formatDateID, formatRupiah } from '~/utils/format'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  allowedRoles: ['guide']
})

useSeoMeta({
  title: 'Daftar Peserta & Check-in — Portal Pemandu JejakNusa',
  description: 'Lihat detail pelanggan per trip, kontak WhatsApp, catatan khusus, status pembayaran, Check-in peserta, dan sapa di Trip Lobby Chat.'
})

const { user } = useAuth()
const { bookings, fetchBookings, toggleParticipantCheckin } = useMarketplace()

await fetchBookings(true)

const scopeFilter = ref<'all' | 'mine'>('all')
const statusFilter = ref<'ALL' | 'LUNAS' | 'DP 30% Lunas' | 'MENUNGGU PEMBAYARAN'>('ALL')

const filteredBookings = computed(() => {
  return bookings.value.filter((b) => {
    if (scopeFilter.value === 'mine' && user.value) {
      const isMine =
        b.guideId === user.value.id ||
        b.guideName.toLowerCase() === user.value.name.toLowerCase()
      if (!isMine) return false
    }
    if (statusFilter.value !== 'ALL' && b.paymentStatus !== statusFilter.value) {
      return false
    }
    return true
  })
})

const checkinLoadingId = ref('')
const feedbackMsg = ref('')

async function handleToggleCheckin(bk: CustomerBookingRecord) {
  checkinLoadingId.value = bk.id
  feedbackMsg.value = ''
  try {
    const updated = await toggleParticipantCheckin(bk.id, !bk.checkedIn)
    feedbackMsg.value = updated.checkedIn
      ? `Peserta ${updated.leaderName} (${updated.invoiceNumber}) berhasil ditandai HADIR / CHECK-IN.`
      : `Status Check-in ${updated.leaderName} dikembalikan menjadi belum hadir.`
  } finally {
    checkinLoadingId.value = ''
  }
}

// Quick Lobby Chat Greeting Modal
const chatTargetBooking = ref<CustomerBookingRecord | null>(null)
const chatMessage = ref('')
const sendingChat = ref(false)

function openLobbyChatModal(bk: CustomerBookingRecord) {
  chatTargetBooking.value = bk
  chatMessage.value = `Halo ${bk.leaderName}! Terima kasih sudah mendaftar di ${bk.tripTitle}. Catatan khusus Anda sudah saya catat. Sampai jumpa di meeting point ya!`
}

async function sendQuickLobbyGreeting() {
  if (!chatTargetBooking.value || chatMessage.value.trim().length < 2) return
  sendingChat.value = true
  try {
    await $fetch('/api/lobby', {
      method: 'POST',
      body: {
        tripSlug: chatTargetBooking.value.tripSlug,
        message: chatMessage.value
      }
    })
    feedbackMsg.value = `Sapaan berhasil dikirim ke Trip Lobby Chat untuk "${chatTargetBooking.value.tripTitle}"!`
    chatTargetBooking.value = null
    chatMessage.value = ''
  } finally {
    sendingChat.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <span class="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#1f6f6d]">
          <UserCheck class="h-4 w-4" />
          Manifest &amp; Check-in Real-Time
        </span>
        <h1 class="font-editorial text-2xl sm:text-3xl font-bold text-[#162221]">
          Daftar Pelanggan &amp; Peserta Trip
        </h1>
        <p class="text-xs sm:text-sm text-[#5c6b69]">
          Seluruh transaksi QRIS pelanggan langsung muncul di sini lengkap dengan kontak, catatan khusus, aksi Check-in, dan sapaan Lobby Chat.
        </p>
      </div>

      <button
        type="button"
        class="rounded-full border border-[#dfd8c8] bg-white px-4 py-2 text-xs font-extrabold text-[#162221] hover:border-[#1f6f6d] cursor-pointer self-start md:self-auto"
        @click="() => fetchBookings(true)"
      >
        Muat Ulang Daftar Peserta
      </button>
    </div>

    <!-- Filters Bar -->
    <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white border border-[#e5dfd2] p-3.5">
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-full px-4 py-1.5 text-xs font-extrabold transition cursor-pointer"
          :class="scopeFilter === 'all' ? 'bg-[#1f6f6d] text-white' : 'bg-[#f4f1ea] text-[#455553]'"
          @click="scopeFilter = 'all'"
        >
          Semua Pesanan Masuk ({{ bookings.length }})
        </button>
        <button
          type="button"
          class="rounded-full px-4 py-1.5 text-xs font-extrabold transition cursor-pointer"
          :class="scopeFilter === 'mine' ? 'bg-[#1f6f6d] text-white' : 'bg-[#f4f1ea] text-[#455553]'"
          @click="scopeFilter = 'mine'"
        >
          Khusus Trip Saya ({{ user?.name }})
        </button>
      </div>

      <select
        v-model="statusFilter"
        class="rounded-full border border-[#e3dccd] bg-[#fbf9f5] px-4 py-1.5 text-xs font-bold text-[#162221]"
      >
        <option value="ALL">Semua Status Bayar</option>
        <option value="LUNAS">LUNAS</option>
        <option value="DP 30% Lunas">DP 30% Lunas</option>
        <option value="MENUNGGU PEMBAYARAN">MENUNGGU PEMBAYARAN</option>
      </select>
    </div>

    <div
      v-if="feedbackMsg"
      class="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-bold text-emerald-800"
    >
      {{ feedbackMsg }}
    </div>

    <!-- Participants List -->
    <div v-if="!filteredBookings.length" class="rounded-[28px] bg-white border border-[#e5dfd2] p-10 text-center text-sm text-[#5c6b69]">
      Belum ada peserta pada filter yang dipilih.
    </div>

    <div v-else class="space-y-4">
      <article
        v-for="bk in filteredBookings"
        :key="bk.id"
        class="rounded-[28px] bg-white border p-5 sm:p-6 space-y-4 transition"
        :class="bk.checkedIn ? 'border-emerald-300 bg-emerald-50/20' : 'border-[#e5dfd2]'"
      >
        <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div class="space-y-1.5">
            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded-full bg-[#f4f1ea] px-2.5 py-0.5 text-[10px] font-mono font-extrabold text-[#162221]">
                {{ bk.invoiceNumber }}
              </span>
              <span
                class="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold"
                :class="
                  bk.paymentStatus === 'LUNAS'
                    ? 'bg-emerald-100 text-emerald-800'
                    : bk.paymentStatus === 'DP 30% Lunas'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-orange-100 text-orange-800'
                "
              >
                {{ bk.paymentStatus }}
              </span>
              <span
                v-if="bk.checkedIn"
                class="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white"
              >
                <CheckCircle2 class="h-3 w-3" /> Sudah Check-in
              </span>
              <span
                v-if="bk.bookingStatus === 'Selesai'"
                class="inline-flex items-center gap-1 rounded-full bg-[#1f6f6d] px-2.5 py-0.5 text-[10px] font-extrabold text-white"
              >
                <Flag class="h-3 w-3" /> Trip Selesai (Admin)
              </span>
              <span
                v-if="bk.certificateSent && !bk.certificateClaimed"
                class="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-extrabold text-sky-900"
              >
                <Send class="h-3 w-3" /> Sertifikat Dikirim Admin
              </span>
              <span
                v-if="bk.certificateClaimed"
                class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-900"
              >
                <Award class="h-3 w-3" /> Sertifikat Diklaim: {{ bk.certificateId }}
              </span>
            </div>

            <h2 class="text-base sm:text-lg font-extrabold text-[#162221]">
              {{ bk.leaderName }}
              <span class="text-xs font-semibold text-[#5c6b69]">({{ bk.participantsCount }} peserta)</span>
            </h2>

            <p class="text-xs sm:text-sm font-bold text-[#1f6f6d]">
              {{ bk.tripTitle }} &bull; {{ bk.location }}
            </p>

            <div class="flex flex-wrap gap-4 text-xs text-[#455553] pt-0.5">
              <span class="inline-flex items-center gap-1.5"><Phone class="h-3.5 w-3.5 text-[#1f6f6d]" /> {{ bk.customerPhone }}</span>
              <span class="inline-flex items-center gap-1.5"><Mail class="h-3.5 w-3.5 text-[#1f6f6d]" /> {{ bk.customerEmail }}</span>
              <span class="inline-flex items-center gap-1.5"><Calendar class="h-3.5 w-3.5 text-[#1f6f6d]" /> {{ formatDateID(bk.departureDate) }}</span>
              <span class="inline-flex items-center gap-1.5"><Users class="h-3.5 w-3.5 text-[#1f6f6d]" /> Pemandu: {{ bk.guideName }}</span>
            </div>
          </div>

          <div class="lg:text-right shrink-0 space-y-1">
            <span class="block text-[11px] text-[#5c6b69]">Total Transaksi ({{ bk.paymentMethod }})</span>
            <span class="block text-lg font-extrabold text-[#162221]">{{ formatRupiah(bk.totalAmount) }}</span>
            <span class="block text-xs font-bold text-emerald-700">Terbayar: {{ formatRupiah(bk.paidAmount) }}</span>
          </div>
        </div>

        <!-- Special Notes Box -->
        <div class="rounded-2xl bg-amber-50/70 border border-amber-200/80 px-4 py-2.5 text-xs text-amber-950 flex items-start gap-2">
          <StickyNote class="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
          <span><strong>Catatan Khusus / Kebutuhan Alat:</strong> {{ bk.specialNotes }}</span>
        </div>

        <!-- Participant Safety & Medical Manifest for Field Risk Mitigation -->
        <div
          v-if="bk.participants?.length"
          class="rounded-2xl bg-rose-50/60 border border-rose-200/80 p-4 space-y-2.5"
        >
          <p class="text-[11px] font-extrabold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
            <ShieldAlert class="h-4 w-4 text-rose-600" />
            Data Keselamatan, Kontak Darurat &amp; Riwayat Medis Peserta ({{ bk.participants.length }} Orang)
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div
              v-for="(p, pIdx) in bk.participants"
              :key="pIdx"
              class="rounded-xl bg-white border border-rose-200/70 p-3 text-xs space-y-1"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="font-extrabold text-[#162221]">{{ pIdx + 1 }}. {{ p.fullName }}</span>
                <span class="font-mono text-[10px] font-bold text-[#1f6f6d] bg-[#eef7f6] px-2 py-0.5 rounded-full">
                  ID: {{ p.idNumber }}
                </span>
              </div>
              <p class="text-[11px] text-rose-900 flex items-center gap-1.5">
                <Phone class="h-3 w-3 text-rose-600 shrink-0" />
                <span><strong>Darurat:</strong> {{ p.emergencyContact }}</span>
              </p>
              <p class="text-[11px] text-[#3c4a48] flex items-start gap-1.5">
                <HeartPulse class="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
                <span><strong>Medis / Alergi:</strong> {{ p.medicalNotes }}</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Quick Actions Row -->
        <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#ebe5d8]">
          <NuxtLink
            :to="`/customer/transactions/${bk.id}`"
            class="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#1f6f6d] hover:underline"
          >
            <FileText class="h-3.5 w-3.5" />
            Lihat Rincian Invoice
          </NuxtLink>

          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-full border border-[#1f6f6d] bg-white px-4 py-2 text-xs font-extrabold text-[#1f6f6d] hover:bg-[#eef7f6] transition cursor-pointer"
              @click="openLobbyChatModal(bk)"
            >
              <MessageCircle class="h-3.5 w-3.5" />
              Sapa di Trip Lobby Chat
            </button>

            <button
              type="button"
              :disabled="checkinLoadingId === bk.id"
              class="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-extrabold transition cursor-pointer"
              :class="
                bk.checkedIn
                  ? 'bg-emerald-100 text-emerald-800 hover:bg-stone-200'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
              "
              @click="handleToggleCheckin(bk)"
            >
              <CheckCircle2 class="h-3.5 w-3.5" />
              {{
                checkinLoadingId === bk.id
                  ? 'Menyimpan...'
                  : bk.checkedIn
                    ? 'Batalkan Check-in'
                    : 'Check-in Peserta'
              }}
            </button>

            <NuxtLink
              v-if="bk.certificateClaimed"
              :to="`/customer/certificates/${bk.id}`"
              class="inline-flex items-center gap-1.5 rounded-full border border-amber-400 bg-amber-50 px-4 py-2 text-xs font-extrabold text-amber-900 hover:bg-amber-100 transition"
            >
              <Award class="h-3.5 w-3.5" />
              Lihat Sertifikat
            </NuxtLink>
          </div>
        </div>
      </article>
    </div>

    <!-- Quick Lobby Chat Modal -->
    <Teleport to="body">
      <div
        v-if="chatTargetBooking"
        class="fixed inset-0 z-50 flex items-center justify-center bg-[#0d2423]/55 backdrop-blur-xs p-4"
        @click.self="chatTargetBooking = null"
      >
        <div class="w-full max-w-lg rounded-[28px] bg-[#fbf9f5] border border-white p-6 shadow-2xl space-y-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <span class="text-[11px] font-extrabold uppercase tracking-wider text-[#1f6f6d]">Trip Lobby Chat</span>
              <h3 class="font-editorial text-xl font-bold text-[#162221]">
                Sapa {{ chatTargetBooking.leaderName }}
              </h3>
              <p class="text-xs text-[#5c6b69]">{{ chatTargetBooking.tripTitle }}</p>
            </div>
            <button
              type="button"
              class="rounded-full p-1.5 text-stone-500 hover:bg-stone-200 cursor-pointer"
              @click="chatTargetBooking = null"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <textarea
            v-model="chatMessage"
            rows="4"
            class="w-full rounded-2xl border border-[#e3dccd] bg-white p-3.5 text-xs sm:text-sm text-[#162221]"
          />

          <div class="flex justify-end gap-2">
            <button
              type="button"
              class="rounded-full border border-[#dfd8c8] bg-white px-4 py-2 text-xs font-bold text-[#455553] cursor-pointer"
              @click="chatTargetBooking = null"
            >
              Batal
            </button>
            <button
              type="button"
              :disabled="sendingChat"
              class="inline-flex items-center gap-1.5 rounded-full bg-[#1f6f6d] px-5 py-2 text-xs font-extrabold text-white hover:bg-[#175957] disabled:opacity-60 cursor-pointer"
              @click="sendQuickLobbyGreeting"
            >
              <Send class="h-3.5 w-3.5" />
              {{ sendingChat ? 'Mengirim...' : 'Kirim ke Lobby Chat' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

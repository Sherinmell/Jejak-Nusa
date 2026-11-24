<script setup lang="ts">
import {
  Award,
  CheckCircle2,
  ClipboardList,
  Clock,
  Eye,
  FileText,
  QrCode,
  Search,
  Send,
  X
} from 'lucide-vue-next'
import type { CustomerBookingRecord } from '#shared/types/booking'
import { formatDateID, formatRupiah } from '~/utils/format'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  allowedRoles: ['admin']
})

useSeoMeta({
  title: 'Manajemen Transaksi & Pengiriman Sertifikat — Admin JejakNusa',
  description: 'Kelola transaksi pelanggan, pilih status penyelesaian trip peserta, dan kirim sertifikat resmi ke akun peserta.'
})

const {
  bookings,
  fetchBookings,
  verifyBookingByAdmin,
  setTripCompletionStatus,
  sendCertificateToParticipant
} = useMarketplace()
await fetchBookings(true)

const searchQuery = ref('')
const selectedTrip = ref('ALL')
const selectedStatus = ref('ALL')
const selectedCertFilter = ref<'ALL' | 'UNFINISHED' | 'READY_SEND' | 'SENT' | 'CLAIMED'>('ALL')
const selectedInvoice = ref<CustomerBookingRecord | null>(null)
const sendCertTarget = ref<CustomerBookingRecord | null>(null)
const sendCertNote = ref('')

const verifyingId = ref('')
const updatingStatusId = ref('')
const sendingCertId = ref('')
const feedback = ref('')
const errorFeedback = ref('')

const uniqueTrips = computed(() => {
  const map = new Map<string, string>()
  for (const b of bookings.value) {
    map.set(b.tripSlug, b.tripTitle)
  }
  return Array.from(map.entries()).map(([slug, title]) => ({ slug, title }))
})

const certStats = computed(() => {
  const tripOnly = bookings.value.filter((b) => b.bookingType !== 'hotel')
  const finished = tripOnly.filter((b) => b.bookingStatus === 'Selesai').length
  const sent = tripOnly.filter((b) => b.certificateSent).length
  const claimed = tripOnly.filter((b) => b.certificateClaimed).length
  return { totalTrips: tripOnly.length, finished, sent, claimed }
})

const filteredBookings = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return bookings.value.filter((b) => {
    if (selectedTrip.value !== 'ALL' && b.tripSlug !== selectedTrip.value) return false
    if (selectedStatus.value !== 'ALL' && b.paymentStatus !== selectedStatus.value) return false
    if (selectedCertFilter.value !== 'ALL') {
      if (b.bookingType === 'hotel') return false
      if (selectedCertFilter.value === 'UNFINISHED' && b.bookingStatus === 'Selesai') return false
      if (selectedCertFilter.value === 'READY_SEND' && !(b.bookingStatus === 'Selesai' && !b.certificateSent)) return false
      if (selectedCertFilter.value === 'SENT' && !(b.certificateSent && !b.certificateClaimed)) return false
      if (selectedCertFilter.value === 'CLAIMED' && !b.certificateClaimed) return false
    }
    if (q) {
      const hay = `${b.invoiceNumber} ${b.leaderName} ${b.tripTitle} ${b.guideName} ${b.customerPhone} ${b.certificateId || ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
})

function extractErr(err: unknown, fallback: string) {
  if (err && typeof err === 'object') {
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
    return e.data?.statusMessage || e.statusMessage || fallback
  }
  return fallback
}

async function handleVerifyPayment(bk: CustomerBookingRecord) {
  verifyingId.value = bk.id
  feedback.value = ''
  errorFeedback.value = ''
  try {
    const updated = await verifyBookingByAdmin(bk.id)
    feedback.value = `Transaksi ${updated.invoiceNumber} (${updated.leaderName}) berhasil diverifikasi LUNAS.`
    if (selectedInvoice.value?.id === updated.id) {
      selectedInvoice.value = updated
    }
  } catch (err) {
    errorFeedback.value = extractErr(err, 'Gagal memverifikasi pembayaran.')
  } finally {
    verifyingId.value = ''
  }
}

async function handleChangeTripCompletion(bk: CustomerBookingRecord, completed: boolean) {
  updatingStatusId.value = bk.id
  feedback.value = ''
  errorFeedback.value = ''
  try {
    const updated = await setTripCompletionStatus(bk.id, completed)
    feedback.value = completed
      ? `Peserta ${updated.leaderName} (${updated.invoiceNumber}) ditandai SUDAH SELESAI trip. Sekarang Anda bisa menekan "Kirim Sertifikat".`
      : `Status trip ${updated.leaderName} (${updated.invoiceNumber}) dikembalikan menjadi BELUM SELESAI.`
    if (selectedInvoice.value?.id === updated.id) {
      selectedInvoice.value = updated
    }
  } catch (err) {
    errorFeedback.value = extractErr(err, 'Gagal mengubah status penyelesaian trip.')
  } finally {
    updatingStatusId.value = ''
  }
}

function openSendCertModal(bk: CustomerBookingRecord) {
  sendCertTarget.value = bk
  sendCertNote.value = `Selamat ${bk.leaderName}! Kegiatan ${bk.tripTitle} telah dinyatakan selesai oleh Admin JejakNusa. Silakan klaim sertifikat resmi Anda.`
}

async function handleSendCertificate() {
  if (!sendCertTarget.value) return
  const target = sendCertTarget.value
  sendingCertId.value = target.id
  feedback.value = ''
  errorFeedback.value = ''
  try {
    const updated = await sendCertificateToParticipant(target.id, sendCertNote.value)
    feedback.value = `Sertifikat (${updated.certificateId}) berhasil DIKIRIM ke akun peserta ${updated.leaderName}! Peserta kini dapat mengklaim sertifikat di Dashboard & Adventure Passport.`
    if (selectedInvoice.value?.id === updated.id) {
      selectedInvoice.value = updated
    }
    sendCertTarget.value = null
    sendCertNote.value = ''
  } catch (err) {
    errorFeedback.value = extractErr(err, 'Gagal mengirim sertifikat ke peserta.')
  } finally {
    sendingCertId.value = ''
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <span class="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#1f6f6d]">
          <ClipboardList class="h-4 w-4" />
          Log Transaksi, Status Selesai Trip &amp; Kirim Sertifikat
        </span>
        <h1 class="font-editorial text-2xl sm:text-3xl font-bold text-[#162221]">
          Transaksi Peserta &amp; Pengiriman Sertifikat
        </h1>
        <p class="text-xs sm:text-sm text-[#5c6b69]">
          Pilih status apakah peserta sudah menyelesaikan trip-nya, lalu kirim sertifikat resmi ke akun peserta agar peserta dapat mengklaimnya.
        </p>
      </div>

      <button
        type="button"
        class="rounded-full border border-[#dfd8c8] bg-white px-4 py-2 text-xs font-extrabold text-[#162221] hover:border-[#1f6f6d] cursor-pointer self-start sm:self-auto"
        @click="() => fetchBookings(true)"
      >
        Muat Ulang Tabel
      </button>
    </div>

    <!-- Certificate & Trip Completion Summary Strip -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <div class="min-w-0 rounded-[22px] bg-white border border-[#e5dfd2] p-4 flex flex-col justify-between gap-2">
        <span class="text-xs font-bold text-[#5c6b69]">Total Peserta Open Trip</span>
        <p class="text-2xl font-extrabold tabular-nums text-[#162221]">{{ certStats.totalTrips }}</p>
      </div>
      <div class="min-w-0 rounded-[22px] bg-white border border-[#e5dfd2] p-4 flex flex-col justify-between gap-2">
        <span class="text-xs font-bold text-[#5c6b69]">Ditandai Sudah Selesai</span>
        <p class="text-2xl font-extrabold tabular-nums text-[#1f6f6d]">{{ certStats.finished }}</p>
      </div>
      <div class="min-w-0 rounded-[22px] bg-white border border-[#e5dfd2] p-4 flex flex-col justify-between gap-2">
        <span class="text-xs font-bold text-[#5c6b69]">Sertifikat Dikirim Admin</span>
        <p class="text-2xl font-extrabold tabular-nums text-amber-700">{{ certStats.sent }}</p>
      </div>
      <div class="min-w-0 rounded-[22px] bg-white border border-[#e5dfd2] p-4 flex flex-col justify-between gap-2">
        <span class="text-xs font-bold text-[#5c6b69]">Sudah Diklaim Peserta</span>
        <p class="text-2xl font-extrabold tabular-nums text-emerald-700">{{ certStats.claimed }}</p>
      </div>
    </div>

    <div
      v-if="feedback"
      class="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-bold text-emerald-800"
    >
      {{ feedback }}
    </div>

    <div
      v-if="errorFeedback"
      class="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-bold text-rose-800"
    >
      {{ errorFeedback }}
    </div>

    <!-- Filters Bar -->
    <div class="grid grid-cols-1 md:grid-cols-12 gap-3 rounded-[24px] bg-white border border-[#e5dfd2] p-4">
      <div class="md:col-span-4 relative">
        <Search class="h-4 w-4 text-[#7a8785] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari invoice, peserta, pemandu, no. sertifikat..."
          class="w-full rounded-full border border-[#e3dccd] bg-[#fbf9f5] pl-10 pr-4 py-2 text-xs sm:text-sm text-[#162221]"
        >
      </div>

      <div class="md:col-span-3">
        <select
          v-model="selectedTrip"
          class="w-full rounded-full border border-[#e3dccd] bg-[#fbf9f5] px-4 py-2 text-xs sm:text-sm font-semibold text-[#162221]"
        >
          <option value="ALL">Semua Destinasi ({{ uniqueTrips.length }})</option>
          <option v-for="t in uniqueTrips" :key="t.slug" :value="t.slug">{{ t.title }}</option>
        </select>
      </div>

      <div class="md:col-span-2">
        <select
          v-model="selectedStatus"
          class="w-full rounded-full border border-[#e3dccd] bg-[#fbf9f5] px-3 py-2 text-xs sm:text-sm font-semibold text-[#162221]"
        >
          <option value="ALL">Semua Bayar</option>
          <option value="LUNAS">LUNAS</option>
          <option value="DP 30% Lunas">DP 30% Lunas</option>
          <option value="MENUNGGU PEMBAYARAN">Menunggu Bayar</option>
        </select>
      </div>

      <div class="md:col-span-3">
        <select
          v-model="selectedCertFilter"
          class="w-full rounded-full border border-[#e3dccd] bg-[#fbf9f5] px-3 py-2 text-xs sm:text-sm font-semibold text-[#162221]"
        >
          <option value="ALL">Semua Status Trip &amp; Sertifikat</option>
          <option value="UNFINISHED">Belum Selesai Trip</option>
          <option value="READY_SEND">Sudah Selesai (Siap Kirim)</option>
          <option value="SENT">Terkirim (Menunggu Klaim)</option>
          <option value="CLAIMED">Sudah Diklaim Peserta</option>
        </select>
      </div>
    </div>

    <!-- Full Bookings Table -->
    <div class="rounded-[28px] bg-white border border-[#e5dfd2] overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-[#f4f1ea] text-[#455553] uppercase tracking-wider text-[10px]">
            <tr>
              <th class="px-4 py-3.5 font-extrabold">Invoice &amp; Peserta</th>
              <th class="px-4 py-3.5 font-extrabold">Destinasi &amp; Pemandu</th>
              <th class="px-4 py-3.5 font-extrabold">Nominal &amp; Bayar</th>
              <th class="px-4 py-3.5 font-extrabold">Status Selesai Trip (Pilih Admin)</th>
              <th class="px-4 py-3.5 font-extrabold">Pengiriman Sertifikat</th>
              <th class="px-4 py-3.5 font-extrabold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#ebe5d8]">
            <tr
              v-for="bk in filteredBookings"
              :key="bk.id"
              class="hover:bg-[#fbf9f5] transition cursor-pointer"
              @click="selectedInvoice = bk"
            >
              <td class="px-4 py-3.5">
                <span class="font-mono font-extrabold text-[#1f6f6d]">{{ bk.invoiceNumber }}</span>
                <p class="font-extrabold text-[#162221] mt-0.5">{{ bk.leaderName }}</p>
                <p class="text-[11px] text-[#5c6b69]">{{ bk.participantsCount }} org &bull; {{ bk.customerPhone }}</p>
              </td>
              <td class="px-4 py-3.5">
                <p class="font-bold text-[#162221] max-w-[220px] truncate">{{ bk.tripTitle }}</p>
                <p class="text-[11px] text-[#5c6b69]">{{ bk.location }} &bull; {{ formatDateID(bk.departureDate) }}</p>
                <p class="text-[10px] font-semibold text-[#1f6f6d] mt-0.5">{{ bk.guideName }}</p>
              </td>
              <td class="px-4 py-3.5">
                <p class="font-extrabold text-[#162221] tabular-nums">{{ formatRupiah(bk.totalAmount) }}</p>
                <span
                  class="inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold whitespace-nowrap"
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
                <p class="text-[10px] text-[#5c6b69] inline-flex items-center gap-1 mt-0.5">
                  <QrCode class="h-3 w-3 text-[#1f6f6d]" /> {{ bk.paymentMethod }}
                </p>
              </td>

              <!-- Admin Trip Completion Selector -->
              <td class="px-4 py-3.5" @click.stop>
                <div v-if="bk.bookingType === 'hotel'" class="text-[11px] text-[#6d7a78] italic">
                  Hotel Saja (tanpa sertifikat trip)
                </div>
                <div v-else-if="bk.paymentStatus === 'MENUNGGU PEMBAYARAN'" class="text-[11px] text-orange-700 font-semibold">
                  Verifikasi bayar dulu
                </div>
                <div v-else class="space-y-1">
                  <select
                    :value="bk.bookingStatus === 'Selesai' ? 'done' : 'ongoing'"
                    :disabled="updatingStatusId === bk.id || Boolean(bk.certificateClaimed)"
                    class="rounded-full border px-3 py-1.5 text-[11px] font-extrabold cursor-pointer disabled:opacity-70"
                    :class="
                      bk.bookingStatus === 'Selesai'
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : 'border-[#d9d1c2] bg-[#fbf9f5] text-[#455553]'
                    "
                    @change="handleChangeTripCompletion(bk, ($event.target as HTMLSelectElement).value === 'done')"
                  >
                    <option value="ongoing">Belum Selesai Trip</option>
                    <option value="done">Sudah Selesai Trip ✓</option>
                  </select>
                  <p v-if="bk.completedAt" class="text-[10px] text-[#5c6b69]">
                    Selesai: {{ bk.completedAt }}
                  </p>
                </div>
              </td>

              <!-- Admin Send Certificate Column -->
              <td class="px-4 py-3.5" @click.stop>
                <div v-if="bk.bookingType === 'hotel'" class="text-[11px] text-[#6d7a78]">—</div>
                <div v-else-if="bk.certificateClaimed" class="space-y-1">
                  <span class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-extrabold text-emerald-800 whitespace-nowrap">
                    <Award class="h-3 w-3" /> Diklaim Peserta ✓
                  </span>
                  <span class="block font-mono text-[10px] text-[#1f6f6d] font-bold">{{ bk.certificateId }}</span>
                </div>
                <div v-else-if="bk.certificateSent" class="space-y-1">
                  <span class="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-1 text-[10px] font-extrabold text-sky-900 whitespace-nowrap">
                    <Send class="h-3 w-3" /> Terkirim ke Peserta
                  </span>
                  <span class="block font-mono text-[10px] text-[#5c6b69]">{{ bk.certificateId }}</span>
                  <span class="block text-[10px] text-[#6d7a78]">Menunggu peserta klaim</span>
                </div>
                <div v-else-if="bk.bookingStatus === 'Selesai'">
                  <button
                    type="button"
                    :disabled="sendingCertId === bk.id"
                    class="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3.5 py-1.5 text-[11px] font-extrabold text-[#162221] hover:bg-amber-400 shadow-xs transition cursor-pointer whitespace-nowrap"
                    @click="openSendCertModal(bk)"
                  >
                    <Send class="h-3 w-3" />
                    {{ sendingCertId === bk.id ? 'Mengirim...' : 'Kirim Sertifikat' }}
                  </button>
                </div>
                <div v-else class="inline-flex items-center gap-1 text-[10px] text-[#6d7a78]">
                  <Clock class="h-3 w-3" />
                  Pilih &ldquo;Sudah Selesai&rdquo; dulu
                </div>
              </td>

              <td class="px-4 py-3.5 text-right whitespace-nowrap space-x-1.5" @click.stop>
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-full border border-[#dfd8c8] bg-white px-3 py-1.5 text-[11px] font-bold text-[#162221] hover:border-[#1f6f6d] hover:text-[#1f6f6d] cursor-pointer"
                  @click="selectedInvoice = bk"
                >
                  <Eye class="h-3 w-3" /> Detail
                </button>
                <button
                  v-if="bk.paymentStatus !== 'LUNAS'"
                  type="button"
                  :disabled="verifyingId === bk.id"
                  class="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-extrabold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                  @click="handleVerifyPayment(bk)"
                >
                  <CheckCircle2 class="h-3 w-3" />
                  {{ verifyingId === bk.id ? '...' : 'Lunas' }}
                </button>
                <NuxtLink
                  v-if="bk.certificateClaimed"
                  :to="`/customer/certificates/${bk.id}`"
                  class="inline-flex items-center gap-1 rounded-full border border-amber-400 bg-amber-50 px-3 py-1.5 text-[11px] font-extrabold text-amber-900 hover:bg-amber-100"
                >
                  <Award class="h-3 w-3" /> Sertifikat
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Send Certificate Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="sendCertTarget"
        class="fixed inset-0 z-50 flex items-center justify-center bg-[#0d2423]/60 backdrop-blur-xs p-4"
        @click.self="sendCertTarget = null"
      >
        <div class="w-full max-w-lg rounded-[28px] bg-[#fbf9f5] border border-white p-6 shadow-2xl space-y-4">
          <div class="flex items-start justify-between gap-3 pb-3 border-b border-[#e5dfd2]">
            <div>
              <span class="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-[#1f6f6d]">
                <Award class="h-3.5 w-3.5" />
                Kirim Sertifikat Resmi ke Peserta
              </span>
              <h3 class="font-editorial text-xl font-bold text-[#162221] mt-0.5">
                {{ sendCertTarget.leaderName }}
              </h3>
              <p class="text-xs text-[#5c6b69]">
                {{ sendCertTarget.tripTitle }} &bull; {{ sendCertTarget.invoiceNumber }}
              </p>
            </div>
            <button
              type="button"
              class="rounded-full p-1.5 text-stone-500 hover:bg-stone-200 cursor-pointer"
              @click="sendCertTarget = null"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-900">
            Peserta sudah berstatus <strong>Sudah Selesai Trip</strong>. Setelah Anda menekan tombol kirim di bawah, notifikasi sertifikat resmi akan langsung muncul di <strong>Dashboard</strong> dan <strong>Adventure Passport</strong> peserta agar peserta dapat mengklaim &amp; mencetak sertifikatnya.
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-extrabold text-[#162221]">
              Pesan Pengiriman dari Admin untuk Peserta
            </label>
            <textarea
              v-model="sendCertNote"
              rows="3"
              class="w-full rounded-2xl border border-[#dfd8c8] bg-white p-3.5 text-xs sm:text-sm text-[#162221]"
            />
          </div>

          <div class="flex justify-end gap-2 pt-1">
            <button
              type="button"
              class="rounded-full border border-[#dfd8c8] bg-white px-4 py-2 text-xs font-bold text-[#455553] cursor-pointer"
              @click="sendCertTarget = null"
            >
              Batal
            </button>
            <button
              type="button"
              :disabled="sendingCertId === sendCertTarget.id"
              class="inline-flex items-center gap-1.5 rounded-full bg-[#1f6f6d] px-5 py-2.5 text-xs font-extrabold text-white hover:bg-[#175957] disabled:opacity-60 cursor-pointer shadow-sm"
              @click="handleSendCertificate"
            >
              <Send class="h-3.5 w-3.5" />
              {{ sendingCertId === sendCertTarget.id ? 'Mengirim...' : 'Kirim Sertifikat ke Peserta' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Invoice & Certificate Detail Modal -->
    <Teleport to="body">
      <div
        v-if="selectedInvoice"
        class="fixed inset-0 z-50 flex items-center justify-center bg-[#0d2423]/60 backdrop-blur-xs p-4"
        @click.self="selectedInvoice = null"
      >
        <div class="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[28px] bg-[#fbf9f5] border border-white p-6 shadow-2xl space-y-4">
          <div class="flex items-start justify-between gap-3 pb-3 border-b border-[#e5dfd2]">
            <div>
              <span class="text-[11px] font-extrabold uppercase tracking-wider text-[#1f6f6d]">Rincian Invoice &amp; Sertifikat</span>
              <h3 class="font-mono text-xl font-extrabold text-[#162221]">{{ selectedInvoice.invoiceNumber }}</h3>
              <p class="text-xs text-[#5c6b69]">{{ selectedInvoice.createdAt }} &bull; Ref: {{ selectedInvoice.paymentReference }}</p>
            </div>
            <button
              type="button"
              class="rounded-full p-1.5 text-stone-500 hover:bg-stone-200 cursor-pointer"
              @click="selectedInvoice = null"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="rounded-2xl bg-white border border-[#e5dfd2] p-4 space-y-1.5 text-xs">
            <div class="flex justify-between"><span class="text-[#5c6b69]">Pemesan</span><strong class="text-[#162221]">{{ selectedInvoice.leaderName }}</strong></div>
            <div class="flex justify-between"><span class="text-[#5c6b69]">WhatsApp</span><strong class="text-[#162221]">{{ selectedInvoice.customerPhone }}</strong></div>
            <div class="flex justify-between"><span class="text-[#5c6b69]">Destinasi</span><strong class="text-[#162221] text-right">{{ selectedInvoice.tripTitle }}</strong></div>
            <div class="flex justify-between"><span class="text-[#5c6b69]">Pemandu Lokal</span><strong class="text-[#1f6f6d]">{{ selectedInvoice.guideName }}</strong></div>
            <div class="flex justify-between"><span class="text-[#5c6b69]">Catatan Khusus</span><span class="text-[#3c4a48] text-right">{{ selectedInvoice.specialNotes }}</span></div>
          </div>

          <!-- Participant Identity, Emergency Contact & Medical Notes for Admin -->
          <div
            v-if="selectedInvoice.participants?.length"
            class="rounded-2xl bg-rose-50/60 border border-rose-200 p-4 space-y-2 text-xs"
          >
            <p class="font-extrabold text-rose-950">
              Manifest Peserta, NIK/Paspor &amp; Data Keselamatan ({{ selectedInvoice.participants.length }} Orang)
            </p>
            <div
              v-for="(p, pIdx) in selectedInvoice.participants"
              :key="pIdx"
              class="rounded-xl bg-white border border-rose-200/70 p-2.5 space-y-0.5"
            >
              <div class="flex items-center justify-between gap-2">
                <strong class="text-[#162221]">{{ pIdx + 1 }}. {{ p.fullName }}</strong>
                <span class="font-mono text-[10px] font-bold text-[#1f6f6d]">NIK/ID: {{ p.idNumber }}</span>
              </div>
              <p class="text-[11px] text-rose-900"><strong>Kontak Darurat:</strong> {{ p.emergencyContact }}</p>
              <p class="text-[11px] text-[#455553]"><strong>Medis / Alergi:</strong> {{ p.medicalNotes }}</p>
            </div>
          </div>

          <!-- Admin Certificate Control Panel Inside Detail Modal -->
          <div
            v-if="selectedInvoice.bookingType !== 'hotel' && selectedInvoice.paymentStatus !== 'MENUNGGU PEMBAYARAN'"
            class="rounded-2xl bg-[#eef7f6] border border-[#c7e4e0] p-4 space-y-3 text-xs"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="font-extrabold text-[#103f3e] inline-flex items-center gap-1.5">
                <Award class="h-4 w-4 text-[#1f6f6d]" />
                Kontrol Status Trip &amp; Sertifikat Peserta
              </span>
              <select
                :value="selectedInvoice.bookingStatus === 'Selesai' ? 'done' : 'ongoing'"
                :disabled="updatingStatusId === selectedInvoice.id || Boolean(selectedInvoice.certificateClaimed)"
                class="rounded-full border border-[#1f6f6d]/40 bg-white px-3 py-1 text-[11px] font-extrabold text-[#103f3e] cursor-pointer"
                @change="handleChangeTripCompletion(selectedInvoice, ($event.target as HTMLSelectElement).value === 'done')"
              >
                <option value="ongoing">Belum Selesai Trip</option>
                <option value="done">Sudah Selesai Trip ✓</option>
              </select>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#c7e4e0]">
              <span class="text-[11px] text-[#355250]">
                <template v-if="selectedInvoice.certificateClaimed">
                  Sertifikat <strong>{{ selectedInvoice.certificateId }}</strong> telah diklaim peserta ({{ selectedInvoice.certificateClaimedAt }}).
                </template>
                <template v-else-if="selectedInvoice.certificateSent">
                  Sertifikat <strong>{{ selectedInvoice.certificateId }}</strong> sudah dikirim pada {{ selectedInvoice.certificateSentAt }} — menunggu peserta klaim.
                </template>
                <template v-else-if="selectedInvoice.bookingStatus === 'Selesai'">
                  Trip sudah ditandai selesai. Klik tombol di kanan untuk mengirim sertifikat ke akun peserta.
                </template>
                <template v-else>
                  Ubah pilihan di atas menjadi <strong>Sudah Selesai Trip</strong> untuk mengaktifkan pengiriman sertifikat.
                </template>
              </span>

              <button
                v-if="selectedInvoice.bookingStatus === 'Selesai' && !selectedInvoice.certificateSent"
                type="button"
                class="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-1.5 text-[11px] font-extrabold text-[#162221] hover:bg-amber-400 cursor-pointer"
                @click="openSendCertModal(selectedInvoice)"
              >
                <Send class="h-3.5 w-3.5" />
                Kirim Sertifikat
              </button>
              <NuxtLink
                v-else-if="selectedInvoice.certificateClaimed"
                :to="`/customer/certificates/${selectedInvoice.id}`"
                class="inline-flex items-center gap-1.5 rounded-full bg-[#1f6f6d] px-4 py-1.5 text-[11px] font-extrabold text-white"
              >
                <Award class="h-3.5 w-3.5" />
                Lihat Sertifikat
              </NuxtLink>
            </div>
          </div>

          <div class="rounded-2xl bg-white border border-[#e5dfd2] p-4 space-y-1.5 text-xs">
            <div class="flex justify-between"><span>Paket ({{ selectedInvoice.participantsCount }} org)</span><strong>{{ formatRupiah(selectedInvoice.packageSubtotal) }}</strong></div>
            <div class="flex justify-between"><span>Asuransi Perjalanan</span><strong>{{ formatRupiah(selectedInvoice.insuranceFee) }}</strong></div>
            <div class="flex justify-between"><span>Carbon Offset</span><strong>{{ formatRupiah(selectedInvoice.carbonOffsetFee) }}</strong></div>
            <div class="flex justify-between"><span>Biaya Layanan Aplikasi</span><strong>{{ formatRupiah(selectedInvoice.serviceFee) }}</strong></div>
            <div class="flex justify-between pt-2 border-t border-dashed border-[#dfd8c8] text-sm font-extrabold text-[#1f6f6d]">
              <span>Total Transaksi</span>
              <span>{{ formatRupiah(selectedInvoice.totalAmount) }}</span>
            </div>
            <div class="flex justify-between text-emerald-700 font-bold">
              <span>Telah Dibayar ({{ selectedInvoice.paymentStatus }})</span>
              <span>{{ formatRupiah(selectedInvoice.paidAmount) }}</span>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
            <NuxtLink
              :to="`/customer/transactions/${selectedInvoice.id}`"
              class="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#1f6f6d] hover:underline"
            >
              <FileText class="h-4 w-4" />
              Buka Halaman Cetak Invoice Lengkap &rarr;
            </NuxtLink>

            <button
              v-if="selectedInvoice.paymentStatus !== 'LUNAS'"
              type="button"
              :disabled="verifyingId === selectedInvoice.id"
              class="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-emerald-700 cursor-pointer"
              @click="handleVerifyPayment(selectedInvoice)"
            >
              <CheckCircle2 class="h-4 w-4" />
              Verifikasi LUNAS Sekarang
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

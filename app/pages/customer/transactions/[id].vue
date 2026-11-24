<script setup lang="ts">
import {
  BadgeCheck,
  BedDouble,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Download,
  LayoutDashboard,
  MapPin,
  Printer,
  QrCode,
  ShieldCheck,
  Sparkles,
  Users
} from 'lucide-vue-next'
import type { CustomerBookingRecord } from '#shared/types/booking'
import { formatDateID, formatRupiah } from '~/utils/format'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth']
})

const route = useRoute()
const id = computed(() => String(route.params.id || ''))
const justPaidQris = computed(() => route.query.paid === '1')

const { data } = await useFetch<{ booking: CustomerBookingRecord }>(() => `/api/bookings/${id.value}`)
const booking = computed(() => data.value?.booking ?? null)

useSeoMeta({
  title: () => (booking.value ? `Bukti Pembayaran ${booking.value.invoiceNumber} — JejakNusa` : 'Bukti Pembayaran — JejakNusa')
})

const bookingTypeLabel = computed(() => {
  if (booking.value?.bookingType === 'trip+hotel') return 'PAKET GABUNGAN TRIP + HOTEL'
  if (booking.value?.bookingType === 'hotel') return 'RESERVASI PENGINAPAN / HOTEL'
  return 'BUKTI PEMBAYARAN OPEN TRIP'
})

function printInvoice() {
  if (typeof window !== 'undefined') {
    window.print()
  }
}

function downloadReceiptHtml() {
  if (!booking.value || typeof document === 'undefined') return
  const b = booking.value
  const participantsHtml = b.participants?.length
    ? `<h3 style="margin-top:20px;font-size:14px;color:#103f3e;">Manifest Peserta Terdaftar (Bukti Sah Check-in &amp; Simaksi)</h3>
  <table>
    <thead><tr><th>No</th><th>Nama Lengkap</th><th>Nomor NIK / Paspor</th><th>Kontak Darurat</th><th>Waiver</th></tr></thead>
    <tbody>
      ${b.participants
        .map(
          (p, i) =>
            `<tr><td>${i + 1}</td><td><strong>${p.fullName}</strong></td><td style="font-family:monospace;">${p.idNumber}</td><td>${p.emergencyContact}</td><td>${p.agreementAccepted ? 'Disetujui' : '-'}</td></tr>`
        )
        .join('')}
    </tbody>
  </table>`
    : ''

  const html = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>Bukti Pembayaran ${b.invoiceNumber} — JejakNusa</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #162221; padding: 28px; max-width: 760px; margin: 0 auto; }
  .header { background: #103f3e; color: #fff; padding: 20px 24px; border-radius: 14px; display: flex; justify-content: space-between; align-items: center; }
  .badge { background: #34d399; color: #062925; padding: 6px 14px; border-radius: 999px; font-weight: 800; font-size: 12px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 20px 0; }
  .card { border: 1px solid #d9d4c7; border-radius: 12px; padding: 14px; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 13px; }
  th, td { border-bottom: 1px solid #e5dfd2; padding: 10px 8px; text-align: left; }
  th { background: #f4f1ea; }
  .right { text-align: right; }
  .total { font-weight: 800; font-size: 16px; color: #1f6f6d; background: #eef7f6; }
  .footer { margin-top: 22px; font-size: 12px; color: #4a5f5d; border-top: 1px dashed #c7d7d4; padding-top: 12px; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div style="font-size:12px;opacity:.85;">JEJAKNUSA INDONESIA — BUKTI PEMBAYARAN RESMI</div>
      <div style="font-size:22px;font-weight:800;margin-top:4px;">${b.invoiceNumber}</div>
      <div style="font-size:12px;margin-top:4px;">Dibuat: ${b.createdAt}${b.paidAt ? ` • Dibayar: ${b.paidAt}` : ''}</div>
    </div>
    <div class="badge">STATUS: ${b.paymentStatus}</div>
  </div>
  <div class="grid">
    <div class="card">
      <strong>Detail Layanan</strong><br/>
      ${b.tripTitle}<br/>
      Lokasi: ${b.location}<br/>
      Tanggal: ${formatDateID(b.departureDate)}<br/>
      Pemandu / Partner: ${b.guideName}
      ${b.hotelName ? `<br/><br/><strong>Hotel:</strong> ${b.hotelName} (${b.hotelRoomName}, ${b.hotelRooms} kmr x ${b.hotelNights} mlm)` : ''}
    </div>
    <div class="card">
      <strong>Data Pemesan &amp; QRIS</strong><br/>
      Nama: ${b.leaderName}<br/>
      WhatsApp: ${b.customerPhone}<br/>
      Email: ${b.customerEmail}<br/>
      Peserta/Tamu: ${b.participantsCount} orang<br/>
      Metode: ${b.paymentMethod}<br/>
      Referensi: ${b.paymentReference}
    </div>
  </div>
  <table>
    <thead><tr><th>Komponen Biaya</th><th class="right">Nominal</th></tr></thead>
    <tbody>
      ${b.packageSubtotal > 0 ? `<tr><td>Paket Open Trip (${b.participantsCount} org)</td><td class="right">${formatRupiah(b.packageSubtotal)}</td></tr>` : ''}
      ${b.hotelSubtotal > 0 ? `<tr><td>Penginapan ${b.hotelName} (${b.hotelRooms} kmr x ${b.hotelNights} mlm)</td><td class="right">${formatRupiah(b.hotelSubtotal)}</td></tr>` : ''}
      ${b.shuttleFee > 0 ? `<tr><td>Shuttle Antar-Jemput</td><td class="right">${formatRupiah(b.shuttleFee)}</td></tr>` : ''}
      ${b.insuranceFee > 0 ? `<tr><td>Asuransi Perjalanan Instan</td><td class="right">${formatRupiah(b.insuranceFee)}</td></tr>` : ''}
      ${b.carbonOffsetFee > 0 ? `<tr><td>Donasi Carbon Offset</td><td class="right">${formatRupiah(b.carbonOffsetFee)}</td></tr>` : ''}
      <tr><td>Biaya Layanan Platform</td><td class="right">${formatRupiah(b.serviceFee)}</td></tr>
      <tr class="total"><td>Total Tagihan</td><td class="right">${formatRupiah(b.totalAmount)}</td></tr>
      <tr><td><strong>Nominal Telah Dibayar (${b.paymentScheme})</strong></td><td class="right"><strong>${formatRupiah(b.paidAmount)}</strong></td></tr>
    </tbody>
  </table>
  ${participantsHtml}
  <div class="footer">
    Catatan: ${b.specialNotes}<br/>
    Dokumen ini sah sebagai bukti pembayaran resmi JejakNusa (Kode Booking: ${b.bookingCode}).
  </div>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Bukti-Pembayaran-${b.invoiceNumber}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

onMounted(() => {
  if (route.query.autoprint === '1' && typeof window !== 'undefined') {
    setTimeout(() => {
      window.print()
    }, 350)
  }
})
</script>

<template>
  <div v-if="booking" class="max-w-4xl mx-auto space-y-6 print:max-w-none print:space-y-0">
    <!-- Celebratory Post-QRIS Banner (Hidden when printing) -->
    <div
      v-if="justPaidQris"
      class="rounded-[24px] bg-emerald-50 border-2 border-emerald-300 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden"
    >
      <div class="flex items-start gap-3">
        <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow">
          <Sparkles class="h-5 w-5" />
        </span>
        <div>
          <p class="text-sm sm:text-base font-extrabold text-emerald-950">
            Pembayaran QRIS Berhasil Dikonfirmasi!
          </p>
          <p class="text-xs text-emerald-800 mt-0.5">
            Bukti pembayaran resmi Anda (<strong>{{ booking.invoiceNumber }}</strong>) sudah terbit dan langsung tersinkronisasi ke Pemandu Lokal &amp; Admin. Klik tombol di kanan untuk mencetak atau menyimpan bukti.
          </p>
        </div>
      </div>

      <button
        type="button"
        class="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-xs sm:text-sm font-extrabold text-white shadow-md hover:bg-emerald-700 transition cursor-pointer shrink-0"
        @click="printInvoice"
      >
        <Printer class="h-4 w-4" />
        Cetak Bukti Pembayaran
      </button>
    </div>

    <!-- Action Bar (Hidden when printing) -->
    <div class="flex flex-wrap items-center justify-between gap-3 print:hidden">
      <div class="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3.5 py-1.5 text-xs font-extrabold text-emerald-800">
        <CheckCircle2 class="h-4 w-4" />
        Bukti Pembayaran Resmi JejakNusa
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-full bg-[#1f6f6d] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-[#175957] transition cursor-pointer"
          @click="printInvoice"
        >
          <Printer class="h-4 w-4" />
          Cetak Bukti / Simpan PDF
        </button>

        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-full border border-[#1f6f6d] bg-white px-4 py-2.5 text-xs font-extrabold text-[#1f6f6d] hover:bg-[#eef7f6] transition cursor-pointer"
          @click="downloadReceiptHtml"
        >
          <Download class="h-4 w-4" />
          Unduh Bukti
        </button>

        <NuxtLink
          to="/customer/dashboard"
          class="inline-flex items-center gap-1.5 rounded-full border border-[#dfd8c8] bg-white px-4 py-2.5 text-xs font-bold text-[#162221] hover:border-[#1f6f6d] transition"
        >
          <LayoutDashboard class="h-4 w-4" />
          Dashboard Saya
        </NuxtLink>
      </div>
    </div>

    <!-- Official Printable Payment Receipt / Invoice Card -->
    <article class="rounded-[32px] bg-white border border-[#e5dfd2] shadow-lg overflow-hidden print:rounded-none print:shadow-none print:border-stone-300">
      <div class="teal-card px-6 sm:px-8 py-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="space-y-1">
          <div class="flex flex-wrap items-center gap-2">
            <Compass class="h-5 w-5 text-amber-300" />
            <span class="font-editorial text-xl font-bold tracking-tight">JejakNusa</span>
            <span class="rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold">{{ bookingTypeLabel }}</span>
          </div>
          <h1 class="font-mono text-xl sm:text-2xl font-extrabold tracking-wide">
            {{ booking.invoiceNumber }}
          </h1>
          <p class="text-xs text-teal-100/90">
            Dibuat: {{ booking.createdAt }}
            <span v-if="booking.paidAt"> &bull; Dibayar: {{ booking.paidAt }}</span>
          </p>
        </div>

        <div class="sm:text-right space-y-1">
          <span
            class="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold"
            :class="
              booking.paymentStatus === 'LUNAS'
                ? 'bg-emerald-400 text-[#0d2e2b]'
                : booking.paymentStatus === 'DP 30% Lunas'
                  ? 'bg-amber-300 text-[#162221]'
                  : 'bg-orange-500 text-white'
            "
          >
            <CheckCircle2 v-if="booking.paymentStatus !== 'MENUNGGU PEMBAYARAN'" class="h-3.5 w-3.5" />
            <Clock v-else class="h-3.5 w-3.5" />
            STATUS: {{ booking.paymentStatus }}
          </span>
          <p class="text-[11px] font-mono text-teal-100/80">Kode Booking: {{ booking.bookingCode }}</p>
        </div>
      </div>

      <div class="p-6 sm:p-8 space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div class="rounded-2xl bg-[#fbf9f5] border border-[#e8e2d5] p-4 space-y-2">
            <p class="text-[11px] font-extrabold uppercase tracking-wider text-[#1f6f6d]">
              {{ booking.bookingType === 'hotel' ? 'Detail Penginapan / Hotel' : 'Detail Destinasi & Pemandu Lokal' }}
            </p>
            <h2 class="font-editorial text-lg font-bold text-[#162221]">{{ booking.tripTitle }}</h2>
            <p class="text-xs text-[#455553] flex items-center gap-1.5">
              <MapPin class="h-3.5 w-3.5 text-[#1f6f6d]" />
              {{ booking.location }}
            </p>
            <p class="text-xs text-[#455553] flex items-center gap-1.5">
              <Calendar class="h-3.5 w-3.5 text-[#1f6f6d]" />
              {{ booking.bookingType === 'hotel' ? 'Check-in' : 'Keberangkatan' }}: <strong>{{ formatDateID(booking.departureDate) }}</strong>
            </p>
            <p class="text-xs text-[#162221] font-bold flex items-center gap-1.5 pt-1 border-t border-[#e8e2d5]">
              <BadgeCheck class="h-4 w-4 text-[#1f6f6d]" />
              {{ booking.guideName }} ({{ booking.guideCertification }})
            </p>
          </div>

          <div class="rounded-2xl bg-[#fbf9f5] border border-[#e8e2d5] p-4 space-y-2 text-xs">
            <p class="text-[11px] font-extrabold uppercase tracking-wider text-[#1f6f6d]">
              Data Pemesan &amp; Pembayaran QRIS
            </p>
            <div class="flex justify-between gap-2">
              <span class="text-[#5c6b69]">Nama Pemesan</span>
              <span class="font-extrabold text-[#162221]">{{ booking.leaderName }}</span>
            </div>
            <div class="flex justify-between gap-2">
              <span class="text-[#5c6b69]">WhatsApp / Kontak</span>
              <span class="font-bold text-[#162221]">{{ booking.customerPhone }}</span>
            </div>
            <div class="flex justify-between gap-2">
              <span class="text-[#5c6b69]">Email</span>
              <span class="font-bold text-[#162221] truncate">{{ booking.customerEmail }}</span>
            </div>
            <div class="flex justify-between gap-2">
              <span class="text-[#5c6b69]">Jumlah Peserta / Tamu</span>
              <span class="font-extrabold text-[#162221] inline-flex items-center gap-1">
                <Users class="h-3.5 w-3.5 text-[#1f6f6d]" />
                {{ booking.participantsCount }} Orang
              </span>
            </div>
            <div class="flex justify-between gap-2 pt-1 border-t border-[#e8e2d5]">
              <span class="text-[#5c6b69]">Metode Bayar</span>
              <span class="font-extrabold text-[#1f6f6d] inline-flex items-center gap-1">
                <QrCode class="h-3.5 w-3.5" />
                {{ booking.paymentMethod }}
              </span>
            </div>
            <div class="flex justify-between gap-2">
              <span class="text-[#5c6b69]">No. Referensi</span>
              <span class="font-mono font-bold text-[#162221]">{{ booking.paymentReference }}</span>
            </div>
          </div>
        </div>

        <!-- Dedicated Hotel Detail Block when Hotel is Included or Hotel-Only -->
        <div
          v-if="booking.hotelName"
          class="rounded-2xl bg-[#eef7f6] border border-[#c7e4e0] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
        >
          <div class="space-y-1">
            <p class="font-extrabold text-[#175957] flex items-center gap-1.5">
              <BedDouble class="h-4 w-4" />
              Rincian Penginapan: {{ booking.hotelName }}
            </p>
            <p class="text-[#355250]">
              Tipe Kamar: <strong>{{ booking.hotelRoomName }}</strong> &bull; {{ booking.hotelRooms }} kamar &times; {{ booking.hotelNights }} malam
            </p>
            <p v-if="booking.hotelCheckIn" class="text-[#4a5f5d]">
              Check-in {{ formatDateID(booking.hotelCheckIn) }} — Check-out {{ formatDateID(booking.hotelCheckOut || booking.hotelCheckIn) }}
            </p>
          </div>
          <div class="sm:text-right">
            <span class="block text-[10px] font-bold text-[#4a5f5d]">Subtotal Penginapan</span>
            <span class="text-base font-extrabold text-[#1f6f6d]">{{ formatRupiah(booking.hotelSubtotal) }}</span>
          </div>
        </div>

        <div class="rounded-2xl bg-amber-50/70 border border-amber-200/80 px-4 py-3 text-xs text-amber-950">
          <strong>Catatan Khusus:</strong> {{ booking.specialNotes }}
        </div>

        <!-- Registered Participants Manifest (Valid Proof for Hotel Check-in & Trail Registration) -->
        <div
          v-if="booking.participants?.length"
          class="rounded-2xl border border-[#c7e4e0] bg-[#eef7f6]/45 overflow-hidden"
        >
          <div class="px-4 py-3 bg-[#eef7f6] border-b border-[#c7e4e0] flex flex-wrap items-center justify-between gap-2">
            <p class="text-xs font-extrabold uppercase tracking-wider text-[#175957] flex items-center gap-1.5">
              <Users class="h-4 w-4" />
              Daftar Peserta Terdaftar — Bukti Sah Check-in &amp; Registrasi Pos ({{ booking.participants.length }} Orang)
            </p>
            <span
              v-if="booking.agreementAccepted"
              class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800"
            >
              <ShieldCheck class="h-3 w-3" /> Waiver Keselamatan &amp; Menginap Disetujui
            </span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-white/80 text-[#455553] text-[10px] uppercase tracking-wider">
                <tr>
                  <th class="px-4 py-2.5 font-extrabold">No</th>
                  <th class="px-4 py-2.5 font-extrabold">Nama Lengkap (Sesuai KTP/Paspor)</th>
                  <th class="px-4 py-2.5 font-extrabold">Nomor NIK / Paspor</th>
                  <th class="px-4 py-2.5 font-extrabold">Kontak Darurat</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#d9ebe8] bg-white/70">
                <tr v-for="(p, pIdx) in booking.participants" :key="pIdx">
                  <td class="px-4 py-2.5 font-bold text-[#5c6b69]">{{ pIdx + 1 }}</td>
                  <td class="px-4 py-2.5 font-extrabold text-[#162221]">{{ p.fullName }}</td>
                  <td class="px-4 py-2.5 font-mono font-bold text-[#1f6f6d]">{{ p.idNumber }}</td>
                  <td class="px-4 py-2.5 text-[#455553]">{{ p.emergencyContact }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Itemized Cost Table -->
        <div class="overflow-x-auto rounded-2xl border border-[#e5dfd2]">
          <table class="w-full text-left text-xs sm:text-sm">
            <thead class="bg-[#f4f1ea] text-[#455553] text-[11px] uppercase tracking-wider">
              <tr>
                <th class="px-4 py-3 font-extrabold">Komponen Biaya</th>
                <th class="px-4 py-3 font-extrabold text-center">Kuantitas</th>
                <th class="px-4 py-3 font-extrabold text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#ebe5d8]">
              <tr v-if="booking.packageSubtotal > 0">
                <td class="px-4 py-3 font-bold text-[#162221]">Paket Open Trip</td>
                <td class="px-4 py-3 text-center text-[#5c6b69]">{{ booking.participantsCount }} org</td>
                <td class="px-4 py-3 text-right font-bold text-[#162221]">{{ formatRupiah(booking.packageSubtotal) }}</td>
              </tr>
              <tr v-if="booking.hotelSubtotal > 0">
                <td class="px-4 py-3 font-bold text-[#162221]">
                  Penginapan: {{ booking.hotelName }} ({{ booking.hotelRoomName }})
                </td>
                <td class="px-4 py-3 text-center text-[#5c6b69]">{{ booking.hotelRooms }} kmr &times; {{ booking.hotelNights }} mlm</td>
                <td class="px-4 py-3 text-right font-bold text-[#1f6f6d]">{{ formatRupiah(booking.hotelSubtotal) }}</td>
              </tr>
              <tr v-if="booking.shuttleFee > 0">
                <td class="px-4 py-3 text-[#3c4a48]">Shuttle Antar-Jemput Hotel &harr; Basecamp</td>
                <td class="px-4 py-3 text-center text-[#5c6b69]">1 paket</td>
                <td class="px-4 py-3 text-right font-semibold text-[#162221]">{{ formatRupiah(booking.shuttleFee) }}</td>
              </tr>
              <tr v-if="booking.insuranceFee > 0">
                <td class="px-4 py-3 text-[#3c4a48]">Asuransi Perjalanan Instan</td>
                <td class="px-4 py-3 text-center text-[#5c6b69]">{{ booking.participantsCount }} org</td>
                <td class="px-4 py-3 text-right font-semibold text-[#162221]">{{ formatRupiah(booking.insuranceFee) }}</td>
              </tr>
              <tr v-if="booking.carbonOffsetFee > 0">
                <td class="px-4 py-3 text-[#3c4a48]">Donasi Carbon Offset &amp; Konservasi Lokal</td>
                <td class="px-4 py-3 text-center text-[#5c6b69]">1 paket</td>
                <td class="px-4 py-3 text-right font-semibold text-emerald-700">{{ formatRupiah(booking.carbonOffsetFee) }}</td>
              </tr>
              <tr>
                <td class="px-4 py-3 text-[#3c4a48]">Biaya Layanan Platform JejakNusa</td>
                <td class="px-4 py-3 text-center text-[#5c6b69]">1 transaksi</td>
                <td class="px-4 py-3 text-right font-semibold text-[#162221]">{{ formatRupiah(booking.serviceFee) }}</td>
              </tr>
            </tbody>
            <tfoot class="bg-[#eef7f6]">
              <tr>
                <td colspan="2" class="px-4 py-3.5 font-extrabold text-[#162221]">Total Tagihan Transaksi</td>
                <td class="px-4 py-3.5 text-right text-lg font-extrabold text-[#1f6f6d]">{{ formatRupiah(booking.totalAmount) }}</td>
              </tr>
              <tr class="border-t border-[#c7e4e0]">
                <td colspan="2" class="px-4 py-3 font-extrabold text-emerald-800">Nominal Telah Dibayar ({{ booking.paymentScheme }})</td>
                <td class="px-4 py-3 text-right font-extrabold text-emerald-800">{{ formatRupiah(booking.paidAmount) }}</td>
              </tr>
              <tr v-if="booking.remainingAmount > 0" class="border-t border-[#c7e4e0] bg-amber-50">
                <td colspan="2" class="px-4 py-2.5 font-bold text-amber-900">Sisa Pelunasan (Jatuh Tempo H-7)</td>
                <td class="px-4 py-2.5 text-right font-extrabold text-orange-700">{{ formatRupiah(booking.remainingAmount) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Official Receipt Stamp Footer -->
        <div class="rounded-2xl border border-dashed border-[#1f6f6d]/35 bg-[#fbf9f5] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div class="space-y-0.5">
            <p class="inline-flex items-center gap-1.5 font-extrabold text-[#175957]">
              <ShieldCheck class="h-4 w-4 text-[#1f6f6d]" />
              TERVERIFIKASI QRIS — BUKTI PEMBAYARAN SAH JEJAKNUSA
            </p>
            <p class="text-[11px] text-[#5c6b69]">
              Tunjukkan bukti cetak / PDF ini saat registrasi ulang di basecamp atau resepsionis penginapan.
            </p>
          </div>
          <div class="sm:text-right font-mono text-[11px] text-[#455553]">
            <span class="block font-bold">{{ booking.invoiceNumber }}</span>
            <span>Ref: {{ booking.paymentReference }}</span>
          </div>
        </div>
      </div>
    </article>
  </div>
</template>

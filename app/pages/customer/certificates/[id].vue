<script setup lang="ts">
import {
  Award,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  Compass,
  Download,
  Edit3,
  FileText,
  LayoutDashboard,
  Leaf,
  MapPin,
  Printer,
  ShieldCheck,
  Sparkles,
  Stamp,
  Trophy,
  UserCheck
} from 'lucide-vue-next'
import type { CustomerBookingRecord } from '#shared/types/booking'
import { formatDateID } from '~/utils/format'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth']
})

const route = useRoute()
const id = computed(() => String(route.params.id || ''))
const { user } = useAuth()
const { claimTripCertificate } = useMarketplace()

const { data, refresh } = await useFetch<{ booking: CustomerBookingRecord }>(
  () => `/api/bookings/${id.value}`
)
const booking = computed(() => data.value?.booking ?? null)

useSeoMeta({
  title: () =>
    booking.value?.certificateClaimed
      ? `Sertifikat ${booking.value.certificateId} — JejakNusa`
      : 'Klaim Sertifikat Trip — JejakNusa',
  description: 'Klaim, cetak PDF, atau unduh Sertifikat Penyelesaian Ekspedisi resmi dari JejakNusa.'
})

const holderName = ref('')
const showRenameBox = ref(false)
const claiming = ref(false)
const claimError = ref('')
const justClaimedReward = ref<{ pointsAwarded: number; unlockedBadges: string[] } | null>(null)

watch(
  [booking, user],
  ([bk, u]) => {
    if (!holderName.value && bk) {
      holderName.value = bk.certificateHolderName || u?.name || bk.leaderName || ''
    }
  },
  { immediate: true }
)

const isHotelOnly = computed(() => booking.value?.bookingType === 'hotel')
const isUnpaid = computed(() => booking.value?.paymentStatus === 'MENUNGGU PEMBAYARAN')
const isTripFinished = computed(() => booking.value?.bookingStatus === 'Selesai')
const isSentByAdmin = computed(() => Boolean(booking.value?.certificateSent))
const canClaim = computed(() =>
  Boolean(booking.value && !isHotelOnly.value && !isUnpaid.value && isTripFinished.value && isSentByAdmin.value)
)

async function handleClaimCertificate() {
  if (!booking.value) return
  claimError.value = ''
  claiming.value = true
  try {
    const res = await claimTripCertificate(booking.value.id, holderName.value.trim())
    if (res.passportReward && res.passportReward.pointsAwarded > 0) {
      justClaimedReward.value = res.passportReward
    }
    showRenameBox.value = false
    await refresh()
  } catch (err: unknown) {
    if (err && typeof err === 'object') {
      const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
      claimError.value = e.data?.statusMessage || e.statusMessage || 'Gagal mengklaim sertifikat.'
    } else {
      claimError.value = 'Gagal mengklaim sertifikat.'
    }
  } finally {
    claiming.value = false
  }
}

function printCertificate() {
  if (typeof window !== 'undefined') {
    window.print()
  }
}

function downloadCertificateHtml() {
  if (!booking.value || typeof document === 'undefined') return
  const b = booking.value
  const recipient = b.certificateHolderName || b.leaderName
  const certId = b.certificateId || `CERT-JN-${b.bookingCode}`
  const issuedAt = b.certificateClaimedAt || b.completedAt || b.departureDate

  const html = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>Sertifikat Penyelesaian ${certId} — JejakNusa</title>
<style>
  @page { size: landscape; margin: 12mm; }
  body {
    margin: 0;
    padding: 28px;
    background: #f3efe6;
    font-family: Georgia, "Times New Roman", serif;
    color: #162221;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    box-sizing: border-box;
  }
  .cert {
    width: 1020px;
    background: #fdfbf6;
    border: 10px solid #103f3e;
    padding: 16px;
    box-shadow: 0 20px 50px rgba(16, 63, 62, 0.18);
    box-sizing: border-box;
  }
  .inner {
    border: 2px solid #c9973b;
    padding: 40px 52px;
    text-align: center;
    position: relative;
  }
  .brand {
    font-family: Arial, Helvetica, sans-serif;
    letter-spacing: 3px;
    font-size: 12px;
    font-weight: 800;
    color: #1f6f6d;
    text-transform: uppercase;
  }
  .serial {
    display: inline-block;
    margin-top: 8px;
    padding: 5px 14px;
    border-radius: 999px;
    background: #eef7f6;
    border: 1px solid #b8dcd7;
    font-family: "Courier New", monospace;
    font-size: 12px;
    font-weight: 700;
    color: #103f3e;
  }
  h1 {
    margin: 22px 0 8px;
    font-size: 34px;
    letter-spacing: 1.5px;
    color: #103f3e;
  }
  .sub {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 12px;
    letter-spacing: 2.5px;
    color: #6b7b79;
    text-transform: uppercase;
    margin-bottom: 18px;
  }
  .name {
    font-size: 44px;
    font-weight: 700;
    color: #162221;
    margin: 6px 0 10px;
    border-bottom: 2px solid #d4a64a;
    display: inline-block;
    padding: 0 28px 8px;
  }
  .desc {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 14px;
    color: #425452;
    max-width: 720px;
    margin: 14px auto;
    line-height: 1.6;
  }
  .trip-box {
    background: #eef7f6;
    border: 1px solid #c7e4e0;
    border-radius: 16px;
    padding: 16px 24px;
    max-width: 720px;
    margin: 18px auto 26px;
    font-family: Arial, Helvetica, sans-serif;
  }
  .trip-title {
    font-family: Georgia, serif;
    font-size: 22px;
    font-weight: 700;
    color: #103f3e;
    margin: 0 0 6px;
  }
  .trip-meta {
    font-size: 13px;
    color: #355250;
  }
  .footer {
    display: grid;
    grid-template-columns: 1fr 160px 1fr;
    gap: 24px;
    align-items: end;
    margin-top: 28px;
    font-family: Arial, Helvetica, sans-serif;
  }
  .sig-line {
    border-bottom: 1px solid #103f3e;
    padding-bottom: 6px;
    margin-bottom: 6px;
    font-family: Georgia, serif;
    font-style: italic;
    font-size: 20px;
    color: #103f3e;
  }
  .sig-name { font-size: 13px; font-weight: 700; color: #162221; }
  .sig-role { font-size: 11px; color: #5c6b69; }
  .seal {
    width: 120px;
    height: 120px;
    margin: 0 auto;
    border-radius: 999px;
    border: 3px double #c9973b;
    background: #103f3e;
    color: #fef3c7;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1px;
  }
</style>
</head>
<body>
  <div class="cert">
    <div class="inner">
      <div class="brand">JEJAKNUSA INDONESIA &bull; OFFICIAL EXPEDITION CERTIFICATE</div>
      <div class="serial">NO. SERTIFIKAT: ${certId}</div>
      <h1>SERTIFIKAT PENYELESAIAN EKSPEDISI</h1>
      <div class="sub">Diberikan Dengan Bangga Kepada</div>
      <div class="name">${recipient}</div>
      <p class="desc">
        Atas partisipasi aktif, semangat petualangan, dan keberhasilannya menyelesaikan seluruh rangkaian kegiatan Open Trip dengan standar keselamatan &amp; pelestarian alam JejakNusa pada ekspedisi:
      </p>
      <div class="trip-box">
        <div class="trip-title">${b.tripTitle}</div>
        <div class="trip-meta">
          Lokasi: ${b.location} &bull; Jadwal Ekspedisi: ${formatDateID(b.departureDate)} &bull; Peserta: ${b.participantsCount} Orang
        </div>
      </div>
      <div class="footer">
        <div>
          <div class="sig-line">${b.guideName}</div>
          <div class="sig-name">${b.guideName}</div>
          <div class="sig-role">Pemandu Lokal (${b.guideCertification})</div>
        </div>
        <div class="seal">
          <span>TERVERIFIKASI</span>
          <span style="font-size:14px;margin:4px 0;">JEJAKNUSA</span>
          <span>${issuedAt.slice(0, 10)}</span>
        </div>
        <div>
          <div class="sig-line">JejakNusa Ops</div>
          <div class="sig-name">Direktur Ekspedisi JejakNusa</div>
          <div class="sig-role">Kode Booking: ${b.bookingCode} &bull; Invoice: ${b.invoiceNumber}</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Sertifikat-JejakNusa-${certId}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6 print:max-w-none print:space-y-0">
    <!-- Not Found State -->
    <div
      v-if="!booking"
      class="rounded-[28px] bg-white border border-[#e5dfd2] p-10 text-center space-y-4"
    >
      <Award class="h-10 w-10 text-[#1f6f6d] mx-auto" />
      <h1 class="font-editorial text-2xl font-bold text-[#162221]">Data Transaksi Tidak Ditemukan</h1>
      <p class="text-xs sm:text-sm text-[#5c6b69]">
        Pastikan Anda mengakses sertifikat dari transaksi Open Trip yang terdaftar di akun Anda.
      </p>
      <NuxtLink
        to="/customer/dashboard"
        class="inline-flex items-center gap-2 rounded-full bg-[#1f6f6d] px-5 py-2.5 text-xs font-extrabold text-white"
      >
        Kembali ke Dashboard
      </NuxtLink>
    </div>

    <!-- Hotel-Only Notice -->
    <div
      v-else-if="isHotelOnly"
      class="rounded-[28px] bg-white border border-amber-200 p-8 sm:p-10 text-center space-y-4"
    >
      <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
        <Award class="h-7 w-7" />
      </span>
      <h1 class="font-editorial text-2xl font-bold text-[#162221]">
        Sertifikat Khusus Kegiatan Open Trip
      </h1>
      <p class="text-xs sm:text-sm text-[#5c6b69] max-w-xl mx-auto">
        Transaksi <strong>{{ booking.invoiceNumber }}</strong> merupakan reservasi <strong>Hotel Saja</strong>. Sertifikat penyelesaian ekspedisi resmi dan stempel Adventure Passport diterbitkan untuk pesanan <strong>Open Trip</strong> maupun paket <strong>Trip + Hotel</strong>.
      </p>
      <div class="flex flex-wrap justify-center gap-2.5">
        <NuxtLink
          :to="`/customer/transactions/${booking.id}`"
          class="inline-flex items-center gap-1.5 rounded-full bg-[#1f6f6d] px-5 py-2.5 text-xs font-extrabold text-white"
        >
          <FileText class="h-4 w-4" />
          Lihat Bukti Pembayaran Hotel
        </NuxtLink>
        <NuxtLink
          to="/trips"
          class="inline-flex items-center gap-1.5 rounded-full border border-[#1f6f6d] bg-white px-5 py-2.5 text-xs font-extrabold text-[#1f6f6d]"
        >
          <Compass class="h-4 w-4" />
          Jelajahi Open Trip
        </NuxtLink>
      </div>
    </div>

    <!-- Unpaid Notice -->
    <div
      v-else-if="isUnpaid"
      class="rounded-[28px] bg-white border border-orange-200 p-8 sm:p-10 text-center space-y-4"
    >
      <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
        <ShieldCheck class="h-7 w-7" />
      </span>
      <h1 class="font-editorial text-2xl font-bold text-[#162221]">
        Pembayaran Belum Dikonfirmasi
      </h1>
      <p class="text-xs sm:text-sm text-[#5c6b69] max-w-xl mx-auto">
        Transaksi <strong>{{ booking.invoiceNumber }}</strong> masih berstatus <strong>MENUNGGU PEMBAYARAN</strong>. Selesaikan pembayaran QRIS terlebih dahulu untuk dapat mengklaim Sertifikat Penyelesaian Trip.
      </p>
      <NuxtLink
        :to="`/customer/transactions/${booking.id}`"
        class="inline-flex items-center gap-1.5 rounded-full bg-[#1f6f6d] px-5 py-2.5 text-xs font-extrabold text-white"
      >
        Lihat Status Pembayaran
      </NuxtLink>
    </div>

    <!-- Waiting for Admin to Mark Trip Completed -->
    <div
      v-else-if="!isTripFinished && !booking.certificateClaimed"
      class="rounded-[28px] bg-white border border-[#e5dfd2] p-8 sm:p-10 text-center space-y-4"
    >
      <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef7f6] text-[#1f6f6d]">
        <Compass class="h-7 w-7" />
      </span>
      <h1 class="font-editorial text-2xl font-bold text-[#162221]">
        Menunggu Konfirmasi Selesai Trip dari Admin
      </h1>
      <p class="text-xs sm:text-sm text-[#5c6b69] max-w-xl mx-auto">
        Kegiatan <strong>{{ booking.tripTitle }}</strong> ({{ booking.invoiceNumber }}) saat ini masih berstatus <strong>{{ booking.bookingStatus }}</strong>. Setelah kegiatan trip selesai, <strong>Admin JejakNusa</strong> akan menandai trip Anda sebagai <em>Sudah Selesai</em> dan mengirimkan sertifikat resmi ke akun Anda.
      </p>
      <div class="flex flex-wrap justify-center gap-2.5">
        <NuxtLink
          to="/customer/dashboard"
          class="inline-flex items-center gap-1.5 rounded-full bg-[#1f6f6d] px-5 py-2.5 text-xs font-extrabold text-white"
        >
          <LayoutDashboard class="h-4 w-4" />
          Kembali ke Dashboard
        </NuxtLink>
      </div>
    </div>

    <!-- Trip Marked Completed by Admin, Waiting for Admin to Send Certificate -->
    <div
      v-else-if="isTripFinished && !isSentByAdmin && !booking.certificateClaimed"
      class="rounded-[28px] bg-white border border-amber-200 p-8 sm:p-10 text-center space-y-4"
    >
      <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
        <Award class="h-7 w-7" />
      </span>
      <h1 class="font-editorial text-2xl font-bold text-[#162221]">
        Trip Selesai — Menunggu Pengiriman Sertifikat dari Admin
      </h1>
      <p class="text-xs sm:text-sm text-[#5c6b69] max-w-xl mx-auto">
        Admin telah menandai kegiatan <strong>{{ booking.tripTitle }}</strong> Anda sebagai <strong>Sudah Selesai</strong><span v-if="booking.completedAt"> ({{ booking.completedAt }})</span>. Mohon tunggu <strong>Admin mengirimkan sertifikat</strong> ke akun Anda agar tombol klaim aktif.
      </p>
      <NuxtLink
        to="/customer/dashboard"
        class="inline-flex items-center gap-1.5 rounded-full bg-[#1f6f6d] px-5 py-2.5 text-xs font-extrabold text-white"
      >
        <LayoutDashboard class="h-4 w-4" />
        Kembali ke Dashboard
      </NuxtLink>
    </div>

    <!-- STEP A: Claim Form (Sent by Admin, Not Yet Claimed) -->
    <section
      v-else-if="canClaim && !booking.certificateClaimed"
      class="rounded-[32px] bg-white border border-[#e5dfd2] overflow-hidden shadow-lg"
    >
      <div class="teal-card px-6 sm:px-8 py-7 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="space-y-1.5">
          <span class="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-amber-200">
            <Award class="h-3.5 w-3.5" />
            Sertifikat Dikirim oleh Admin &bull; Siap Diklaim
          </span>
          <h1 class="font-editorial text-2xl sm:text-3xl font-bold">
            {{ booking.tripTitle }}
          </h1>
          <p class="text-xs sm:text-sm text-teal-100/90">
            {{ booking.location }} &bull; Jadwal {{ formatDateID(booking.departureDate) }} &bull; Pemandu: {{ booking.guideName }}
          </p>
        </div>

        <span class="inline-flex items-center gap-1.5 self-start md:self-center rounded-full bg-emerald-400 px-3.5 py-1.5 text-xs font-extrabold text-[#0d2e2b]">
          <CheckCircle2 class="h-4 w-4" />
          Dikirim Admin ({{ booking.certificateId }})
        </span>
      </div>

      <div class="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div class="lg:col-span-7 space-y-5">
          <div class="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-950 space-y-1">
            <p class="font-extrabold text-emerald-900">
              Pesan dari {{ booking.certificateSentBy || 'Admin JejakNusa' }} ({{ booking.certificateSentAt }})
            </p>
            <p class="leading-relaxed">
              {{ booking.certificateAdminNote || 'Kegiatan trip Anda telah dinyatakan selesai. Silakan klaim sertifikat resmi Anda.' }}
            </p>
          </div>

          <div class="space-y-1.5">
            <h2 class="font-editorial text-xl font-bold text-[#162221]">
              Konfirmasi Nama pada Sertifikat Resmi
            </h2>
            <p class="text-xs sm:text-sm text-[#5c6b69]">
              Pastikan penulisan nama lengkap Anda sudah benar. Saat Anda menekan tombol klaim, sertifikat bernomor seri resmi akan langsung diterbitkan beserta +500 poin &amp; stempel Adventure Passport.
            </p>
          </div>

          <div
            v-if="claimError"
            class="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-bold text-rose-800"
          >
            {{ claimError }}
          </div>

          <form class="space-y-4" @submit.prevent="handleClaimCertificate">
            <div class="space-y-1.5">
              <label class="block text-xs font-extrabold text-[#162221]">
                Nama Lengkap Penerima Sertifikat
              </label>
              <input
                v-model="holderName"
                type="text"
                required
                minlength="2"
                placeholder="Masukkan nama lengkap yang tercetak di sertifikat"
                class="w-full rounded-2xl border border-[#d9d1c2] bg-[#fbf9f5] px-4 py-3 text-sm font-bold text-[#162221] focus:border-[#1f6f6d] focus:outline-none"
              >
              <p class="text-[11px] text-[#6d7a78]">
                Nomor Invoice: <span class="font-mono font-bold">{{ booking.invoiceNumber }}</span> &bull; Kode Booking: <span class="font-mono font-bold">{{ booking.bookingCode }}</span>
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="submit"
                :disabled="claiming || holderName.trim().length < 2"
                class="inline-flex items-center justify-center gap-2 rounded-full bg-[#1f6f6d] px-6 py-3.5 text-xs sm:text-sm font-extrabold text-white shadow-md hover:bg-[#175957] disabled:opacity-50 transition cursor-pointer"
              >
                <Award class="h-4 w-4" />
                {{ claiming ? 'Menerbitkan Sertifikat...' : 'Klaim Sertifikat Resmi Sekarang' }}
              </button>

              <NuxtLink
                to="/customer/dashboard"
                class="inline-flex items-center gap-1.5 rounded-full border border-[#dfd8c8] bg-white px-4 py-3 text-xs font-bold text-[#455553] hover:border-[#1f6f6d]"
              >
                Kembali ke Dashboard
              </NuxtLink>
            </div>
          </form>
        </div>

        <!-- Automatic Rewards Preview -->
        <aside class="lg:col-span-5 rounded-[24px] bg-[#fbf9f5] border border-[#e5dfd2] p-5 space-y-3.5">
          <p class="text-xs font-extrabold uppercase tracking-wider text-[#1f6f6d] flex items-center gap-1.5">
            <Sparkles class="h-4 w-4" />
            Hadiah Otomatis Saat Klaim
          </p>

          <div class="space-y-2.5 text-xs">
            <div class="flex items-start gap-2.5 rounded-2xl bg-white border border-[#ebe5d8] p-3">
              <Award class="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p class="font-extrabold text-[#162221]">Sertifikat Ekspedisi Bernomor Seri</p>
                <p class="text-[#5c6b69]">Bisa langsung dicetak ke PDF atau diunduh (.html) lengkap dengan tanda tangan Pemandu Lokal.</p>
              </div>
            </div>

            <div class="flex items-start gap-2.5 rounded-2xl bg-white border border-[#ebe5d8] p-3">
              <Trophy class="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p class="font-extrabold text-[#162221]">+500 Poin Loyalitas Adventure Passport</p>
                <p class="text-[#5c6b69]">Poin dapat ditukar diskon trip berikutnya, sewa alat gratis, atau akses early-access.</p>
              </div>
            </div>

            <div class="flex items-start gap-2.5 rounded-2xl bg-white border border-[#ebe5d8] p-3">
              <Stamp class="h-4 w-4 text-[#1f6f6d] shrink-0 mt-0.5" />
              <div>
                <p class="font-extrabold text-[#162221]">Stempel Destinasi &amp; Lencana Digital</p>
                <p class="text-[#5c6b69]">Wilayah trip otomatis menyala di Peta Jejak Nusantara dan membuka badge pencapaian.</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>

    <!-- STEP B: Official Claimed Certificate View (Printable & Downloadable) -->
    <template v-else-if="booking.certificateClaimed">
      <!-- Celebratory Banner right after claiming -->
      <div
        v-if="justClaimedReward"
        class="rounded-[24px] bg-emerald-50 border-2 border-emerald-300 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden"
      >
        <div class="flex items-start gap-3">
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow">
            <Trophy class="h-5 w-5" />
          </span>
          <div class="space-y-0.5">
            <p class="text-sm sm:text-base font-extrabold text-emerald-950">
              Selamat! Sertifikat Resmi Berhasil Diklaim!
            </p>
            <p class="text-xs text-emerald-800">
              Anda mendapatkan <strong>+{{ justClaimedReward.pointsAwarded }} Poin Adventure Passport</strong>, 1 Stempel Destinasi baru<span v-if="justClaimedReward.unlockedBadges.length">, serta membuka lencana: <strong>{{ justClaimedReward.unlockedBadges.join(', ') }}</strong></span>!
            </p>
          </div>
        </div>

        <NuxtLink
          to="/customer/passport"
          class="inline-flex items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-700 transition shrink-0"
        >
          <Stamp class="h-4 w-4" />
          Lihat Adventure Passport
        </NuxtLink>
      </div>

      <!-- Action Bar (Hidden when printing) -->
      <div class="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div class="inline-flex items-center gap-2 rounded-full bg-amber-100 border border-amber-300 px-3.5 py-1.5 text-xs font-extrabold text-amber-950">
          <Award class="h-4 w-4 text-amber-700" />
          Sertifikat Terverifikasi &bull; {{ booking.certificateId }}
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-full bg-[#1f6f6d] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-[#175957] transition cursor-pointer"
            @click="printCertificate"
          >
            <Printer class="h-4 w-4" />
            Cetak Sertifikat / Simpan PDF
          </button>

          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-full border border-[#1f6f6d] bg-white px-4 py-2.5 text-xs font-extrabold text-[#1f6f6d] hover:bg-[#eef7f6] transition cursor-pointer"
            @click="downloadCertificateHtml"
          >
            <Download class="h-4 w-4" />
            Unduh Sertifikat
          </button>

          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-full border border-[#dfd8c8] bg-white px-3.5 py-2.5 text-xs font-bold text-[#455553] hover:border-[#1f6f6d] transition cursor-pointer"
            @click="showRenameBox = !showRenameBox"
          >
            <Edit3 class="h-3.5 w-3.5" />
            Ubah Nama
          </button>

          <NuxtLink
            to="/customer/dashboard"
            class="inline-flex items-center gap-1.5 rounded-full border border-[#dfd8c8] bg-white px-4 py-2.5 text-xs font-bold text-[#162221] hover:border-[#1f6f6d] transition"
          >
            <LayoutDashboard class="h-4 w-4" />
            Dashboard
          </NuxtLink>
        </div>
      </div>

      <!-- Optional Inline Name Update Bar (Hidden when printing) -->
      <form
        v-if="showRenameBox"
        class="rounded-2xl bg-white border border-[#e5dfd2] p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 print:hidden"
        @submit.prevent="handleClaimCertificate"
      >
        <input
          v-model="holderName"
          type="text"
          required
          minlength="2"
          placeholder="Perbarui nama pada sertifikat..."
          class="flex-1 rounded-full border border-[#dfd8c8] bg-[#fbf9f5] px-4 py-2 text-xs sm:text-sm font-bold text-[#162221]"
        >
        <button
          type="submit"
          :disabled="claiming"
          class="rounded-full bg-[#1f6f6d] px-5 py-2 text-xs font-extrabold text-white hover:bg-[#175957] cursor-pointer"
        >
          {{ claiming ? 'Menyimpan...' : 'Simpan Perubahan Nama' }}
        </button>
      </form>

      <!-- OFFICIAL PRINTABLE CERTIFICATE CARD -->
      <article
        class="rounded-[28px] bg-[#fdfbf6] border-[8px] border-[#103f3e] p-3 sm:p-4 shadow-xl print:rounded-none print:shadow-none"
      >
        <div class="relative rounded-[18px] border-2 border-amber-500/70 px-6 py-8 sm:px-12 sm:py-11 text-center overflow-hidden">
          <!-- Subtle Decorative Corner Accents -->
          <span class="pointer-events-none absolute top-3 left-3 h-7 w-7 border-t-4 border-l-4 border-[#1f6f6d]/40 rounded-tl-md" />
          <span class="pointer-events-none absolute top-3 right-3 h-7 w-7 border-t-4 border-r-4 border-[#1f6f6d]/40 rounded-tr-md" />
          <span class="pointer-events-none absolute bottom-3 left-3 h-7 w-7 border-b-4 border-l-4 border-[#1f6f6d]/40 rounded-bl-md" />
          <span class="pointer-events-none absolute bottom-3 right-3 h-7 w-7 border-b-4 border-r-4 border-[#1f6f6d]/40 rounded-br-md" />

          <!-- Top Crest & Serial -->
          <div class="space-y-2.5">
            <div class="inline-flex items-center justify-center gap-2 text-[#103f3e]">
              <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#103f3e] text-amber-300 shadow-xs">
                <Compass class="h-5 w-5" />
              </span>
              <div class="text-left">
                <p class="font-editorial text-lg font-bold leading-none text-[#103f3e]">JejakNusa</p>
                <p class="text-[9px] font-extrabold uppercase tracking-[0.22em] text-[#1f6f6d]">
                  Official Expedition Certificate
                </p>
              </div>
            </div>

            <div>
              <span class="inline-flex items-center gap-1.5 rounded-full bg-[#eef7f6] border border-[#c7e4e0] px-3.5 py-1 text-[11px] font-mono font-extrabold text-[#103f3e]">
                <ShieldCheck class="h-3.5 w-3.5 text-[#1f6f6d]" />
                NO. SERTIFIKAT: {{ booking.certificateId }}
              </span>
            </div>
          </div>

          <!-- Certificate Title -->
          <div class="mt-6 space-y-2">
            <h1 class="font-editorial text-2xl sm:text-4xl font-bold tracking-wide text-[#103f3e]">
              SERTIFIKAT PENYELESAIAN EKSPEDISI
            </h1>
            <p class="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.24em] text-[#6d7a78]">
              Diberikan Dengan Bangga Kepada
            </p>
          </div>

          <!-- Recipient Name -->
          <div class="mt-5 mb-4">
            <p class="font-editorial text-3xl sm:text-5xl font-bold text-[#162221] inline-block border-b-2 border-amber-500/80 px-6 pb-2.5">
              {{ booking.certificateHolderName || booking.leaderName }}
            </p>
          </div>

          <!-- Citation Text -->
          <p class="text-xs sm:text-sm text-[#455553] max-w-2xl mx-auto leading-relaxed">
            Atas partisipasi aktif, semangat kebersamaan, dan keberhasilannya menyelesaikan seluruh rangkaian kegiatan Open Trip dengan standar keselamatan serta pelestarian alam JejakNusa pada destinasi:
          </p>

          <!-- Highlighted Trip Info Box -->
          <div class="mt-5 mx-auto max-w-2xl rounded-2xl bg-[#eef7f6] border border-[#c7e4e0] px-5 py-4 space-y-1.5">
            <h2 class="font-editorial text-lg sm:text-2xl font-bold text-[#103f3e]">
              {{ booking.tripTitle }}
            </h2>
            <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-semibold text-[#355250]">
              <span class="inline-flex items-center gap-1">
                <MapPin class="h-3.5 w-3.5 text-[#1f6f6d]" />
                {{ booking.location }}
              </span>
              <span class="inline-flex items-center gap-1">
                <Calendar class="h-3.5 w-3.5 text-[#1f6f6d]" />
                {{ formatDateID(booking.departureDate) }}
              </span>
              <span class="inline-flex items-center gap-1">
                <UserCheck class="h-3.5 w-3.5 text-[#1f6f6d]" />
                {{ booking.participantsCount }} Peserta
              </span>
            </div>
            <div v-if="booking.hasCarbonOffset" class="pt-1">
              <span class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800">
                <Leaf class="h-3 w-3" />
                Kontributor Eco-Friendly Carbon Offset
              </span>
            </div>
          </div>

          <!-- Signatures & Official Verification Seal -->
          <div class="mt-9 grid grid-cols-1 sm:grid-cols-3 gap-6 items-end pt-4 border-t border-dashed border-[#dfd8c8]">
            <!-- Guide Signature -->
            <div class="space-y-1">
              <p class="font-editorial italic text-xl text-[#103f3e] border-b border-[#103f3e]/40 pb-1.5 mx-6">
                {{ booking.guideName }}
              </p>
              <p class="text-xs font-extrabold text-[#162221]">{{ booking.guideName }}</p>
              <p class="text-[10px] font-semibold text-[#5c6b69]">
                Pemandu Lokal &bull; {{ booking.guideCertification }}
              </p>
            </div>

            <!-- Official Gold & Forest Seal -->
            <div class="flex flex-col items-center justify-center">
              <div class="h-24 w-24 rounded-full bg-[#103f3e] border-4 border-double border-amber-400 text-amber-200 flex flex-col items-center justify-center shadow-md">
                <BadgeCheck class="h-5 w-5 text-amber-300 mb-0.5" />
                <span class="text-[8px] font-extrabold tracking-widest uppercase">Terverifikasi</span>
                <span class="font-editorial text-xs font-bold text-white leading-tight">JejakNusa</span>
                <span class="text-[8px] font-mono text-teal-200">
                  {{ (booking.certificateClaimedAt || booking.completedAt || '').slice(0, 10) }}
                </span>
              </div>
            </div>

            <!-- Director / Platform Verification -->
            <div class="space-y-1">
              <p class="font-editorial italic text-xl text-[#103f3e] border-b border-[#103f3e]/40 pb-1.5 mx-6">
                JejakNusa Ops
              </p>
              <p class="text-xs font-extrabold text-[#162221]">Direktur Ekspedisi JejakNusa</p>
              <p class="text-[10px] font-mono text-[#5c6b69]">
                Ref: {{ booking.bookingCode }} &bull; {{ booking.invoiceNumber }}
              </p>
            </div>
          </div>
        </div>
      </article>
    </template>
  </div>
</template>

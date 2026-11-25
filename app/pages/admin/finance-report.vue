<script setup lang="ts">
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Coins,
  Compass,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Landmark,
  Receipt,
  RefreshCw,
  RotateCcw,
  Search,
  TrendingUp,
  Wallet,
  X
} from 'lucide-vue-next'
import type {
  AdminFinanceReportResponse,
  FinanceDirection,
  FinanceEntryType,
  FinanceLedgerItem
} from '#shared/types/finance'
import { formatRupiah } from '~/utils/format'
import { downloadFinanceExcel, exportFinancePdfViaPrint } from '~/utils/reportExport'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  allowedRoles: ['admin']
})

useSeoMeta({
  title: 'Laporan Keuangan & Arus Kas — Admin JejakNusa',
  description: 'Laporan keuangan lengkap platform JejakNusa: GMV, arus kas masuk/keluar, komisi platform, pendapatan per destinasi, payout pemandu, refund cuaca, serta ekspor Excel (.xlsx) dan PDF.'
})

const { user } = useAuth()
const { data, pending, refresh } = await useFetch<AdminFinanceReportResponse>('/api/admin/finance-report')

const summary = computed(() => data.value?.summary)
const byDestination = computed(() => data.value?.byDestination ?? [])
const ledger = computed(() => data.value?.ledger ?? [])
const generatedAt = computed(() => data.value?.generatedAt || '-')

const selectedType = ref<'ALL' | FinanceEntryType>('ALL')
const selectedDirection = ref<'ALL' | FinanceDirection>('ALL')
const searchQuery = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const selectedItem = ref<FinanceLedgerItem | null>(null)
const exportFeedback = ref('')

const filteredLedger = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return ledger.value.filter((item) => {
    if (selectedType.value !== 'ALL' && item.type !== selectedType.value) return false
    if (selectedDirection.value !== 'ALL' && item.direction !== selectedDirection.value) return false
    if (dateFrom.value && item.dateOnly < dateFrom.value) return false
    if (dateTo.value && item.dateOnly > dateTo.value) return false
    if (q) {
      const hay = `${item.referenceCode} ${item.title} ${item.counterparty} ${item.paymentMethod} ${item.status} ${item.notes} ${item.typeLabel}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
})

const filteredTotals = computed(() => {
  const gross = filteredLedger.value.reduce((s, i) => s + i.grossAmount, 0)
  const settledIn = filteredLedger.value
    .filter((i) => i.direction === 'MASUK')
    .reduce((s, i) => s + i.settledAmount, 0)
  const settledOut = filteredLedger.value
    .filter((i) => i.direction === 'KELUAR')
    .reduce((s, i) => s + i.settledAmount, 0)
  const commission = filteredLedger.value.reduce((s, i) => s + i.platformCommission, 0)
  const serviceFee = filteredLedger.value.reduce((s, i) => s + i.serviceFee, 0)
  const netCash = filteredLedger.value.reduce((s, i) => s + i.netCashImpact, 0)
  return { gross, settledIn, settledOut, commission, serviceFee, netCash }
})

const activeFilterLabel = computed(() => {
  const parts: string[] = []
  if (selectedType.value === 'ALL') parts.push('Semua Jenis Transaksi')
  else if (selectedType.value === 'income_booking') parts.push('Pemasukan Booking')
  else if (selectedType.value === 'payout_guide') parts.push('Payout Pemandu')
  else parts.push('Refund Cuaca')

  if (selectedDirection.value !== 'ALL') {
    parts.push(selectedDirection.value === 'MASUK' ? 'Arus Masuk' : 'Arus Keluar')
  }
  if (dateFrom.value || dateTo.value) {
    parts.push(`Periode ${dateFrom.value || 'awal'} s.d. ${dateTo.value || 'sekarang'}`)
  }
  if (searchQuery.value.trim()) {
    parts.push(`Kata kunci: "${searchQuery.value.trim()}"`)
  }
  return parts.join(' • ')
})

function resetFilters() {
  selectedType.value = 'ALL'
  selectedDirection.value = 'ALL'
  searchQuery.value = ''
  dateFrom.value = ''
  dateTo.value = ''
}

function statusBadgeClass(severity: FinanceLedgerItem['severity']): string {
  switch (severity) {
    case 'success':
      return 'bg-emerald-100 text-emerald-800'
    case 'warning':
      return 'bg-amber-100 text-amber-900'
    case 'danger':
      return 'bg-rose-100 text-rose-800'
    default:
      return 'bg-[#eef7f6] text-[#175957]'
  }
}

function handleExportExcel() {
  if (!summary.value) return
  downloadFinanceExcel(summary.value, filteredLedger.value, byDestination.value, {
    generatedAt: generatedAt.value,
    filterLabel: activeFilterLabel.value,
    exportedBy: user.value?.name || 'Admin JejakNusa'
  })
  exportFeedback.value = `Berhasil mengunduh Laporan Keuangan Excel (.xlsx) dengan 3 sheet (Ringkasan Keuangan, ${filteredLedger.value.length} baris Buku Besar, dan ${byDestination.value.length} Destinasi).`
  setTimeout(() => {
    exportFeedback.value = ''
  }, 5500)
}

function handleExportPdf() {
  exportFeedback.value = 'Menyiapkan cetak PDF Laporan Keuangan A4 Landscape (pilih "Save as PDF" pada dialog cetak).'
  exportFinancePdfViaPrint()
  setTimeout(() => {
    exportFeedback.value = ''
  }, 5500)
}
</script>

<template>
  <div class="space-y-6">
    <!-- ==================== INTERACTIVE SCREEN VIEW ==================== -->
    <div class="space-y-6 print:hidden">
      <!-- Hero Banner -->
      <section class="rounded-[28px] teal-card p-6 sm:p-7 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div class="space-y-1.5">
          <span class="inline-flex items-center gap-1.5 rounded-full bg-amber-300/20 border border-amber-300/35 px-3 py-1 text-[11px] font-extrabold text-amber-200">
            <Landmark class="h-3.5 w-3.5" />
            Pembukuan, Laba/Rugi Platform &amp; Arus Kas Escrow
          </span>
          <h1 class="font-editorial text-2xl sm:text-3xl font-bold">
            Laporan Keuangan JejakNusa
          </h1>
          <p class="text-xs sm:text-sm text-teal-100/90 max-w-2xl">
            Pantau total GMV, dana riil masuk dari QRIS, piutang peserta, pendapatan bersih platform (komisi + biaya layanan), payout pemandu, dan refund cuaca ekstrem. Dapat diekspor langsung ke Excel (.xlsx) 3-sheet atau PDF.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            :disabled="!summary"
            class="inline-flex items-center gap-1.5 rounded-full bg-emerald-400 px-4 py-2.5 text-xs font-extrabold text-[#0f2f2e] hover:bg-emerald-300 disabled:opacity-50 shadow-sm transition cursor-pointer"
            @click="handleExportExcel"
          >
            <FileSpreadsheet class="h-4 w-4" />
            Ekspor Excel (.xlsx)
          </button>

          <button
            type="button"
            :disabled="!summary"
            class="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-4 py-2.5 text-xs font-extrabold text-[#162221] hover:bg-amber-300 disabled:opacity-50 shadow-sm transition cursor-pointer"
            @click="handleExportPdf"
          >
            <FileText class="h-4 w-4" />
            Ekspor PDF
          </button>

          <button
            type="button"
            :disabled="pending"
            class="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/25 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-white/25 transition cursor-pointer"
            @click="() => refresh()"
          >
            <RefreshCw class="h-3.5 w-3.5" :class="pending ? 'animate-spin' : ''" />
            Muat Ulang
          </button>
        </div>
      </section>

      <!-- Export Feedback -->
      <div
        v-if="exportFeedback"
        class="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-bold text-emerald-900 flex items-center gap-2"
      >
        <Download class="h-4 w-4 text-emerald-700 shrink-0" />
        <span>{{ exportFeedback }}</span>
      </div>

      <!-- Primary Financial KPI Cards -->
      <div v-if="summary" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div class="min-w-0 rounded-[24px] bg-white border border-[#e5dfd2] p-5 flex flex-col justify-between gap-3 shadow-xs">
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs font-bold text-[#5c6b69]">Total GMV Platform</p>
            <span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eef7f6] text-[#1f6f6d]">
              <TrendingUp class="h-4.5 w-4.5" />
            </span>
          </div>
          <div>
            <p class="text-xl 2xl:text-2xl font-extrabold tabular-nums text-[#162221] break-words">
              {{ formatRupiah(summary.totalGmv) }}
            </p>
            <p class="text-[11px] font-medium text-[#6d7a78] mt-0.5">
              Booking {{ formatRupiah(summary.totalBookingGross) }} + Payout Bruto
            </p>
          </div>
        </div>

        <div class="min-w-0 rounded-[24px] bg-white border border-[#e5dfd2] p-5 flex flex-col justify-between gap-3 shadow-xs">
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs font-bold text-[#5c6b69]">Dana Riil Masuk (Booking)</p>
            <span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <ArrowDownLeft class="h-4.5 w-4.5" />
            </span>
          </div>
          <div>
            <p class="text-xl 2xl:text-2xl font-extrabold tabular-nums text-emerald-800 break-words">
              {{ formatRupiah(summary.totalCashIn) }}
            </p>
            <p class="text-[11px] font-medium text-amber-800 mt-0.5">
              Piutang belum lunas: {{ formatRupiah(summary.totalReceivable) }}
            </p>
          </div>
        </div>

        <div class="min-w-0 rounded-[24px] bg-white border border-[#e5dfd2] p-5 flex flex-col justify-between gap-3 shadow-xs">
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs font-bold text-[#5c6b69]">Pendapatan Bersih Platform</p>
            <span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Coins class="h-4.5 w-4.5" />
            </span>
          </div>
          <div>
            <p class="text-xl 2xl:text-2xl font-extrabold tabular-nums text-[#1f6f6d] break-words">
              {{ formatRupiah(summary.totalPlatformNetRevenue) }}
            </p>
            <p class="text-[11px] font-medium text-[#6d7a78] mt-0.5">
              Komisi {{ summary.commissionPercent }}% + Biaya Layanan
            </p>
          </div>
        </div>

        <div class="min-w-0 rounded-[24px] bg-white border border-[#e5dfd2] p-5 flex flex-col justify-between gap-3 shadow-xs">
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs font-bold text-[#5c6b69]">Saldo Escrow Bersih</p>
            <span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
              <Wallet class="h-4.5 w-4.5" />
            </span>
          </div>
          <div>
            <p class="text-xl 2xl:text-2xl font-extrabold tabular-nums text-[#162221] break-words">
              {{ formatRupiah(summary.netEscrowBalance) }}
            </p>
            <p class="text-[11px] font-medium text-[#6d7a78] mt-0.5">
              Dana keluar cair: {{ formatRupiah(summary.totalCashOut) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Two-Column Financial Composition Breakdown -->
      <div v-if="summary" class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <!-- Left: Revenue & Platform Income Breakdown -->
        <section class="rounded-[26px] bg-white border border-[#e5dfd2] p-5 sm:p-6 space-y-4">
          <div class="flex items-center justify-between gap-2 pb-3 border-b border-[#efe9dc]">
            <div>
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-[#1f6f6d]">Komposisi Pendapatan</span>
              <h2 class="font-editorial text-lg font-bold text-[#162221]">Rincian Pemasukan &amp; Titipan Dana</h2>
            </div>
            <Receipt class="h-5 w-5 text-[#1f6f6d]" />
          </div>

          <div class="space-y-2.5 text-xs">
            <div class="flex items-center justify-between rounded-xl bg-[#fbf9f5] px-3.5 py-2.5">
              <span class="text-[#455553] font-semibold">Komisi Platform ({{ summary.commissionPercent }}%)</span>
              <strong class="tabular-nums text-emerald-800">{{ formatRupiah(summary.totalPlatformCommission) }}</strong>
            </div>
            <div class="flex items-center justify-between rounded-xl bg-[#fbf9f5] px-3.5 py-2.5">
              <span class="text-[#455553] font-semibold">Biaya Layanan Aplikasi (Service Fee)</span>
              <strong class="tabular-nums text-emerald-800">{{ formatRupiah(summary.totalServiceFee) }}</strong>
            </div>
            <div class="flex items-center justify-between rounded-xl bg-[#eef7f6] border border-[#c7e4e0] px-3.5 py-2.5">
              <span class="text-[#103f3e] font-extrabold">Total Pendapatan Bersih Platform</span>
              <strong class="tabular-nums text-sm text-[#103f3e]">{{ formatRupiah(summary.totalPlatformNetRevenue) }}</strong>
            </div>
            <div class="flex items-center justify-between rounded-xl bg-[#fbf9f5] px-3.5 py-2.5">
              <span class="text-[#5c6b69]">Titipan Premi Asuransi Perjalanan</span>
              <strong class="tabular-nums text-[#162221]">{{ formatRupiah(summary.totalInsuranceFee) }}</strong>
            </div>
            <div class="flex items-center justify-between rounded-xl bg-[#fbf9f5] px-3.5 py-2.5">
              <span class="text-[#5c6b69]">Titipan Dana Carbon Offset</span>
              <strong class="tabular-nums text-[#162221]">{{ formatRupiah(summary.totalCarbonOffsetFee) }}</strong>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2 pt-2 border-t border-[#efe9dc] text-center text-[11px]">
            <div class="rounded-xl bg-emerald-50 border border-emerald-200 p-2">
              <p class="font-bold text-emerald-800">LUNAS</p>
              <p class="text-base font-extrabold text-emerald-900">{{ summary.paidTransactionsCount }}</p>
            </div>
            <div class="rounded-xl bg-amber-50 border border-amber-200 p-2">
              <p class="font-bold text-amber-900">DP 30%</p>
              <p class="text-base font-extrabold text-amber-950">{{ summary.dpTransactionsCount }}</p>
            </div>
            <div class="rounded-xl bg-orange-50 border border-orange-200 p-2">
              <p class="font-bold text-orange-800">Menunggu</p>
              <p class="text-base font-extrabold text-orange-950">{{ summary.unpaidTransactionsCount }}</p>
            </div>
          </div>
        </section>

        <!-- Right: Outflows & Escrow Liabilities -->
        <section class="rounded-[26px] bg-white border border-[#e5dfd2] p-5 sm:p-6 space-y-4">
          <div class="flex items-center justify-between gap-2 pb-3 border-b border-[#efe9dc]">
            <div>
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-orange-700">Kewajiban &amp; Pengeluaran</span>
              <h2 class="font-editorial text-lg font-bold text-[#162221]">Payout Pemandu &amp; Refund Cuaca</h2>
            </div>
            <NuxtLink
              to="/admin/payouts"
              class="inline-flex items-center gap-1 rounded-full bg-[#eef7f6] px-3 py-1.5 text-[11px] font-extrabold text-[#1f6f6d] hover:bg-[#1f6f6d] hover:text-white transition"
            >
              Kelola Payout
              <ArrowUpRight class="h-3.5 w-3.5" />
            </NuxtLink>
          </div>

          <div class="space-y-2.5 text-xs">
            <div class="flex items-center justify-between rounded-xl bg-[#fbf9f5] px-3.5 py-2.5">
              <span class="text-[#455553] font-semibold">Payout Pemandu Sudah Dicairkan</span>
              <strong class="tabular-nums text-rose-700">-{{ formatRupiah(summary.totalPayoutReleased) }}</strong>
            </div>
            <div class="flex items-center justify-between rounded-xl bg-amber-50/70 border border-amber-200 px-3.5 py-2.5">
              <span class="text-amber-950 font-semibold">Payout Pemandu Menunggu Pencairan</span>
              <strong class="tabular-nums text-amber-900">{{ formatRupiah(summary.totalPayoutPending) }}</strong>
            </div>
            <div class="flex items-center justify-between rounded-xl bg-[#fbf9f5] px-3.5 py-2.5">
              <span class="text-[#455553] font-semibold">Refund Cuaca Disetujui &amp; Dikembalikan</span>
              <strong class="tabular-nums text-rose-700">-{{ formatRupiah(summary.totalRefundApproved) }}</strong>
            </div>
            <div class="flex items-center justify-between rounded-xl bg-orange-50/70 border border-orange-200 px-3.5 py-2.5">
              <span class="text-orange-950 font-semibold">Antrean Refund Cuaca Menunggu Persetujuan</span>
              <strong class="tabular-nums text-orange-800">{{ formatRupiah(summary.totalRefundPending) }}</strong>
            </div>
            <div class="flex items-center justify-between rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5">
              <span class="text-rose-950 font-extrabold">Total Dana Keluar Terealisasi (Cash Out)</span>
              <strong class="tabular-nums text-sm text-rose-800">-{{ formatRupiah(summary.totalCashOut) }}</strong>
            </div>
          </div>

          <p class="text-[11px] text-[#5c6b69]">
            Diperbarui otomatis secara real-time: <strong>{{ generatedAt }}</strong>
          </p>
        </section>
      </div>

      <!-- Revenue by Destination Table -->
      <section class="rounded-[28px] bg-white border border-[#e5dfd2] overflow-hidden shadow-xs">
        <div class="px-5 py-4 border-b border-[#ebe5d8] bg-[#fbf9f5] flex items-center justify-between gap-2">
          <div>
            <span class="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-[#1f6f6d]">
              <Compass class="h-3.5 w-3.5" />
              Rekap Pendapatan per Destinasi
            </span>
            <h2 class="font-editorial text-lg font-bold text-[#162221]">
              Kontribusi Pendapatan Destinasi ({{ byDestination.length }})
            </h2>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-[#f4f1ea] text-[#455553] uppercase tracking-wider text-[10px]">
              <tr>
                <th class="px-4 py-3 font-extrabold">Destinasi / Paket Trip</th>
                <th class="px-4 py-3 font-extrabold text-center">Transaksi</th>
                <th class="px-4 py-3 font-extrabold text-center">Peserta</th>
                <th class="px-4 py-3 font-extrabold text-right">Bruto</th>
                <th class="px-4 py-3 font-extrabold text-right">Terbayar</th>
                <th class="px-4 py-3 font-extrabold text-right">Piutang</th>
                <th class="px-4 py-3 font-extrabold text-right">Est. Komisi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#ebe5d8]">
              <tr v-for="dest in byDestination" :key="dest.tripSlug" class="hover:bg-[#fbf9f5]">
                <td class="px-4 py-3">
                  <p class="font-extrabold text-[#162221]">{{ dest.tripTitle }}</p>
                  <p class="text-[11px] text-[#5c6b69]">{{ dest.location }}</p>
                </td>
                <td class="px-4 py-3 text-center font-bold">{{ dest.bookingsCount }}</td>
                <td class="px-4 py-3 text-center font-bold">{{ dest.participantsCount }} org</td>
                <td class="px-4 py-3 text-right font-extrabold tabular-nums text-[#162221]">{{ formatRupiah(dest.grossRevenue) }}</td>
                <td class="px-4 py-3 text-right font-extrabold tabular-nums text-emerald-800">{{ formatRupiah(dest.paidRevenue) }}</td>
                <td class="px-4 py-3 text-right font-bold tabular-nums text-amber-800">{{ formatRupiah(dest.unpaidRevenue) }}</td>
                <td class="px-4 py-3 text-right font-extrabold tabular-nums text-[#1f6f6d]">{{ formatRupiah(dest.estimatedCommission) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Filterable Financial Ledger -->
      <section class="rounded-[28px] bg-white border border-[#e5dfd2] overflow-hidden shadow-xs">
        <div class="p-5 border-b border-[#ebe5d8] space-y-3.5 bg-[#fbf9f5]">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 class="font-editorial text-lg font-bold text-[#162221]">
                Buku Besar Arus Kas &amp; Transaksi ({{ filteredLedger.length }})
              </h2>
              <p class="text-[11px] text-[#5c6b69]">
                Masuk Realisasi: <strong class="text-emerald-800">{{ formatRupiah(filteredTotals.settledIn) }}</strong>
                &bull; Keluar Realisasi: <strong class="text-rose-700">{{ formatRupiah(filteredTotals.settledOut) }}</strong>
                &bull; Komisi: <strong class="text-[#1f6f6d]">{{ formatRupiah(filteredTotals.commission) }}</strong>
              </p>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-[11px] font-extrabold text-emerald-800 hover:bg-emerald-100 cursor-pointer"
                @click="handleExportExcel"
              >
                <FileSpreadsheet class="h-3.5 w-3.5" /> Excel
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-[11px] font-extrabold text-amber-900 hover:bg-amber-100 cursor-pointer"
                @click="handleExportPdf"
              >
                <FileText class="h-3.5 w-3.5" /> PDF
              </button>
            </div>
          </div>

          <!-- Filter Pills -->
          <div class="flex flex-wrap items-center gap-2">
            <button
              v-for="opt in [
                { key: 'ALL', label: 'Semua Jenis' },
                { key: 'income_booking', label: 'Pemasukan Booking' },
                { key: 'payout_guide', label: 'Payout Pemandu' },
                { key: 'refund_weather', label: 'Refund Cuaca' }
              ] as const"
              :key="opt.key"
              type="button"
              class="rounded-full px-3.5 py-1.5 text-xs font-bold border transition cursor-pointer"
              :class="
                selectedType === opt.key
                  ? 'bg-[#103f3e] text-white border-[#103f3e]'
                  : 'bg-white text-[#354442] border-[#e3dccd] hover:border-[#1f6f6d]'
              "
              @click="selectedType = opt.key"
            >
              {{ opt.label }}
            </button>

            <span class="h-4 w-px bg-[#dfd8c8] mx-1 hidden sm:inline-block" />

            <button
              v-for="dir in [
                { key: 'ALL', label: 'Semua Arus' },
                { key: 'MASUK', label: 'Dana Masuk' },
                { key: 'KELUAR', label: 'Dana Keluar' }
              ] as const"
              :key="dir.key"
              type="button"
              class="rounded-full px-3 py-1.5 text-xs font-bold border transition cursor-pointer"
              :class="
                selectedDirection === dir.key
                  ? 'bg-[#1f6f6d] text-white border-[#1f6f6d]'
                  : 'bg-white text-[#455553] border-[#e3dccd] hover:border-[#1f6f6d]'
              "
              @click="selectedDirection = dir.key"
            >
              {{ dir.label }}
            </button>
          </div>

          <!-- Search + Date Range -->
          <div class="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
            <div class="md:col-span-5 relative">
              <Search class="h-4 w-4 text-[#7a8785] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Cari invoice, peserta, pemandu, destinasi..."
                class="w-full rounded-full border border-[#e3dccd] bg-white pl-10 pr-4 py-2 text-xs sm:text-sm text-[#162221] focus:border-[#1f6f6d] focus:outline-none"
              >
            </div>

            <div class="md:col-span-3 flex items-center gap-2">
              <label for="fin-date-from" class="text-[11px] font-bold text-[#5c6b69] shrink-0 inline-flex items-center gap-1">
                <Calendar class="h-3.5 w-3.5 text-[#1f6f6d]" /> Dari
              </label>
              <input
                id="fin-date-from"
                v-model="dateFrom"
                type="date"
                class="w-full rounded-full border border-[#e3dccd] bg-white px-3 py-1.5 text-xs font-semibold text-[#162221]"
              >
            </div>

            <div class="md:col-span-3 flex items-center gap-2">
              <label for="fin-date-to" class="text-[11px] font-bold text-[#5c6b69] shrink-0">Sampai</label>
              <input
                id="fin-date-to"
                v-model="dateTo"
                type="date"
                class="w-full rounded-full border border-[#e3dccd] bg-white px-3 py-1.5 text-xs font-semibold text-[#162221]"
              >
            </div>

            <div class="md:col-span-1 flex items-center justify-end">
              <button
                type="button"
                title="Reset filter"
                class="w-full md:w-auto inline-flex items-center justify-center gap-1 rounded-full border border-[#dfd8c8] bg-white px-3 py-2 text-xs font-bold text-[#455553] hover:border-[#1f6f6d] cursor-pointer"
                @click="resetFilters"
              >
                <RotateCcw class="h-3.5 w-3.5" />
                <span class="md:hidden">Reset</span>
              </button>
            </div>
          </div>
        </div>

        <div v-if="filteredLedger.length === 0" class="p-10 text-center space-y-2">
          <p class="text-sm font-bold text-[#354442]">Tidak ada entri keuangan yang cocok dengan filter.</p>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-full bg-[#1f6f6d] px-4 py-2 text-xs font-extrabold text-white cursor-pointer"
            @click="resetFilters"
          >
            <RotateCcw class="h-3.5 w-3.5" /> Tampilkan Semua
          </button>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-[#f4f1ea] text-[#455553] uppercase tracking-wider text-[10px]">
              <tr>
                <th class="px-4 py-3.5 font-extrabold">Waktu &amp; Ref</th>
                <th class="px-4 py-3.5 font-extrabold">Arah &amp; Jenis</th>
                <th class="px-4 py-3.5 font-extrabold">Destinasi &amp; Pihak</th>
                <th class="px-4 py-3.5 font-extrabold text-right">Bruto</th>
                <th class="px-4 py-3.5 font-extrabold text-right">Realisasi</th>
                <th class="px-4 py-3.5 font-extrabold text-right">Komisi</th>
                <th class="px-4 py-3.5 font-extrabold">Status</th>
                <th class="px-4 py-3.5 font-extrabold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#ebe5d8]">
              <tr
                v-for="item in filteredLedger"
                :key="item.id"
                class="hover:bg-[#fbf9f5] transition cursor-pointer"
                @click="selectedItem = item"
              >
                <td class="px-4 py-3.5 whitespace-nowrap">
                  <span class="font-mono font-extrabold text-[#1f6f6d]">{{ item.referenceCode }}</span>
                  <span class="block text-[10px] text-[#6d7a78]">{{ item.timestamp }}</span>
                </td>

                <td class="px-4 py-3.5 whitespace-nowrap">
                  <span
                    class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold"
                    :class="item.direction === 'MASUK' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'"
                  >
                    <ArrowDownLeft v-if="item.direction === 'MASUK'" class="h-3 w-3" />
                    <ArrowUpRight v-else class="h-3 w-3" />
                    {{ item.direction }}
                  </span>
                  <span class="block text-[10px] font-semibold text-[#5c6b69] mt-0.5">{{ item.typeLabel }}</span>
                </td>

                <td class="px-4 py-3.5 max-w-[260px]">
                  <p class="font-extrabold text-[#162221] truncate">{{ item.title }}</p>
                  <p class="text-[11px] text-[#5c6b69]">{{ item.counterparty }} &bull; {{ item.paymentMethod }}</p>
                </td>

                <td class="px-4 py-3.5 text-right font-bold tabular-nums text-[#455553] whitespace-nowrap">
                  {{ formatRupiah(item.grossAmount) }}
                </td>

                <td
                  class="px-4 py-3.5 text-right font-extrabold tabular-nums whitespace-nowrap"
                  :class="item.settledAmount === 0 ? 'text-[#8a9694]' : item.direction === 'MASUK' ? 'text-emerald-800' : 'text-rose-700'"
                >
                  <template v-if="item.settledAmount > 0">
                    {{ item.direction === 'MASUK' ? '+' : '-' }}{{ formatRupiah(item.settledAmount) }}
                  </template>
                  <template v-else>Rp 0</template>
                </td>

                <td class="px-4 py-3.5 text-right font-bold tabular-nums text-[#1f6f6d] whitespace-nowrap">
                  {{ item.platformCommission > 0 ? formatRupiah(item.platformCommission) : '—' }}
                </td>

                <td class="px-4 py-3.5 whitespace-nowrap">
                  <span
                    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold"
                    :class="statusBadgeClass(item.severity)"
                  >
                    {{ item.status }}
                  </span>
                </td>

                <td class="px-4 py-3.5 text-right whitespace-nowrap" @click.stop>
                  <button
                    type="button"
                    class="inline-flex items-center gap-1 rounded-full border border-[#dfd8c8] bg-white px-2.5 py-1 text-[11px] font-bold text-[#162221] hover:border-[#1f6f6d] hover:text-[#1f6f6d] cursor-pointer"
                    @click="selectedItem = item"
                  >
                    <Eye class="h-3 w-3" /> Detail
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Detail Modal -->
      <Teleport to="body">
        <div
          v-if="selectedItem"
          class="fixed inset-0 z-50 flex items-center justify-center bg-[#0d2423]/60 backdrop-blur-xs p-4 print:hidden"
          @click.self="selectedItem = null"
        >
          <div class="w-full max-w-lg rounded-[28px] bg-[#fbf9f5] border border-white p-6 shadow-2xl space-y-4">
            <div class="flex items-start justify-between gap-3 pb-3 border-b border-[#e5dfd2]">
              <div>
                <span
                  class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold"
                  :class="selectedItem.direction === 'MASUK' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'"
                >
                  {{ selectedItem.direction }} &bull; {{ selectedItem.typeLabel }}
                </span>
                <h3 class="font-mono text-lg font-extrabold text-[#162221] mt-1">{{ selectedItem.referenceCode }}</h3>
                <p class="text-xs text-[#5c6b69]">{{ selectedItem.timestamp }}</p>
              </div>
              <button
                type="button"
                class="rounded-full p-1.5 text-stone-500 hover:bg-stone-200 cursor-pointer"
                @click="selectedItem = null"
              >
                <X class="h-5 w-5" />
              </button>
            </div>

            <div class="rounded-2xl bg-white border border-[#e5dfd2] p-4 space-y-2 text-xs">
              <div class="flex justify-between gap-3"><span class="text-[#5c6b69]">Kegiatan / Paket</span><strong class="text-right text-[#162221]">{{ selectedItem.title }}</strong></div>
              <div class="flex justify-between gap-3"><span class="text-[#5c6b69]">Pihak Terkait</span><strong class="text-right text-[#162221]">{{ selectedItem.counterparty }}</strong></div>
              <div class="flex justify-between gap-3"><span class="text-[#5c6b69]">Info Pihak</span><span class="text-right text-[#455553]">{{ selectedItem.counterpartyInfo }}</span></div>
              <div class="flex justify-between gap-3"><span class="text-[#5c6b69]">Metode</span><span class="text-right font-semibold text-[#162221]">{{ selectedItem.paymentMethod }}</span></div>
              <div class="flex justify-between gap-3"><span class="text-[#5c6b69]">Status</span><span class="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold" :class="statusBadgeClass(selectedItem.severity)">{{ selectedItem.status }}</span></div>
            </div>

            <div class="rounded-2xl bg-white border border-[#e5dfd2] p-4 space-y-1.5 text-xs">
              <div class="flex justify-between"><span>Nilai Bruto</span><strong class="tabular-nums">{{ formatRupiah(selectedItem.grossAmount) }}</strong></div>
              <div class="flex justify-between"><span>Dana Realisasi</span><strong class="tabular-nums text-emerald-800">{{ formatRupiah(selectedItem.settledAmount) }}</strong></div>
              <div class="flex justify-between"><span>Belum Lunas / Belum Cair</span><strong class="tabular-nums text-amber-800">{{ formatRupiah(selectedItem.outstandingAmount) }}</strong></div>
              <div class="flex justify-between"><span>Komisi Platform</span><strong class="tabular-nums text-[#1f6f6d]">{{ formatRupiah(selectedItem.platformCommission) }}</strong></div>
              <div v-if="selectedItem.serviceFee > 0" class="flex justify-between"><span>Biaya Layanan Aplikasi</span><strong class="tabular-nums">{{ formatRupiah(selectedItem.serviceFee) }}</strong></div>
              <div v-if="selectedItem.insuranceFee > 0" class="flex justify-between"><span>Asuransi Perjalanan</span><strong class="tabular-nums">{{ formatRupiah(selectedItem.insuranceFee) }}</strong></div>
              <div v-if="selectedItem.carbonOffsetFee > 0" class="flex justify-between"><span>Carbon Offset</span><strong class="tabular-nums">{{ formatRupiah(selectedItem.carbonOffsetFee) }}</strong></div>
              <div class="flex justify-between pt-2 border-t border-dashed border-[#dfd8c8] text-sm font-extrabold">
                <span>Dampak Arus Kas Bersih</span>
                <span :class="selectedItem.netCashImpact >= 0 ? 'text-emerald-800' : 'text-rose-700'">
                  {{ selectedItem.netCashImpact >= 0 ? '+' : '-' }}{{ formatRupiah(Math.abs(selectedItem.netCashImpact)) }}
                </span>
              </div>
            </div>

            <p class="text-xs text-[#455553] rounded-xl bg-white border border-[#e5dfd2] p-3">
              <strong>Catatan:</strong> {{ selectedItem.notes }}
            </p>

            <div class="flex items-center justify-between gap-2">
              <NuxtLink
                v-if="selectedItem.detailLink"
                :to="selectedItem.detailLink"
                class="inline-flex items-center gap-1.5 rounded-full bg-[#1f6f6d] px-4 py-2 text-xs font-extrabold text-white hover:bg-[#175957]"
              >
                Buka Halaman Sumber
                <ArrowUpRight class="h-3.5 w-3.5" />
              </NuxtLink>
              <button
                type="button"
                class="rounded-full border border-[#dfd8c8] bg-white px-4 py-2 text-xs font-bold text-[#455553] cursor-pointer ml-auto"
                @click="selectedItem = null"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </Teleport>
    </div>

    <!-- ==================== DEDICATED PRINT / PDF FINANCIAL REPORT ==================== -->
    <section v-if="summary" class="hidden print:block text-[#162221] space-y-4">
      <!-- Official Header -->
      <div class="flex items-start justify-between border-b-2 border-[#103f3e] pb-3">
        <div>
          <p class="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#1f6f6d]">
            JEJAKNUSA &bull; DIVISI KEUANGAN &amp; ESCROW PLATFORM
          </p>
          <h1 class="text-xl font-bold text-[#103f3e] mt-0.5">
            LAPORAN KEUANGAN &amp; BUKU BESAR ARUS KAS
          </h1>
          <p class="text-[11px] text-[#455553] mt-0.5">
            Filter Aktif: <strong>{{ activeFilterLabel }}</strong>
          </p>
        </div>

        <div class="text-right text-[10px] text-[#455553] space-y-0.5">
          <p><strong>Tanggal Cetak:</strong> {{ generatedAt }}</p>
          <p><strong>Dicetak Oleh:</strong> {{ user?.name || 'Admin JejakNusa' }}</p>
          <p><strong>Tarif Komisi Aktif:</strong> {{ summary.commissionPercent }}%</p>
        </div>
      </div>

      <!-- Executive Financial KPI Row -->
      <div class="grid grid-cols-4 gap-2 text-[10px]">
        <div class="rounded-lg border border-[#c7e4e0] bg-[#eef7f6] p-2.5">
          <p class="font-bold text-[#455553]">Total GMV Bruto</p>
          <p class="text-sm font-extrabold text-[#103f3e]">{{ formatRupiah(summary.totalGmv) }}</p>
        </div>
        <div class="rounded-lg border border-emerald-300 bg-emerald-50 p-2.5">
          <p class="font-bold text-[#455553]">Dana Riil Masuk (Booking)</p>
          <p class="text-sm font-extrabold text-emerald-900">{{ formatRupiah(summary.totalCashIn) }}</p>
          <p class="text-[9px] text-[#455553]">Piutang: {{ formatRupiah(summary.totalReceivable) }}</p>
        </div>
        <div class="rounded-lg border border-amber-300 bg-amber-50 p-2.5">
          <p class="font-bold text-[#455553]">Pendapatan Bersih Platform</p>
          <p class="text-sm font-extrabold text-[#103f3e]">{{ formatRupiah(summary.totalPlatformNetRevenue) }}</p>
          <p class="text-[9px] text-[#455553]">Komisi + Biaya Layanan</p>
        </div>
        <div class="rounded-lg border border-[#dfd8c8] bg-[#fbf9f5] p-2.5">
          <p class="font-bold text-[#455553]">Saldo Escrow Bersih</p>
          <p class="text-sm font-extrabold text-[#162221]">{{ formatRupiah(summary.netEscrowBalance) }}</p>
          <p class="text-[9px] text-[#455553]">Keluar Cair: {{ formatRupiah(summary.totalCashOut) }}</p>
        </div>
      </div>

      <!-- Buku Besar Arus Kas Table -->
      <div>
        <h2 class="text-xs font-extrabold uppercase tracking-wider text-[#103f3e] mb-1.5">
          1. Buku Besar Arus Kas &amp; Transaksi ({{ filteredLedger.length }} Entri)
        </h2>
        <table class="w-full border-collapse text-[9px]">
          <thead>
            <tr class="bg-[#103f3e] text-white">
              <th class="border border-[#103f3e] px-1.5 py-1.5 text-left">No</th>
              <th class="border border-[#103f3e] px-1.5 py-1.5 text-left">Waktu</th>
              <th class="border border-[#103f3e] px-1.5 py-1.5 text-left">Arah</th>
              <th class="border border-[#103f3e] px-1.5 py-1.5 text-left">Referensi</th>
              <th class="border border-[#103f3e] px-1.5 py-1.5 text-left">Destinasi &amp; Pihak</th>
              <th class="border border-[#103f3e] px-1.5 py-1.5 text-right">Bruto</th>
              <th class="border border-[#103f3e] px-1.5 py-1.5 text-right">Realisasi</th>
              <th class="border border-[#103f3e] px-1.5 py-1.5 text-right">Komisi</th>
              <th class="border border-[#103f3e] px-1.5 py-1.5 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in filteredLedger" :key="`pdf-fin-${item.id}`" class="break-inside-avoid">
              <td class="border border-[#d9d2c5] px-1.5 py-1 align-top">{{ idx + 1 }}</td>
              <td class="border border-[#d9d2c5] px-1.5 py-1 align-top whitespace-nowrap">{{ item.timestamp }}</td>
              <td class="border border-[#d9d2c5] px-1.5 py-1 align-top font-bold whitespace-nowrap">{{ item.direction }} ({{ item.typeLabel }})</td>
              <td class="border border-[#d9d2c5] px-1.5 py-1 align-top font-mono whitespace-nowrap">{{ item.referenceCode }}</td>
              <td class="border border-[#d9d2c5] px-1.5 py-1 align-top">
                <p class="font-bold">{{ item.title }}</p>
                <p class="text-[#5c6b69]">{{ item.counterparty }} • {{ item.paymentMethod }}</p>
              </td>
              <td class="border border-[#d9d2c5] px-1.5 py-1 align-top text-right whitespace-nowrap">{{ formatRupiah(item.grossAmount) }}</td>
              <td class="border border-[#d9d2c5] px-1.5 py-1 align-top text-right font-bold whitespace-nowrap">
                {{ item.settledAmount > 0 ? `${item.direction === 'MASUK' ? '+' : '-'}${formatRupiah(item.settledAmount)}` : 'Rp 0' }}
              </td>
              <td class="border border-[#d9d2c5] px-1.5 py-1 align-top text-right whitespace-nowrap">
                {{ item.platformCommission > 0 ? formatRupiah(item.platformCommission) : '—' }}
              </td>
              <td class="border border-[#d9d2c5] px-1.5 py-1 align-top font-bold whitespace-nowrap">{{ item.status }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="bg-[#eef7f6] font-extrabold">
              <td colspan="5" class="border border-[#103f3e] px-2 py-1.5 text-right text-[#103f3e]">
                TOTAL TERFILTER (MASUK: {{ formatRupiah(filteredTotals.settledIn) }} | KELUAR: {{ formatRupiah(filteredTotals.settledOut) }})
              </td>
              <td class="border border-[#103f3e] px-1.5 py-1.5 text-right whitespace-nowrap">{{ formatRupiah(filteredTotals.gross) }}</td>
              <td class="border border-[#103f3e] px-1.5 py-1.5 text-right whitespace-nowrap">
                {{ filteredTotals.netCash >= 0 ? '+' : '-' }}{{ formatRupiah(Math.abs(filteredTotals.netCash)) }}
              </td>
              <td class="border border-[#103f3e] px-1.5 py-1.5 text-right whitespace-nowrap">{{ formatRupiah(filteredTotals.commission) }}</td>
              <td class="border border-[#103f3e] px-1.5 py-1.5" />
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Revenue by Destination Table in PDF -->
      <div class="break-inside-avoid">
        <h2 class="text-xs font-extrabold uppercase tracking-wider text-[#103f3e] mb-1.5">
          2. Rekap Pendapatan per Destinasi
        </h2>
        <table class="w-full border-collapse text-[9px]">
          <thead>
            <tr class="bg-[#f4f1ea] text-[#103f3e]">
              <th class="border border-[#bfb8aa] px-2 py-1 text-left">Destinasi</th>
              <th class="border border-[#bfb8aa] px-2 py-1 text-center">Transaksi</th>
              <th class="border border-[#bfb8aa] px-2 py-1 text-center">Peserta</th>
              <th class="border border-[#bfb8aa] px-2 py-1 text-right">Bruto</th>
              <th class="border border-[#bfb8aa] px-2 py-1 text-right">Terbayar</th>
              <th class="border border-[#bfb8aa] px-2 py-1 text-right">Piutang</th>
              <th class="border border-[#bfb8aa] px-2 py-1 text-right">Est. Komisi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in byDestination" :key="`pdf-dest-${d.tripSlug}`">
              <td class="border border-[#d9d2c5] px-2 py-1 font-bold">{{ d.tripTitle }} ({{ d.location }})</td>
              <td class="border border-[#d9d2c5] px-2 py-1 text-center">{{ d.bookingsCount }}</td>
              <td class="border border-[#d9d2c5] px-2 py-1 text-center">{{ d.participantsCount }}</td>
              <td class="border border-[#d9d2c5] px-2 py-1 text-right whitespace-nowrap">{{ formatRupiah(d.grossRevenue) }}</td>
              <td class="border border-[#d9d2c5] px-2 py-1 text-right whitespace-nowrap">{{ formatRupiah(d.paidRevenue) }}</td>
              <td class="border border-[#d9d2c5] px-2 py-1 text-right whitespace-nowrap">{{ formatRupiah(d.unpaidRevenue) }}</td>
              <td class="border border-[#d9d2c5] px-2 py-1 text-right font-bold whitespace-nowrap">{{ formatRupiah(d.estimatedCommission) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Signature Footer -->
      <div class="pt-3 border-t border-[#d9d2c5] flex items-center justify-between text-[9px] text-[#5c6b69]">
        <span>Laporan Keuangan resmi dihasilkan otomatis oleh JejakNusa Admin Command Center.</span>
        <span>Diverifikasi: {{ user?.name || 'Admin JejakNusa' }} • {{ generatedAt }}</span>
      </div>
    </section>
  </div>
</template>

<style scoped>
@media print {
  @page {
    size: A4 landscape;
    margin: 10mm;
  }
}
</style>

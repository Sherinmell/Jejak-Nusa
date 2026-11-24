<script setup lang="ts">
import {
  CheckCircle2,
  CloudLightning,
  Coins,
  Send,
  Wallet,
  XCircle
} from 'lucide-vue-next'
import type { GuidePayoutRecord, WeatherRefundRecord } from '#shared/types/guide'
import { formatDateID, formatRupiah } from '~/utils/format'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  allowedRoles: ['admin']
})

useSeoMeta({
  title: 'Keuangan, Payout Pemandu & Refund Cuaca — Admin JejakNusa',
  description: 'Kelola komisi platform, pencairan dana payout ke pemandu lokal, dan resolusi refund cuaca ekstrem.'
})

const { data, refresh } = await useFetch<{
  summary: {
    totalCommission: number
    pendingPayoutAmount: number
    pendingRefundAmount: number
  }
  payouts: GuidePayoutRecord[]
  weatherRefunds: WeatherRefundRecord[]
}>('/api/admin/payouts')

const summary = computed(() => data.value?.summary)
const payouts = computed(() => data.value?.payouts ?? [])
const weatherRefunds = computed(() => data.value?.weatherRefunds ?? [])

const processingId = ref('')
const feedback = ref('')

async function releasePayout(payout: GuidePayoutRecord) {
  processingId.value = payout.id
  feedback.value = ''
  try {
    await $fetch(`/api/admin/payouts/${payout.id}`, {
      method: 'PATCH',
      body: { kind: 'payout', action: 'release' }
    })
    feedback.value = `Dana bersih ${formatRupiah(payout.netPayout)} berhasil dicairkan ke rekening ${payout.guideName}.`
    await refresh()
  } finally {
    processingId.value = ''
  }
}

async function resolveRefund(refund: WeatherRefundRecord, action: 'approve' | 'reject') {
  processingId.value = refund.id
  feedback.value = ''
  try {
    await $fetch(`/api/admin/payouts/${refund.id}`, {
      method: 'PATCH',
      body: { kind: 'refund', action }
    })
    feedback.value =
      action === 'approve'
        ? `Refund cuaca ekstrem ${formatRupiah(refund.refundAmount)} untuk ${refund.customerName} (${refund.bookingCode}) disetujui & dikembalikan.`
        : `Pengajuan refund ${refund.bookingCode} ditolak.`
    await refresh()
  } finally {
    processingId.value = ''
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <span class="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#1f6f6d]">
        <Wallet class="h-4 w-4" />
        Escrow &amp; Manajemen Keuangan
      </span>
      <h1 class="font-editorial text-2xl sm:text-3xl font-bold text-[#162221]">
        Komisi Platform, Payout Pemandu &amp; Refund Cuaca
      </h1>
      <p class="text-xs sm:text-sm text-[#5c6b69]">
        Cairkan dana bersih ke pemandu setelah trip selesai (dipotong komisi 10%) serta proses klaim Garansi Cuaca Ekstrem.
      </p>
    </div>

    <!-- Financial Summary Cards -->
    <div v-if="summary" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <div class="min-w-0 rounded-[24px] bg-white border border-[#e5dfd2] p-5 flex flex-col justify-between gap-3 shadow-xs">
        <div class="flex items-center justify-between gap-2">
          <p class="text-xs font-bold text-[#5c6b69]">Total Komisi Platform (10%)</p>
          <span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Coins class="h-4.5 w-4.5" />
          </span>
        </div>
        <p class="text-xl 2xl:text-2xl font-extrabold tracking-tight tabular-nums text-emerald-800 break-words">{{ formatRupiah(summary.totalCommission) }}</p>
      </div>

      <div class="min-w-0 rounded-[24px] bg-white border border-[#e5dfd2] p-5 flex flex-col justify-between gap-3 shadow-xs">
        <div class="flex items-center justify-between gap-2">
          <p class="text-xs font-bold text-[#5c6b69]">Payout Pemandu Menunggu Cair</p>
          <span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eef7f6] text-[#1f6f6d]">
            <Wallet class="h-4.5 w-4.5" />
          </span>
        </div>
        <p class="text-xl 2xl:text-2xl font-extrabold tracking-tight tabular-nums text-[#162221] break-words">{{ formatRupiah(summary.pendingPayoutAmount) }}</p>
      </div>

      <div class="min-w-0 rounded-[24px] bg-white border border-[#e5dfd2] p-5 flex flex-col justify-between gap-3 shadow-xs">
        <div class="flex items-center justify-between gap-2">
          <p class="text-xs font-bold text-[#5c6b69]">Antrean Refund Cuaca Ekstrem</p>
          <span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <CloudLightning class="h-4.5 w-4.5" />
          </span>
        </div>
        <p class="text-xl 2xl:text-2xl font-extrabold tracking-tight tabular-nums text-orange-700 break-words">{{ formatRupiah(summary.pendingRefundAmount) }}</p>
      </div>
    </div>

    <div
      v-if="feedback"
      class="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-bold text-emerald-800"
    >
      {{ feedback }}
    </div>

    <!-- Guide Payouts Section -->
    <section class="rounded-[28px] bg-white border border-[#e5dfd2] p-6 space-y-4">
      <h2 class="font-editorial text-xl font-bold text-[#162221]">
        1. Antrean Pencairan Dana (Payout) Pemandu Lokal
      </h2>

      <div class="space-y-3">
        <div
          v-for="pay in payouts"
          :key="pay.id"
          class="rounded-2xl border border-[#e8e2d5] bg-[#fbf9f5] p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          <div class="space-y-1">
            <div class="flex flex-wrap items-center gap-2">
              <span
                class="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold"
                :class="pay.status === 'Dicairkan' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'"
              >
                {{ pay.status }}
              </span>
              <span class="text-xs text-[#5c6b69]">Selesai: {{ formatDateID(pay.departureDate) }} &bull; {{ pay.participantsCount }} peserta</span>
            </div>
            <h3 class="text-sm sm:text-base font-extrabold text-[#162221]">{{ pay.tripTitle }}</h3>
            <p class="text-xs font-semibold text-[#1f6f6d]">Penerima: {{ pay.guideName }}</p>
            <div class="flex flex-wrap gap-4 text-xs text-[#455553] pt-1">
              <span>Bruto: <strong>{{ formatRupiah(pay.grossAmount) }}</strong></span>
              <span>Komisi (10%): <strong class="text-orange-700">-{{ formatRupiah(pay.platformCommission) }}</strong></span>
              <span>Bersih Diterima: <strong class="text-emerald-800">{{ formatRupiah(pay.netPayout) }}</strong></span>
            </div>
          </div>

          <div class="shrink-0">
            <button
              v-if="pay.status === 'Menunggu Pencairan'"
              type="button"
              :disabled="processingId === pay.id"
              class="inline-flex items-center gap-1.5 rounded-full bg-[#1f6f6d] px-4 py-2.5 text-xs font-extrabold text-white hover:bg-[#175957] disabled:opacity-60 transition cursor-pointer"
              @click="releasePayout(pay)"
            >
              <Send class="h-3.5 w-3.5" />
              {{ processingId === pay.id ? 'Mencairkan...' : 'Cairkan Dana Payout' }}
            </button>
            <span
              v-else
              class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3.5 py-1.5 text-xs font-extrabold text-emerald-800"
            >
              <CheckCircle2 class="h-4 w-4" />
              Cair {{ pay.releasedAt }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- Weather Refund Resolution Section -->
    <section class="rounded-[28px] bg-white border border-[#e5dfd2] p-6 space-y-4">
      <h2 class="font-editorial text-xl font-bold text-[#162221] flex items-center gap-2">
        <CloudLightning class="h-5 w-5 text-orange-600" />
        2. Resolusi Refund Cuaca Ekstrem (Garansi BMKG)
      </h2>

      <div class="space-y-3">
        <div
          v-for="refItem in weatherRefunds"
          :key="refItem.id"
          class="rounded-2xl border p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
          :class="refItem.status === 'Menunggu Persetujuan' ? 'border-amber-300 bg-amber-50/40' : 'border-[#e8e2d5] bg-[#fbf9f5]'"
        >
          <div class="space-y-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded-full bg-white border border-[#e5dfd2] px-2.5 py-0.5 text-[10px] font-mono font-extrabold text-[#162221]">
                {{ refItem.bookingCode }}
              </span>
              <span
                class="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold"
                :class="
                  refItem.status === 'Disetujui & Dikembalikan'
                    ? 'bg-emerald-100 text-emerald-800'
                    : refItem.status === 'Ditolak'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-900'
                "
              >
                {{ refItem.status }}
              </span>
            </div>
            <h3 class="text-sm sm:text-base font-extrabold text-[#162221]">
              {{ refItem.tripTitle }} — {{ refItem.customerName }}
            </h3>
            <p class="text-xs font-bold text-orange-800">{{ refItem.weatherCondition }}</p>
            <p class="text-xs text-[#455553]">{{ refItem.reason }}</p>
            <p class="text-xs font-extrabold text-[#1f6f6d] pt-0.5">
              Nominal Pengembalian: {{ formatRupiah(refItem.refundAmount) }}
            </p>
          </div>

          <div v-if="refItem.status === 'Menunggu Persetujuan'" class="flex items-center gap-2 shrink-0">
            <button
              type="button"
              :disabled="processingId === refItem.id"
              class="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-white px-3.5 py-2 text-xs font-extrabold text-rose-700 hover:bg-rose-600 hover:text-white disabled:opacity-50 transition cursor-pointer"
              @click="resolveRefund(refItem, 'reject')"
            >
              <XCircle class="h-3.5 w-3.5" />
              Tolak
            </button>
            <button
              type="button"
              :disabled="processingId === refItem.id"
              class="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-emerald-700 disabled:opacity-50 transition cursor-pointer"
              @click="resolveRefund(refItem, 'approve')"
            >
              <CheckCircle2 class="h-3.5 w-3.5" />
              Setujui Refund 100%
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

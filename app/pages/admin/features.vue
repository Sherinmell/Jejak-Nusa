<script setup lang="ts">
import {
  CheckCircle2,
  Coins,
  CreditCard,
  IdCard,
  Leaf,
  Percent,
  QrCode,
  Save,
  ShieldPlus,
  Sliders
} from 'lucide-vue-next'
import type { PlatformFeatureFlags } from '#shared/types/booking'
import { formatRupiah } from '~/utils/format'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  allowedRoles: ['admin']
})

useSeoMeta({
  title: 'Manajemen Fitur & Komisi Platform — Admin JejakNusa',
  description: 'Aktifkan/nonaktifkan fitur pembayaran QRIS, Split Bill, Asuransi Instan, Carbon Offset, Custom Trip, serta atur persentase komisi & biaya layanan.'
})

const { features, fetchFeatures, updateFeatures } = useMarketplace()
await fetchFeatures(true)

const draft = reactive<PlatformFeatureFlags>({ ...features.value })

watch(
  features,
  (val) => {
    Object.assign(draft, val)
  },
  { deep: true }
)

const saving = ref(false)
const savedMsg = ref('')
const errorMsg = ref('')

async function saveFeatureConfig() {
  saving.value = true
  savedMsg.value = ''
  errorMsg.value = ''
  try {
    await updateFeatures({
      qrisEnabled: draft.qrisEnabled,
      splitBillDpEnabled: draft.splitBillDpEnabled,
      instantInsuranceEnabled: draft.instantInsuranceEnabled,
      carbonOffsetEnabled: draft.carbonOffsetEnabled,
      customTripEnabled: draft.customTripEnabled,
      requireIdentityAndHealthCert: draft.requireIdentityAndHealthCert,
      platformCommissionPercent: Number(draft.platformCommissionPercent),
      serviceFeeAmount: Number(draft.serviceFeeAmount)
    })
    savedMsg.value = 'Konfigurasi fitur & tarif berhasil disimpan! Perubahan langsung aktif pada halaman Checkout Pelanggan dan Dashboard Pemandu.'
  } catch (err: unknown) {
    if (err && typeof err === 'object') {
      const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
      errorMsg.value = e.data?.statusMessage || e.statusMessage || 'Gagal menyimpan konfigurasi.'
    } else {
      errorMsg.value = 'Gagal menyimpan konfigurasi.'
    }
  } finally {
    saving.value = false
  }
}

const toggleItems = [
  {
    key: 'qrisEnabled' as const,
    title: 'Pembayaran QRIS Instan',
    description: 'Menampilkan kode QRIS dinamis beserta timer 15 menit di halaman Checkout Pelanggan.',
    icon: 'qris'
  },
  {
    key: 'splitBillDpEnabled' as const,
    title: 'Fitur Split Bill & DP 30%',
    description: 'Mengizinkan pelanggan mengunci kuota dengan DP 30% dan membuat Split Payment Link grup.',
    icon: 'split'
  },
  {
    key: 'instantInsuranceEnabled' as const,
    title: 'Add-on Asuransi Perjalanan Instan',
    description: 'Menampilkan opsi proteksi evakuasi medis & cuaca ekstrem (+Rp50.000/orang) di Checkout.',
    icon: 'insurance'
  },
  {
    key: 'carbonOffsetEnabled' as const,
    title: 'Donasi Carbon Offset & Konservasi',
    description: 'Menampilkan opsi donasi mikro (+Rp25.000) penanaman pohon/karang saat Checkout.',
    icon: 'carbon'
  },
  {
    key: 'requireIdentityAndHealthCert' as const,
    title: 'Wajib Syarat Surat Sehat & Nomor Identitas (NIK/Paspor)',
    description: 'Mewajibkan input Nomor NIK/Paspor setiap peserta dan peringatan syarat Surat Keterangan Sehat H-3 pada halaman Checkout.',
    icon: 'identity'
  }
]

const sampleTripPrice = 1150000
const simulatedGuideNet = computed(() =>
  Math.round(sampleTripPrice * (1 - Number(draft.platformCommissionPercent || 0) / 100))
)
const simulatedCustomerTotal = computed(
  () => sampleTripPrice + Number(draft.serviceFeeAmount || 0)
)
</script>

<template>
  <div class="max-w-5xl space-y-6">
    <!-- Header -->
    <div class="rounded-[28px] teal-card p-6 sm:p-7 text-white space-y-1.5">
      <span class="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-extrabold text-amber-200">
        <Sliders class="h-3.5 w-3.5" />
        Feature Flags &amp; Platform Pricing Configuration
      </span>
      <h1 class="font-editorial text-2xl sm:text-3xl font-bold">
        Manajemen Fitur &amp; Komisi Platform
      </h1>
      <p class="text-xs sm:text-sm text-teal-100/90 max-w-2xl">
        Aktifkan atau nonaktifkan fitur secara real-time. Setiap perubahan langsung mengubah opsi di halaman Checkout Pelanggan dan perhitungan pendapatan Pemandu Lokal.
      </p>
    </div>

    <div
      v-if="savedMsg"
      class="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3.5 text-xs font-bold text-emerald-800 flex items-center gap-2"
    >
      <CheckCircle2 class="h-4 w-4 shrink-0" />
      {{ savedMsg }}
    </div>
    <div
      v-if="errorMsg"
      class="rounded-2xl bg-orange-50 border border-orange-200 px-4 py-3.5 text-xs font-bold text-orange-800"
    >
      {{ errorMsg }}
    </div>

    <form class="space-y-6" @submit.prevent="saveFeatureConfig">
      <!-- Feature Toggles -->
      <section class="rounded-[28px] bg-white border border-[#e5dfd2] p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="font-editorial text-xl font-bold text-[#162221]">1. Kontrol Aktif / Nonaktif Fitur</h2>
          <span class="text-[11px] font-semibold text-[#5c6b69]">Terakhir diperbarui: {{ features.updatedAt }}</span>
        </div>

        <div class="space-y-3">
          <div
            v-for="item in toggleItems"
            :key="item.key"
            class="rounded-2xl border p-4 flex items-center justify-between gap-4 transition"
            :class="draft[item.key] ? 'border-[#c7e4e0] bg-[#eef7f6]/55' : 'border-[#e5dfd2] bg-[#fbf9f5]'"
          >
            <div class="flex items-start gap-3">
              <span
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                :class="draft[item.key] ? 'bg-[#1f6f6d] text-white' : 'bg-stone-200 text-stone-600'"
              >
                <QrCode v-if="item.icon === 'qris'" class="h-5 w-5" />
                <CreditCard v-else-if="item.icon === 'split'" class="h-5 w-5" />
                <ShieldPlus v-else-if="item.icon === 'insurance'" class="h-5 w-5" />
                <Leaf v-else-if="item.icon === 'carbon'" class="h-5 w-5" />
                <IdCard v-else class="h-5 w-5" />
              </span>
              <div>
                <p class="text-sm font-extrabold text-[#162221]">{{ item.title }}</p>
                <p class="text-xs text-[#5c6b69] mt-0.5">{{ item.description }}</p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              :aria-checked="draft[item.key]"
              class="relative inline-flex h-7 w-13 shrink-0 items-center rounded-full transition-colors cursor-pointer"
              :class="draft[item.key] ? 'bg-emerald-600' : 'bg-stone-300'"
              @click="draft[item.key] = !draft[item.key]"
            >
              <span
                class="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform"
                :class="draft[item.key] ? 'translate-x-7' : 'translate-x-1'"
              />
            </button>
          </div>
        </div>
      </section>

      <!-- Commission & Service Fee Configuration -->
      <section class="rounded-[28px] bg-white border border-[#e5dfd2] p-6 space-y-5">
        <h2 class="font-editorial text-xl font-bold text-[#162221]">2. Pengaturan Persentase Komisi &amp; Biaya Layanan</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div class="space-y-1.5">
            <label for="commission-pct" class="block text-xs font-extrabold uppercase tracking-wider text-[#5c6b69] flex items-center gap-1.5">
              <Percent class="h-3.5 w-3.5 text-[#1f6f6d]" />
              Persentase Komisi Platform (%)
            </label>
            <input
              id="commission-pct"
              v-model.number="draft.platformCommissionPercent"
              type="number"
              min="0"
              max="40"
              step="0.5"
              required
              class="w-full rounded-xl border border-[#e3dccd] bg-[#fbf9f5] px-4 py-3 text-base font-extrabold text-[#162221]"
            >
            <p class="text-[11px] text-[#5c6b69]">
              Dipotong dari pendapatan kotor trip Pemandu Lokal (rentang 0% – 40%).
            </p>
          </div>

          <div class="space-y-1.5">
            <label for="service-fee" class="block text-xs font-extrabold uppercase tracking-wider text-[#5c6b69] flex items-center gap-1.5">
              <Coins class="h-3.5 w-3.5 text-[#1f6f6d]" />
              Biaya Layanan Aplikasi (Rp / Transaksi)
            </label>
            <input
              id="service-fee"
              v-model.number="draft.serviceFeeAmount"
              type="number"
              min="0"
              max="250000"
              step="1000"
              required
              class="w-full rounded-xl border border-[#e3dccd] bg-[#fbf9f5] px-4 py-3 text-base font-extrabold text-[#162221]"
            >
            <p class="text-[11px] text-[#5c6b69]">
              Otomatis dihitung ulang di halaman Checkout Pelanggan &amp; Invoice.
            </p>
          </div>
        </div>

        <!-- Live Impact Preview -->
        <div class="rounded-2xl bg-[#eef7f6] border border-[#c7e4e0] p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span class="block text-[#4a5f5d]">Simulasi Checkout Pelanggan (Paket Rp1.150.000):</span>
            <strong class="text-sm text-[#162221]">
              {{ formatRupiah(simulatedCustomerTotal) }}
            </strong>
            <span class="text-[#5c6b69]"> (termasuk biaya layanan {{ formatRupiah(draft.serviceFeeAmount) }})</span>
          </div>
          <div>
            <span class="block text-[#4a5f5d]">Simulasi Pendapatan Bersih Pemandu:</span>
            <strong class="text-sm text-emerald-800">
              {{ formatRupiah(simulatedGuideNet) }}
            </strong>
            <span class="text-[#5c6b69]"> (setelah komisi {{ draft.platformCommissionPercent }}%)</span>
          </div>
        </div>

        <div class="flex justify-end">
          <button
            type="submit"
            :disabled="saving"
            class="inline-flex items-center gap-2 rounded-full bg-[#1f6f6d] px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#1f6f6d]/25 hover:bg-[#175957] disabled:opacity-60 transition cursor-pointer"
          >
            <Save class="h-4 w-4" />
            {{ saving ? 'Menyimpan Perubahan...' : 'Simpan Konfigurasi Platform' }}
          </button>
        </div>
      </section>
    </form>
  </div>
</template>

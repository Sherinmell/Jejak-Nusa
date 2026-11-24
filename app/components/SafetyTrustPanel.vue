<script setup lang="ts">
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  CloudRain,
  PhoneCall,
  Radio,
  Share2,
  ShieldCheck,
  Users
} from 'lucide-vue-next'
import type { Trip } from '#shared/types/trip'
import { formatDateID } from '~/utils/format'

interface Props {
  trip: Trip
}

const props = defineProps<Props>()

const emergencyName = ref('')
const emergencyPhone = ref('')
const emergencySaved = ref(false)
const safetyShared = ref(false)
const sosTestActive = ref(false)

function saveEmergencyContact() {
  if (!emergencyName.value.trim() || !emergencyPhone.value.trim()) return
  emergencySaved.value = true
}

async function shareSafetyBrief() {
  const text = [
    `[Info Keselamatan Perjalanan — JejakNusa]`,
    `Saya akan mengikuti open trip: ${props.trip.title}`,
    `Lokasi: ${props.trip.location}`,
    `Jadwal: ${formatDateID(props.trip.nextDepartureDate)} (${props.trip.duration})`,
    `Meeting Point: ${props.trip.meetingPoint}`,
    `Pemandu Terverifikasi: ${props.trip.guide.name} (${props.trip.guide.certifications[0]})`,
    emergencyName.value ? `Kontak Darurat Terdaftar: ${emergencyName.value} (${emergencyPhone.value})` : ''
  ]
    .filter(Boolean)
    .join('\n')

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    }
    safetyShared.value = true
    setTimeout(() => {
      safetyShared.value = false
    }, 2500)
  } catch {
    safetyShared.value = false
  }
}
</script>

<template>
  <section class="rounded-[28px] glass-surface p-6 sm:p-7 space-y-6 border-[#c7e4e0]">
    <!-- Header & Safety Score -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#e8e2d5]">
      <div class="flex items-start gap-3">
        <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#1f6f6d] text-white shadow-sm">
          <ShieldCheck class="h-5 w-5" />
        </span>
        <div>
          <span class="text-[11px] font-bold uppercase tracking-wider text-[#1f6f6d]">
            Keamanan &amp; Kepercayaan
          </span>
          <h2 class="font-editorial text-2xl font-bold text-[#162221]">
            Protokol Keselamatan Lapangan
          </h2>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-200 px-3 py-1 text-xs font-extrabold text-emerald-900">
          <span class="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
          Status Jalur: Aman &amp; Dibuka
        </span>
        <span class="rounded-full bg-[#eef7f6] border border-[#c7e4e0] px-3 py-1 text-xs font-extrabold text-[#175957]">
          Safety Score 99/100
        </span>
      </div>
    </div>

    <!-- 4 Trust Pillars -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      <div class="rounded-2xl bg-white/90 border border-[#ebe5d8] p-4 flex items-start gap-3">
        <CheckCircle2 class="h-5 w-5 text-[#1f6f6d] shrink-0 mt-0.5" />
        <div>
          <h3 class="text-sm font-extrabold text-[#162221]">Identitas &amp; Lisensi Terverifikasi</h3>
          <p class="mt-0.5 text-xs text-[#5c6b69] leading-relaxed">
            KTP, domisili lokal, dan sertifikasi {{ trip.guide.certifications[0] }} telah diaudit aktif.
          </p>
        </div>
      </div>

      <div class="rounded-2xl bg-white/90 border border-[#ebe5d8] p-4 flex items-start gap-3">
        <CloudRain class="h-5 w-5 text-[#1f6f6d] shrink-0 mt-0.5" />
        <div>
          <h3 class="text-sm font-extrabold text-[#162221]">Garansi Refund Cuaca Ekstrem</h3>
          <p class="mt-0.5 text-xs text-[#5c6b69] leading-relaxed">
            100% refund penuh atau reschedule gratis bila jalur ditutup otoritas/BMKG.
          </p>
        </div>
      </div>

      <div class="rounded-2xl bg-white/90 border border-[#ebe5d8] p-4 flex items-start gap-3">
        <Users class="h-5 w-5 text-[#1f6f6d] shrink-0 mt-0.5" />
        <div>
          <h3 class="text-sm font-extrabold text-[#162221]">Rasio Guide Ketat &amp; P3K Wilderness</h3>
          <p class="mt-0.5 text-xs text-[#5c6b69] leading-relaxed">
            Maksimal 1 pemandu per 4 peserta, lengkap radio HT &amp; koordinasi posko BASARNAS lokal.
          </p>
        </div>
      </div>

      <div class="rounded-2xl bg-white/90 border border-[#ebe5d8] p-4 flex items-start gap-3">
        <Radio class="h-5 w-5 text-[#1f6f6d] shrink-0 mt-0.5" />
        <div>
          <h3 class="text-sm font-extrabold text-[#162221]">Dana Escrow &amp; Live Check-In</h3>
          <p class="mt-0.5 text-xs text-[#5c6b69] leading-relaxed">
            Dana pembayaran ditahan di rekening bersama JejakNusa sampai trip selesai aman.
          </p>
        </div>
      </div>
    </div>

    <!-- Emergency Contact (ICE) + SOS / Share Safety Brief -->
    <div class="rounded-2xl bg-[#eef7f6]/80 border border-[#c7e4e0] p-4 sm:p-5 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 class="text-sm font-extrabold text-[#103f3e] flex items-center gap-1.5">
            <PhoneCall class="h-4 w-4 text-[#1f6f6d]" />
            Kontak Darurat (ICE) &amp; Bagikan Rute ke Keluarga
          </h3>
          <p class="text-xs text-[#4a5f5d] mt-0.5">
            Daftarkan kontak keluarga agar pemandu dan tim rescue dapat menghubungi jika terjadi kondisi darurat.
          </p>
        </div>

        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-full border border-orange-300 bg-white px-3.5 py-1.5 text-xs font-bold text-orange-700 hover:bg-orange-600 hover:text-white transition cursor-pointer self-start"
          @click="sosTestActive = !sosTestActive"
        >
          <AlertTriangle class="h-3.5 w-3.5" />
          {{ sosTestActive ? 'Tutup Info SOS' : 'Simulasi Tombol SOS' }}
        </button>
      </div>

      <div
        v-if="sosTestActive"
        class="rounded-2xl bg-orange-50 border border-orange-200 p-3.5 text-xs text-orange-900 space-y-1"
      >
        <p class="font-extrabold">Protokol Darurat Aktif (Simulasi)</p>
        <p>
          Saat berada di lapangan, tombol SOS akan mengirimkan koordinat GPS terakhir ke Posko Pemandu Lokal ({{ trip.guide.name }}), Hotline JejakNusa 24/7 (0800-1-JEJAK), dan nomor ICE terdaftar Anda.
        </p>
      </div>

      <form class="grid grid-cols-1 sm:grid-cols-12 gap-2.5" @submit.prevent="saveEmergencyContact">
        <input
          v-model="emergencyName"
          type="text"
          placeholder="Nama kontak darurat (mis. Ibu Ratna)"
          class="sm:col-span-5 rounded-full border border-[#cde3df] bg-white px-4 py-2 text-xs font-medium text-[#162221] placeholder:text-[#889391] focus:border-[#1f6f6d] focus:outline-none"
        >
        <input
          v-model="emergencyPhone"
          type="tel"
          placeholder="No. WhatsApp / Telepon"
          class="sm:col-span-4 rounded-full border border-[#cde3df] bg-white px-4 py-2 text-xs font-medium text-[#162221] placeholder:text-[#889391] focus:border-[#1f6f6d] focus:outline-none"
        >
        <button
          type="submit"
          class="sm:col-span-3 rounded-full bg-[#1f6f6d] px-4 py-2 text-xs font-bold text-white hover:bg-[#175957] transition cursor-pointer"
        >
          {{ emergencySaved ? 'Tersimpan ✓' : 'Simpan ICE' }}
        </button>
      </form>

      <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
        <span v-if="emergencySaved" class="text-xs font-bold text-[#175957]">
          Kontak darurat atas nama {{ emergencyName }} siap diteruskan ke manifest pemandu.
        </span>
        <span v-else class="text-[11px] text-[#5c6b69]">
          Tips: Bagikan ringkasan itinerary &amp; kontak pemandu ke keluarga sebelum berangkat.
        </span>

        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#c7e4e0] px-3.5 py-1.5 text-xs font-bold text-[#175957] hover:bg-[#1f6f6d] hover:text-white transition cursor-pointer"
          @click="shareSafetyBrief"
        >
          <Check v-if="safetyShared" class="h-3.5 w-3.5" />
          <Share2 v-else class="h-3.5 w-3.5" />
          {{ safetyShared ? 'Info Safety Tersalin!' : 'Salin Info Safety untuk Keluarga' }}
        </button>
      </div>
    </div>
  </section>
</template>

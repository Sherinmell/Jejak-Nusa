<script setup lang="ts">
import {
  Backpack,
  Calendar,
  CloudRain,
  Lock,
  PlusCircle,
  Unlock,
  Users
} from 'lucide-vue-next'
import type { GuideManagedTripItem, SimpleTrailWeatherStatus } from '#shared/types/guide'
import { formatDateID, formatRupiah } from '~/utils/format'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  allowedRoles: ['guide']
})

useSeoMeta({
  title: 'Kelola Paket Trip & Status Jalur — JejakNusa',
  description: 'Buka/tutup kuota peserta, atur status cuaca jalur (Buka, Waspada Hujan, Tutup), dan lihat Gear Checklist.'
})

const { data, refresh } = await useFetch<{ trips: GuideManagedTripItem[] }>('/api/guide/trips')
const trips = computed(() => data.value?.trips ?? [])

const savingId = ref('')
const feedback = ref('')

const statuses: SimpleTrailWeatherStatus[] = ['Buka', 'Waspada Hujan', 'Tutup']

async function toggleQuota(trip: GuideManagedTripItem) {
  savingId.value = trip.id
  feedback.value = ''
  try {
    await $fetch(`/api/guide/trips/${trip.id}`, {
      method: 'PATCH',
      body: { quotaOpen: !trip.quotaOpen }
    })
    feedback.value = `Kuota untuk "${trip.title}" berhasil ${!trip.quotaOpen ? 'dibuka' : 'ditutup'}.`
    await refresh()
  } finally {
    savingId.value = ''
  }
}

async function updateTrailWeather(trip: GuideManagedTripItem, status: SimpleTrailWeatherStatus) {
  savingId.value = trip.id
  feedback.value = ''
  try {
    await $fetch(`/api/guide/trips/${trip.id}`, {
      method: 'PATCH',
      body: { trailWeatherStatus: status }
    })
    feedback.value = `Status jalur "${trip.title}" diperbarui menjadi "${status}".`
    await refresh()
  } finally {
    savingId.value = ''
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="font-editorial text-2xl sm:text-3xl font-bold text-[#162221]">
          Manajemen Paket Trip &amp; Kondisi Jalur
        </h1>
        <p class="text-xs sm:text-sm text-[#5c6b69]">
          Kontrol cepat untuk membuka/menutup kuota pendaftaran dan memperbarui status cuaca/jalur secara real-time.
        </p>
      </div>

      <NuxtLink
        to="/guide/trips/create"
        class="inline-flex items-center justify-center gap-2 rounded-full bg-[#1f6f6d] px-5 py-2.5 text-xs font-extrabold text-white shadow-md hover:bg-[#175957] transition self-start sm:self-auto"
      >
        <PlusCircle class="h-4 w-4" />
        Buat Paket Trip Baru
      </NuxtLink>
    </div>

    <div
      v-if="feedback"
      class="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-bold text-emerald-800"
    >
      {{ feedback }}
    </div>

    <div class="space-y-4">
      <div
        v-for="trip in trips"
        :key="trip.id"
        class="rounded-[28px] bg-white border border-[#e5dfd2] p-5 sm:p-6 space-y-5"
      >
        <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div class="flex items-start gap-4">
            <img :src="trip.coverImage" :alt="trip.title" class="h-24 w-32 rounded-2xl object-cover shrink-0">
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="rounded-full bg-[#eef7f6] px-2.5 py-0.5 text-[10px] font-extrabold text-[#175957]">
                  {{ trip.category }}
                </span>
                <span class="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-900">
                  {{ trip.adrenalineLevel }}
                </span>
                <span class="text-xs font-extrabold text-[#1f6f6d]">
                  {{ formatRupiah(trip.pricePerPerson) }}/org
                </span>
              </div>
              <h2 class="text-base sm:text-lg font-extrabold text-[#162221]">{{ trip.title }}</h2>
              <p class="text-xs text-[#5c6b69]">{{ trip.location }} &bull; {{ trip.duration }}</p>
              <div class="flex flex-wrap gap-3 text-xs text-[#455553] pt-0.5">
                <span class="inline-flex items-center gap-1"><Calendar class="h-3.5 w-3.5 text-[#1f6f6d]" /> {{ formatDateID(trip.nextDepartureDate) }}</span>
                <span class="inline-flex items-center gap-1"><Users class="h-3.5 w-3.5 text-[#1f6f6d]" /> {{ trip.bookedCount }} / {{ trip.totalQuota }} terisi</span>
              </div>
            </div>
          </div>

          <!-- Quick Quota Open / Close Toggle -->
          <button
            type="button"
            :disabled="savingId === trip.id"
            class="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-extrabold border transition cursor-pointer self-start"
            :class="
              trip.quotaOpen
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-600 hover:text-white'
                : 'border-stone-300 bg-stone-100 text-stone-700 hover:bg-[#1f6f6d] hover:text-white'
            "
            @click="toggleQuota(trip)"
          >
            <Unlock v-if="trip.quotaOpen" class="h-3.5 w-3.5" />
            <Lock v-else class="h-3.5 w-3.5" />
            {{ trip.quotaOpen ? 'Kuota Dibuka (Klik Tutup)' : 'Kuota Ditutup (Klik Buka)' }}
          </button>
        </div>

        <!-- Quick Trail / Weather Status Controls -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-3 border-t border-[#ebe5d8]">
          <div class="lg:col-span-7 space-y-2">
            <span class="text-xs font-extrabold uppercase tracking-wider text-[#5c6b69] flex items-center gap-1.5">
              <CloudRain class="h-4 w-4 text-[#1f6f6d]" />
              Kontrol Cepat Status Jalur &amp; Cuaca
            </span>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="st in statuses"
                :key="st"
                type="button"
                :disabled="savingId === trip.id"
                class="rounded-full px-4 py-2 text-xs font-extrabold border transition cursor-pointer"
                :class="
                  trip.trailWeatherStatus === st
                    ? st === 'Buka'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : st === 'Waspada Hujan'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-rose-600 text-white border-rose-600'
                    : 'bg-[#fbf9f5] text-[#455553] border-[#e3dccd] hover:border-[#1f6f6d]'
                "
                @click="updateTrailWeather(trip, st)"
              >
                {{ st }}
              </button>
            </div>
            <p class="text-xs text-[#5c6b69]">Catatan terkini: {{ trip.weatherNote }}</p>
          </div>

          <!-- Gear Checklist Preview -->
          <div class="lg:col-span-5 rounded-2xl bg-[#fbf9f5] border border-[#ebe5d8] p-3.5 space-y-2">
            <span class="text-[11px] font-extrabold uppercase tracking-wider text-[#1f6f6d] flex items-center gap-1.5">
              <Backpack class="h-3.5 w-3.5" />
              Gear Checklist Peserta ({{ trip.gearChecklist.length }})
            </span>
            <ul class="space-y-1 text-xs text-[#3c4a48]">
              <li v-for="gear in trip.gearChecklist" :key="gear.id" class="flex items-center justify-between gap-2">
                <span class="truncate">&bull; {{ gear.item }}</span>
                <span
                  class="rounded-full px-2 py-0.5 text-[9px] font-extrabold shrink-0"
                  :class="gear.mandatory ? 'bg-orange-100 text-orange-800' : 'bg-stone-200 text-stone-600'"
                >
                  {{ gear.mandatory ? 'Wajib' : 'Opsional' }}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

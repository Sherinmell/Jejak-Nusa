<script setup lang="ts">
import {
  ArrowLeft,
  Backpack,
  ListChecks,
  Plus,
  Send,
  Trash2
} from 'lucide-vue-next'
import {
  ADRENALINE_LEVELS,
  TRIP_CATEGORIES,
  type AdrenalineLevel,
  type TripCategory
} from '#shared/types/trip'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  allowedRoles: ['guide']
})

useSeoMeta({
  title: 'Buat Paket Trip Baru — JejakNusa',
  description: 'Publikasikan paket open trip baru lengkap dengan itinerary harian dan daftar Gear Checklist wajib.'
})

const router = useRouter()

const form = reactive({
  title: '',
  location: '',
  province: 'Bali',
  category: 'Trekking' as TripCategory,
  adrenalineLevel: 'Menengah' as AdrenalineLevel,
  pricePerPerson: 1250000,
  duration: '2 Hari 1 Malam',
  nextDepartureDate: '2026-12-26',
  totalQuota: 10,
  meetingPoint: '',
  shortDescription: ''
})

const itinerary = ref<{ day: string; title: string; activitiesText: string }[]>([
  {
    day: 'Hari 1',
    title: 'Meeting Point, Briefing & Eksplorasi Jalur Utama',
    activitiesText: 'Cek perlengkapan wajib di basecamp\nTrekking menuju pos utama\nMakan siang lokal & sesi foto'
  },
  {
    day: 'Hari 2',
    title: 'Sunrise Summit & Penutupan',
    activitiesText: 'Summit attack dini hari\nSarapan hangat & turun ke basecamp\nPembagian dokumentasi & selesai'
  }
])

const gearChecklist = ref<{ item: string; mandatory: boolean }[]>([
  { item: 'Sepatu outdoor / trekking anti-slip', mandatory: true },
  { item: 'Jaket windproof & jas hujan 2-piece', mandatory: true },
  { item: 'Dry bag 10L & headlamp cadangan', mandatory: true },
  { item: 'Trekking pole & kamera pribadi', mandatory: false }
])

function addDay() {
  const num = itinerary.value.length + 1
  itinerary.value.push({
    day: `Hari ${num}`,
    title: `Agenda Hari ${num}`,
    activitiesText: 'Eksplorasi lanjutan\nEvaluasi & penutupan'
  })
}

function removeDay(index: number) {
  if (itinerary.value.length > 1) {
    itinerary.value.splice(index, 1)
  }
}

function addGear() {
  gearChecklist.value.push({ item: '', mandatory: true })
}

function removeGear(index: number) {
  if (gearChecklist.value.length > 1) {
    gearChecklist.value.splice(index, 1)
  }
}

const submitting = ref(false)
const errorMsg = ref('')

async function handleCreateTrip() {
  submitting.value = true
  errorMsg.value = ''
  try {
    await $fetch('/api/guide/trips', {
      method: 'POST',
      body: {
        ...form,
        itinerary: itinerary.value.map((d) => ({
          day: d.day,
          title: d.title,
          activities: d.activitiesText
            .split('\n')
            .map((a) => a.trim())
            .filter(Boolean)
        })),
        gearChecklist: gearChecklist.value.filter((g) => g.item.trim().length > 0)
      }
    })
    await router.push('/guide/trips')
  } catch (err: unknown) {
    if (err && typeof err === 'object') {
      const e = err as { data?: { statusMessage?: string }; statusMessage?: string }
      errorMsg.value = e.data?.statusMessage || e.statusMessage || 'Gagal membuat paket trip.'
    } else {
      errorMsg.value = 'Gagal membuat paket trip.'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <div class="flex items-center justify-between gap-3">
      <div>
        <NuxtLink
          to="/guide/trips"
          class="inline-flex items-center gap-1 text-xs font-bold text-[#1f6f6d] hover:underline mb-1"
        >
          <ArrowLeft class="h-3.5 w-3.5" />
          Kembali ke Kelola Paket Trip
        </NuxtLink>
        <h1 class="font-editorial text-2xl sm:text-3xl font-bold text-[#162221]">
          Buat Paket Open Trip Baru
        </h1>
        <p class="text-xs sm:text-sm text-[#5c6b69]">
          Paket yang dipublikasikan otomatis muncul di katalog publik beserta daftar Gear Checklist wajibnya.
        </p>
      </div>
    </div>

    <div
      v-if="errorMsg"
      class="rounded-2xl bg-orange-50 border border-orange-200 px-4 py-3 text-xs font-bold text-orange-800"
    >
      {{ errorMsg }}
    </div>

    <form class="space-y-6" @submit.prevent="handleCreateTrip">
      <!-- Basic Info Card -->
      <section class="rounded-[28px] bg-white border border-[#e5dfd2] p-6 space-y-4">
        <h2 class="font-editorial text-lg font-bold text-[#162221]">1. Informasi Utama Paket Trip</h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="sm:col-span-2 space-y-1">
            <label class="block text-xs font-bold text-[#5c6b69]">Judul Paket Open Trip</label>
            <input
              v-model="form.title"
              type="text"
              required
              placeholder="Mis. Summit Gunung Agung via Besakih — Sunrise Expedition"
              class="w-full rounded-xl border border-[#e3dccd] bg-[#fbf9f5] px-3.5 py-2.5 text-sm text-[#162221]"
            >
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-bold text-[#5c6b69]">Lokasi Destinasi</label>
            <input
              v-model="form.location"
              type="text"
              required
              placeholder="Mis. Karangasem, Bali"
              class="w-full rounded-xl border border-[#e3dccd] bg-[#fbf9f5] px-3.5 py-2.5 text-sm text-[#162221]"
            >
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-bold text-[#5c6b69]">Provinsi</label>
            <input
              v-model="form.province"
              type="text"
              required
              class="w-full rounded-xl border border-[#e3dccd] bg-[#fbf9f5] px-3.5 py-2.5 text-sm text-[#162221]"
            >
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-bold text-[#5c6b69]">Kategori</label>
            <select
              v-model="form.category"
              class="w-full rounded-xl border border-[#e3dccd] bg-[#fbf9f5] px-3.5 py-2.5 text-sm font-semibold text-[#162221]"
            >
              <option v-for="cat in TRIP_CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-bold text-[#5c6b69]">Tingkat Adrenalin</label>
            <select
              v-model="form.adrenalineLevel"
              class="w-full rounded-xl border border-[#e3dccd] bg-[#fbf9f5] px-3.5 py-2.5 text-sm font-semibold text-[#162221]"
            >
              <option v-for="lvl in ADRENALINE_LEVELS" :key="lvl" :value="lvl">{{ lvl }}</option>
            </select>
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-bold text-[#5c6b69]">Harga per Peserta (Rp)</label>
            <input
              v-model.number="form.pricePerPerson"
              type="number"
              min="150000"
              step="50000"
              required
              class="w-full rounded-xl border border-[#e3dccd] bg-[#fbf9f5] px-3.5 py-2.5 text-sm font-semibold text-[#162221]"
            >
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-bold text-[#5c6b69]">Batas Kuota Peserta</label>
            <input
              v-model.number="form.totalQuota"
              type="number"
              min="2"
              max="30"
              required
              class="w-full rounded-xl border border-[#e3dccd] bg-[#fbf9f5] px-3.5 py-2.5 text-sm font-semibold text-[#162221]"
            >
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-bold text-[#5c6b69]">Durasi</label>
            <input
              v-model="form.duration"
              type="text"
              required
              placeholder="Mis. 2 Hari 1 Malam"
              class="w-full rounded-xl border border-[#e3dccd] bg-[#fbf9f5] px-3.5 py-2.5 text-sm text-[#162221]"
            >
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-bold text-[#5c6b69]">Tanggal Keberangkatan Terdekat</label>
            <input
              v-model="form.nextDepartureDate"
              type="date"
              required
              class="w-full rounded-xl border border-[#e3dccd] bg-[#fbf9f5] px-3.5 py-2.5 text-sm text-[#162221]"
            >
          </div>

          <div class="sm:col-span-2 space-y-1">
            <label class="block text-xs font-bold text-[#5c6b69]">Meeting Point</label>
            <input
              v-model="form.meetingPoint"
              type="text"
              required
              placeholder="Mis. Basecamp Besakih (06.00 WITA)"
              class="w-full rounded-xl border border-[#e3dccd] bg-[#fbf9f5] px-3.5 py-2.5 text-sm text-[#162221]"
            >
          </div>

          <div class="sm:col-span-2 space-y-1">
            <label class="block text-xs font-bold text-[#5c6b69]">Deskripsi Singkat</label>
            <textarea
              v-model="form.shortDescription"
              rows="2"
              placeholder="Ceritakan daya tarik jalur dan keunggulan pemandu lokal Anda..."
              class="w-full rounded-xl border border-[#e3dccd] bg-[#fbf9f5] px-3.5 py-2.5 text-sm text-[#162221]"
            />
          </div>
        </div>
      </section>

      <!-- Itinerary Builder -->
      <section class="rounded-[28px] bg-white border border-[#e5dfd2] p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="font-editorial text-lg font-bold text-[#162221] flex items-center gap-2">
            <ListChecks class="h-5 w-5 text-[#1f6f6d]" />
            2. Susunan Itinerary Harian
          </h2>
          <button
            type="button"
            class="inline-flex items-center gap-1 rounded-full bg-[#eef7f6] px-3.5 py-1.5 text-xs font-extrabold text-[#175957] hover:bg-[#1f6f6d] hover:text-white transition cursor-pointer"
            @click="addDay"
          >
            <Plus class="h-3.5 w-3.5" />
            Tambah Hari
          </button>
        </div>

        <div class="space-y-3">
          <div
            v-for="(item, idx) in itinerary"
            :key="idx"
            class="rounded-2xl border border-[#e5dfd2] bg-[#fbf9f5] p-4 space-y-3"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-extrabold text-[#1f6f6d]">{{ item.day }}</span>
              <button
                v-if="itinerary.length > 1"
                type="button"
                class="text-xs font-bold text-rose-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                @click="removeDay(idx)"
              >
                <Trash2 class="h-3.5 w-3.5" />
                Hapus
              </button>
            </div>
            <input
              v-model="item.title"
              type="text"
              placeholder="Judul agenda hari ini"
              class="w-full rounded-xl border border-[#e3dccd] bg-white px-3 py-2 text-xs sm:text-sm font-bold text-[#162221]"
            >
            <textarea
              v-model="item.activitiesText"
              rows="3"
              placeholder="Satu aktivitas per baris"
              class="w-full rounded-xl border border-[#e3dccd] bg-white px-3 py-2 text-xs text-[#354442]"
            />
          </div>
        </div>
      </section>

      <!-- Mandatory Gear Checklist Builder -->
      <section class="rounded-[28px] bg-white border border-[#e5dfd2] p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="font-editorial text-lg font-bold text-[#162221] flex items-center gap-2">
            <Backpack class="h-5 w-5 text-[#1f6f6d]" />
            3. Pembuat Daftar Gear Checklist Wajib Peserta
          </h2>
          <button
            type="button"
            class="inline-flex items-center gap-1 rounded-full bg-[#eef7f6] px-3.5 py-1.5 text-xs font-extrabold text-[#175957] hover:bg-[#1f6f6d] hover:text-white transition cursor-pointer"
            @click="addGear"
          >
            <Plus class="h-3.5 w-3.5" />
            Tambah Item Gear
          </button>
        </div>

        <div class="space-y-2.5">
          <div
            v-for="(gear, idx) in gearChecklist"
            :key="idx"
            class="flex flex-col sm:flex-row sm:items-center gap-2 rounded-2xl border border-[#e5dfd2] bg-[#fbf9f5] p-3"
          >
            <input
              v-model="gear.item"
              type="text"
              placeholder="Nama perlengkapan (mis. Sepatu gunung, Headlamp)"
              class="flex-1 rounded-xl border border-[#e3dccd] bg-white px-3 py-2 text-xs sm:text-sm text-[#162221]"
            >
            <label class="inline-flex items-center gap-1.5 text-xs font-bold text-[#354442] px-2 cursor-pointer">
              <input v-model="gear.mandatory" type="checkbox" class="accent-[#1f6f6d]">
              Wajib
            </label>
            <button
              v-if="gearChecklist.length > 1"
              type="button"
              class="rounded-lg p-2 text-rose-600 hover:bg-rose-50 cursor-pointer self-end sm:self-center"
              @click="removeGear(idx)"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <div class="flex items-center justify-end gap-3">
        <NuxtLink
          to="/guide/trips"
          class="rounded-full border border-[#dfd8c8] bg-white px-5 py-3 text-xs font-bold text-[#455553]"
        >
          Batal
        </NuxtLink>
        <button
          type="submit"
          :disabled="submitting"
          class="inline-flex items-center gap-2 rounded-full bg-[#1f6f6d] px-6 py-3 text-xs sm:text-sm font-extrabold text-white shadow-lg hover:bg-[#175957] disabled:opacity-60 transition cursor-pointer"
        >
          <Send class="h-4 w-4" />
          {{ submitting ? 'Memublikasikan...' : 'Publikasikan Paket Open Trip' }}
        </button>
      </div>
    </form>
  </div>
</template>

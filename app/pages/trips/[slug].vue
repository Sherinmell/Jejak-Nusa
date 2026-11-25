<script setup lang="ts">
import {
  ArrowLeft,
  Backpack,
  BedDouble,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  FileCheck2,
  Globe,
  Heart,
  HeartPulse,
  IdCard,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  XCircle
} from 'lucide-vue-next'
import { resolveTripRequirements, type Trip } from '#shared/types/trip'
import type { HotelsApiResponse } from '#shared/types/hotel'
import {
  buildImageSrcSet,
  formatDateID,
  formatRupiah,
  getAdrenalineBadgeClass,
  getAdrenalineDotClass,
  optimizeImageUrl
} from '~/utils/format'

const route = useRoute()
const slug = computed(() => String(route.params.slug || ''))
const { isSaved, toggleSaved } = useSavedTrips()

const [{ data: trip, pending, error }, { data: hotelsData }] = await Promise.all([
  useFetch<Trip>(() => `/api/trips/${slug.value}`),
  useFetch<HotelsApiResponse>('/api/hotels')
])

const nearbyHotels = computed(() => {
  const all = hotelsData.value?.hotels ?? []
  const current = trip.value
  if (!current) return all.slice(0, 2)
  return [...all]
    .sort((a, b) => {
      const aScore = a.nearTripSlug === current.slug ? 2 : a.province === current.province ? 1 : 0
      const bScore = b.nearTripSlug === current.slug ? 2 : b.province === current.province ? 1 : 0
      return bScore - aScore || b.rating - a.rating
    })
    .slice(0, 2)
})

const activeImageIndex = ref(0)
const selectedAddonIds = ref<string[]>([])
const includeCarbonOffset = ref(true)
const ecoPledgeAccepted = ref(true)

watch(slug, () => {
  activeImageIndex.value = 0
  selectedAddonIds.value = []
})

const activeImage = computed(() => {
  if (!trip.value) return ''
  return trip.value.gallery[activeImageIndex.value] ?? trip.value.coverImage
})

const saved = computed(() => (trip.value ? isSaved(trip.value.id) : false))
const tripRequirements = computed(() => (trip.value ? resolveTripRequirements(trip.value) : null))

useSeoMeta({
  title: () => (trip.value ? `${trip.value.title} — JejakNusa` : 'Detail Open Trip — JejakNusa'),
  description: () => trip.value?.shortDescription ?? 'Detail paket open trip petualangan Indonesia bersama pemandu lokal terverifikasi.'
})
</script>

<template>
  <div>
    <!-- Loading State -->
    <div v-if="pending" class="space-y-6 animate-pulse">
      <div class="h-6 w-64 rounded-full bg-[#e9e3d7]" />
      <div class="h-96 rounded-[30px] bg-[#e9e3d7]" />
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-8 space-y-4">
          <div class="h-32 rounded-[26px] bg-[#e9e3d7]" />
          <div class="h-64 rounded-[26px] bg-[#e9e3d7]" />
        </div>
        <div class="lg:col-span-4 h-96 rounded-[28px] bg-[#e9e3d7]" />
      </div>
    </div>

    <!-- Error / Not Found State -->
    <div
      v-else-if="error || !trip"
      class="rounded-[28px] glass-surface p-12 text-center space-y-4 max-w-xl mx-auto my-10"
    >
      <h1 class="font-editorial text-2xl font-bold text-[#162221]">Paket Open Trip Tidak Ditemukan</h1>
      <p class="text-sm text-[#5c6b69]">
        Tautan trip yang Anda buka mungkin sudah tidak tersedia atau alamat URL salah.
      </p>
      <NuxtLink
        to="/trips"
        class="inline-flex items-center gap-2 rounded-full bg-[#1f6f6d] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#175957] transition"
      >
        <ArrowLeft class="h-4 w-4" />
        Kembali ke Katalog Open Trip
      </NuxtLink>
    </div>

    <!-- Main Trip Detail -->
    <div v-else class="space-y-7">
      <!-- Breadcrumb -->
      <nav aria-label="Breadcrumb" class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-[#667472]">
          <NuxtLink to="/" class="hover:text-[#1f6f6d] transition">Beranda</NuxtLink>
          <ChevronRight class="h-3.5 w-3.5 text-[#9ba6a4]" />
          <NuxtLink to="/trips" class="hover:text-[#1f6f6d] transition">Explore</NuxtLink>
          <ChevronRight class="h-3.5 w-3.5 text-[#9ba6a4]" />
          <NuxtLink :to="`/trips?category=${trip.category}`" class="hover:text-[#1f6f6d] transition">
            {{ trip.category }}
          </NuxtLink>
          <ChevronRight class="h-3.5 w-3.5 text-[#9ba6a4]" />
          <span class="text-[#162221] truncate max-w-[200px] sm:max-w-md">{{ trip.title }}</span>
        </div>

        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition cursor-pointer"
          :class="
            saved
              ? 'bg-orange-500 text-white shadow-sm'
              : 'glass-pill text-[#3f4f4d] hover:text-orange-600'
          "
          @click="toggleSaved(trip.id)"
        >
          <Heart class="h-3.5 w-3.5" :class="saved ? 'fill-current' : ''" />
          {{ saved ? 'Tersimpan di Favorit' : 'Simpan Trip' }}
        </button>
      </nav>

      <!-- Title & Meta Card -->
      <div class="rounded-[30px] glass-surface p-5 sm:p-7 space-y-5">
        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-full bg-[#1f6f6d] px-3 py-1 text-xs font-bold text-white">
              {{ trip.category }}
            </span>
            <span
              class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold"
              :class="getAdrenalineBadgeClass(trip.adrenalineLevel)"
            >
              <span class="h-1.5 w-1.5 rounded-full" :class="getAdrenalineDotClass(trip.adrenalineLevel)" />
              Level {{ trip.adrenalineLevel }}
            </span>
            <GuideBadge :guide-name="trip.guide.name" compact />
          </div>

          <h1 class="font-editorial text-2xl sm:text-4xl font-bold tracking-tight text-[#14201f] leading-tight">
            {{ trip.title }}
          </h1>

          <div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm text-[#556462]">
            <span class="inline-flex items-center gap-1.5 font-semibold">
              <MapPin class="h-4 w-4 text-[#1f6f6d]" />
              {{ trip.location }}
            </span>
            <span class="inline-flex items-center gap-1.5 font-bold text-[#162221]">
              <Star class="h-4 w-4 fill-amber-400 text-amber-400" />
              {{ trip.rating.toFixed(1) }}
              <span class="font-normal text-[#6d7a78]">({{ trip.reviewCount }} ulasan)</span>
            </span>
            <span class="inline-flex items-center gap-1.5">
              <Clock class="h-4 w-4 text-[#1f6f6d]" />
              {{ trip.duration }}
            </span>
            <span class="inline-flex items-center gap-1.5">
              <Calendar class="h-4 w-4 text-[#1f6f6d]" />
              Berangkat {{ formatDateID(trip.nextDepartureDate) }}
            </span>
          </div>
        </div>

        <!-- Interactive Photo Gallery -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div class="lg:col-span-9 relative aspect-[16/9] sm:aspect-[16/10] overflow-hidden rounded-[24px] bg-[#144746]">
            <img
              :src="optimizeImageUrl(activeImage, 960, 75)"
              :srcset="buildImageSrcSet(activeImage, [480, 800, 1200], 75)"
              sizes="(max-width: 1024px) 94vw, 880px"
              :alt="trip.title"
              decoding="async"
              fetchpriority="high"
              class="h-full w-full object-cover transition-all duration-300"
            >
            <div class="absolute bottom-3.5 right-3.5 rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white">
              Foto {{ activeImageIndex + 1 }} / {{ trip.gallery.length }}
            </div>
          </div>

          <div class="lg:col-span-3 grid grid-cols-4 lg:grid-cols-1 gap-2.5">
            <button
              v-for="(img, idx) in trip.gallery"
              :key="img + idx"
              type="button"
              class="relative aspect-[16/10] lg:aspect-auto lg:h-full overflow-hidden rounded-[18px] border-2 transition cursor-pointer"
              :class="
                activeImageIndex === idx
                  ? 'border-[#1f6f6d] ring-2 ring-[#1f6f6d]/30'
                  : 'border-transparent opacity-75 hover:opacity-100'
              "
              @click="activeImageIndex = idx"
            >
              <img
                :src="optimizeImageUrl(img, 240, 68)"
                :alt="`${trip.title} galeri ${idx + 1}`"
                loading="lazy"
                decoding="async"
                class="h-full w-full object-cover"
              >
            </button>
          </div>
        </div>
      </div>

      <!-- Main Two-Column Content + Sticky Booking Widget -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        <!-- Left Column: Trip Details -->
        <div class="lg:col-span-8 space-y-6">
          <!-- Quick Facts Cards -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            <div class="rounded-[22px] glass-surface p-4">
              <span class="text-xs font-semibold text-[#667472] flex items-center gap-1.5">
                <Users class="h-3.5 w-3.5 text-[#1f6f6d]" />
                Kuota Peserta
              </span>
              <p class="mt-1 text-sm font-extrabold text-[#162221]">
                Sisa {{ trip.remainingQuota }} / {{ trip.totalQuota }} orang
              </p>
            </div>
            <div class="rounded-[22px] glass-surface p-4">
              <span class="text-xs font-semibold text-[#667472] flex items-center gap-1.5">
                <Clock class="h-3.5 w-3.5 text-[#1f6f6d]" />
                Durasi Trip
              </span>
              <p class="mt-1 text-sm font-extrabold text-[#162221]">{{ trip.duration }}</p>
            </div>
            <div class="col-span-2 sm:col-span-1 rounded-[22px] glass-surface p-4">
              <span class="text-xs font-semibold text-[#667472] flex items-center gap-1.5">
                <MapPin class="h-3.5 w-3.5 text-[#1f6f6d]" />
                Meeting Point
              </span>
              <p class="mt-1 text-xs font-bold text-[#162221] leading-snug">{{ trip.meetingPoint }}</p>
            </div>
          </div>

          <!-- Overview & Highlights -->
          <section class="rounded-[28px] glass-surface p-6 sm:p-7 space-y-6">
            <div>
              <h2 class="font-editorial text-2xl font-bold text-[#162221]">Tentang Petualangan Ini</h2>
              <p class="mt-3 text-sm sm:text-base text-[#495755] leading-relaxed">
                {{ trip.description }}
              </p>
            </div>

            <div class="pt-5 border-t border-[#e8e2d5]">
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-[#1f6f6d] flex items-center gap-1.5 mb-3.5">
                <Sparkles class="h-4 w-4 text-orange-500" />
                Highlight Pengalaman
              </h3>
              <ul class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <li
                  v-for="(item, idx) in trip.highlights"
                  :key="idx"
                  class="flex items-start gap-2.5 rounded-2xl bg-white/90 border border-[#ebe5d8] p-3.5 text-sm text-[#354442]"
                >
                  <CheckCircle2 class="h-4 w-4 text-[#1f6f6d] shrink-0 mt-0.5" />
                  <span>{{ item }}</span>
                </li>
              </ul>
            </div>
          </section>

          <!-- Itinerary / Rundown -->
          <section class="rounded-[28px] glass-surface p-6 sm:p-7">
            <h2 class="font-editorial text-2xl font-bold text-[#162221] mb-6">Rundown &amp; Itinerary</h2>

            <div class="space-y-5">
              <div
                v-for="(step, idx) in trip.itinerary"
                :key="idx"
                class="relative pl-8 pb-5 last:pb-0 border-l-2 border-[#c7e4e0] last:border-l-transparent"
              >
                <span
                  class="absolute -left-[11px] top-0 flex h-5 w-5 items-center justify-center rounded-full bg-[#1f6f6d] text-[11px] font-extrabold text-white ring-4 ring-[#fbf9f5]"
                >
                  {{ idx + 1 }}
                </span>

                <div class="rounded-2xl bg-white/90 border border-[#ebe5d8] p-4 sm:p-5">
                  <span class="text-xs font-extrabold uppercase tracking-wider text-orange-600">
                    {{ step.day }}
                  </span>
                  <h3 class="mt-1 text-base font-extrabold text-[#162221]">
                    {{ step.title }}
                  </h3>
                  <ul class="mt-3 space-y-2 text-sm text-[#4f5d5b]">
                    <li
                      v-for="(act, aIdx) in step.activities"
                      :key="aIdx"
                      class="flex items-start gap-2"
                    >
                      <span class="mt-2 h-1.5 w-1.5 rounded-full bg-[#1f6f6d] shrink-0" />
                      <span class="leading-relaxed">{{ act }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <!-- Included & Excluded Facilities -->
          <section class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="rounded-[28px] glass-surface p-6 space-y-4">
              <h2 class="font-editorial text-xl font-bold text-[#175957] flex items-center gap-2">
                <CheckCircle2 class="h-5 w-5 text-[#1f6f6d]" />
                Fasilitas Termasuk
              </h2>
              <ul class="space-y-2.5 text-sm text-[#354442]">
                <li
                  v-for="(inc, idx) in trip.included"
                  :key="idx"
                  class="flex items-start gap-2.5 leading-relaxed"
                >
                  <CheckCircle2 class="h-4 w-4 text-[#1f6f6d] shrink-0 mt-0.5" />
                  <span>{{ inc }}</span>
                </li>
              </ul>
            </div>

            <div class="rounded-[28px] glass-surface p-6 space-y-4">
              <h2 class="font-editorial text-xl font-bold text-[#162221] flex items-center gap-2">
                <XCircle class="h-5 w-5 text-orange-600" />
                Tidak Termasuk
              </h2>
              <ul class="space-y-2.5 text-sm text-[#576664]">
                <li
                  v-for="(exc, idx) in trip.excluded"
                  :key="idx"
                  class="flex items-start gap-2.5 leading-relaxed"
                >
                  <XCircle class="h-4 w-4 text-[#9aa5a3] shrink-0 mt-0.5" />
                  <span>{{ exc }}</span>
                </li>
              </ul>
            </div>
          </section>

          <!-- Persyaratan Trip & Ketentuan Akomodasi (Hotel / Homestay / Camping) -->
          <section
            v-if="tripRequirements"
            id="persyaratan-trip"
            class="rounded-[28px] glass-surface border-[#c7e4e0] p-6 sm:p-7 space-y-5"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span class="inline-flex items-center gap-1.5 rounded-full bg-[#eef7f6] border border-[#c7e4e0] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#175957]">
                  <ClipboardCheck class="h-3.5 w-3.5" />
                  Wajib Dibaca Sebelum Pemesanan
                </span>
                <h2 class="font-editorial text-2xl font-bold text-[#162221] mt-2">
                  Persyaratan Trip &amp; Ketentuan Akomodasi
                </h2>
                <p class="text-xs sm:text-sm text-[#5c6b69] mt-1">
                  Pastikan seluruh peserta memenuhi persyaratan administrasi, kesehatan fisik, dan aturan menginap demi keselamatan bersama.
                </p>
              </div>
              <span class="rounded-full bg-amber-100 border border-amber-200 px-3 py-1 text-xs font-extrabold text-amber-900">
                Usia Min. {{ tripRequirements.minAge }} Tahun
              </span>
            </div>

            <!-- Syarat Wajib Administrasi & Kesehatan -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="rounded-2xl bg-white/95 border border-[#e5dfd2] p-4 space-y-1.5">
                <span class="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#1f6f6d]">
                  <IdCard class="h-4 w-4" />
                  Identitas Resmi
                </span>
                <p class="text-sm font-extrabold text-[#162221]">
                  {{ tripRequirements.requiresIdCard ? 'Wajib KTP / Paspor Asli' : 'Identitas Opsional' }}
                </p>
                <p class="text-[11px] text-[#5c6b69]">
                  Digunakan untuk pengurusan Simaksi kawasan wisata/taman nasional &amp; registrasi check-in.
                </p>
              </div>

              <div class="rounded-2xl bg-white/95 border border-[#e5dfd2] p-4 space-y-1.5">
                <span class="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-rose-700">
                  <HeartPulse class="h-4 w-4" />
                  Kesehatan Fisik
                </span>
                <p class="text-sm font-extrabold text-[#162221]">
                  {{ tripRequirements.requiresHealthCert ? 'Wajib Surat Sehat H-3' : 'Sehat Jasmani & Fit' }}
                </p>
                <p class="text-[11px] text-[#5c6b69]">
                  {{
                    tripRequirements.requiresHealthCert
                      ? 'Surat Keterangan Sehat dari Klinik/Puskesmas/RS (maks. H-3 keberangkatan) & bebas penyakit kronis berat.'
                      : 'Peserta dalam kondisi fisik prima serta wajib melaporkan riwayat alergi/penyakit saat checkout.'
                  }}
                </p>
              </div>

              <div class="rounded-2xl bg-white/95 border border-[#e5dfd2] p-4 space-y-1.5">
                <span class="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-700">
                  <FileCheck2 class="h-4 w-4" />
                  Batas Usia &amp; Fisik
                </span>
                <p class="text-sm font-extrabold text-[#162221]">
                  Minimal {{ tripRequirements.minAge }} Tahun
                </p>
                <p class="text-[11px] text-[#5c6b69]">
                  Peserta di bawah 18 tahun wajib didampingi orang tua/wali atau melampirkan izin tertulis resmi.
                </p>
              </div>
            </div>

            <!-- Perlengkapan Wajib -->
            <div class="rounded-2xl bg-white/95 border border-[#e5dfd2] p-4 sm:p-5 space-y-3">
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-[#1f6f6d] flex items-center gap-1.5">
                <Backpack class="h-4 w-4" />
                Perlengkapan &amp; Kesiapan Wajib Peserta
              </h3>
              <ul class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm text-[#354442]">
                <li
                  v-for="(gear, idx) in tripRequirements.mandatoryGear"
                  :key="idx"
                  class="flex items-start gap-2"
                >
                  <CheckCircle2 class="h-4 w-4 text-[#1f6f6d] shrink-0 mt-0.5" />
                  <span>{{ gear }}</span>
                </li>
              </ul>
            </div>

            <!-- Kartu Ketentuan Menginap (Hotel / Homestay / Camping) -->
            <div
              v-if="tripRequirements.accommodationType !== 'None'"
              class="rounded-2xl bg-amber-50/80 border-2 border-amber-200 p-5 space-y-3"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h3 class="font-editorial text-lg font-bold text-amber-950 flex items-center gap-2">
                  <BedDouble class="h-5 w-5 text-amber-700" />
                  Ketentuan Menginap ({{ tripRequirements.accommodationType }})
                </h3>
                <span class="rounded-full bg-amber-200/80 px-3 py-0.5 text-[11px] font-extrabold text-amber-950">
                  Tipe: {{ tripRequirements.accommodationType }}
                </span>
              </div>
              <ul class="space-y-2 text-xs sm:text-sm text-amber-950/90">
                <li
                  v-for="(rule, rIdx) in tripRequirements.accommodationRules"
                  :key="rIdx"
                  class="flex items-start gap-2 leading-relaxed"
                >
                  <ShieldCheck class="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>{{ rule }}</span>
                </li>
              </ul>
            </div>

            <div
              v-else
              class="rounded-2xl bg-[#fbf9f5] border border-dashed border-[#c7d7d4] p-4 flex items-start gap-3 text-xs text-[#455553]"
            >
              <BedDouble class="h-4 w-4 text-[#1f6f6d] shrink-0 mt-0.5" />
              <p>
                <strong>Trip 1 Hari (Tanpa Menginap):</strong> Paket ini berlangsung pulang-pergi tanpa bermalam. Jika Anda memilih add-on <strong>Gabung Hotel Dekat Basecamp</strong> pada halaman Checkout, ketentuan check-in (14.00 / check-out 12.00), KTP asli, aturan kamar syariah/gender, dan deposit keamanan hotel akan berlaku otomatis.
              </p>
            </div>
          </section>

          <!-- Contextual AI Trip Q&A Assistant -->
          <TripAiAssistant
            :trip-slug="trip.slug"
            :trip-title="trip.title"
            :guide-name="trip.guide.name"
          />

          <!-- Social Proof: Reels Preview & Participant-Only Shared Media Album -->
          <TripSocialMediaHub :trip="trip" />

          <!-- Eco-Tourism: Carbon Footprint, Local Economic Transparency & Leave No Trace -->
          <EcoImpactPanel
            v-model:include-carbon-offset="includeCarbonOffset"
            v-model:eco-pledge-accepted="ecoPledgeAccepted"
            :trip="trip"
          />

          <!-- Safety & Trust Protocol Panel -->
          <SafetyTrustPanel :trip="trip" />

          <!-- Packing Checklist & Gear Rental Add-Ons -->
          <GearPrepSection
            v-model:selected-addon-ids="selectedAddonIds"
            :category="trip.category"
          />

          <!-- Solo Traveler Community & Pre-Trip Buddies -->
          <TripCommunityBox :trip-slug="trip.slug" :trip-title="trip.title" />

          <!-- Verified Local Guide Profile Card -->
          <section class="rounded-[28px] glass-surface border-[#c7e4e0] p-6 sm:p-7 space-y-6">
            <div class="flex flex-col sm:flex-row sm:items-start gap-5">
              <img
                :src="trip.guide.avatar"
                :alt="trip.guide.name"
                class="h-20 w-20 rounded-2xl object-cover border-2 border-[#c7e4e0] shrink-0"
              >

              <div class="flex-1 space-y-2">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p class="text-xs font-bold uppercase tracking-wider text-[#1f6f6d]">
                      Pemandu Lokal Anda
                    </p>
                    <h2 class="font-editorial text-2xl font-bold text-[#162221]">{{ trip.guide.name }}</h2>
                    <p class="text-xs text-[#667472] mt-0.5">Asal: {{ trip.guide.origin }}</p>
                  </div>

                  <div class="inline-flex items-center gap-1.5 rounded-full bg-[#fff7ec] border border-amber-200 px-3.5 py-1.5">
                    <Star class="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span class="text-sm font-extrabold text-[#162221]">{{ trip.guide.rating.toFixed(2) }}</span>
                    <span class="text-xs text-[#667472]">({{ trip.guide.reviewCount }} ulasan)</span>
                  </div>
                </div>

                <GuideBadge
                  :guide-name="trip.guide.name"
                  :compact="false"
                  :certification="trip.guide.certifications[0]"
                />
              </div>
            </div>

            <p class="text-sm text-[#495755] leading-relaxed">
              {{ trip.guide.bio }}
            </p>

            <!-- Guide Stats -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#e8e2d5]">
              <div class="rounded-2xl bg-white/90 border border-[#ebe5d8] p-3">
                <span class="text-[11px] font-semibold text-[#667472]">Pengalaman</span>
                <p class="text-sm font-extrabold text-[#162221] mt-0.5">{{ trip.guide.experienceYears }} Tahun</p>
              </div>
              <div class="rounded-2xl bg-white/90 border border-[#ebe5d8] p-3">
                <span class="text-[11px] font-semibold text-[#667472]">Trip Dipandu</span>
                <p class="text-sm font-extrabold text-[#162221] mt-0.5">{{ trip.guide.completedTrips }}+ Trip</p>
              </div>
              <div class="rounded-2xl bg-white/90 border border-[#ebe5d8] p-3">
                <span class="text-[11px] font-semibold text-[#667472]">Waktu Respons</span>
                <p class="text-sm font-extrabold text-[#1f6f6d] mt-0.5">{{ trip.guide.responseTime }}</p>
              </div>
              <div class="rounded-2xl bg-white/90 border border-[#ebe5d8] p-3">
                <span class="text-[11px] font-semibold text-[#667472] flex items-center gap-1">
                  <Globe class="h-3 w-3" /> Bahasa
                </span>
                <p class="text-xs font-bold text-[#162221] mt-0.5 truncate">{{ trip.guide.languages.join(', ') }}</p>
              </div>
            </div>

            <!-- Certifications List -->
            <div class="space-y-2">
              <span class="text-xs font-bold uppercase tracking-wider text-[#667472] flex items-center gap-1.5">
                <ShieldCheck class="h-4 w-4 text-[#1f6f6d]" />
                Sertifikasi &amp; Lisensi Terverifikasi
              </span>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="cert in trip.guide.certifications"
                  :key="cert"
                  class="rounded-full bg-[#eef7f6] border border-[#c7e4e0] px-3 py-1.5 text-xs font-bold text-[#175957]"
                >
                  {{ cert }}
                </span>
              </div>
            </div>
          </section>

          <!-- Participant Reviews -->
          <section class="rounded-[28px] glass-surface p-6 sm:p-7 space-y-5">
            <div class="flex items-center justify-between gap-2">
              <h2 class="font-editorial text-2xl font-bold text-[#162221] flex items-center gap-2">
                <MessageSquare class="h-5 w-5 text-[#1f6f6d]" />
                Ulasan Peserta ({{ trip.reviews.length }})
              </h2>
              <span class="inline-flex items-center gap-1 text-sm font-extrabold text-[#162221]">
                <Star class="h-4 w-4 fill-amber-400 text-amber-400" />
                {{ trip.rating.toFixed(1) }} / 5.0
              </span>
            </div>

            <div class="space-y-4">
              <article
                v-for="review in trip.reviews"
                :key="review.id"
                class="rounded-2xl bg-white/90 border border-[#ebe5d8] p-4 sm:p-5 space-y-2"
              >
                <div class="flex items-center justify-between gap-2">
                  <div>
                    <p class="text-sm font-extrabold text-[#162221]">{{ review.author }}</p>
                    <p class="text-xs text-[#667472]">{{ review.authorOrigin }} &bull; {{ formatDateID(review.date) }}</p>
                  </div>
                  <div class="flex items-center gap-0.5 text-amber-400">
                    <Star
                      v-for="n in review.rating"
                      :key="n"
                      class="h-3.5 w-3.5 fill-amber-400"
                    />
                  </div>
                </div>
                <p class="text-sm text-[#43514f] leading-relaxed">"{{ review.comment }}"</p>
              </article>
            </div>
          </section>
        </div>

        <!-- Right Column: Sticky Booking & Split Bill Widget -->
        <aside class="lg:col-span-4 lg:sticky lg:top-6 space-y-4">
          <BookingWidget
            v-model:include-carbon-offset="includeCarbonOffset"
            :trip="trip"
            :selected-addon-ids="selectedAddonIds"
            :eco-pledge-accepted="ecoPledgeAccepted"
          />

          <!-- Nearby Hotels Bundle Card (Gabung Trip + Hotel atau Hotel Saja) -->
          <div class="rounded-[24px] glass-surface p-5 space-y-3.5">
            <div class="flex items-center justify-between gap-2">
              <div>
                <span class="text-[11px] font-extrabold uppercase tracking-wider text-[#1f6f6d] flex items-center gap-1.5">
                  <BedDouble class="h-3.5 w-3.5" />
                  Penginapan Dekat Basecamp
                </span>
                <p class="mt-0.5 font-editorial text-lg font-bold text-[#162221]">
                  Gabung Trip + Hotel Sekaligus
                </p>
              </div>
            </div>

            <div class="space-y-2.5">
              <div
                v-for="hotel in nearbyHotels"
                :key="hotel.id"
                class="rounded-2xl bg-white/95 border border-[#e5dfd2] p-3 space-y-2.5"
              >
                <div class="flex items-center gap-3">
                  <img :src="hotel.coverImage" :alt="hotel.name" class="h-14 w-16 rounded-xl object-cover shrink-0">
                  <div class="min-w-0">
                    <p class="text-xs font-extrabold text-[#162221] truncate">{{ hotel.name }}</p>
                    <p class="text-[10px] text-[#5c6b69] truncate">{{ hotel.distanceToBasecamp }}</p>
                    <p class="text-xs font-extrabold text-[#1f6f6d] mt-0.5">{{ formatRupiah(hotel.pricePerNight) }}/malam</p>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-1.5">
                  <NuxtLink
                    :to="`/customer/checkout/${trip.slug}?hotel=${hotel.slug}`"
                    class="rounded-full bg-[#1f6f6d] px-2.5 py-1.5 text-center text-[10px] font-extrabold text-white hover:bg-[#175957] transition"
                  >
                    + Gabung Trip
                  </NuxtLink>
                  <NuxtLink
                    :to="`/hotels/${hotel.slug}`"
                    class="rounded-full border border-[#1f6f6d] bg-white px-2.5 py-1.5 text-center text-[10px] font-extrabold text-[#1f6f6d] hover:bg-[#eef7f6] transition"
                  >
                    Hotel Saja (QRIS)
                  </NuxtLink>
                </div>
              </div>
            </div>

            <NuxtLink
              :to="`/hotels?q=${encodeURIComponent(trip.province)}`"
              class="inline-flex items-center gap-1 text-xs font-extrabold text-[#1f6f6d] hover:underline"
            >
              Lihat Semua Penginapan di {{ trip.province }}
              <ChevronRight class="h-3.5 w-3.5" />
            </NuxtLink>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

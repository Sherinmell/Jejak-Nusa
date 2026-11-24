<script setup lang="ts">
import {
  Award,
  BadgeCheck,
  CheckCircle2,
  Compass,
  Gift,
  Lock,
  MapPin,
  Medal,
  Sparkles,
  Stamp
} from 'lucide-vue-next'
import type { PassportProfileResponse } from '#shared/types/ecosystem'
import { formatDateID } from '~/utils/format'

useSeoMeta({
  title: 'Adventure Passport & Peta Jejak Pribadi — JejakNusa',
  description:
    'Koleksi stempel destinasi Nusantara, lencana pencapaian digital, poin loyalitas member, dan peta provinsi yang sudah dijelajahi.'
})

const { data: passport, refresh } = await useFetch<PassportProfileResponse>('/api/passport')

const redeemingId = ref<string | null>(null)
const redeemMessage = ref('')
const redeemError = ref('')

interface ProvincePin {
  province: string
  label: string
  x: number
  y: number
}

const indonesiaPins: ProvincePin[] = [
  { province: 'Jawa Barat', label: 'Jawa Barat', x: 185, y: 155 },
  { province: 'DI Yogyakarta', label: 'Yogyakarta', x: 245, y: 168 },
  { province: 'Jawa Timur', label: 'Jawa Timur', x: 300, y: 164 },
  { province: 'Bali', label: 'Bali', x: 348, y: 172 },
  { province: 'Nusa Tenggara Barat', label: 'NTB (Rinjani)', x: 398, y: 175 },
  { province: 'Nusa Tenggara Timur', label: 'NTT (Komodo)', x: 472, y: 182 },
  { province: 'Kalimantan Timur', label: 'Kalimantan Timur', x: 358, y: 82 },
  { province: 'Sulawesi Selatan', label: 'Sulawesi Selatan', x: 432, y: 122 }
]

const selectedProvince = ref<string>('Bali')

const tierProgressPercent = computed(() => {
  if (!passport.value) return 0
  return Math.min(100, Math.round((passport.value.points / passport.value.nextTierPoints) * 100))
})

const selectedProvinceStamp = computed(() =>
  passport.value?.stamps.find((s) => s.province === selectedProvince.value) ?? null
)

async function redeemReward(rewardId: string) {
  redeemingId.value = rewardId
  redeemMessage.value = ''
  redeemError.value = ''
  try {
    const res = await $fetch<{ message: string; code: string }>('/api/passport/redeem', {
      method: 'POST',
      body: { rewardId }
    })
    redeemMessage.value = res.message
    await refresh()
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    redeemError.value = e?.data?.statusMessage || 'Gagal menukar poin.'
  } finally {
    redeemingId.value = null
  }
}
</script>

<template>
  <div v-if="passport" class="space-y-6">
    <!-- Top Adventure Passport & Loyalty Tier Banner -->
    <section class="teal-card rounded-[32px] p-6 sm:p-8 text-white grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
      <div class="lg:col-span-7 space-y-3">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-amber-200">
          <Medal class="h-4 w-4" />
          Adventure Passport &bull; Tier {{ passport.tier }}
        </span>
        <h2 class="font-editorial text-3xl sm:text-4xl font-bold leading-tight">
          {{ passport.explorerName }}
        </h2>
        <p class="text-xs sm:text-sm text-teal-100/90 max-w-xl">
          Setiap open trip yang selesai menambah stempel paspor digital, membuka lencana pencapaian baru, dan mengumpulkan poin yang dapat ditukar diskon atau Early Access kuota terbatas.
        </p>

        <div class="flex flex-wrap gap-3 pt-1 text-xs font-bold">
          <span class="rounded-full bg-white/12 px-3.5 py-1.5">
            {{ passport.completedTripsCount }} Trip Selesai
          </span>
          <span class="rounded-full bg-white/12 px-3.5 py-1.5">
            {{ passport.visitedProvinces.length }} Provinsi Dijelajahi
          </span>
          <span class="rounded-full bg-white/12 px-3.5 py-1.5">
            {{ passport.totalKmExplored }} km Jejak Alam
          </span>
        </div>
      </div>

      <!-- Points & Tier Progress Box -->
      <div class="lg:col-span-5 rounded-[24px] bg-white/12 backdrop-blur-md border border-white/20 p-5 space-y-3">
        <div class="flex items-baseline justify-between gap-2">
          <span class="text-xs font-semibold text-teal-100">Saldo Poin JejakNusa</span>
          <span class="text-3xl font-extrabold text-amber-300">{{ passport.points.toLocaleString('id-ID') }} pts</span>
        </div>

        <div class="space-y-1.5">
          <div class="flex justify-between text-[11px] font-semibold text-teal-100">
            <span>{{ passport.tier }}</span>
            <span>Target {{ passport.nextTierName }} ({{ passport.nextTierPoints }} pts)</span>
          </div>
          <div class="h-2.5 rounded-full bg-black/25 overflow-hidden">
            <div class="h-full rounded-full bg-amber-400 transition-all" :style="{ width: `${tierProgressPercent}%` }" />
          </div>
        </div>

        <p class="text-[11px] text-teal-100/90">
          Butuh <strong>{{ Math.max(0, passport.nextTierPoints - passport.points) }} poin</strong> lagi untuk membuka status Nusantara Legend &amp; prioritas booking VIP.
        </p>
      </div>
    </section>

    <!-- Interactive Indonesia Travel Map (Peta Jejak Pribadi) -->
    <section class="rounded-[30px] glass-surface p-6 sm:p-7 space-y-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span class="text-[11px] font-bold uppercase tracking-wider text-[#1f6f6d]">
            Interactive Travel Map
          </span>
          <h3 class="font-editorial text-2xl font-bold text-[#162221]">
            Peta Jejak Pribadi Nusantara
          </h3>
        </div>
        <div class="flex items-center gap-4 text-xs font-bold">
          <span class="inline-flex items-center gap-1.5 text-[#175957]">
            <span class="h-3 w-3 rounded-full bg-[#1f6f6d]" />
            Sudah Dijelajahi ({{ passport.visitedProvinces.length }})
          </span>
          <span class="inline-flex items-center gap-1.5 text-[#667472]">
            <span class="h-3 w-3 rounded-full bg-amber-400" />
            Belum Dijelajahi
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        <!-- SVG Map Canvas -->
        <div
          class="lg:col-span-8 relative rounded-[24px] overflow-hidden border border-[#bfe1dd] p-4"
          style="background: radial-gradient(circle at 35% 30%, #6ac2bd 0%, #2a8c8a 58%, #165958 100%);"
        >
          <svg viewBox="0 0 600 240" class="w-full h-auto" fill="none">
            <!-- Stylized Indonesian Archipelago Silhouettes -->
            <!-- Sumatra -->
            <path d="M35 45 L115 110 L132 142 L104 148 L22 72 Z" fill="#9bc992" fill-opacity="0.7" stroke="#e4f1d7" stroke-width="2" />
            <!-- Jawa -->
            <path d="M148 152 L225 154 L322 162 L320 176 L220 172 L145 166 Z" fill="#a8d59e" fill-opacity="0.92" stroke="#eef7e5" stroke-width="2" />
            <!-- Bali & Nusa Tenggara -->
            <path d="M335 167 L362 167 L364 178 L336 178 Z" fill="#a8d59e" fill-opacity="0.95" stroke="#eef7e5" stroke-width="2" />
            <path d="M376 168 L422 170 L424 182 L378 180 Z" fill="#a8d59e" fill-opacity="0.95" stroke="#eef7e5" stroke-width="2" />
            <path d="M438 172 L512 176 L508 190 L436 184 Z" fill="#a8d59e" fill-opacity="0.82" stroke="#eef7e5" stroke-width="2" />
            <!-- Kalimantan -->
            <path d="M258 44 L365 40 L394 82 L364 126 L278 122 L248 82 Z" fill="#9cc993" fill-opacity="0.82" stroke="#eef7e5" stroke-width="2" />
            <!-- Sulawesi -->
            <path d="M412 62 L462 60 L452 96 L474 118 L442 134 L416 112 Z" fill="#9cc993" fill-opacity="0.82" stroke="#eef7e5" stroke-width="2" />
            <!-- Papua -->
            <path d="M525 76 L585 95 L588 134 L535 128 L516 98 Z" fill="#9bc992" fill-opacity="0.65" stroke="#e4f1d7" stroke-width="2" />

            <!-- Dashed travel line across visited spots -->
            <path
              d="M245 168 Q272 152 300 164 T348 172 T398 175"
              stroke="#fbbf24"
              stroke-width="2.2"
              stroke-dasharray="5 4"
              stroke-linecap="round"
            />

            <!-- Interactive Province Nodes -->
            <g
              v-for="pin in indonesiaPins"
              :key="pin.province"
              class="cursor-pointer"
              @click="selectedProvince = pin.province"
            >
              <circle
                :cx="pin.x"
                :cy="pin.y"
                :r="selectedProvince === pin.province ? 12 : 8"
                :fill="passport.visitedProvinces.includes(pin.province) ? '#103f3e' : '#f59e0b'"
                stroke="white"
                stroke-width="2.5"
              />
              <circle
                v-if="passport.visitedProvinces.includes(pin.province)"
                :cx="pin.x"
                :cy="pin.y"
                r="3.5"
                fill="#fbbf24"
              />
              <text
                :x="pin.x"
                :y="pin.y - 14"
                text-anchor="middle"
                fill="white"
                font-size="9.5"
                font-weight="700"
              >
                {{ pin.label }}
              </text>
            </g>
          </svg>
        </div>

        <!-- Selected Province Info Card -->
        <div class="lg:col-span-4 rounded-[24px] bg-white/95 border border-[#ebe5d8] p-5 space-y-4">
          <div class="flex items-center justify-between gap-2">
            <span class="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#1f6f6d]">
              <MapPin class="h-4 w-4" />
              {{ selectedProvince }}
            </span>
            <span
              class="rounded-full px-2.5 py-0.5 text-[10px] font-bold"
              :class="
                passport.visitedProvinces.includes(selectedProvince)
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-900'
              "
            >
              {{ passport.visitedProvinces.includes(selectedProvince) ? 'Sudah Dijelajahi' : 'Target Berikutnya' }}
            </span>
          </div>

          <div v-if="selectedProvinceStamp" class="space-y-2">
            <div class="inline-flex items-center gap-1.5 text-xs font-bold text-[#175957]">
              <Stamp class="h-4 w-4" />
              Stempel Digital Aktif
            </div>
            <h4 class="font-editorial text-lg font-bold text-[#162221]">
              {{ selectedProvinceStamp.tripTitle }}
            </h4>
            <p class="text-xs text-[#5c6b69]">
              {{ selectedProvinceStamp.destination }} &bull; {{ formatDateID(selectedProvinceStamp.date) }}
            </p>
            <p class="text-xs text-[#5c6b69]">
              Pemandu: <strong class="text-[#162221]">{{ selectedProvinceStamp.guideName }}</strong>
            </p>
          </div>

          <div v-else class="space-y-2.5">
            <p class="text-sm font-bold text-[#162221]">Belum ada stempel di {{ selectedProvince }}</p>
            <p class="text-xs text-[#5c6b69] leading-relaxed">
              Selesaikan 1 open trip di wilayah ini untuk membuka stempel paspor digital &amp; menambah poin menuju Nusantara Legend!
            </p>
          </div>

          <NuxtLink
            :to="`/trips?q=${encodeURIComponent(selectedProvince.split(' ')[0] || '')}`"
            class="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-[#1f6f6d] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#175957] transition"
          >
            <Compass class="h-4 w-4" />
            Lihat Open Trip di {{ selectedProvince }}
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Digital Badges & Passport Stamps Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Badges -->
      <section class="lg:col-span-7 rounded-[28px] glass-surface p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-editorial text-2xl font-bold text-[#162221] flex items-center gap-2">
            <Award class="h-5 w-5 text-[#1f6f6d]" />
            Lencana Pencapaian (Badges)
          </h3>
          <span class="text-xs font-bold text-[#1f6f6d]">
            {{ passport.badges.filter((b) => b.unlocked).length }}/{{ passport.badges.length }} Terbuka
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div
            v-for="badge in passport.badges"
            :key="badge.id"
            class="rounded-2xl border p-4 space-y-2 transition"
            :class="
              badge.unlocked
                ? 'border-[#c7e4e0] bg-white/95'
                : 'border-[#e8e2d5] bg-[#f4f1ea]/80 opacity-80'
            "
          >
            <div class="flex items-start justify-between gap-2">
              <span
                class="flex h-10 w-10 items-center justify-center rounded-xl"
                :class="badge.unlocked ? 'bg-[#1f6f6d] text-amber-300' : 'bg-stone-200 text-stone-500'"
              >
                <BadgeCheck v-if="badge.unlocked" class="h-5 w-5" />
                <Lock v-else class="h-4 w-4" />
              </span>
              <span class="rounded-full bg-[#eef7f6] px-2.5 py-0.5 text-[10px] font-bold text-[#175957]">
                {{ badge.category }}
              </span>
            </div>
            <div>
              <h4 class="text-sm font-extrabold text-[#162221]">{{ badge.title }}</h4>
              <p class="text-xs text-[#5c6b69] mt-0.5 leading-relaxed">{{ badge.subtitle }}</p>
            </div>
            <p class="text-[11px] font-bold text-[#1f6f6d] pt-1 border-t border-[#ebe5d8]">
              {{ badge.progressText }}
            </p>
          </div>
        </div>
      </section>

      <!-- Points Redeem & Early Access Rewards -->
      <section class="lg:col-span-5 rounded-[28px] glass-surface p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-editorial text-2xl font-bold text-[#162221] flex items-center gap-2">
            <Gift class="h-5 w-5 text-orange-600" />
            Tukar Poin &amp; Early Access
          </h3>
        </div>

        <div v-if="redeemMessage" class="rounded-2xl bg-[#eef7f6] border border-[#c7e4e0] p-3 text-xs font-bold text-[#175957]">
          {{ redeemMessage }}
        </div>
        <div v-if="redeemError" class="rounded-2xl bg-orange-50 border border-orange-200 p-3 text-xs font-bold text-orange-800">
          {{ redeemError }}
        </div>

        <div class="space-y-3">
          <div
            v-for="rew in passport.rewards"
            :key="rew.id"
            class="rounded-2xl bg-white/95 border border-[#ebe5d8] p-4 space-y-2.5"
          >
            <div class="flex items-start justify-between gap-2">
              <div>
                <span class="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                  <Sparkles class="h-3 w-3" />
                  {{ rew.badgeText }}
                </span>
                <h4 class="mt-1 text-sm font-extrabold text-[#162221]">{{ rew.title }}</h4>
              </div>
              <span class="text-xs font-extrabold text-[#1f6f6d] shrink-0">{{ rew.pointsCost }} pts</span>
            </div>

            <p class="text-xs text-[#5c6b69] leading-relaxed">{{ rew.description }}</p>

            <div v-if="rew.redeemedCode" class="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 flex items-center justify-between text-xs font-bold text-emerald-900">
              <span class="inline-flex items-center gap-1.5">
                <CheckCircle2 class="h-4 w-4 text-emerald-700" />
                Kode Aktif:
              </span>
              <code class="font-mono text-emerald-950">{{ rew.redeemedCode }}</code>
            </div>

            <button
              v-else
              type="button"
              :disabled="redeemingId === rew.id || passport.points < rew.pointsCost"
              class="w-full rounded-full bg-[#1f6f6d] px-4 py-2 text-xs font-bold text-white hover:bg-[#175957] disabled:opacity-45 transition cursor-pointer"
              @click="redeemReward(rew.id)"
            >
              {{
                redeemingId === rew.id
                  ? 'Memproses...'
                  : passport.points < rew.pointsCost
                    ? 'Poin Belum Cukup'
                    : `Tukar ${rew.pointsCost} Poin`
              }}
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

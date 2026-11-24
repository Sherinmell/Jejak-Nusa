<script setup lang="ts">
import { Backpack, CheckSquare, PlusCircle, CheckCircle2, Sparkles } from 'lucide-vue-next'
import type { TripCategory } from '#shared/types/trip'
import { GEAR_ADDONS, PACKING_CHECKLIST_BY_CATEGORY } from '#shared/types/adventure'
import { formatRupiah } from '~/utils/format'

interface Props {
  category: TripCategory
  selectedAddonIds: string[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:selectedAddonIds': [ids: string[]]
}>()

const checklist = computed(() => PACKING_CHECKLIST_BY_CATEGORY[props.category] ?? [])
const checkedItems = ref<string[]>([])

const readinessPercent = computed(() => {
  if (!checklist.value.length) return 0
  return Math.round((checkedItems.value.length / checklist.value.length) * 100)
})

function toggleChecklistItem(id: string) {
  if (checkedItems.value.includes(id)) {
    checkedItems.value = checkedItems.value.filter((item) => item !== id)
  } else {
    checkedItems.value = [...checkedItems.value, id]
  }
}

const recommendedAddons = computed(() =>
  GEAR_ADDONS.filter((addon) => addon.recommendedFor.includes(props.category))
)

function toggleAddon(id: string) {
  const exists = props.selectedAddonIds.includes(id)
  const next = exists
    ? props.selectedAddonIds.filter((x) => x !== id)
    : [...props.selectedAddonIds, id]
  emit('update:selectedAddonIds', next)
}
</script>

<template>
  <section class="rounded-[28px] glass-surface p-6 sm:p-7 space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e8e2d5]">
      <div class="flex items-start gap-3">
        <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef7f6] text-[#1f6f6d]">
          <Backpack class="h-5 w-5" />
        </span>
        <div>
          <span class="text-[11px] font-bold uppercase tracking-wider text-[#1f6f6d]">
            Persiapan &amp; Perlengkapan
          </span>
          <h2 class="font-editorial text-2xl font-bold text-[#162221]">
            Checklist Bawaan &amp; Sewa Gear Add-On
          </h2>
        </div>
      </div>

      <div class="rounded-2xl bg-white/90 border border-[#ebe5d8] px-3.5 py-2 text-right self-start">
        <span class="block text-[10px] font-bold uppercase tracking-wider text-[#667472]">Kesiapan Packing</span>
        <span class="text-sm font-extrabold text-[#1f6f6d]">
          {{ checkedItems.length }}/{{ checklist.length }} siap ({{ readinessPercent }}%)
        </span>
      </div>
    </div>

    <!-- Interactive Packing Checklist -->
    <div class="space-y-3">
      <div class="flex items-center justify-between text-xs">
        <span class="font-extrabold uppercase tracking-wider text-[#4a5957] flex items-center gap-1.5">
          <CheckSquare class="h-4 w-4 text-[#1f6f6d]" />
          Daftar Bawaan Pribadi ({{ category }})
        </span>
      </div>

      <div class="h-2 w-full rounded-full bg-[#e6dfd1] overflow-hidden">
        <div
          class="h-full rounded-full bg-[#1f6f6d] transition-all duration-300"
          :style="{ width: `${readinessPercent}%` }"
        />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        <label
          v-for="item in checklist"
          :key="item.id"
          class="flex items-start gap-3 rounded-2xl border p-3.5 cursor-pointer transition"
          :class="
            checkedItems.includes(item.id)
              ? 'border-[#1f6f6d] bg-[#eef7f6]/70'
              : 'border-[#ebe5d8] bg-white/90 hover:border-[#1f6f6d]/40'
          "
        >
          <input
            type="checkbox"
            :checked="checkedItems.includes(item.id)"
            class="mt-0.5 h-4 w-4 rounded accent-[#1f6f6d] cursor-pointer"
            @change="toggleChecklistItem(item.id)"
          >
          <div class="text-xs leading-relaxed">
            <span
              class="font-bold text-[#162221]"
              :class="checkedItems.includes(item.id) ? 'line-through text-[#667472]' : ''"
            >
              {{ item.label }}
            </span>
            <span
              v-if="item.required"
              class="ml-1.5 inline-block rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-800"
            >
              Wajib
            </span>
            <p class="mt-0.5 text-[11px] text-[#667472]">{{ item.tip }}</p>
          </div>
        </label>
      </div>
    </div>

    <!-- Add-On Gear Rental Services -->
    <div class="pt-5 border-t border-[#e8e2d5] space-y-3.5">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 class="text-sm font-extrabold text-[#162221] flex items-center gap-1.5">
            <Sparkles class="h-4 w-4 text-orange-500" />
            Layanan Tambahan &amp; Sewa Perlengkapan (Add-On)
          </h3>
          <p class="text-xs text-[#5c6b69] mt-0.5">
            Pilih perlengkapan yang ingin disewa — biaya otomatis masuk ke kalkulator Booking &amp; Split Bill.
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          v-for="addon in recommendedAddons"
          :key="addon.id"
          type="button"
          class="text-left rounded-2xl border p-4 transition cursor-pointer flex flex-col justify-between gap-3"
          :class="
            selectedAddonIds.includes(addon.id)
              ? 'border-[#1f6f6d] bg-[#eef7f6] shadow-xs'
              : 'border-[#ebe5d8] bg-white/90 hover:border-[#1f6f6d]/40'
          "
          @click="toggleAddon(addon.id)"
        >
          <div class="space-y-1">
            <div class="flex items-start justify-between gap-2">
              <span class="rounded-full bg-white border border-[#e3dccd] px-2 py-0.5 text-[10px] font-bold text-[#4a5957]">
                {{ addon.category }}
              </span>
              <CheckCircle2
                v-if="selectedAddonIds.includes(addon.id)"
                class="h-5 w-5 text-[#1f6f6d] shrink-0"
              />
              <PlusCircle v-else class="h-5 w-5 text-[#9ba6a4] shrink-0" />
            </div>
            <h4 class="text-sm font-extrabold text-[#162221] pt-1">{{ addon.name }}</h4>
            <p class="text-xs text-[#5c6b69] leading-relaxed">{{ addon.description }}</p>
          </div>

          <div class="flex items-baseline justify-between pt-2 border-t border-[#e8e2d5]/80">
            <span class="text-sm font-extrabold text-[#1f6f6d]">+{{ formatRupiah(addon.price) }}</span>
            <span class="text-[11px] font-semibold text-[#6d7a78]">{{ addon.unit }}</span>
          </div>
        </button>
      </div>
    </div>
  </section>
</template>

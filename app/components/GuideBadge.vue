<script setup lang="ts">
import { BadgeCheck } from 'lucide-vue-next'

interface Props {
  guideName?: string
  compact?: boolean
  certification?: string
}

withDefaults(defineProps<Props>(), {
  guideName: '',
  compact: true,
  certification: ''
})
</script>

<template>
  <div
    v-if="compact"
    class="inline-flex items-center gap-1.5 rounded-full bg-[#eef7f6] px-2.5 py-1 text-[11px] font-bold text-[#175957] border border-[#c7e4e0]"
    :title="guideName ? `Dipandu oleh ${guideName} — Pemandu Lokal Terverifikasi` : 'Pemandu Lokal Terverifikasi'"
  >
    <BadgeCheck class="h-3.5 w-3.5 text-[#1f6f6d] shrink-0" />
    <span>Pemandu Terverifikasi</span>
  </div>

  <div
    v-else
    class="inline-flex flex-wrap items-center gap-2 rounded-2xl bg-[#eef7f6] px-3.5 py-2 text-xs font-bold text-[#175957] border border-[#c7e4e0]"
  >
    <span class="inline-flex items-center gap-1.5">
      <BadgeCheck class="h-4 w-4 text-[#1f6f6d] shrink-0" />
      <span>Pemandu Lokal Terverifikasi</span>
    </span>
    <span
      v-if="certification"
      class="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#1f6f6d] border border-[#d5ece9]"
    >
      {{ certification }}
    </span>
  </div>
</template>

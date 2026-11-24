<script setup lang="ts">
import {
  BadgeCheck,
  CheckCircle2,
  Eye,
  FileText,
  ShieldCheck,
  X,
  XCircle
} from 'lucide-vue-next'
import type { GuideVerificationApplication } from '#shared/types/guide'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'role'],
  allowedRoles: ['admin']
})

useSeoMeta({
  title: 'Verifikasi Pemandu Lokal — Admin JejakNusa',
  description: 'Tinjau dokumen lisensi APGI, POSSI, ICOpro, FAJI, dan HPI lalu setujui atau tolak verifikasi pemandu.'
})

const { data, refresh } = await useFetch<{
  applications: GuideVerificationApplication[]
  pendingCount: number
  approvedCount: number
}>('/api/admin/verifications')

const applications = computed(() => data.value?.applications ?? [])
const previewApp = ref<GuideVerificationApplication | null>(null)
const processingId = ref('')
const feedback = ref('')

async function handleDecision(app: GuideVerificationApplication, decision: 'approved' | 'rejected') {
  processingId.value = app.id
  feedback.value = ''
  try {
    await $fetch(`/api/admin/verifications/${app.id}`, {
      method: 'PATCH',
      body: { decision }
    })
    feedback.value =
      decision === 'approved'
        ? `Lisensi ${app.licenseBody} milik ${app.guideName} telah DISETUJUI. Badge Terverifikasi kini aktif.`
        : `Pengajuan verifikasi milik ${app.guideName} telah ditolak.`
    previewApp.value = null
    await refresh()
  } finally {
    processingId.value = ''
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <span class="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#1f6f6d]">
          <ShieldCheck class="h-4 w-4" />
          Kurasi &amp; Keamanan Pemandu
        </span>
        <h1 class="font-editorial text-2xl sm:text-3xl font-bold text-[#162221]">
          Verifikasi Lisensi Pemandu Lokal
        </h1>
        <p class="text-xs sm:text-sm text-[#5c6b69]">
          Periksa dokumen sertifikasi resmi (APGI, POSSI, ICOpro, FAJI, HPI) sebelum mengaktifkan badge Terverifikasi pemandu.
        </p>
      </div>

      <div class="flex items-center gap-2 text-xs font-extrabold">
        <span class="rounded-full bg-amber-100 px-3 py-1.5 text-amber-900">
          Menunggu: {{ data?.pendingCount || 0 }}
        </span>
        <span class="rounded-full bg-emerald-100 px-3 py-1.5 text-emerald-800">
          Disetujui: {{ data?.approvedCount || 0 }}
        </span>
      </div>
    </div>

    <div
      v-if="feedback"
      class="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-bold text-emerald-800"
    >
      {{ feedback }}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div
        v-for="app in applications"
        :key="app.id"
        class="rounded-[28px] bg-white border p-5 sm:p-6 space-y-4"
        :class="app.status === 'pending' ? 'border-amber-300 shadow-sm' : 'border-[#e5dfd2]'"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3.5">
            <img :src="app.avatar" :alt="app.guideName" class="h-14 w-14 rounded-2xl object-cover shrink-0">
            <div>
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="rounded-full bg-[#eef7f6] px-2.5 py-0.5 text-[10px] font-extrabold text-[#175957]">
                  {{ app.licenseBody }}
                </span>
                <span
                  class="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold"
                  :class="
                    app.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : app.status === 'rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-900'
                  "
                >
                  {{
                    app.status === 'approved'
                      ? 'Terverifikasi ✓'
                      : app.status === 'rejected'
                        ? 'Ditolak'
                        : 'Menunggu Review'
                  }}
                </span>
              </div>
              <h2 class="text-base font-extrabold text-[#162221] mt-1 flex items-center gap-1.5">
                {{ app.guideName }}
                <BadgeCheck v-if="app.status === 'approved'" class="h-4 w-4 text-[#1f6f6d]" />
              </h2>
              <p class="text-xs text-[#5c6b69]">{{ app.origin }} &bull; {{ app.email }}</p>
            </div>
          </div>
        </div>

        <div class="rounded-2xl bg-[#fbf9f5] border border-[#ebe5d8] p-3.5 space-y-1.5 text-xs">
          <div class="flex items-center justify-between">
            <span class="text-[#5c6b69]">Nomor Lisensi</span>
            <span class="font-mono font-extrabold text-[#162221]">{{ app.licenseNumber }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[#5c6b69]">Spesialisasi &amp; Pengalaman</span>
            <span class="font-bold text-[#162221]">{{ app.specialty }} ({{ app.experienceYears }} tahun)</span>
          </div>
          <div class="flex items-center justify-between gap-2">
            <span class="text-[#5c6b69]">Dokumen Terlampir</span>
            <span class="font-bold text-[#1f6f6d] truncate">{{ app.documentTitle }}</span>
          </div>
        </div>

        <p v-if="app.reviewNote" class="text-[11px] font-semibold text-[#455553]">
          Catatan Review: {{ app.reviewNote }}
        </p>

        <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-full border border-[#dfd8c8] bg-white px-3.5 py-2 text-xs font-bold text-[#354442] hover:border-[#1f6f6d] hover:text-[#1f6f6d] transition cursor-pointer"
            @click="previewApp = app"
          >
            <Eye class="h-3.5 w-3.5" />
            Pratinjau Dokumen
          </button>

          <div class="flex items-center gap-2">
            <button
              v-if="app.status !== 'rejected'"
              type="button"
              :disabled="processingId === app.id"
              class="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-50 px-3.5 py-2 text-xs font-extrabold text-rose-700 hover:bg-rose-600 hover:text-white disabled:opacity-50 transition cursor-pointer"
              @click="handleDecision(app, 'rejected')"
            >
              <XCircle class="h-3.5 w-3.5" />
              Tolak
            </button>

            <button
              v-if="app.status !== 'approved'"
              type="button"
              :disabled="processingId === app.id"
              class="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-emerald-700 disabled:opacity-50 transition cursor-pointer"
              @click="handleDecision(app, 'approved')"
            >
              <CheckCircle2 class="h-3.5 w-3.5" />
              Setujui (Approve)
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- License Document Preview Modal -->
    <Teleport to="body">
      <div
        v-if="previewApp"
        class="fixed inset-0 z-50 flex items-center justify-center bg-[#0d2423]/60 backdrop-blur-xs p-4"
        @click.self="previewApp = null"
      >
        <div class="w-full max-w-xl rounded-[28px] bg-[#fbf9f5] border border-white p-6 shadow-2xl space-y-4">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-2.5">
              <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1f6f6d] text-white">
                <FileText class="h-5 w-5" />
              </span>
              <div>
                <h3 class="font-editorial text-lg font-bold text-[#162221]">{{ previewApp.documentTitle }}</h3>
                <p class="text-xs text-[#5c6b69]">{{ previewApp.guideName }} &bull; {{ previewApp.licenseNumber }}</p>
              </div>
            </div>
            <button
              type="button"
              class="rounded-full p-1.5 text-stone-500 hover:bg-stone-200 cursor-pointer"
              @click="previewApp = null"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="relative rounded-2xl overflow-hidden border border-[#e5dfd2]">
            <img :src="previewApp.documentPreviewUrl" :alt="previewApp.documentTitle" class="h-64 w-full object-cover">
            <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex flex-col justify-end p-5 text-white">
              <span class="text-[10px] font-extrabold uppercase tracking-widest text-amber-300">
                Sertifikat Resmi {{ previewApp.licenseBody }}
              </span>
              <p class="font-editorial text-xl font-bold">{{ previewApp.guideName }}</p>
              <p class="text-xs font-mono text-teal-100">No. Reg: {{ previewApp.licenseNumber }} &bull; Tanggal Pengajuan: {{ previewApp.submittedAt }}</p>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2">
            <button
              type="button"
              class="rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-extrabold text-rose-700 hover:bg-rose-600 hover:text-white cursor-pointer"
              @click="handleDecision(previewApp, 'rejected')"
            >
              Tolak Pengajuan
            </button>
            <button
              type="button"
              class="rounded-full bg-emerald-600 px-5 py-2 text-xs font-extrabold text-white hover:bg-emerald-700 cursor-pointer"
              @click="handleDecision(previewApp, 'approved')"
            >
              Setujui &amp; Aktifkan Badge
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

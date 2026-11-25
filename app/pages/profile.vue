<script setup lang="ts">
import {
  AtSign,
  BadgeCheck,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Upload,
  User
} from 'lucide-vue-next'
import { getRoleLabel } from '#shared/types/auth'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth']
})

useSeoMeta({
  title: 'Edit Profil Akun — JejakNusa',
  description: 'Ubah nama, username, foto profil, nomor WhatsApp, kota asal, dan kata sandi akun JejakNusa Anda.'
})

const { user, loading, updateProfile } = useAuth()

const presetAvatars = [
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=240&q=80'
]

const form = reactive({
  name: user.value?.name || '',
  username: user.value?.username || '',
  email: user.value?.email || '',
  phone: user.value?.phone || '',
  origin: user.value?.origin || 'Indonesia',
  avatar: user.value?.avatar || presetAvatars[0]!
})

watch(
  user,
  (u) => {
    if (!u) return
    form.name = u.name
    form.username = u.username || ''
    form.email = u.email
    form.phone = u.phone || ''
    form.origin = u.origin
    form.avatar = u.avatar
  },
  { immediate: true }
)

const avatarPreview = computed(() => form.avatar || user.value?.avatar || presetAvatars[0]!)
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploadingPhoto = ref(false)

const profileSuccess = ref('')
const profileError = ref('')

// Password change state
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showPasswords = ref(false)
const passwordSaving = ref(false)
const passwordSuccess = ref('')
const passwordError = ref('')

function extractError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const e = err as { data?: { statusMessage?: string }; statusMessage?: string; message?: string }
    return e.data?.statusMessage || e.statusMessage || e.message || fallback
  }
  return fallback
}

function triggerFilePicker() {
  fileInputRef.value?.click()
}

function handleAvatarFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    profileError.value = 'File harus berupa gambar (JPG, PNG, atau WebP).'
    return
  }

  profileError.value = ''
  uploadingPhoto.value = true

  const reader = new FileReader()
  reader.onload = () => {
    const img = new Image()
    img.onload = () => {
      try {
        const size = 256
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          form.avatar = String(reader.result || '')
          uploadingPhoto.value = false
          return
        }
        // Center-crop square thumbnail
        const minDim = Math.min(img.width, img.height)
        const sx = (img.width - minDim) / 2
        const sy = (img.height - minDim) / 2
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size)
        form.avatar = canvas.toDataURL('image/jpeg', 0.84)
      } finally {
        uploadingPhoto.value = false
      }
    }
    img.onerror = () => {
      profileError.value = 'Gagal membaca file gambar. Coba gambar lain.'
      uploadingPhoto.value = false
    }
    img.src = String(reader.result || '')
  }
  reader.readAsDataURL(file)
}

async function handleSaveProfile() {
  profileSuccess.value = ''
  profileError.value = ''
  try {
    const res = await updateProfile({
      name: form.name,
      username: user.value?.role === 'admin' ? undefined : form.username || undefined,
      email: form.email,
      phone: form.phone,
      origin: form.origin,
      avatar: form.avatar
    })
    profileSuccess.value = res.message || 'Profil berhasil diperbarui!'
  } catch (err) {
    profileError.value = extractError(err, 'Gagal menyimpan perubahan profil.')
  }
}

async function handleChangePassword() {
  passwordSuccess.value = ''
  passwordError.value = ''

  if (newPassword.value.length < 6) {
    passwordError.value = 'Kata sandi baru minimal 6 karakter.'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = 'Konfirmasi kata sandi baru tidak cocok.'
    return
  }

  passwordSaving.value = true
  try {
    const res = await updateProfile({
      name: form.name,
      email: form.email,
      currentPassword: currentPassword.value,
      newPassword: newPassword.value
    })
    passwordSuccess.value = res.message || 'Kata sandi berhasil diperbarui!'
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (err) {
    passwordError.value = extractError(err, 'Gagal memperbarui kata sandi.')
  } finally {
    passwordSaving.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Top Profile Header Banner -->
    <div class="rounded-[28px] teal-card p-6 sm:p-7 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <div class="relative shrink-0">
          <img
            :src="avatarPreview"
            :alt="form.name || 'Profil'"
            class="h-18 w-18 sm:h-20 sm:w-20 rounded-2xl object-cover border-2 border-white/40 shadow-lg"
          >
          <button
            type="button"
            class="absolute -bottom-1.5 -right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-[#103f3e] shadow hover:bg-amber-300 transition cursor-pointer"
            title="Ganti Foto Profil"
            @click="triggerFilePicker"
          >
            <Camera class="h-4 w-4" />
          </button>
        </div>

        <div class="space-y-1 min-w-0">
          <span class="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-0.5 text-[11px] font-extrabold text-amber-200">
            <BadgeCheck class="h-3.5 w-3.5" />
            {{ getRoleLabel(user?.role) }}
          </span>
          <h1 class="font-editorial text-2xl sm:text-3xl font-bold truncate">
            {{ user?.name || 'Profil Akun' }}
          </h1>
          <p class="text-xs text-teal-100/90 truncate">
            <span v-if="user?.username">@{{ user.username }} &bull; </span>{{ user?.email }}
          </p>
        </div>
      </div>

      <span class="inline-flex items-center gap-1.5 self-start sm:self-center rounded-full bg-white/12 border border-white/20 px-3.5 py-1.5 text-[11px] font-bold text-teal-50">
        <ShieldCheck class="h-3.5 w-3.5 text-amber-300" />
        Tersimpan ke TiDB Cloud
      </span>
    </div>

    <!-- Section 1: Edit Profile Info & Photo -->
    <section class="rounded-[28px] bg-white border border-[#e5dfd2] p-6 sm:p-7 space-y-6">
      <div>
        <h2 class="font-editorial text-xl font-bold text-[#162221]">
          1. Informasi Profil &amp; Foto Akun
        </h2>
        <p class="text-xs sm:text-sm text-[#5c6b69]">
          Perubahan langsung tampil di sapaan beranda, formulir checkout, bukti pembayaran, dan sertifikat Anda.
        </p>
      </div>

      <div
        v-if="profileSuccess"
        class="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-bold text-emerald-800 flex items-center gap-2"
      >
        <CheckCircle2 class="h-4 w-4 shrink-0" />
        {{ profileSuccess }}
      </div>
      <div
        v-if="profileError"
        class="rounded-2xl bg-orange-50 border border-orange-200 px-4 py-3 text-xs font-bold text-orange-800"
      >
        {{ profileError }}
      </div>

      <!-- Photo Picker & Presets -->
      <div class="rounded-2xl bg-[#fbf9f5] border border-[#e5dfd2] p-4 sm:p-5 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3.5">
            <img
              :src="avatarPreview"
              alt="Preview Foto Profil"
              class="h-16 w-16 rounded-2xl object-cover border-2 border-[#c7e4e0] shrink-0"
            >
            <div>
              <p class="text-sm font-extrabold text-[#162221]">Foto Profil</p>
              <p class="text-[11px] text-[#5c6b69]">
                Unggah foto dari galeri HP/komputer (otomatis dikompres) atau pilih avatar siap pakai di bawah.
              </p>
            </div>
          </div>

          <div class="shrink-0">
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleAvatarFileChange"
            >
            <button
              type="button"
              :disabled="uploadingPhoto"
              class="inline-flex items-center gap-1.5 rounded-full border border-[#1f6f6d] bg-white px-4 py-2 text-xs font-extrabold text-[#1f6f6d] hover:bg-[#eef7f6] transition cursor-pointer"
              @click="triggerFilePicker"
            >
              <Upload class="h-3.5 w-3.5" />
              {{ uploadingPhoto ? 'Memproses Foto...' : 'Upload Foto' }}
            </button>
          </div>
        </div>

        <div class="space-y-2">
          <span class="block text-[11px] font-bold uppercase tracking-wider text-[#5c6b69]">
            Atau Pilih Avatar Cepat
          </span>
          <div class="flex flex-wrap items-center gap-2.5">
            <button
              v-for="(preset, idx) in presetAvatars"
              :key="idx"
              type="button"
              class="relative rounded-2xl overflow-hidden border-2 transition cursor-pointer"
              :class="form.avatar === preset ? 'border-[#1f6f6d] ring-2 ring-[#1f6f6d]/25 scale-105' : 'border-transparent opacity-80 hover:opacity-100'"
              @click="form.avatar = preset"
            >
              <img :src="preset" :alt="`Avatar ${idx + 1}`" class="h-12 w-12 object-cover">
            </button>
          </div>
        </div>
      </div>

      <!-- Profile Text Fields -->
      <form class="space-y-4" @submit.prevent="handleSaveProfile">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label for="prof-name" class="block text-xs font-bold uppercase tracking-wider text-[#5c6b69]">
              Nama Lengkap <span class="text-orange-600">*</span>
            </label>
            <div class="relative">
              <User class="h-4 w-4 text-[#7a8785] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="prof-name"
                v-model="form.name"
                type="text"
                required
                minlength="2"
                class="w-full rounded-full border border-[#e3dccd] bg-[#fbf9f5] pl-11 pr-4 py-3 text-sm font-semibold text-[#162221] focus:border-[#1f6f6d] focus:bg-white focus:outline-none"
              >
            </div>
          </div>

          <div class="space-y-1.5">
            <label for="prof-username" class="block text-xs font-bold uppercase tracking-wider text-[#5c6b69]">
              Username (Untuk Login)
            </label>
            <div class="relative">
              <AtSign class="h-4 w-4 text-[#7a8785] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="prof-username"
                v-model="form.username"
                type="text"
                :readonly="user?.role === 'admin'"
                minlength="3"
                pattern="[a-zA-Z0-9._-]+"
                placeholder="Mis. rina_oktavia"
                class="w-full rounded-full border border-[#e3dccd] bg-[#fbf9f5] pl-11 pr-4 py-3 text-sm font-semibold text-[#162221] focus:border-[#1f6f6d] focus:bg-white focus:outline-none read-only:opacity-65 read-only:cursor-not-allowed"
              >
            </div>
          </div>

          <div class="space-y-1.5">
            <label for="prof-email" class="block text-xs font-bold uppercase tracking-wider text-[#5c6b69]">
              Alamat Email <span class="text-orange-600">*</span>
            </label>
            <div class="relative">
              <Mail class="h-4 w-4 text-[#7a8785] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="prof-email"
                v-model="form.email"
                type="email"
                required
                class="w-full rounded-full border border-[#e3dccd] bg-[#fbf9f5] pl-11 pr-4 py-3 text-sm text-[#162221] focus:border-[#1f6f6d] focus:bg-white focus:outline-none"
              >
            </div>
          </div>

          <div class="space-y-1.5">
            <label for="prof-phone" class="block text-xs font-bold uppercase tracking-wider text-[#5c6b69]">
              Nomor WhatsApp
            </label>
            <div class="relative">
              <Phone class="h-4 w-4 text-[#7a8785] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="prof-phone"
                v-model="form.phone"
                type="tel"
                placeholder="Mis. 0812-3456-7890"
                class="w-full rounded-full border border-[#e3dccd] bg-[#fbf9f5] pl-11 pr-4 py-3 text-sm text-[#162221] focus:border-[#1f6f6d] focus:bg-white focus:outline-none"
              >
            </div>
          </div>

          <div class="space-y-1.5 sm:col-span-2">
            <label for="prof-origin" class="block text-xs font-bold uppercase tracking-wider text-[#5c6b69]">
              Kota Asal
            </label>
            <div class="relative">
              <MapPin class="h-4 w-4 text-[#7a8785] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="prof-origin"
                v-model="form.origin"
                type="text"
                placeholder="Mis. Jakarta, Bandung, Surabaya, Makassar"
                class="w-full rounded-full border border-[#e3dccd] bg-[#fbf9f5] pl-11 pr-4 py-3 text-sm text-[#162221] focus:border-[#1f6f6d] focus:bg-white focus:outline-none"
              >
            </div>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <button
            type="submit"
            :disabled="loading || uploadingPhoto"
            class="inline-flex items-center gap-2 rounded-full bg-[#1f6f6d] px-6 py-3 text-sm font-extrabold text-white shadow-md hover:bg-[#175957] disabled:opacity-60 transition cursor-pointer"
          >
            <Save class="h-4 w-4" />
            {{ loading ? 'Menyimpan...' : 'Simpan Perubahan Profil' }}
          </button>
        </div>
      </form>
    </section>

    <!-- Section 2: Change Password -->
    <section class="rounded-[28px] bg-white border border-[#e5dfd2] p-6 sm:p-7 space-y-5">
      <div class="flex items-center justify-between gap-2">
        <div>
          <h2 class="font-editorial text-xl font-bold text-[#162221]">
            2. Ubah Kata Sandi (Opsional)
          </h2>
          <p class="text-xs sm:text-sm text-[#5c6b69]">
            Perbarui kata sandi akun Anda secara berkala. Kata sandi baru langsung dienkripsi menggunakan hash <code>scrypt</code>.
          </p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-full border border-[#dfd8c8] bg-[#fbf9f5] px-3 py-1.5 text-xs font-bold text-[#455553] cursor-pointer shrink-0"
          @click="showPasswords = !showPasswords"
        >
          <EyeOff v-if="showPasswords" class="h-3.5 w-3.5" />
          <Eye v-else class="h-3.5 w-3.5" />
          {{ showPasswords ? 'Sembunyikan' : 'Tampilkan' }}
        </button>
      </div>

      <div
        v-if="passwordSuccess"
        class="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-bold text-emerald-800 flex items-center gap-2"
      >
        <CheckCircle2 class="h-4 w-4 shrink-0" />
        {{ passwordSuccess }}
      </div>
      <div
        v-if="passwordError"
        class="rounded-2xl bg-orange-50 border border-orange-200 px-4 py-3 text-xs font-bold text-orange-800"
      >
        {{ passwordError }}
      </div>

      <form class="space-y-4" @submit.prevent="handleChangePassword">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="space-y-1.5">
            <label for="pwd-current" class="block text-xs font-bold text-[#5c6b69]">Kata Sandi Saat Ini</label>
            <div class="relative">
              <Lock class="h-4 w-4 text-[#7a8785] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="pwd-current"
                v-model="currentPassword"
                :type="showPasswords ? 'text' : 'password'"
                required
                placeholder="Sandi lama"
                class="w-full rounded-full border border-[#e3dccd] bg-[#fbf9f5] pl-10 pr-4 py-2.5 text-sm text-[#162221]"
              >
            </div>
          </div>

          <div class="space-y-1.5">
            <label for="pwd-new" class="block text-xs font-bold text-[#5c6b69]">Kata Sandi Baru</label>
            <div class="relative">
              <Lock class="h-4 w-4 text-[#7a8785] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="pwd-new"
                v-model="newPassword"
                :type="showPasswords ? 'text' : 'password'"
                required
                minlength="6"
                placeholder="Min. 6 karakter"
                class="w-full rounded-full border border-[#e3dccd] bg-[#fbf9f5] pl-10 pr-4 py-2.5 text-sm text-[#162221]"
              >
            </div>
          </div>

          <div class="space-y-1.5">
            <label for="pwd-confirm" class="block text-xs font-bold text-[#5c6b69]">Ulangi Kata Sandi Baru</label>
            <div class="relative">
              <Lock class="h-4 w-4 text-[#7a8785] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="pwd-confirm"
                v-model="confirmPassword"
                :type="showPasswords ? 'text' : 'password'"
                required
                minlength="6"
                placeholder="Konfirmasi sandi baru"
                class="w-full rounded-full border border-[#e3dccd] bg-[#fbf9f5] pl-10 pr-4 py-2.5 text-sm text-[#162221]"
              >
            </div>
          </div>
        </div>

        <div class="flex justify-end">
          <button
            type="submit"
            :disabled="passwordSaving"
            class="inline-flex items-center gap-2 rounded-full border border-[#1f6f6d] bg-white px-5 py-2.5 text-xs sm:text-sm font-extrabold text-[#1f6f6d] hover:bg-[#1f6f6d] hover:text-white disabled:opacity-60 transition cursor-pointer"
          >
            <Lock class="h-4 w-4" />
            {{ passwordSaving ? 'Memperbarui...' : 'Perbarui Kata Sandi' }}
          </button>
        </div>
      </form>
    </section>
  </div>
</template>

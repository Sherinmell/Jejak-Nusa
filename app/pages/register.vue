<script setup lang="ts">
import {
  ArrowRight,
  AtSign,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User
} from 'lucide-vue-next'

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Daftar Akun Baru — JejakNusa',
  description: 'Buat akun Peserta baru dengan username dan kata sandi untuk mulai menjelajah destinasi Nusantara.'
})

const router = useRouter()
const { loading, register } = useAuth()

const username = ref('')
const name = ref('')
const email = ref('')
const phone = ref('')
const password = ref('')
const showPassword = ref(false)
const origin = ref('')
const errorMessage = ref('')

async function handleRegister() {
  errorMessage.value = ''
  try {
    await register({
      username: username.value.trim().toLowerCase(),
      name: name.value,
      email: email.value,
      phone: phone.value || undefined,
      password: password.value,
      origin: origin.value || 'Indonesia',
      role: 'customer'
    })
    await router.push('/home')
  } catch (err: unknown) {
    if (err && typeof err === 'object') {
      const e = err as { data?: { statusMessage?: string }; statusMessage?: string; message?: string }
      errorMessage.value = e.data?.statusMessage || e.statusMessage || e.message || 'Gagal mendaftarkan akun.'
    } else {
      errorMessage.value = 'Gagal mendaftarkan akun.'
    }
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <div class="rounded-[32px] glass-surface p-6 sm:p-9 space-y-6">
      <div class="space-y-1.5">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-[#eef7f6] border border-[#c7e4e0] px-3 py-1 text-[11px] font-extrabold text-[#175957]">
          <ShieldCheck class="h-3.5 w-3.5" />
          Pendaftaran Akun Peserta JejakNusa
        </span>
        <h2 class="font-editorial text-2xl sm:text-3xl font-bold text-[#162221]">
          Buat Akun Baru Anda
        </h2>
        <p class="text-xs sm:text-sm text-[#5c6b69]">
          Akun Anda akan disimpan permanen di database. Setelah mendaftar, Anda dapat masuk kapan saja menggunakan <strong>Username</strong> (atau Email / WhatsApp) dan <strong>Kata Sandi</strong> Anda.
        </p>
      </div>

      <div
        v-if="errorMessage"
        class="rounded-2xl bg-orange-50 border border-orange-200 px-4 py-3 text-xs font-bold text-orange-800"
      >
        {{ errorMessage }}
      </div>

      <form class="space-y-4" @submit.prevent="handleRegister">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label for="reg-username" class="block text-xs font-bold uppercase tracking-wider text-[#5c6b69]">
              Username (Untuk Login) <span class="text-orange-600">*</span>
            </label>
            <div class="relative">
              <AtSign class="h-4 w-4 text-[#7a8785] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reg-username"
                v-model="username"
                type="text"
                required
                minlength="3"
                pattern="[a-zA-Z0-9._-]+"
                placeholder="Mis. rina_oktavia"
                class="w-full rounded-full border border-[#e3dccd] bg-white pl-11 pr-4 py-3 text-sm font-semibold text-[#162221] focus:border-[#1f6f6d] focus:outline-none focus:ring-2 focus:ring-[#1f6f6d]/20"
              >
            </div>
          </div>

          <div class="space-y-1.5">
            <label for="reg-name" class="block text-xs font-bold uppercase tracking-wider text-[#5c6b69]">
              Nama Lengkap <span class="text-orange-600">*</span>
            </label>
            <div class="relative">
              <User class="h-4 w-4 text-[#7a8785] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reg-name"
                v-model="name"
                type="text"
                required
                minlength="2"
                placeholder="Nama lengkap Anda"
                class="w-full rounded-full border border-[#e3dccd] bg-white pl-11 pr-4 py-3 text-sm text-[#162221] focus:border-[#1f6f6d] focus:outline-none focus:ring-2 focus:ring-[#1f6f6d]/20"
              >
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label for="reg-email" class="block text-xs font-bold uppercase tracking-wider text-[#5c6b69]">
              Alamat Email <span class="text-orange-600">*</span>
            </label>
            <div class="relative">
              <Mail class="h-4 w-4 text-[#7a8785] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reg-email"
                v-model="email"
                type="email"
                required
                placeholder="nama@email.com"
                class="w-full rounded-full border border-[#e3dccd] bg-white pl-11 pr-4 py-3 text-sm text-[#162221] focus:border-[#1f6f6d] focus:outline-none focus:ring-2 focus:ring-[#1f6f6d]/20"
              >
            </div>
          </div>

          <div class="space-y-1.5">
            <label for="reg-phone" class="block text-xs font-bold uppercase tracking-wider text-[#5c6b69]">
              Nomor WhatsApp (Opsional)
            </label>
            <div class="relative">
              <Phone class="h-4 w-4 text-[#7a8785] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reg-phone"
                v-model="phone"
                type="tel"
                placeholder="Mis. 0812-3456-7890"
                class="w-full rounded-full border border-[#e3dccd] bg-white pl-11 pr-4 py-3 text-sm text-[#162221] focus:border-[#1f6f6d] focus:outline-none focus:ring-2 focus:ring-[#1f6f6d]/20"
              >
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label for="reg-origin" class="block text-xs font-bold uppercase tracking-wider text-[#5c6b69]">
              Kota Asal
            </label>
            <div class="relative">
              <MapPin class="h-4 w-4 text-[#7a8785] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reg-origin"
                v-model="origin"
                type="text"
                placeholder="Mis. Jakarta, Bandung, Surabaya"
                class="w-full rounded-full border border-[#e3dccd] bg-white pl-11 pr-4 py-3 text-sm text-[#162221] focus:border-[#1f6f6d] focus:outline-none focus:ring-2 focus:ring-[#1f6f6d]/20"
              >
            </div>
          </div>

          <div class="space-y-1.5">
            <label for="reg-password" class="block text-xs font-bold uppercase tracking-wider text-[#5c6b69]">
              Kata Sandi (Min. 6 Karakter) <span class="text-orange-600">*</span>
            </label>
            <div class="relative">
              <Lock class="h-4 w-4 text-[#7a8785] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reg-password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                minlength="6"
                placeholder="Buat kata sandi aman"
                class="w-full rounded-full border border-[#e3dccd] bg-white pl-11 pr-11 py-3 text-sm text-[#162221] focus:border-[#1f6f6d] focus:outline-none focus:ring-2 focus:ring-[#1f6f6d]/20"
              >
              <button
                type="button"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7a8785] hover:text-[#1f6f6d] cursor-pointer"
                aria-label="Tampilkan kata sandi"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" class="h-4 w-4" />
                <Eye v-else class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#1f6f6d] px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#1f6f6d]/25 hover:bg-[#175957] disabled:opacity-60 transition cursor-pointer"
        >
          <span>{{ loading ? 'Menyimpan Akun...' : 'Daftar & Simpan Akun' }}</span>
          <ArrowRight class="h-4 w-4" />
        </button>
      </form>

      <p class="text-center text-xs text-[#5c6b69]">
        Sudah memiliki akun?
        <NuxtLink to="/login" class="font-extrabold text-[#1f6f6d] hover:underline">
          Masuk di sini &rarr;
        </NuxtLink>
      </p>
    </div>
  </div>
</template>

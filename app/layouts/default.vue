<script setup lang="ts">
import { ShieldCheck } from 'lucide-vue-next'
</script>

<template>
  <div class="min-h-screen bg-[#f4f1ea] text-[#1c2423] relative overflow-x-clip">
    <!-- Subtle Atmospheric Ambient Glow -->
    <div
      class="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-gradient-to-b from-[#faf8f4] via-[#f4f1ea]/80 to-transparent -z-10"
    />

    <!-- Main Container offset on desktop for left floating rail -->
    <div class="lg:pl-[112px] xl:pl-[124px] pr-4 sm:pr-6 lg:pr-8 pl-4 pt-5 sm:pt-7 pb-32 max-w-[1460px] mx-auto">
      <Navbar />

      <main class="mt-6">
        <slot />
      </main>

      <!-- Minimalist Tropical Footer -->
      <footer class="mt-14 rounded-[28px] glass-surface px-6 sm:px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1f6f6d] text-white">
            <ShieldCheck class="h-4.5 w-4.5" />
          </span>
          <div>
            <p class="font-editorial text-base font-bold text-[#162221]">JejakNusa</p>
            <p class="text-xs text-[#5c6765]">Marketplace Open Trip &amp; Pemandu Lokal Terverifikasi Indonesia</p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-[#485755]">
          <NuxtLink to="/trips" class="hover:text-[#1f6f6d] transition">Open Trip</NuxtLink>
          <NuxtLink to="/hotels" class="hover:text-[#1f6f6d] transition">Penginapan</NuxtLink>
          <NuxtLink to="/matchmaker" class="hover:text-[#1f6f6d] transition">Quiz AI</NuxtLink>
          <NuxtLink to="/customer/passport" class="hover:text-[#1f6f6d] transition">Passport</NuxtLink>
          <NuxtLink to="/community" class="hover:text-[#1f6f6d] transition">Komunitas</NuxtLink>
          <NuxtLink to="/admin/dashboard" class="font-bold text-[#1f6f6d] hover:underline transition">Admin Center</NuxtLink>
          <span class="text-[#8a9592]">&copy; {{ new Date().getFullYear() }} JejakNusa</span>
        </div>
      </footer>
    </div>
  </div>
</template>

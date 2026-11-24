<script setup lang="ts">
import { Compass, ShieldCheck } from 'lucide-vue-next'
</script>

<template>
  <div class="min-h-screen bg-[#f4f1ea] text-[#1c2423] flex flex-col justify-between relative overflow-x-clip">
    <div
      class="pointer-events-none fixed inset-x-0 top-0 h-[380px] bg-gradient-to-b from-[#faf8f4] via-[#f4f1ea]/80 to-transparent -z-10"
    />

    <!-- Minimal Auth-Only Header (No access to app menus before login) -->
    <header class="w-full px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7">
      <div class="max-w-5xl mx-auto flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1f6f6d] text-white shadow-md">
            <Compass class="h-6 w-6" />
          </span>
          <div>
            <p class="font-editorial text-xl font-bold text-[#162221] leading-none">JejakNusa</p>
            <p class="text-[11px] font-semibold text-[#5c6b69] mt-0.5">
              Marketplace Open Trip &amp; Pemandu Lokal Terverifikasi
            </p>
          </div>
        </div>

        <span class="inline-flex items-center gap-1.5 rounded-full bg-white/90 border border-[#e3dccd] px-3.5 py-1.5 text-[11px] font-extrabold text-[#175957]">
          <ShieldCheck class="h-3.5 w-3.5 text-[#1f6f6d]" />
          Login Diperlukan
        </span>
      </div>
    </header>

    <!-- Main Auth Content -->
    <main class="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
      <div class="w-full max-w-5xl">
        <slot />
      </div>
    </main>

    <!-- Minimal Footer -->
    <footer class="w-full px-4 sm:px-6 pb-6 text-center text-xs text-[#6d7a78]">
      &copy; {{ new Date().getFullYear() }} JejakNusa Indonesia &bull; Masuk terlebih dahulu untuk mengakses katalog, pemesanan QRIS, dan portal peran Anda.
    </footer>
  </div>
</template>

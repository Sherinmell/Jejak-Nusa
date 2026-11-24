<script setup lang="ts">
const route = useRoute()
const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/admin'

await navigateTo(`/login?role=admin&redirect=${encodeURIComponent(redirect)}`, {
  replace: true
})
</script>

<template>
  <div class="py-16 text-center text-sm text-[#5c6b69]">
    Mengalihkan ke halaman login terpadu...
  </div>
</template>

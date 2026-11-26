<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

const { user, fetchUser } = useAuth()
await fetchUser()
await navigateTo(user.value ? '/home' : '/login', { replace: true })
</script>

<template>
  <div class="py-16 text-center text-sm text-[#5c6b69]">
    Mengalihkan ke JejakNusa...
  </div>
</template>

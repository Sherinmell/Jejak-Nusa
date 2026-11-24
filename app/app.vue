<script setup lang="ts">
const { fetchUser } = useAuth()

await callOnce('auth-session', async () => {
  await fetchUser()
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

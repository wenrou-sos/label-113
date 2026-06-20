<template>
  <div class="app-container">
    <router-view v-slot="{ Component, route }">
      <transition name="page-slide" mode="out-in">
        <component :is="Component" :key="route.fullPath" />
      </transition>
    </router-view>
  </div>
</template>

<script setup>
import { watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

watch(
  () => router.currentRoute.value.path,
  (newPath) => {
    window.scrollTo(0, 0)
  }
)
</script>

<style lang="scss">
.app-container {
  width: 100%;
  min-height: 100vh;
  max-width: 480px;
  margin: 0 auto;
  background: #f5f5f5;
  overflow-x: hidden;
}

.page-slide-enter-active,
.page-slide-leave-active {
  transition: all 0.3s ease;
}

.page-slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.page-slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>

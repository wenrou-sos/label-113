<template>
  <div class="navigation-page">
    <div class="nav-header">
      <div class="back-btn" @click="goBack">
        ‹
      </div>
      <div class="nav-title">前往目的地</div>
      <div class="placeholder"></div>
    </div>

    <div class="map-container" ref="mapContainer"></div>

    <div class="info-panel">
      <div class="destination-card">
        <div class="dest-icon">🏠</div>
        <div class="dest-info">
          <div class="dest-title">{{ order?.title }}</div>
          <div class="dest-address ellipsis-2">{{ order?.address }}</div>
          <div class="dest-detail ellipsis">{{ order?.detailAddress }}</div>
        </div>
      </div>

      <div class="route-info">
        <div class="route-item">
          <div class="route-value">{{ distance }}</div>
          <div class="route-label">距离</div>
        </div>
        <div class="route-divider"></div>
        <div class="route-item">
          <div class="route-value">{{ eta }}</div>
          <div class="route-label">预计时间</div>
        </div>
        <div class="route-divider"></div>
        <div class="route-item">
          <div class="route-value">¥{{ order?.price }}</div>
          <div class="route-label">订单金额</div>
        </div>
      </div>

      <div class="order-tips">
        <div class="tips-title">温馨提示</div>
        <div class="tips-item">• 请在30分钟内到达指定地点</div>
        <div class="tips-item">• 到达后请及时点击签到</div>
        <div class="tips-item">• 注意交通安全，切勿酒后驾车</div>
      </div>

      <div class="action-section">
        <div class="arrive-check" v-if="!hasArrived">
          <nut-checkbox v-model="confirmArrive" label-position="right">
            我已到达目的地
          </nut-checkbox>
        </div>
        <div class="arrive-status" v-else>
          <span class="status-icon">✅</span>
          <span class="status-text">已确认到达</span>
        </div>

        <nut-button
          type="primary"
          size="large"
          :disabled="!confirmArrive && !hasArrived"
          :loading="submitting"
          @click="handleCheckIn"
          block
        >
          {{ hasArrived ? '已签到' : '已到场签到' }}
        </nut-button>
      </div>
    </div>

    <div class="simulate-travel" v-if="!hasArrived">
      <div class="simulate-title">模拟导航进度</div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
      </div>
      <div class="simulate-btns">
        <nut-button size="small" type="default" @click="toggleSimulation">
          {{ isSimulating ? '暂停模拟' : '开始模拟导航' }}
        </nut-button>
        <nut-button size="small" type="primary" @click="quickArrive">
          一键到达
        </nut-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import L from 'leaflet'
import { useOrderStore, useUserStore } from '@/store'
import { showToast, showDialog } from '@nutui/nutui'

const route = useRoute()
const router = useRouter()
const orderStore = useOrderStore()
const userStore = useUserStore()

const mapContainer = ref(null)
let map = null
let routeLine = null
let currentMarker = null
let simulateTimer = null

const orderId = computed(() => route.params.orderId)
const order = computed(() => {
  return orderStore.orders.find((o) => o.orderId === orderId.value) || orderStore.currentOrder
})

const hasArrived = ref(false)
const confirmArrive = ref(false)
const submitting = ref(false)
const currentLat = ref(userStore.currentLocation.lat)
const currentLng = ref(userStore.currentLocation.lng)
const isSimulating = ref(false)
const progressPercent = ref(0)

const distance = computed(() => {
  if (!order.value) return '0km'
  return (Math.random() * 2 + 1).toFixed(1) + 'km'
})

const eta = computed(() => {
  if (!order.value) return '0分钟'
  return Math.floor(Math.random() * 15 + 10) + '分钟'
})

const goBack = () => {
  showDialog({
    title: '确认退出',
    content: '退出导航可能导致订单超时，确认退出吗？',
    okText: '确定退出',
    cancelText: '继续导航'
  })
    .then(() => {
      router.push('/home')
    })
    .catch(() => {})
}

const initMap = async () => {
  if (!mapContainer.value || !order.value) return

  await nextTick()

  map = L.map(mapContainer.value, {
    zoomControl: false,
    attributionControl: false
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(map)

  const startPoint = [currentLat.value, currentLng.value]
  const endPoint = [order.value.lat, order.value.lng]

  const bounds = L.latLngBounds([startPoint, endPoint])
  map.fitBounds(bounds, { padding: [80, 80] })

  currentMarker = L.circleMarker(startPoint, {
    radius: 10,
    fillColor: '#1989fa',
    color: '#fff',
    weight: 3,
    fillOpacity: 1
  }).addTo(map).bindTooltip('我的位置', { permanent: false })

  L.circleMarker(endPoint, {
    radius: 14,
    fillColor: '#ff5000',
    color: '#fff',
    weight: 3,
    fillOpacity: 1
  }).addTo(map).bindTooltip('目的地', { permanent: false })

  const midPoint1 = [
    (startPoint[0] + endPoint[0]) / 2 + (Math.random() - 0.5) * 0.005,
    (startPoint[1] + endPoint[1]) / 2 + (Math.random() - 0.5) * 0.005
  ]
  const midPoint2 = [
    (startPoint[0] + endPoint[0]) / 2 + (Math.random() - 0.5) * 0.005,
    (startPoint[1] + endPoint[1]) / 2 + (Math.random() - 0.5) * 0.005
  ]

  routeLine = L.polyline([startPoint, midPoint1, midPoint2, endPoint], {
    color: '#1989fa',
    weight: 5,
    opacity: 0.8,
    dashArray: '10, 10'
  }).addTo(map)
}

const updatePosition = () => {
  if (!order.value || !currentMarker) return

  const startLat = userStore.currentLocation.lat
  const startLng = userStore.currentLocation.lng
  const endLat = order.value.lat
  const endLng = order.value.lng

  const progress = progressPercent.value / 100
  currentLat.value = startLat + (endLat - startLat) * progress
  currentLng.value = startLng + (endLng - startLng) * progress

  currentMarker.setLatLng([currentLat.value, currentLng.value])

  if (progressPercent.value >= 100) {
    stopSimulation()
    hasArrived.value = true
    confirmArrive.value = true
    showToast({ content: '已到达目的地，请签到' })
  }
}

const toggleSimulation = () => {
  if (isSimulating.value) {
    stopSimulation()
  } else {
    startSimulation()
  }
}

const startSimulation = () => {
  if (progressPercent.value >= 100) return
  isSimulating.value = true
  simulateTimer = setInterval(() => {
    progressPercent.value = Math.min(100, progressPercent.value + 2)
    updatePosition()
  }, 300)
}

const stopSimulation = () => {
  isSimulating.value = false
  if (simulateTimer) {
    clearInterval(simulateTimer)
    simulateTimer = null
  }
}

const quickArrive = () => {
  progressPercent.value = 100
  updatePosition()
}

const handleCheckIn = async () => {
  if (!order.value) return

  if (progressPercent.value < 95 && !hasArrived.value) {
    showToast({ content: '您尚未到达目的地附近' })
    return
  }

  try {
    await showDialog({
      title: '确认签到',
      content: '确认已到达目的地并开始服务？签到后将开始计时。',
      okText: '确认签到',
      cancelText: '取消'
    })

    submitting.value = true
    setTimeout(() => {
      orderStore.arriveOrder(order.value.orderId || order.value.id)
      orderStore.startService(order.value.orderId || order.value.id)
      submitting.value = false
      showToast({ content: '签到成功！开始服务', type: 'success' })
      setTimeout(() => {
        router.push(`/service/${order.value.orderId || order.value.id}`)
      }, 1000)
    }, 800)
  } catch {}
}

watch(orderId, () => {
  if (map) {
    map.remove()
    map = null
    initMap()
  }
})

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  stopSimulation()
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<style lang="scss" scoped>
.navigation-page {
  width: 100%;
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.nav-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  padding-top: calc(env(safe-area-inset-top) + 12px);
  background: #fff;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.back-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #333;
  cursor: pointer;
}

.nav-title {
  flex: 1;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.placeholder {
  width: 32px;
}

.map-container {
  width: 100%;
  height: 280px;
  flex-shrink: 0;
}

.info-panel {
  flex: 1;
  padding: 16px;
}

.destination-card {
  display: flex;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.dest-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff3e0;
  border-radius: 10px;
  font-size: 22px;
  margin-right: 12px;
  flex-shrink: 0;
}

.dest-info {
  flex: 1;
  min-width: 0;
}

.dest-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}

.dest-address {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 4px;
}

.dest-detail {
  font-size: 12px;
  color: #999;
}

.route-info {
  display: flex;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.route-item {
  flex: 1;
  text-align: center;
}

.route-value {
  font-size: 20px;
  font-weight: bold;
  color: #1989fa;
  margin-bottom: 4px;
}

.route-label {
  font-size: 12px;
  color: #999;
}

.route-divider {
  width: 1px;
  height: 36px;
  background: #eee;
}

.order-tips {
  padding: 14px 16px;
  background: #fffbe6;
  border-radius: 12px;
  margin-bottom: 16px;
}

.tips-title {
  font-size: 14px;
  font-weight: 600;
  color: #d48806;
  margin-bottom: 8px;
}

.tips-item {
  font-size: 12px;
  color: #8c6d1f;
  line-height: 1.8;
}

.action-section {
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.arrive-check {
  margin-bottom: 12px;

  :deep(.nut-checkbox__label) {
    font-size: 14px;
    color: #333;
  }
}

.arrive-status {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  padding: 10px;
  background: #f6ffed;
  border-radius: 8px;
}

.status-icon {
  margin-right: 6px;
}

.status-text {
  font-size: 14px;
  color: #52c41a;
  font-weight: 500;
}

.simulate-travel {
  padding: 16px;
  background: #fff;
  border-top: 1px solid #eee;
}

.simulate-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.progress-bar {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1989fa, #5db3ff);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.simulate-btns {
  display: flex;
  gap: 12px;

  :deep(.nut-button) {
    flex: 1;
  }
}
</style>

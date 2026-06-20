<template>
  <div class="home-page">
    <div class="map-container" ref="mapContainer"></div>

    <div class="top-bar">
      <div class="location-info" @click="refreshLocation">
        <div class="location-icon">📍</div>
        <div class="location-text ellipsis">{{ currentLocation?.address || '定位中...' }}</div>
      </div>
      <div class="refresh-btn" @click="handleRefresh">
        <span :class="{ rotating: isRefreshing }">🔄</span>
      </div>
    </div>

    <div class="active-orders-bar" v-if="hasActiveOrders" @click="showActiveOrdersPopup = true">
      <div class="active-orders-icon">🚗</div>
      <div class="active-orders-info">
        <div class="active-orders-title">有 {{ activeOrders.length }} 笔订单进行中</div>
        <div class="active-orders-sub">点击查看详情</div>
      </div>
      <div class="active-orders-arrow">›</div>
    </div>

    <div class="bottom-panel" ref="bottomPanel">
      <div class="pull-refresh-tip" v-if="showPullTip">
        <span>{{ pullTipText }}</span>
      </div>

      <div class="panel-header">
        <div class="panel-title">
          <span class="title-text">附近酒局</span>
          <span class="count-badge">{{ pendingHotspots.length }}单</span>
        </div>
        <div class="filter-tabs">
          <span
            v-for="tab in filterTabs"
            :key="tab.value"
            :class="['tab-item', { active: activeFilter === tab.value }]"
            @click="activeFilter = tab.value"
          >
            {{ tab.label }}
          </span>
        </div>
      </div>

      <div class="order-list" ref="orderList" @scroll="handleScroll">
        <div
          v-for="hotspot in filteredHotspots"
          :key="hotspot.id"
          class="order-card"
          @click="showOrderDetail(hotspot)"
        >
          <div class="card-left">
            <div :class="['price-tag', getPriceClass(hotspot.price)]">
              ¥{{ hotspot.price }}
            </div>
          </div>
          <div class="card-main">
            <div class="card-title ellipsis">{{ hotspot.title }}</div>
            <div class="card-address ellipsis-2">{{ hotspot.address }}</div>
            <div class="card-tags">
              <span class="tag">{{ hotspot.drinkType }}</span>
              <span class="tag">{{ hotspot.duration }}小时</span>
              <span v-if="hotspot.needTalent" class="tag tag-talent">
                🎤 {{ hotspot.talentType }}
              </span>
            </div>
          </div>
          <div class="card-right">
            <div class="arrow">›</div>
          </div>
        </div>
        <div v-if="!loading && filteredHotspots.length === 0" class="empty-tip">
          暂无相关酒局
        </div>
        <div v-if="loading" class="loading-tip">
          <span>加载中...</span>
        </div>
        <div v-if="!hasMore && filteredHotspots.length > 0" class="no-more-tip">
          已加载全部
        </div>
      </div>
    </div>

    <nut-popup
      v-model:visible="showDetail"
      position="bottom"
      round
      :style="{ height: '70%' }"
    >
      <div class="detail-popup" v-if="selectedHotspot">
        <div class="detail-header" :class="getPriceClass(selectedHotspot.price)">
          <div class="detail-price">¥{{ selectedHotspot.price }}</div>
          <div class="detail-close" @click="showDetail = false">×</div>
          <div class="detail-tags">
            <span class="d-tag">{{ selectedHotspot.drinkType }}</span>
            <span class="d-tag">{{ selectedHotspot.duration }}小时</span>
            <span v-if="selectedHotspot.needTalent" class="d-tag talent">
              🎤 {{ selectedHotspot.talentType }}
            </span>
          </div>
        </div>

        <div class="detail-body">
          <div class="detail-title">{{ selectedHotspot.title }}</div>

          <div class="info-section">
            <div class="info-row">
              <span class="info-label">📍 详细地址</span>
              <span class="info-value">{{ selectedHotspot.address }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">🏢 具体位置</span>
              <span class="info-value">{{ selectedHotspot.detailAddress }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">🍺 酒水类型</span>
              <span class="info-value">{{ selectedHotspot.drinkType }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">⏱️ 服务时长</span>
              <span class="info-value">约{{ selectedHotspot.duration }}小时</span>
            </div>
            <div class="info-row">
              <span class="info-label">💰 客户出价</span>
              <span class="info-value price">¥{{ selectedHotspot.price }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">🎭 才艺表演</span>
              <span class="info-value">
                {{ selectedHotspot.needTalent ? selectedHotspot.talentType : '不需要' }}
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">👥 参与人数</span>
              <span class="info-value">{{ selectedHotspot.peopleCount }}人</span>
            </div>
          </div>

          <div class="desc-section">
            <div class="desc-title">客户描述</div>
            <div class="desc-content">{{ selectedHotspot.description }}</div>
          </div>
        </div>

        <div class="detail-footer">
          <nut-button type="default" size="large" @click="handleIgnore">
            忽略
          </nut-button>
          <nut-button type="primary" size="large" @click="handleAcceptClick">
            立即接单
          </nut-button>
        </div>
      </div>
    </nut-popup>

    <nut-popup
      v-model:visible="showActiveOrdersPopup"
      position="bottom"
      round
      :style="{ height: '60%' }"
    >
      <div class="active-orders-popup">
        <div class="popup-header">
          <div class="popup-title">进行中的订单</div>
          <div class="popup-close" @click="showActiveOrdersPopup = false">×</div>
        </div>

        <div class="active-orders-list">
          <div
            v-for="order in activeOrders"
            :key="order.orderId || order.id"
            class="active-order-card"
          >
            <div class="order-status-tag" :class="order.status">
              {{ getStatusText(order.status) }}
            </div>
            <div class="order-title">{{ order.title }}</div>
            <div class="order-address ellipsis-2">{{ order.address }}</div>
            <div class="order-meta">
              <span class="order-type">{{ order.drinkType }}</span>
              <span class="order-duration">{{ order.duration }}小时</span>
              <span class="order-price">¥{{ order.price }}</span>
            </div>
            <div class="order-actions">
              <nut-button size="small" type="default" @click="handleIgnoreOrder(order)">
                取消订单
              </nut-button>
              <nut-button size="small" type="primary" @click="handleResumeOrder(order)">
                继续服务
              </nut-button>
            </div>
          </div>
        </div>

        <div class="popup-tip">
          💡 提示：您可以同时处理多笔订单，但请确保能准时到达
        </div>
      </div>
    </nut-popup>

    <nut-tabbar bottom safe-area-inset-bottom>
      <nut-tabbar-item tab-title="首页" icon="map" to="/home" />
      <nut-tabbar-item tab-title="我的" icon="my" to="/profile" />
    </nut-tabbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import { useOrderStore, useUserStore } from '@/store'
import { showToast, showDialog } from '@nutui/nutui'

const router = useRouter()
const orderStore = useOrderStore()
const userStore = useUserStore()

const mapContainer = ref(null)
const bottomPanel = ref(null)
const orderList = ref(null)
let map = null
const markers = []

const isRefreshing = ref(false)
const showDetail = ref(false)
const selectedHotspot = ref(null)
const activeFilter = ref('all')
const loading = ref(false)
const hasMore = ref(true)
const showPullTip = ref(false)
const pullTipText = ref('下拉可以刷新')
const startY = ref(0)
const pulling = ref(false)
const showActiveOrdersPopup = ref(false)

const filterTabs = [
  { label: '全部', value: 'all' },
  { label: '低价', value: 'low' },
  { label: '中价', value: 'medium' },
  { label: '高价', value: 'high' },
  { label: '天价', value: 'ultra' }
]

const currentLocation = computed(() => userStore.currentLocation)
const pendingHotspots = computed(() => orderStore.pendingHotspots)
const activeOrders = computed(() => orderStore.activeOrders)
const hasActiveOrders = computed(() => orderStore.hasActiveOrders)

const filteredHotspots = computed(() => {
  const list = pendingHotspots.value
  if (activeFilter.value === 'all') return list
  return list.filter((h) => getPriceClass(h.price) === `price-${activeFilter.value}`)
})

const getPriceClass = (price) => {
  if (price < 300) return 'price-low'
  if (price < 600) return 'price-medium'
  if (price < 1000) return 'price-high'
  return 'price-ultra'
}

const initMap = async () => {
  if (!mapContainer.value) return

  await nextTick()

  map = L.map(mapContainer.value, {
    zoomControl: false,
    attributionControl: false
  }).setView([currentLocation.value.lat, currentLocation.value.lng], 14)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(map)

  L.circleMarker([currentLocation.value.lat, currentLocation.value.lng], {
    radius: 12,
    fillColor: '#1989fa',
    color: '#fff',
    weight: 3,
    fillOpacity: 1
  }).addTo(map).bindTooltip('我的位置', { permanent: false, direction: 'top' })

  renderHotspots()
}

const renderHotspots = () => {
  markers.forEach((m) => map.removeLayer(m))
  markers.length = 0

  pendingHotspots.value.forEach((hotspot) => {
    const priceClass = getPriceClass(hotspot.price)
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div class="hotspot-marker ${priceClass}">¥${hotspot.price > 999 ? '999+' : hotspot.price}</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    })

    const marker = L.marker([hotspot.lat, hotspot.lng], { icon })
      .addTo(map)
      .on('click', () => {
        showOrderDetail(hotspot)
      })

    markers.push(marker)
  })
}

const showOrderDetail = (hotspot) => {
  selectedHotspot.value = hotspot
  showDetail.value = true
}

const handleAcceptClick = async () => {
  if (!selectedHotspot.value) return
  try {
    await showDialog({
      title: '确认接单',
      content: `确定要接这个¥${selectedHotspot.value.price}的酒局吗？接单后需立即前往。`,
      okText: '确认接单',
      cancelText: '再想想'
    })

    const order = orderStore.acceptOrder(selectedHotspot.value.id)
    if (order) {
      showToast({ content: '接单成功！', type: 'success' })
      showDetail.value = false
      setTimeout(() => {
        router.push(`/navigation/${order.orderId}`)
      }, 800)
    }
  } catch {}
}

const handleIgnore = () => {
  if (selectedHotspot.value) {
    orderStore.ignoreHotspot(selectedHotspot.value.id)
    showDetail.value = false
    showToast({ content: '已忽略该订单' })
    renderHotspots()
  }
}

const handleRefresh = async () => {
  isRefreshing.value = true
  setTimeout(() => {
    orderStore.refreshHotspots()
    renderHotspots()
    isRefreshing.value = false
    showToast({ content: '刷新成功', type: 'success' })
  }, 1000)
}

const refreshLocation = () => {
  showToast({ content: '定位已更新' })
}

const handleScroll = (e) => {
  const target = e.target
  if (target.scrollTop + target.clientHeight >= target.scrollHeight - 50) {
    if (!loading.value && hasMore.value) {
      loadMore()
    }
  }
}

const loadMore = () => {
  loading.value = true
  setTimeout(() => {
    orderStore.loadMoreHotspots()
    renderHotspots()
    loading.value = false
    if (filteredHotspots.value.length >= 30) {
      hasMore.value = false
    }
  }, 800)
}

const handleTouchStart = (e) => {
  if (orderList.value && orderList.value.scrollTop === 0) {
    startY.value = e.touches[0].clientY
    pulling.value = true
  }
}

const handleTouchMove = (e) => {
  if (!pulling.value) return
  const diff = e.touches[0].clientY - startY.value
  if (diff > 0 && diff < 80) {
    showPullTip.value = true
    pullTipText.value = diff > 50 ? '松开立即刷新' : '下拉可以刷新'
  }
}

const handleTouchEnd = (e) => {
  if (!pulling.value) return
  const diff = e.changedTouches[0].clientY - startY.value
  if (diff > 50) {
    handleRefresh()
  }
  pulling.value = false
  showPullTip.value = false
}

const getStatusText = (status) => {
  const map = {
    accepted: '已接单',
    arrived: '已签到',
    servicing: '服务中'
  }
  return map[status] || status
}

const handleResumeOrder = (order) => {
  orderStore.setCurrentOrder(order.orderId || order.id)
  showActiveOrdersPopup.value = false
  if (order.status === 'accepted') {
    router.push('/navigation')
  } else if (order.status === 'arrived' || order.status === 'servicing') {
    router.push('/service')
  }
}

const handleIgnoreOrder = async (order) => {
  try {
    await showDialog({
      title: '取消订单',
      content: '确定要取消这笔订单吗？',
      okText: '确定取消',
      cancelText: '再想想'
    })
    orderStore.updateOrderStatus(order.orderId || order.id, 'cancelled')
    showToast({ content: '订单已取消', type: 'success' })
  } catch (e) {}
}

watch(
  () => pendingHotspots.value.length,
  () => {
    if (map) renderHotspots()
  }
)

onMounted(() => {
  initMap()
  if (orderList.value) {
    orderList.value.addEventListener('touchstart', handleTouchStart, { passive: true })
    orderList.value.addEventListener('touchmove', handleTouchMove, { passive: true })
    orderList.value.addEventListener('touchend', handleTouchEnd, { passive: true })
  }
})
</script>

<style lang="scss" scoped>
.home-page {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.map-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 60%;
  z-index: 1;
}

.top-bar {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: 12px 16px;
  padding-top: calc(env(safe-area-inset-top) + 12px);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 10;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3), transparent);
}

.location-info {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.location-icon {
  margin-right: 6px;
  font-size: 14px;
}

.location-text {
  flex: 1;
  font-size: 13px;
  color: #333;
}

.refresh-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-size: 18px;
  cursor: pointer;

  .rotating {
    display: inline-block;
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.bottom-panel {
  position: absolute;
  bottom: 50px;
  left: 0;
  width: 100%;
  height: 45%;
  background: #fff;
  border-radius: 20px 20px 0 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.pull-refresh-tip {
  text-align: center;
  padding: 10px;
  font-size: 12px;
  color: #999;
  background: #f9f9f9;
}

.panel-header {
  padding: 14px 16px 10px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.panel-title {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.title-text {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.count-badge {
  margin-left: 8px;
  padding: 2px 8px;
  background: #ff5000;
  color: #fff;
  font-size: 12px;
  border-radius: 10px;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.tab-item {
  flex-shrink: 0;
  padding: 5px 14px;
  background: #f5f5f5;
  border-radius: 15px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;

  &.active {
    background: #1989fa;
    color: #fff;
  }
}

.order-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0 16px;
}

.order-card {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background 0.2s;

  &:active {
    background: #f9f9f9;
  }
}

.card-left {
  margin-right: 12px;
}

.price-tag {
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: bold;
  color: #fff;

  &.price-low {
    background: linear-gradient(135deg, #52c41a, #73d13d);
  }

  &.price-medium {
    background: linear-gradient(135deg, #faad14, #ffc53d);
  }

  &.price-high {
    background: linear-gradient(135deg, #fa541c, #ff7a45);
  }

  &.price-ultra {
    background: linear-gradient(135deg, #eb2f96, #ff85c0);
  }
}

.card-main {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.card-address {
  font-size: 12px;
  color: #999;
  margin-bottom: 6px;
  line-height: 1.4;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  padding: 2px 8px;
  background: #f0f7ff;
  color: #1989fa;
  font-size: 11px;
  border-radius: 4px;

  &.tag-talent {
    background: #fff7e6;
    color: #fa8c16;
  }
}

.card-right {
  margin-left: 8px;
}

.arrow {
  font-size: 20px;
  color: #ccc;
}

.empty-tip,
.loading-tip,
.no-more-tip {
  text-align: center;
  padding: 24px;
  font-size: 13px;
  color: #999;
}

.detail-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.detail-header {
  padding: 20px 20px 16px;
  color: #fff;
  position: relative;
  flex-shrink: 0;

  &.price-low {
    background: linear-gradient(135deg, #52c41a, #73d13d);
  }

  &.price-medium {
    background: linear-gradient(135deg, #faad14, #ffc53d);
  }

  &.price-high {
    background: linear-gradient(135deg, #fa541c, #ff7a45);
  }

  &.price-ultra {
    background: linear-gradient(135deg, #eb2f96, #ff85c0);
  }
}

.detail-price {
  font-size: 32px;
  font-weight: bold;
}

.detail-close {
  position: absolute;
  top: 14px;
  right: 16px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.d-tag {
  padding: 3px 10px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 12px;
  font-size: 12px;

  &.talent {
    background: rgba(255, 255, 255, 0.35);
  }
}

.detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.detail-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
}

.info-section {
  background: #f9f9f9;
  border-radius: 12px;
  padding: 4px 14px;
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
  font-size: 13px;

  &:last-child {
    border-bottom: none;
  }

  .info-label {
    width: 90px;
    color: #999;
    flex-shrink: 0;
  }

  .info-value {
    flex: 1;
    color: #333;

    &.price {
      color: #ff5000;
      font-weight: bold;
      font-size: 15px;
    }
  }
}

.desc-section {
  background: #fffbe6;
  border-radius: 12px;
  padding: 14px;
}

.desc-title {
  font-size: 14px;
  font-weight: 600;
  color: #d48806;
  margin-bottom: 8px;
}

.desc-content {
  font-size: 13px;
  color: #666;
  line-height: 1.6;
}

.detail-footer {
  flex-shrink: 0;
  display: flex;
  padding: 14px 16px;
  padding-bottom: calc(env(safe-area-inset-bottom) + 14px);
  gap: 12px;
  border-top: 1px solid #f0f0f0;
  background: #fff;

  :deep(.nut-button) {
    flex: 1;
  }
}

.active-orders-bar {
  position: absolute;
  top: 110px;
  left: 16px;
  right: 16px;
  z-index: 10;
  display: flex;
  align-items: center;
  padding: 12px 14px;
  background: linear-gradient(135deg, #ff6b35, #f7931e);
  border-radius: 12px;
  color: #fff;
  box-shadow: 0 4px 16px rgba(247, 147, 30, 0.4);
  gap: 12px;

  .active-orders-icon {
    font-size: 24px;
  }

  .active-orders-info {
    flex: 1;

    .active-orders-title {
      font-size: 15px;
      font-weight: 600;
    }

    .active-orders-sub {
      font-size: 12px;
      opacity: 0.9;
      margin-top: 2px;
    }
  }

  .active-orders-arrow {
    font-size: 20px;
    opacity: 0.8;
  }
}

.active-orders-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;

  .popup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: #fff;
    border-bottom: 1px solid #f0f0f0;

    .popup-title {
      font-size: 16px;
      font-weight: 600;
    }

    .popup-close {
      font-size: 24px;
      color: #999;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }
  }

  .active-orders-list {
    flex: 1;
    padding: 12px 16px;
    overflow-y: auto;

    .active-order-card {
      background: #fff;
      border-radius: 12px;
      padding: 14px;
      margin-bottom: 12px;
      position: relative;

      .order-status-tag {
        position: absolute;
        top: 14px;
        right: 14px;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;

        &.accepted {
          background: #e6f7ff;
          color: #1890ff;
        }

        &.arrived {
          background: #f6ffed;
          color: #52c41a;
        }

        &.servicing {
          background: #fff7e6;
          color: #fa8c16;
        }
      }

      .order-title {
        font-size: 15px;
        font-weight: 600;
        margin-bottom: 6px;
        padding-right: 70px;
      }

      .order-address {
        font-size: 13px;
        color: #666;
        line-height: 1.5;
        margin-bottom: 10px;
      }

      .order-meta {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;

        span {
          padding: 3px 8px;
          background: #f5f5f5;
          border-radius: 4px;
          font-size: 12px;
          color: #666;
        }

        .order-price {
          background: #fff7e6;
          color: #fa8c16;
          font-weight: 600;
        }
      }

      .order-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
      }
    }
  }

  .popup-tip {
    flex-shrink: 0;
    padding: 12px 16px;
    padding-bottom: calc(env(safe-area-inset-bottom) + 12px);
    text-align: center;
    font-size: 13px;
    color: #999;
    background: #fff;
    border-top: 1px solid #f0f0f0;
  }
}
</style>

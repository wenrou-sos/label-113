<template>
  <div class="home-page">
    <div class="map-container" ref="mapContainer"></div>

    <div class="top-bar">
      <div class="location-info" @click="showAddressSwitcher = true">
        <div class="location-icon">📍</div>
        <div class="location-text ellipsis">{{ currentLocation?.address || '定位中...' }}</div>
        <div class="location-switch">切换<span class="switch-arrow">›</span></div>
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
          <span v-if="hasPreferences" class="pref-sort-badge">🎯 按偏好排序</span>
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
            <div class="card-title-row">
              <div class="card-title ellipsis">{{ hotspot.title }}</div>
              <span v-if="getMatchScore(hotspot) > 0" class="match-badge">
                擅长
              </span>
            </div>
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

    <nut-popup
      v-model:visible="showAddressSwitcher"
      position="bottom"
      round
      :style="{ height: '55%' }"
    >
      <div class="addr-switcher">
        <div class="switcher-header">
          <div class="switcher-title">切换位置</div>
          <div class="switcher-close" @click="showAddressSwitcher = false">×</div>
        </div>

        <div class="switcher-body">
          <div
            v-if="geoSupported"
            class="switcher-locate"
            :class="{ locating: locating }"
            @click="handleRelocate"
          >
            <div class="switcher-icon">{{ locating ? '⏳' : '🎯' }}</div>
            <div class="switcher-info">
              <div class="switcher-name">{{ locating ? '正在定位...' : '重新定位' }}</div>
              <div class="switcher-sub">{{ hasRealLocation ? currentLocation.address : '获取当前设备位置' }}</div>
            </div>
            <span v-if="hasRealLocation && !locating" class="switcher-check">✓</span>
          </div>

          <template v-if="savedAddresses.length">
            <div class="switcher-divider"></div>
            <div
              v-for="addr in savedAddresses"
              :key="addr.id"
              class="switcher-item"
              :class="{ active: isCurrentLocation(addr) }"
              @click="handleSelectAddress(addr)"
            >
              <div class="switcher-icon">📍</div>
              <div class="switcher-info">
                <div class="switcher-name">{{ addr.name }}</div>
                <div class="switcher-sub">{{ addr.address }}</div>
              </div>
              <span v-if="isCurrentLocation(addr)" class="switcher-check">✓</span>
            </div>
          </template>

          <div v-else class="switcher-empty">
            <div class="empty-icon">📭</div>
            <div class="empty-text">还没有常用地址</div>
            <div class="empty-tip">去「我的 - 常用地址」收藏几个常去的地方吧</div>
          </div>
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
let userMarker = null
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
const showAddressSwitcher = ref(false)

const geoSupported = typeof navigator !== 'undefined' && !!navigator.geolocation
const hasRealLocation = ref(false)
const locating = ref(false)

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
const hasPreferences = computed(() => userStore.hasPreferences)
const savedAddresses = computed(() => userStore.savedAddresses)

const getMatchScore = (hotspot) => {
  const prefs = userStore.preferences
  if (!prefs.drinkTypes.length && !prefs.talentTypes.length) return 0
  let score = 0
  if (prefs.drinkTypes.includes(hotspot.drinkType)) score += 2
  if (hotspot.needTalent && prefs.talentTypes.includes(hotspot.talentType)) score += 1
  return score
}

const toRad = (d) => (d * Math.PI) / 180

const getDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const distanceTo = (hotspot) => {
  const loc = currentLocation.value
  return getDistance(loc.lat, loc.lng, hotspot.lat, hotspot.lng)
}

const filteredHotspots = computed(() => {
  let list = pendingHotspots.value
  if (activeFilter.value !== 'all') {
    list = list.filter((h) => getPriceClass(h.price) === `price-${activeFilter.value}`)
  }
  list = [...list].sort((a, b) => {
    if (userStore.hasPreferences) {
      const diff = getMatchScore(b) - getMatchScore(a)
      if (diff !== 0) return diff
    }
    return distanceTo(a) - distanceTo(b)
  })
  return list
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

  userMarker = L.circleMarker([currentLocation.value.lat, currentLocation.value.lng], {
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
    const loc = currentLocation.value
    orderStore.refreshHotspots({ lat: loc.lat, lng: loc.lng })
    renderHotspots()
    hasMore.value = true
    isRefreshing.value = false
    showToast({ content: '刷新成功', type: 'success' })
  }, 1000)
}

const isCurrentLocation = (loc) => {
  const cur = currentLocation.value
  return cur.lat === loc.lat && cur.lng === loc.lng
}

const handleSelectAddress = (loc) => {
  if (isCurrentLocation(loc)) {
    showAddressSwitcher.value = false
    return
  }
  userStore.setCurrentLocation({ lat: loc.lat, lng: loc.lng, address: loc.address })
  showAddressSwitcher.value = false
  showToast({ content: '已切换到「' + (loc.name || loc.address) + '」', type: 'success' })
}

const reverseGeocode = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18`,
      { headers: { 'Accept-Language': 'zh-CN,zh;q=0.9' } }
    )
    if (!res.ok) return ''
    const data = await res.json()
    if (!data) return ''
    const addr = data.address || {}
    const main = addr.neighbourhood || addr.suburb || addr.residential || addr.road || data.name
    const region = addr.city || addr.town || addr.county || addr.state_district
    if (main && region && main !== region) return main + ' · ' + region
    return main || region || (data.display_name ? data.display_name.split(',').slice(0, 2).join('，') : '')
  } catch {
    return ''
  }
}

const requestLocation = ({ silent = false } = {}) => {
  if (!geoSupported) return
  if (!silent) locating.value = true
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords
      const address = await reverseGeocode(latitude, longitude)
      userStore.setCurrentLocation({
        lat: latitude,
        lng: longitude,
        address: address || `当前位置(${latitude.toFixed(3)}, ${longitude.toFixed(3)})`
      })
      hasRealLocation.value = true
      locating.value = false
      if (!silent) {
        showAddressSwitcher.value = false
        showToast({ content: '已定位到当前位置', type: 'success' })
      }
    },
    () => {
      locating.value = false
      if (!silent) {
        showToast({ content: '无法获取当前位置，请选择常用地址' })
      }
    },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
  )
}

const handleRelocate = () => {
  if (locating.value) return
  requestLocation()
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
    const loc = currentLocation.value
    orderStore.loadMoreHotspots({ lat: loc.lat, lng: loc.lng })
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

watch(
  () => userStore.currentLocation,
  (loc) => {
    if (!loc) return
    if (map) {
      map.setView([loc.lat, loc.lng], 14, { animate: true })
      if (userMarker) {
        userMarker.setLatLng([loc.lat, loc.lng])
      }
    }
    orderStore.refreshHotspots({ lat: loc.lat, lng: loc.lng })
    hasMore.value = true
    if (map) renderHotspots()
  },
  { deep: true }
)

onMounted(() => {
  initMap()
  if (orderList.value) {
    orderList.value.addEventListener('touchstart', handleTouchStart, { passive: true })
    orderList.value.addEventListener('touchmove', handleTouchMove, { passive: true })
    orderList.value.addEventListener('touchend', handleTouchEnd, { passive: true })
  }
  if (geoSupported) {
    requestLocation({ silent: true })
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

.location-switch {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  margin-left: 8px;
  padding: 2px 8px;
  font-size: 11px;
  color: #1989fa;
  background: rgba(25, 137, 250, 0.1);
  border-radius: 10px;

  .switch-arrow {
    margin-left: 2px;
    font-size: 13px;
    line-height: 1;
  }
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

.pref-sort-badge {
  margin-left: 8px;
  padding: 2px 8px;
  background: rgba(255, 107, 53, 0.12);
  color: #ff6b35;
  font-size: 11px;
  border-radius: 10px;
  font-weight: 600;
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

.card-title-row {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  gap: 6px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  flex: 1;
  min-width: 0;
}

.match-badge {
  flex-shrink: 0;
  padding: 2px 7px;
  background: linear-gradient(135deg, #ff6b35, #f7931e);
  color: #fff;
  font-size: 10px;
  border-radius: 8px;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(247, 147, 30, 0.35);
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

.addr-switcher {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f7f8fa;

  .switcher-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    background: #fff;
    border-bottom: 1px solid #f0f0f0;

    .switcher-title {
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .switcher-close {
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

  .switcher-body {
    flex: 1;
    overflow-y: auto;
    padding: 12px 16px;
  }

  .switcher-locate {
    display: flex;
    align-items: center;
    padding: 14px;
    background: rgba(25, 137, 250, 0.06);
    border: 1px dashed #1989fa;
    border-radius: 12px;
    margin-bottom: 10px;
    transition: all 0.2s;

    &.locating {
      opacity: 0.7;
    }

    .switcher-icon {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e6f4ff;
      border-radius: 10px;
      font-size: 18px;
      margin-right: 12px;
      flex-shrink: 0;
    }

    .switcher-info {
      flex: 1;
      min-width: 0;

      .switcher-name {
        font-size: 15px;
        font-weight: 600;
        color: #1989fa;
        margin-bottom: 2px;
      }

      .switcher-sub {
        font-size: 12px;
        color: #666;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .switcher-check {
      flex-shrink: 0;
      margin-left: 8px;
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1989fa;
      color: #fff;
      border-radius: 50%;
      font-size: 13px;
    }
  }

  .switcher-item {
    display: flex;
    align-items: center;
    padding: 14px;
    background: #fff;
    border-radius: 12px;
    margin-bottom: 10px;
    border: 1px solid transparent;
    transition: all 0.2s;

    &.active {
      border-color: #1989fa;
      background: rgba(25, 137, 250, 0.06);
    }

    .switcher-icon {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e6f4ff;
      border-radius: 10px;
      font-size: 18px;
      margin-right: 12px;
      flex-shrink: 0;
    }

    .switcher-info {
      flex: 1;
      min-width: 0;

      .switcher-name {
        font-size: 15px;
        font-weight: 600;
        color: #333;
        margin-bottom: 2px;
      }

      .switcher-sub {
        font-size: 12px;
        color: #999;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .switcher-check {
      flex-shrink: 0;
      margin-left: 8px;
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1989fa;
      color: #fff;
      border-radius: 50%;
      font-size: 13px;
    }
  }

  .switcher-divider {
    height: 1px;
    background: #eee;
    margin: 6px 0 12px;
  }

  .switcher-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 50px 20px;

    .empty-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }

    .empty-text {
      font-size: 15px;
      font-weight: 500;
      color: #666;
      margin-bottom: 8px;
    }

    .empty-tip {
      font-size: 12px;
      color: #999;
      text-align: center;
    }
  }
}
</style>

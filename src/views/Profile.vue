<template>
  <div class="profile-page">
    <div class="header-bg"></div>

    <div class="profile-header">
      <div class="avatar-section">
        <div class="avatar">
          <span>{{ userInfo.name.charAt(0) }}</span>
        </div>
        <div class="user-info">
          <div class="user-name">
            {{ userInfo.name }}
            <span v-if="userInfo.isCertified" class="certified-badge">✓ 已认证</span>
          </div>
          <div :class="['rank-badge', levelInfo.level]">
            {{ levelInfo.levelName }}代喝员
          </div>
        </div>
      </div>

      <div class="level-progress">
        <div class="level-info">
          <span class="level-current">当前等级：{{ levelInfo.levelName }}</span>
          <span class="level-next">下一等级：{{ levelInfo.nextLevel }}</span>
        </div>
        <nut-progress
          :percentage="levelInfo.progress"
          color="linear-gradient(90deg, #ffd700, #ff8c00)"
          :show-text="false"
          stroke-width="8"
        />
        <div class="level-tip">继续完成订单，提升好评率即可升级</div>
      </div>
    </div>

    <div class="stats-section">
      <div class="stats-card">
        <div class="stat-item">
          <div class="stat-value">{{ userStats.totalOrders }}</div>
          <div class="stat-label">累计接单</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-value">{{ userStats.totalDrinkAmount }}<span class="unit">斤</span></div>
          <div class="stat-label">总喝酒量</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-value">{{ userStats.goodRate }}<span class="unit">%</span></div>
          <div class="stat-label">好评率</div>
        </div>
      </div>
    </div>

    <div class="tags-section">
      <div class="section-header">
        <div class="section-title">客户评价标签</div>
        <div class="section-tip">按出现频率排序</div>
      </div>
      <div class="tags-card">
        <div
          v-for="(tag, index) in sortedTags"
          :key="tag.name"
          class="tag-item"
          :style="{ fontSize: getTagSize(index) + 'px', opacity: getTagOpacity(index) }"
        >
          <span class="tag-name">{{ tag.name }}</span>
          <span class="tag-count">{{ tag.count }}</span>
        </div>
      </div>
    </div>

    <div class="menu-section">
      <div class="menu-card">
        <div class="menu-item" @click="goToPage('/orders')">
          <div class="menu-left">
            <span class="menu-icon">📋</span>
            <span class="menu-text">我的订单</span>
          </div>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-item" @click="showCalendarPopup = true">
          <div class="menu-left">
            <span class="menu-icon">📅</span>
            <span class="menu-text">接单日历</span>
          </div>
          <span class="menu-extra">
            <span class="pref-summary">{{ currentMonthWorkDays }}天 / {{ currentMonthEarnings }}元</span>
            <span class="menu-arrow">›</span>
          </span>
        </div>
        <div class="menu-item" @click="goToPage('/earnings')">
          <div class="menu-left">
            <span class="menu-icon">💰</span>
            <span class="menu-text">收益统计</span>
          </div>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-item" @click="goToPage('/level-rules')">
          <div class="menu-left">
            <span class="menu-icon">📊</span>
            <span class="menu-text">等级规则</span>
          </div>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-item" @click="openPreference">
          <div class="menu-left">
            <span class="menu-icon">🎯</span>
            <span class="menu-text">偏好订阅</span>
          </div>
          <span class="menu-extra">
            <span v-if="hasPreferences" class="pref-summary">已订阅{{ preferenceCount }}项</span>
            <span v-else class="pref-summary unactive">未设置</span>
            <span class="menu-arrow">›</span>
          </span>
        </div>
      </div>

      <div class="menu-card">
        <div class="menu-item" @click="showComingSoon">
          <div class="menu-left">
            <span class="menu-icon">⚙️</span>
            <span class="menu-text">设置</span>
          </div>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-item" @click="showComingSoon">
          <div class="menu-left">
            <span class="menu-icon">📞</span>
            <span class="menu-text">联系客服</span>
          </div>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-item" @click="showAbout">
          <div class="menu-left">
            <span class="menu-icon">ℹ️</span>
            <span class="menu-text">关于我们</span>
          </div>
          <span class="menu-arrow">›</span>
        </div>
      </div>
    </div>

    <nut-popup
      v-model:visible="showCalendarPopup"
      position="bottom"
      round
      :style="{ height: '85%' }"
    >
      <div class="calendar-popup">
        <div class="calendar-header">
          <div class="calendar-title-bar">
            <span class="calendar-nav-btn" @click="prevMonth">‹</span>
            <div class="calendar-title">
              {{ calendarYear }}年{{ calendarMonth + 1 }}月
            </div>
            <span class="calendar-nav-btn" @click="nextMonth">›</span>
          </div>
          <div class="calendar-summary">
            <span class="summary-item">
              <span class="summary-label">本月接单</span>
              <span class="summary-value work">{{ currentMonthWorkDays }}天</span>
            </span>
            <span class="summary-divider"></span>
            <span class="summary-item">
              <span class="summary-label">本月收入</span>
              <span class="summary-value earn">¥{{ currentMonthEarnings }}</span>
            </span>
            <span class="summary-divider"></span>
            <span class="summary-item">
              <span class="summary-label">单日最高</span>
              <span class="summary-value max">¥{{ maxDailyOfMonth }}</span>
            </span>
          </div>
        </div>

        <div class="calendar-body">
          <div class="week-header">
            <span v-for="w in weekNames" :key="w" class="week-day">{{ w }}</span>
          </div>

          <div class="day-grid">
            <div
              v-for="(day, idx) in calendarDays"
              :key="idx"
              :class="[
                'day-cell',
                day.isOtherMonth ? 'other-month' : '',
                day.isToday ? 'today' : '',
                day.hasData ? 'has-data' : '',
                day.isSelected ? 'selected' : '',
                day.heatLevel ? `heat-${day.heatLevel}` : ''
              ]"
              @click="handleDayClick(day)"
            >
              <div class="day-num">{{ day.day }}</div>
              <div v-if="day.hasData" class="day-earnings">
                ¥{{ day.earnings }}
              </div>
              <div v-if="!day.hasData && !day.isOtherMonth && day.dayNum > today.getDate() && day.isFuture" class="day-future">
                <span class="future-dot">休</span>
              </div>
            </div>
          </div>

          <div class="legend-bar">
            <span class="legend-title">收入强度</span>
            <span class="legend-item">
              <span class="legend-dot heat-0"></span>
              休息
            </span>
            <span class="legend-item">
              <span class="legend-dot heat-1"></span>
              低
            </span>
            <span class="legend-item">
              <span class="legend-dot heat-2"></span>
              中
            </span>
            <span class="legend-item">
              <span class="legend-dot heat-3"></span>
              高
            </span>
            <span class="legend-item">
              <span class="legend-dot heat-4"></span>
              极高
            </span>
          </div>
        </div>

        <div class="calendar-footer">
          <span class="footer-close" @click="showCalendarPopup = false">关闭</span>
        </div>
      </div>
    </nut-popup>

    <nut-popup
      v-model:visible="showDayDetailPopup"
      position="bottom"
      round
      :style="{ height: '60%' }"
    >
      <div class="day-detail-popup">
        <div class="detail-header">
          <div class="detail-date">
            <span class="detail-date-main">{{ selectedDateDisplay }}</span>
            <span v-if="selectedDayData?.count" class="detail-date-sub">
              {{ selectedDayData.count }}单 · ¥{{ selectedDayData.earnings }}
            </span>
            <span v-else class="detail-date-sub rest">休息，无订单</span>
          </div>
          <span class="detail-close" @click="showDayDetailPopup = false">×</span>
        </div>

        <div class="detail-body">
          <div v-if="selectedDayData?.orders?.length" class="detail-orders">
            <div
              v-for="order in selectedDayData.orders"
              :key="order.orderId || order.id"
              class="detail-order-card"
            >
              <div class="detail-order-top">
                <span class="detail-order-title">{{ order.title }}</span>
                <span class="detail-order-price">¥{{ order.price }}</span>
              </div>
              <div class="detail-order-meta">
                <span class="detail-order-time">
                  {{ order.acceptTime?.substring(11, 16) }} 接单
                </span>
                <span class="detail-order-type">{{ order.drinkType }}</span>
                <span class="detail-order-duration">{{ order.duration }}小时</span>
              </div>
              <div class="detail-order-bottom">
                <span class="detail-order-addr">{{ order.address }}</span>
                <span v-if="order.result?.designatedDriverFee" class="detail-order-dd">
                  + 代驾 ¥{{ order.result.designatedDriverFee }}
                </span>
              </div>
              <div v-if="order.result?.review" class="detail-order-review">
                💬「{{ order.result.review }}」
              </div>
            </div>
          </div>

          <div v-else class="empty-detail">
            <div class="empty-icon">🌙</div>
            <div class="empty-text">这天没有接单记录</div>
            <div class="empty-tip">好好休息，明天继续加油！</div>
          </div>
        </div>
      </div>
    </nut-popup>

    <nut-popup
      v-model:visible="showPreferencePopup"
      position="bottom"
      round
      :style="{ height: '78%' }"
    >
      <div class="pref-popup">
        <div class="pref-header">
          <div class="pref-title">偏好订阅</div>
          <div class="pref-close" @click="showPreferencePopup = false">×</div>
        </div>

        <div class="pref-body">
          <div class="pref-section">
            <div class="pref-section-title">
              <span>🍺 擅长酒水类型</span>
              <span class="pref-section-tip">可多选</span>
            </div>
            <div class="pref-chips">
              <span
                v-for="item in drinkTypeOptions"
                :key="item"
                :class="['pref-chip', { active: tempDrinkTypes.includes(item) }]"
                @click="toggleDrinkType(item)"
              >
                {{ item }}
              </span>
            </div>
          </div>

          <div class="pref-section">
            <div class="pref-section-title">
              <span>🎤 擅长才艺类型</span>
              <span class="pref-section-tip">可多选</span>
            </div>
            <div class="pref-chips">
              <span
                v-for="item in talentTypeOptions"
                :key="item"
                :class="['pref-chip', { active: tempTalentTypes.includes(item) }]"
                @click="toggleTalentType(item)"
              >
                {{ item }}
              </span>
            </div>
          </div>

          <div class="pref-tip-card">
            <div class="pref-tip-icon">💡</div>
            <div class="pref-tip-text">
              设置后，首页“附近酒局”将按匹配度优先排序，擅长的单子会置顶并标记，让您一眼看到。
            </div>
          </div>
        </div>

        <div class="pref-footer">
          <nut-button size="large" type="default" @click="handleClearPref">
            清空
          </nut-button>
          <nut-button size="large" type="primary" @click="handleSavePref">
            保存设置
          </nut-button>
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
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore, useOrderStore } from '@/store'
import { drinkTypes, talentTypes } from '@/mock/data'
import { showToast } from '@nutui/nutui'

const router = useRouter()
const userStore = useUserStore()
const orderStore = useOrderStore()

const userInfo = computed(() => userStore.userInfo)
const userStats = computed(() => userStore.userStats)
const levelInfo = computed(() => userStore.levelInfo)
const sortedTags = computed(() => userStore.sortedTags)
const hasPreferences = computed(() => userStore.hasPreferences)
const preferenceCount = computed(() => userStore.preferenceCount)

const drinkTypeOptions = drinkTypes
const talentTypeOptions = talentTypes.filter((t) => t !== '不需要')

const showPreferencePopup = ref(false)
const tempDrinkTypes = ref([])
const tempTalentTypes = ref([])

const showCalendarPopup = ref(false)
const showDayDetailPopup = ref(false)

const today = new Date()
const calendarYear = ref(today.getFullYear())
const calendarMonth = ref(today.getMonth())
const selectedDateKey = ref('')

const weekNames = ['日', '一', '二', '三', '四', '五', '六']

const calendarDailyData = computed(() => orderStore.calendarDailyData)
const calendarMaxDailyEarnings = computed(() => orderStore.calendarMaxDailyEarnings)

const monthKey = computed(() => {
  const m = String(calendarMonth.value + 1).padStart(2, '0')
  return `${calendarYear.value}-${m}`
})

const currentMonthWorkDays = computed(() => {
  let days = 0
  Object.keys(calendarDailyData.value).forEach((k) => {
    if (k.startsWith(monthKey.value)) days++
  })
  return days
})

const currentMonthEarnings = computed(() => {
  let sum = 0
  Object.entries(calendarDailyData.value).forEach(([k, v]) => {
    if (k.startsWith(monthKey.value)) sum += v.earnings
  })
  return sum
})

const maxDailyOfMonth = computed(() => {
  let max = 0
  Object.entries(calendarDailyData.value).forEach(([k, v]) => {
    if (k.startsWith(monthKey.value) && v.earnings > max) max = v.earnings
  })
  return max
})

const calendarDays = computed(() => {
  const year = calendarYear.value
  const month = calendarMonth.value
  const firstDayOfMonth = new Date(year, month, 1)
  const startWeekDay = firstDayOfMonth.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const days = []
  const todayStr = formatDateKey(today)
  const selectedStr = selectedDateKey.value

  for (let i = startWeekDay - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i
    const prevM = month === 0 ? 12 : month
    const prevY = month === 0 ? year - 1 : year
    const dateKey = `${prevY}-${String(prevM).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
    days.push(buildDayCell(dayNum, dateKey, true, todayStr, selectedStr))
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push(buildDayCell(d, dateKey, false, todayStr, selectedStr))
  }

  while (days.length % 7 !== 0 || days.length < 42) {
    const nextM = month === 11 ? 1 : month + 2
    const nextY = month === 11 ? year + 1 : year
    const dayNum = days.length - startWeekDay - daysInMonth + 1
    const dateKey = `${nextY}-${String(nextM).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
    days.push(buildDayCell(dayNum, dateKey, true, todayStr, selectedStr))
    if (days.length >= 42) break
  }

  return days
})

const buildDayCell = (dayNum, dateKey, isOtherMonth, todayStr, selectedStr) => {
  const d = new Date(dateKey)
  const dayData = calendarDailyData.value[dateKey]
  const hasData = !!dayData
  const earnings = dayData?.earnings || 0
  const max = calendarMaxDailyEarnings.value || 1

  let heatLevel = 0
  if (hasData) {
    const ratio = earnings / max
    if (ratio < 0.25) heatLevel = 1
    else if (ratio < 0.5) heatLevel = 2
    else if (ratio < 0.75) heatLevel = 3
    else heatLevel = 4
  }

  const cellDate = new Date(dateKey)
  const isFuture = cellDate.getTime() > today.getTime()

  return {
    day: dayNum,
    dayNum,
    dateKey,
    isOtherMonth,
    isToday: dateKey === todayStr,
    hasData,
    earnings,
    orderCount: dayData?.count || 0,
    orders: dayData?.orders || [],
    heatLevel,
    isFuture,
    isSelected: dateKey === selectedStr
  }
}

const formatDateKey = (d) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const prevMonth = () => {
  if (calendarMonth.value === 0) {
    calendarMonth.value = 11
    calendarYear.value--
  } else {
    calendarMonth.value--
  }
  selectedDateKey.value = ''
}

const nextMonth = () => {
  if (calendarMonth.value === 11) {
    calendarMonth.value = 0
    calendarYear.value++
  } else {
    calendarMonth.value++
  }
  selectedDateKey.value = ''
}

const selectedDayData = computed(() => {
  if (!selectedDateKey.value) return null
  return calendarDailyData.value[selectedDateKey.value] || { count: 0, earnings: 0, orders: [] }
})

const selectedDateDisplay = computed(() => {
  if (!selectedDateKey.value) return ''
  const [y, m, d] = selectedDateKey.value.split('-')
  const weeks = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const date = new Date(selectedDateKey.value)
  return `${parseInt(m)}月${parseInt(d)}日 ${weeks[date.getDay()]}`
})

const handleDayClick = (day) => {
  if (day.isOtherMonth) return
  selectedDateKey.value = day.dateKey
  showDayDetailPopup.value = true
}

watch(showCalendarPopup, (v) => {
  if (v) {
    calendarYear.value = today.getFullYear()
    calendarMonth.value = today.getMonth()
    selectedDateKey.value = ''
  }
})

const openPreference = () => {
  tempDrinkTypes.value = [...userStore.preferences.drinkTypes]
  tempTalentTypes.value = [...userStore.preferences.talentTypes]
  showPreferencePopup.value = true
}

const toggleDrinkType = (item) => {
  const idx = tempDrinkTypes.value.indexOf(item)
  if (idx > -1) {
    tempDrinkTypes.value.splice(idx, 1)
  } else {
    tempDrinkTypes.value.push(item)
  }
}

const toggleTalentType = (item) => {
  const idx = tempTalentTypes.value.indexOf(item)
  if (idx > -1) {
    tempTalentTypes.value.splice(idx, 1)
  } else {
    tempTalentTypes.value.push(item)
  }
}

const handleSavePref = () => {
  userStore.setPreferences(tempDrinkTypes.value, tempTalentTypes.value)
  showPreferencePopup.value = false
  if (tempDrinkTypes.value.length === 0 && tempTalentTypes.value.length === 0) {
    showToast({ content: '已清空偏好', type: 'success' })
  } else {
    showToast({ content: '偏好保存成功', type: 'success' })
  }
}

const handleClearPref = () => {
  tempDrinkTypes.value = []
  tempTalentTypes.value = []
}

const getTagSize = (index) => {
  const baseSize = 12
  const maxAdd = 8
  const totalTags = sortedTags.value.length || 1
  return baseSize + Math.floor((1 - index / totalTags) * maxAdd)
}

const getTagOpacity = (index) => {
  const baseOpacity = 0.6
  const maxAdd = 0.4
  const totalTags = sortedTags.value.length || 1
  return baseOpacity + (1 - index / totalTags) * maxAdd
}

const goToPage = (path) => {
  router.push(path)
}

const showComingSoon = () => {
  showToast({ content: '功能开发中，敬请期待' })
}

const showAbout = () => {
  showToast({ content: '代喝员接单面板 v1.0.0' })
}
</script>

<style lang="scss" scoped>
.profile-page {
  width: 100%;
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 70px;
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 220px;
  background: linear-gradient(135deg, #1989fa 0%, #5db3ff 50%, #91d5ff 100%);
  z-index: 0;
}

.profile-header {
  position: relative;
  z-index: 1;
  padding: 0 16px 16px;
  padding-top: calc(env(safe-area-inset-top) + 20px);
  color: #fff;
}

.avatar-section {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.avatar {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fff, #f0f0f0);
  border-radius: 50%;
  font-size: 28px;
  font-weight: bold;
  color: #1989fa;
  border: 3px solid rgba(255, 255, 255, 0.5);
  margin-right: 14px;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.certified-badge {
  margin-left: 8px;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 10px;
  font-size: 11px;
  font-weight: normal;
}

.level-progress {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 14px;
}

.level-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 13px;
}

.level-current {
  font-weight: 500;
}

.level-next {
  opacity: 0.85;
}

.level-tip {
  margin-top: 8px;
  font-size: 11px;
  opacity: 0.8;
  text-align: center;
}

.stats-section {
  position: relative;
  z-index: 1;
  padding: 0 16px;
  margin-top: -10px;
}

.stats-card {
  display: flex;
  background: #fff;
  border-radius: 16px;
  padding: 20px 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 6px;

  .unit {
    font-size: 12px;
    font-weight: normal;
    color: #999;
    margin-left: 2px;
  }
}

.stat-label {
  font-size: 12px;
  color: #999;
}

.stat-divider {
  width: 1px;
  background: #f0f0f0;
}

.tags-section {
  margin-top: 16px;
  padding: 0 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.section-tip {
  font-size: 12px;
  color: #999;
}

.tags-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 10px;
  min-height: 100px;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  background: linear-gradient(135deg, #fff3e0, #ffe0b2);
  border-radius: 20px;
  font-weight: 600;
  color: #d48806;
  transition: all 0.3s ease;
  cursor: default;
}

.tag-name {
  margin-right: 4px;
}

.tag-count {
  padding: 1px 6px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  font-size: 10px;
  font-weight: normal;
  color: #d48806;
}

.menu-section {
  margin-top: 16px;
  padding: 0 16px;
}

.menu-card {
  background: #fff;
  border-radius: 12px;
  margin-bottom: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background 0.2s;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background: #f9f9f9;
  }
}

.menu-left {
  display: flex;
  align-items: center;
}

.menu-icon {
  font-size: 18px;
  margin-right: 12px;
}

.menu-text {
  font-size: 14px;
  color: #333;
}

.menu-extra {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pref-summary {
  font-size: 12px;
  color: #ff6b35;

  &.unactive {
    color: #bbb;
  }
}

.menu-arrow {
  font-size: 20px;
  color: #ccc;
}

.rank-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  backdrop-filter: blur(10px);

  &.bronze {
    background: linear-gradient(135deg, #cd7f32, #d4a574);
    color: #fff;
  }

  &.silver {
    background: linear-gradient(135deg, #a8a8a8, #dcdcdc);
    color: #444;
  }

  &.gold {
    background: linear-gradient(135deg, #d4a017, #ffd700);
    color: #5c4600;
  }

  &.platinum {
    background: linear-gradient(135deg, #4a90e2, #b0e0e6);
    color: #fff;
  }

  &.diamond {
    background: linear-gradient(135deg, #b9f2ff, #e0ffff);
    color: #006064;
    box-shadow: 0 0 10px rgba(185, 242, 255, 0.6);
  }
}

.calendar-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f7f8fa;

  .calendar-header {
    flex-shrink: 0;
    padding: 16px;
    background: linear-gradient(135deg, #1989fa 0%, #5db3ff 100%);
    color: #fff;
    border-radius: 0 0 0 0;

    .calendar-title-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 14px;

      .calendar-title {
        font-size: 20px;
        font-weight: bold;
        min-width: 140px;
        text-align: center;
      }

      .calendar-nav-btn {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 26px;
        font-weight: 300;
        cursor: pointer;
        border-radius: 50%;
        transition: background 0.2s;

        &:active {
          background: rgba(255, 255, 255, 0.2);
        }
      }
    }

    .calendar-summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 12px 8px;

      .summary-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;

        .summary-label {
          font-size: 11px;
          opacity: 0.85;
        }

        .summary-value {
          font-size: 16px;
          font-weight: bold;

          &.work {
            color: #fffbe6;
          }

          &.earn {
            color: #ffe0b2;
          }

          &.max {
            color: #ffccbc;
          }
        }
      }

      .summary-divider {
        width: 1px;
        height: 32px;
        background: rgba(255, 255, 255, 0.25);
      }
    }
  }

  .calendar-body {
    flex: 1;
    overflow-y: auto;
    padding: 14px 12px;

    .week-header {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      margin-bottom: 8px;

      .week-day {
        text-align: center;
        font-size: 12px;
        font-weight: 500;
        color: #888;
        padding: 6px 0;
      }
    }

    .day-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
      background: #fff;
      border-radius: 12px;
      padding: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }

    .day-cell {
      aspect-ratio: 1 / 1;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      cursor: pointer;
      transition: all 0.2s;
      border: 2px solid transparent;

      &.other-month {
        opacity: 0.25;
        cursor: default;
      }

      &:not(.other-month):not(.has-data):not(.isFuture):active {
        background: #f5f5f5;
      }

      &.has-data {
        cursor: pointer;

        &.heat-1 {
          background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
          color: #b71c1c;
        }

        &.heat-2 {
          background: linear-gradient(135deg, #ffe0b2 0%, #ffab91 100%);
          color: #bf360c;
        }

        &.heat-3 {
          background: linear-gradient(135deg, #ffb74d 0%, #ff9800 100%);
          color: #fff;
        }

        &.heat-4 {
          background: linear-gradient(135deg, #ff6b35 0%, #e64a19 100%);
          color: #fff;
          box-shadow: 0 3px 10px rgba(230, 74, 25, 0.35);
        }
      }

      &.today {
        border-color: #1989fa;

        .day-num {
          font-weight: bold;
          color: #1989fa;
        }
      }

      &.selected {
        border-color: #1989fa !important;
        transform: scale(1.05);
      }

      .day-num {
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 2px;
      }

      .day-earnings {
        font-size: 9px;
        font-weight: 600;
        line-height: 1;
      }

      .day-future {
        .future-dot {
          font-size: 10px;
          color: #bbb;
          background: #f5f5f5;
          padding: 1px 5px;
          border-radius: 8px;
        }
      }
    }

    .legend-bar {
      margin-top: 14px;
      background: #fff;
      border-radius: 10px;
      padding: 10px 12px;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

      .legend-title {
        font-size: 12px;
        font-weight: 500;
        color: #666;
        margin-right: 4px;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        color: #888;
      }

      .legend-dot {
        width: 14px;
        height: 14px;
        border-radius: 4px;

        &.heat-0 {
          background: #f5f5f5;
        }

        &.heat-1 {
          background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
        }

        &.heat-2 {
          background: linear-gradient(135deg, #ffe0b2 0%, #ffab91 100%);
        }

        &.heat-3 {
          background: linear-gradient(135deg, #ffb74d 0%, #ff9800 100%);
        }

        &.heat-4 {
          background: linear-gradient(135deg, #ff6b35 0%, #e64a19 100%);
        }
      }
    }
  }

  .calendar-footer {
    flex-shrink: 0;
    padding: 12px 16px;
    padding-bottom: calc(env(safe-area-inset-bottom) + 12px);
    background: #fff;
    border-top: 1px solid #f0f0f0;
    text-align: center;

    .footer-close {
      display: inline-block;
      padding: 10px 40px;
      background: linear-gradient(135deg, #f5f5f5, #e8e8e8);
      border-radius: 22px;
      font-size: 14px;
      font-weight: 500;
      color: #555;
      cursor: pointer;

      &:active {
        opacity: 0.8;
      }
    }
  }
}

.day-detail-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f7f8fa;

  .detail-header {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    background: #fff;
    border-bottom: 1px solid #f0f0f0;

    .detail-date {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .detail-date-main {
        font-size: 18px;
        font-weight: bold;
        color: #333;
      }

      .detail-date-sub {
        font-size: 13px;
        color: #ff6b35;
        font-weight: 500;

        &.rest {
          color: #999;
          font-weight: normal;
        }
      }
    }

    .detail-close {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      color: #999;
      cursor: pointer;
      border-radius: 50%;
      transition: background 0.2s;

      &:active {
        background: #f5f5f5;
      }
    }
  }

  .detail-body {
    flex: 1;
    overflow-y: auto;
    padding: 14px;

    .detail-orders {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .detail-order-card {
      background: #fff;
      border-radius: 12px;
      padding: 14px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

      .detail-order-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        .detail-order-title {
          font-size: 15px;
          font-weight: 600;
          color: #333;
        }

        .detail-order-price {
          font-size: 18px;
          font-weight: bold;
          color: #ff6b35;
        }
      }

      .detail-order-meta {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;

        > span {
          font-size: 12px;
          color: #888;
          padding: 2px 8px;
          background: #f5f5f5;
          border-radius: 10px;
        }
      }

      .detail-order-bottom {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;

        .detail-order-addr {
          flex: 1;
          font-size: 12px;
          color: #999;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-right: 8px;
        }

        .detail-order-dd {
          flex-shrink: 0;
          font-size: 12px;
          color: #ff6b35;
          font-weight: 500;
        }
      }

      .detail-order-review {
        padding: 10px 12px;
        background: #fffbe6;
        border-radius: 8px;
        font-size: 12px;
        color: #8c6e2a;
        line-height: 1.5;
      }
    }

    .empty-detail {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;

      .empty-icon {
        font-size: 60px;
        margin-bottom: 16px;
      }

      .empty-text {
        font-size: 16px;
        font-weight: 500;
        color: #666;
        margin-bottom: 8px;
      }

      .empty-tip {
        font-size: 12px;
        color: #999;
      }
    }
  }
}

.pref-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f7f8fa;

  .pref-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    background: #fff;
    border-bottom: 1px solid #f0f0f0;

    .pref-title {
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .pref-close {
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

  .pref-body {
    flex: 1;
    overflow-y: auto;
    padding: 14px 16px;
  }

  .pref-section {
    background: #fff;
    border-radius: 12px;
    padding: 14px;
    margin-bottom: 12px;

    .pref-section-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 14px;
      font-weight: 600;
      color: #333;
      margin-bottom: 12px;

      .pref-section-tip {
        font-size: 11px;
        font-weight: normal;
        color: #bbb;
      }
    }

    .pref-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .pref-chip {
      padding: 7px 16px;
      border-radius: 18px;
      background: #f5f5f5;
      font-size: 13px;
      color: #666;
      border: 1px solid transparent;
      transition: all 0.2s;

      &.active {
        background: rgba(255, 107, 53, 0.12);
        color: #ff6b35;
        border-color: #ff6b35;
        font-weight: 600;
      }
    }
  }

  .pref-tip-card {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 12px 14px;
    background: #fffbe6;
    border-radius: 10px;
    border: 1px solid #ffe58f;

    .pref-tip-icon {
      font-size: 16px;
      flex-shrink: 0;
    }

    .pref-tip-text {
      font-size: 12px;
      color: #8c6e2a;
      line-height: 1.6;
    }
  }

  .pref-footer {
    flex-shrink: 0;
    display: flex;
    padding: 12px 16px;
    padding-bottom: calc(env(safe-area-inset-bottom) + 12px);
    gap: 12px;
    background: #fff;
    border-top: 1px solid #f0f0f0;

    :deep(.nut-button) {
      flex: 1;
    }
  }
}
</style>

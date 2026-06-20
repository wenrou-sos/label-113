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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store'
import { drinkTypes, talentTypes } from '@/mock/data'
import { showToast } from '@nutui/nutui'

const router = useRouter()
const userStore = useUserStore()

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

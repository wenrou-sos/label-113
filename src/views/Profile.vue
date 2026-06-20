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

    <nut-tabbar bottom safe-area-inset-bottom>
      <nut-tabbar-item tab-title="首页" icon="map" to="/home" />
      <nut-tabbar-item tab-title="我的" icon="my" to="/profile" />
    </nut-tabbar>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store'
import { showToast } from '@nutui/nutui'

const router = useRouter()
const userStore = useUserStore()

const userInfo = computed(() => userStore.userInfo)
const userStats = computed(() => userStore.userStats)
const levelInfo = computed(() => userStore.levelInfo)
const sortedTags = computed(() => userStore.sortedTags)

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

.menu-arrow {
  font-size: 20px;
  color: #ccc;
}
</style>

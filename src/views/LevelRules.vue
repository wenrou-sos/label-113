<template>
  <div class="level-rules-page">
    <div class="page-header">
      <div class="back-btn" @click="$router.back()">
        ‹
      </div>
      <div class="page-title">等级规则</div>
      <div class="placeholder"></div>
    </div>

    <div class="current-level">
      <div class="current-label">当前等级</div>
      <div :class="['level-badge', 'large', levelInfo.level]">
        {{ levelInfo.levelName }}代喝员
      </div>
    </div>

    <div class="levels-section">
      <div class="section-title">等级划分标准</div>
      <div class="levels-list">
        <div
          v-for="(level, idx) in levelRules"
          :key="level.key"
          :class="['level-item', { active: levelInfo.level === level.key }]"
        >
          <div class="level-left">
            <div :class="['level-icon', level.key]">
              {{ level.icon }}
            </div>
            <div class="level-info">
              <div class="level-name">
                {{ level.name }}
                <span v-if="levelInfo.level === level.key" class="current-tag">当前</span>
              </div>
              <div class="level-conditions">
                累计接单数 ≥ {{ level.orders }}单，好评率 ≥ {{ level.goodRate }}%
              </div>
            </div>
          </div>
          <div v-if="idx < levelRules.length - 1" class="level-arrow">→</div>
        </div>
      </div>
    </div>

    <div class="benefits-section">
      <div class="section-title">等级权益</div>
      <div class="benefits-card">
        <div class="benefit-item">
          <span class="benefit-icon">🎯</span>
          <span class="benefit-text">等级越高，优先展示高价值订单</span>
        </div>
        <div class="benefit-item">
          <span class="benefit-icon">💎</span>
          <span class="benefit-text">钻石等级专属客服通道</span>
        </div>
        <div class="benefit-item">
          <span class="benefit-icon">🎁</span>
          <span class="benefit-text">每月等级专属红包奖励</span>
        </div>
        <div class="benefit-item">
          <span class="benefit-icon">⭐</span>
          <span class="benefit-text">铂金及以上等级标识展示</span>
        </div>
        <div class="benefit-item">
          <span class="benefit-icon">📈</span>
          <span class="benefit-text">高等级订单服务费分成比例更高</span>
        </div>
      </div>
    </div>

    <div class="tips-section">
      <div class="section-title">升级小贴士</div>
      <div class="tips-card">
        <div class="tip-item">
          <span class="tip-num">1</span>
          <span class="tip-text">认真完成每一个订单，争取客户好评</span>
        </div>
        <div class="tip-item">
          <span class="tip-num">2</span>
          <span class="tip-text">提高服务质量，满足客户合理需求</span>
        </div>
        <div class="tip-item">
          <span class="tip-num">3</span>
          <span class="tip-text">准时到达，不迟到不早退</span>
        </div>
        <div class="tip-item">
          <span class="tip-num">4</span>
          <span class="tip-text">积极学习才艺，提升综合竞争力</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '@/store'

const userStore = useUserStore()
const levelInfo = computed(() => userStore.levelInfo)

const levelRules = [
  {
    key: 'bronze',
    name: '青铜',
    icon: '🥉',
    orders: 0,
    goodRate: 0
  },
  {
    key: 'silver',
    name: '白银',
    icon: '🥈',
    orders: 20,
    goodRate: 88
  },
  {
    key: 'gold',
    name: '黄金',
    icon: '🥇',
    orders: 50,
    goodRate: 92
  },
  {
    key: 'platinum',
    name: '铂金',
    icon: '💠',
    orders: 100,
    goodRate: 95
  },
  {
    key: 'diamond',
    name: '钻石',
    icon: '💎',
    orders: 200,
    goodRate: 98
  }
]
</script>

<style lang="scss" scoped>
.level-rules-page {
  width: 100%;
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  padding-top: calc(env(safe-area-inset-top) + 12px);
  background: #fff;
  border-bottom: 1px solid #eee;
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

.page-title {
  flex: 1;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.placeholder {
  width: 32px;
}

.current-level {
  padding: 24px 16px;
  text-align: center;
  background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
  color: #fff;
}

.current-label {
  font-size: 13px;
  opacity: 0.7;
  margin-bottom: 12px;
}

.level-badge.large {
  display: inline-flex;
  align-items: center;
  padding: 8px 24px;
  border-radius: 24px;
  font-size: 18px;
  font-weight: bold;

  &.bronze {
    background: linear-gradient(135deg, #cd7f32, #b8860b);
  }

  &.silver {
    background: linear-gradient(135deg, #e8e8e8, #c0c0c0);
    color: #333;
  }

  &.gold {
    background: linear-gradient(135deg, #ffd700, #ffb700);
    color: #8b4513;
  }

  &.platinum {
    background: linear-gradient(135deg, #e5e4e2, #b0c4de);
    color: #4682b4;
  }

  &.diamond {
    background: linear-gradient(135deg, #b9f2ff, #87ceeb);
    color: #1e90ff;
  }
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  padding: 0 16px;
}

.levels-section {
  padding-top: 16px;
}

.levels-list {
  margin: 0 16px;
  background: #fff;
  border-radius: 12px;
  padding: 8px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.level-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }

  &.active {
    .level-name {
      color: #1989fa;
    }

    .level-icon {
      transform: scale(1.1);
      box-shadow: 0 0 12px rgba(25, 137, 250, 0.4);
    }
  }
}

.level-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.level-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 50%;
  font-size: 20px;
  margin-right: 12px;
  transition: all 0.3s ease;

  &.bronze {
    background: linear-gradient(135deg, #f5e6d3, #e8d4b8);
  }

  &.silver {
    background: linear-gradient(135deg, #f5f5f5, #e0e0e0);
  }

  &.gold {
    background: linear-gradient(135deg, #fff8dc, #ffe4b5);
  }

  &.platinum {
    background: linear-gradient(135deg, #f0f8ff, #e6e6fa);
  }

  &.diamond {
    background: linear-gradient(135deg, #e0ffff, #b0e0e6);
  }
}

.level-info {
  flex: 1;
}

.level-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
}

.current-tag {
  margin-left: 8px;
  padding: 1px 8px;
  background: #1989fa;
  color: #fff;
  font-size: 10px;
  border-radius: 8px;
  font-weight: normal;
}

.level-conditions {
  font-size: 12px;
  color: #999;
}

.level-arrow {
  font-size: 18px;
  color: #ccc;
  margin-left: 8px;
}

.benefits-section,
.tips-section {
  margin-top: 16px;
}

.benefits-card,
.tips-card {
  margin: 0 16px;
  background: #fff;
  border-radius: 12px;
  padding: 4px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.benefit-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }
}

.benefit-icon {
  font-size: 18px;
  margin-right: 12px;
}

.benefit-text {
  flex: 1;
  font-size: 13px;
  color: #666;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }
}

.tip-num {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1989fa;
  color: #fff;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
  margin-right: 10px;
  flex-shrink: 0;
  margin-top: 1px;
}

.tip-text {
  flex: 1;
  font-size: 13px;
  color: #666;
  line-height: 1.6;
}
</style>

<template>
  <div class="earnings-page">
    <div class="page-header">
      <div class="back-btn" @click="$router.back()">
        ‹
      </div>
      <div class="page-title">收益统计</div>
      <div class="placeholder"></div>
    </div>

    <div v-if="monthlyGoalAmount > 0" class="goal-card" @click="openGoalEditor">
      <div class="goal-header">
        <div class="goal-label">
          <span>🎯 本月目标</span>
          <span class="goal-edit">修改 ›</span>
        </div>
        <div class="goal-amounts">
          <span class="goal-target">¥{{ monthlyGoalAmount.toLocaleString() }}</span>
          <span class="goal-divider">·</span>
          <span class="goal-earned">已完成 ¥{{ Math.floor(monthlyEarnings).toLocaleString() }}</span>
          <span class="goal-percent">({{ goalPercent }}%)</span>
        </div>
      </div>
      <div class="goal-progress-bar">
        <div class="goal-progress-fill" :style="{ width: goalPercent + '%' }"></div>
      </div>
    </div>

    <div v-else class="goal-card goal-empty" @click="openGoalEditor">
      <div class="goal-empty-content">
        <span class="goal-empty-icon">🎯</span>
        <span class="goal-empty-text">设置本月收益目标，看着更有奔头</span>
        <span class="goal-empty-arrow">去设置 ›</span>
      </div>
    </div>

    <div class="summary-card">
      <div class="summary-header">
        <span class="summary-label">累计收益</span>
        <span class="summary-unit">元</span>
      </div>
      <div class="summary-amount">¥{{ userStats.totalEarnings.toLocaleString() }}</div>
      <div class="summary-sub">
        <span>共{{ userStats.totalOrders }}单</span>
        <span>好评率 {{ userStats.goodRate }}%</span>
      </div>
    </div>

    <div class="stats-grid">
      <div class="grid-item">
        <div class="grid-value">¥{{ Math.floor(monthlyEarnings).toLocaleString() }}</div>
        <div class="grid-label">本月收益</div>
      </div>
      <div class="grid-item">
        <div class="grid-value">¥{{ Math.floor(userStats.totalEarnings / userStats.totalOrders) }}</div>
        <div class="grid-label">平均单价</div>
      </div>
      <div class="grid-item">
        <div class="grid-value">{{ userStats.totalDrinkAmount }}<span class="unit">斤</span></div>
        <div class="grid-label">累计饮酒量</div>
      </div>
      <div class="grid-item">
        <div class="grid-value">{{ userStats.goodOrders }}</div>
        <div class="grid-label">好评订单</div>
      </div>
    </div>

    <div class="chart-section">
      <div class="section-title">近7日收益趋势</div>
      <div class="chart-card">
        <div class="chart-bars">
          <div
            v-for="(item, idx) in weekData"
            :key="idx"
            class="bar-item"
          >
            <div class="bar-wrapper">
              <div
                class="bar-fill"
                :style="{ height: (item.amount / maxAmount * 100) + '%' }"
              ></div>
            </div>
            <div class="bar-label">{{ item.day }}</div>
            <div class="bar-amount">¥{{ item.amount }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="list-section">
      <div class="section-title">近期收益明细</div>
      <div class="list-card">
        <div
          v-for="(item, idx) in earningList"
          :key="idx"
          class="list-item"
        >
          <div class="item-left">
            <div class="item-icon">💰</div>
            <div class="item-info">
              <div class="item-title">{{ item.title }}</div>
              <div class="item-time">{{ item.time }}</div>
            </div>
          </div>
          <div class="item-amount">+¥{{ item.amount }}</div>
        </div>
      </div>
    </div>

    <nut-popup
      v-model:visible="showGoalEditor"
      position="bottom"
      round
      :style="{ height: 'auto' }"
    >
      <div class="goal-editor">
        <div class="goal-editor-header">
          <div class="goal-editor-title">
            {{ monthlyGoalAmount > 0 ? '修改本月目标' : '设置本月目标' }}
          </div>
          <div class="goal-editor-close" @click="showGoalEditor = false">×</div>
        </div>

        <div class="goal-editor-body">
          <div class="goal-editor-sub">本月想赚多少钱？</div>
          <div class="goal-editor-input-row">
            <span class="goal-editor-prefix">¥</span>
            <input
              v-model="tempGoalAmount"
              class="goal-editor-input"
              type="number"
              min="0"
              step="100"
              placeholder="5000"
              autofocus
            />
          </div>
          <div class="goal-editor-presets">
            <span
              v-for="preset in goalPresets"
              :key="preset"
              class="goal-editor-chip"
              @click="tempGoalAmount = preset"
            >
              ¥{{ preset.toLocaleString() }}
            </span>
          </div>
          <div class="goal-editor-tip">
            💡 目标仅保存在本地，更换月份后可重新设置
          </div>
        </div>

        <div class="goal-editor-footer">
          <nut-button size="large" type="default" @click="handleClearGoal">
            清除目标
          </nut-button>
          <nut-button size="large" type="primary" @click="handleSaveGoal">
            确定
          </nut-button>
        </div>
      </div>
    </nut-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useUserStore } from '@/store'
import { useOrderStore } from '@/store'
import { showToast } from '@nutui/nutui'

const userStore = useUserStore()
const orderStore = useOrderStore()

let monthTicker = null

onMounted(() => {
  userStore.tickCurrentMonth()
  monthTicker = setInterval(() => {
    userStore.tickCurrentMonth()
  }, 60 * 1000)
})

onBeforeUnmount(() => {
  if (monthTicker) {
    clearInterval(monthTicker)
    monthTicker = null
  }
})

const userStats = computed(() => userStore.userStats)
const monthlyEarnings = computed(() => orderStore.monthlyEarnings)
const monthlyGoalAmount = computed(() => {
  const goal = userStore.monthlyGoal
  if (!goal || !goal.month) return 0
  if (goal.month !== userStore.currentMonth) return 0
  return goal.amount || 0
})
const goalPercent = computed(() => {
  const target = monthlyGoalAmount.value
  if (target <= 0) return 0
  const pct = Math.round((monthlyEarnings.value / target) * 100)
  return Math.min(100, pct)
})

const showGoalEditor = ref(false)
const tempGoalAmount = ref('')
const goalPresets = [3000, 5000, 8000, 10000, 15000, 20000]

const openGoalEditor = () => {
  tempGoalAmount.value = monthlyGoalAmount.value > 0 ? String(monthlyGoalAmount.value) : ''
  showGoalEditor.value = true
}

const handleSaveGoal = () => {
  const val = Number(tempGoalAmount.value)
  if (isNaN(val) || val <= 0) {
    showToast({ content: '请输入有效的目标金额' })
    return
  }
  userStore.setMonthlyGoal(val)
  showGoalEditor.value = false
  showToast({ content: '目标已设置', type: 'success' })
}

const handleClearGoal = () => {
  userStore.setMonthlyGoal(0)
  showGoalEditor.value = false
  showToast({ content: '已清除目标' })
}

const weekData = ref([
  { day: '周一', amount: 588 },
  { day: '周二', amount: 888 },
  { day: '周三', amount: 366 },
  { day: '周四', amount: 1288 },
  { day: '周五', amount: 666 },
  { day: '周六', amount: 999 },
  { day: '周日', amount: 788 }
])

const maxAmount = computed(() => {
  return Math.max(...weekData.value.map((d) => d.amount))
})

const earningList = computed(() => {
  return orderStore.orders
    .filter((o) => o.status === 'completed')
    .map((o) => ({
      title: o.title,
      time: o.endTime?.slice(0, 10) || '2026-06-18',
      amount: o.price + (o.result?.designatedDriverFee || 0)
    }))
})
</script>

<style lang="scss" scoped>
.earnings-page {
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

.summary-card {
  margin: 16px;
  padding: 24px;
  background: linear-gradient(135deg, #ff6b35, #ff8c00, #ffa500);
  border-radius: 16px;
  color: #fff;
  box-shadow: 0 4px 16px rgba(255, 107, 53, 0.3);
}

.summary-header {
  display: flex;
  align-items: baseline;
  margin-bottom: 8px;
}

.summary-label {
  font-size: 14px;
  opacity: 0.9;
}

.summary-unit {
  margin-left: 4px;
  font-size: 14px;
  opacity: 0.9;
}

.summary-amount {
  font-size: 36px;
  font-weight: bold;
  letter-spacing: 1px;
  margin-bottom: 12px;
}

.summary-sub {
  display: flex;
  gap: 20px;
  font-size: 13px;
  opacity: 0.9;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 0 16px;
  margin-bottom: 16px;
}

.grid-item {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.grid-value {
  font-size: 22px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;

  .unit {
    font-size: 12px;
    font-weight: normal;
    color: #999;
    margin-left: 2px;
  }
}

.grid-label {
  font-size: 12px;
  color: #999;
}

.chart-section,
.list-section {
  padding: 0 16px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.chart-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.chart-bars {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 160px;
}

.bar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.bar-wrapper {
  width: 24px;
  height: 120px;
  display: flex;
  align-items: flex-end;
  background: #f5f5f5;
  border-radius: 4px 4px 0 0;
  overflow: hidden;
  margin-bottom: 8px;
}

.bar-fill {
  width: 100%;
  background: linear-gradient(180deg, #ffa500, #ff6b35);
  border-radius: 4px 4px 0 0;
  transition: height 0.5s ease;
}

.bar-label {
  font-size: 11px;
  color: #999;
  margin-bottom: 2px;
}

.bar-amount {
  font-size: 10px;
  color: #666;
}

.list-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }
}

.item-left {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.item-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff3e0;
  border-radius: 10px;
  font-size: 18px;
  margin-right: 12px;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.item-time {
  font-size: 12px;
  color: #999;
}

.item-amount {
  font-size: 16px;
  font-weight: bold;
  color: #52c41a;
}

.goal-card {
  margin: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #1989fa, #3f79ff);
  border-radius: 16px;
  color: #fff;
  box-shadow: 0 4px 14px rgba(25, 137, 250, 0.25);

  .goal-header {
    margin-bottom: 12px;

    .goal-label {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;

      > span:first-child {
        font-size: 14px;
        font-weight: 500;
        opacity: 0.95;
      }

      .goal-edit {
        font-size: 12px;
        opacity: 0.85;
      }
    }

    .goal-amounts {
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 6px;
      font-size: 13px;

      .goal-target {
        font-size: 18px;
        font-weight: bold;
      }

      .goal-divider {
        opacity: 0.7;
      }

      .goal-earned {
        opacity: 0.95;
      }

      .goal-percent {
        opacity: 0.95;
        font-weight: 600;
      }
    }
  }

  .goal-progress-bar {
    height: 8px;
    background: rgba(255, 255, 255, 0.25);
    border-radius: 4px;
    overflow: hidden;

    .goal-progress-fill {
      height: 100%;
      background: #fff;
      border-radius: 4px;
      transition: width 0.6s ease;
    }
  }

  &.goal-empty {
    background: linear-gradient(135deg, #e6f4ff, #f0f8ff);
    color: #1989fa;
    box-shadow: 0 2px 10px rgba(25, 137, 250, 0.1);

    .goal-empty-content {
      display: flex;
      align-items: center;
      gap: 10px;

      .goal-empty-icon {
        font-size: 22px;
      }

      .goal-empty-text {
        flex: 1;
        font-size: 14px;
        font-weight: 500;
      }

      .goal-empty-arrow {
        font-size: 13px;
        opacity: 0.85;
      }
    }
  }
}

.goal-editor {
  background: #fff;
  padding-bottom: env(safe-area-inset-bottom);

  .goal-editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;

    .goal-editor-title {
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .goal-editor-close {
      font-size: 24px;
      color: #999;
      line-height: 1;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .goal-editor-body {
    padding: 20px 16px;

    .goal-editor-sub {
      font-size: 14px;
      color: #666;
      margin-bottom: 14px;
    }

    .goal-editor-input-row {
      display: flex;
      align-items: center;
      background: #f5f5f5;
      border-radius: 12px;
      padding: 0 14px;
      margin-bottom: 16px;

      .goal-editor-prefix {
        font-size: 20px;
        font-weight: 600;
        color: #333;
        margin-right: 6px;
      }

      .goal-editor-input {
        flex: 1;
        border: none;
        outline: none;
        background: transparent;
        font-size: 24px;
        font-weight: bold;
        color: #333;
        padding: 14px 0;

        &::placeholder {
          color: #bbb;
          font-weight: 400;
        }

        /* Hide number input arrows */
        &::-webkit-outer-spin-button,
        &::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      }
    }

    .goal-editor-presets {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 16px;

      .goal-editor-chip {
        padding: 7px 16px;
        border-radius: 18px;
        background: #f5f5f5;
        font-size: 13px;
        color: #666;
      }
    }

    .goal-editor-tip {
      font-size: 12px;
      color: #999;
      line-height: 1.6;
    }
  }

  .goal-editor-footer {
    display: flex;
    padding: 12px 16px;
    padding-bottom: calc(env(safe-area-inset-bottom) + 12px);
    gap: 12px;
    border-top: 1px solid #f0f0f0;

    :deep(.nut-button) {
      flex: 1;
    }
  }
}
</style>

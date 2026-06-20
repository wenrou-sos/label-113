<template>
  <div class="orders-page">
    <div class="page-header">
      <div class="back-btn" @click="$router.back()">
        ‹
      </div>
      <div class="page-title">我的订单</div>
      <div class="placeholder"></div>
    </div>

    <div class="tabs">
      <div
        v-for="tab in tabs"
        :key="tab.value"
        :class="['tab-item', { active: activeTab === tab.value }]"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
      </div>
    </div>

    <div class="order-list" v-if="filteredOrders.length > 0">
      <div
        v-for="order in filteredOrders"
        :key="order.orderId || order.id"
        class="order-card"
      >
        <div class="card-header">
          <span class="order-title">{{ order.title }}</span>
          <span :class="['order-status', order.status]">
            {{ getStatusText(order.status) }}
          </span>
        </div>

        <div class="card-body">
          <div class="info-row">
            <span class="info-label">📍 地址</span>
            <span class="info-value ellipsis">{{ order.address }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">🍺 类型</span>
            <span class="info-value">{{ order.drinkType }} · {{ order.duration }}小时</span>
          </div>
          <div class="info-row" v-if="order.result">
            <span class="info-label">🍻 饮酒量</span>
            <span class="info-value">{{ order.result.drinkAmount }}斤</span>
          </div>
        </div>

        <div class="card-footer">
          <div class="price">¥{{ order.price }}</div>
          <div class="order-id">{{ order.orderId }}</div>
        </div>

        <div class="review-section" v-if="order.result && order.result.review">
          <div class="review-label">客户评价：</div>
          <div class="review-content">{{ order.result.review }}</div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">📋</div>
      <div class="empty-text">暂无相关订单</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useOrderStore } from '@/store'

const orderStore = useOrderStore()

const tabs = [
  { label: '全部', value: 'all' },
  { label: '进行中', value: 'active' },
  { label: '已完成', value: 'completed' }
]

const activeTab = ref('all')

const filteredOrders = computed(() => {
  const orders = orderStore.myOrders
  if (activeTab.value === 'all') return orders
  if (activeTab.value === 'active') {
    return orders.filter((o) => ['accepted', 'arrived', 'servicing'].includes(o.status))
  }
  return orders.filter((o) => o.status === 'completed')
})

const getStatusText = (status) => {
  const statusMap = {
    accepted: '已接单',
    arrived: '已到场',
    servicing: '服务中',
    completed: '已完成'
  }
  return statusMap[status] || status
}
</script>

<style lang="scss" scoped>
.orders-page {
  width: 100%;
  min-height: 100vh;
  background: #f5f5f5;
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

.tabs {
  display: flex;
  background: #fff;
  padding: 0 16px;
  border-bottom: 1px solid #eee;
}

.tab-item {
  flex: 1;
  padding: 14px 0;
  text-align: center;
  font-size: 14px;
  color: #666;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;

  &.active {
    color: #1989fa;
    border-bottom-color: #1989fa;
    font-weight: 600;
  }
}

.order-list {
  padding: 12px;
}

.order-card {
  background: #fff;
  border-radius: 12px;
  margin-bottom: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #f5f5f5;
}

.order-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.order-status {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 10px;

  &.accepted,
  &.arrived {
    background: #e6f7ff;
    color: #1890ff;
  }

  &.servicing {
    background: #f6ffed;
    color: #52c41a;
  }

  &.completed {
    background: #f5f5f5;
    color: #999;
  }
}

.card-body {
  padding: 12px 16px;
}

.info-row {
  display: flex;
  font-size: 13px;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
}

.info-label {
  width: 70px;
  color: #999;
  flex-shrink: 0;
}

.info-value {
  flex: 1;
  color: #333;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid #f5f5f5;
}

.price {
  font-size: 18px;
  font-weight: bold;
  color: #ff5000;
}

.order-id {
  font-size: 11px;
  color: #bbb;
}

.review-section {
  padding: 12px 16px;
  background: #fffbe6;
  border-top: 1px solid #ffeeba;
}

.review-label {
  font-size: 12px;
  color: #d48806;
  margin-bottom: 4px;
}

.review-content {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
  color: #999;
}
</style>

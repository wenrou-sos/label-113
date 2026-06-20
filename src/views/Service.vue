<template>
  <div class="service-page">
    <div class="service-header">
      <div class="status-badge">
        <span class="status-dot"></span>
        服务进行中
      </div>
      <div class="order-info">
        <div class="order-title">{{ order?.title }}</div>
        <div class="order-id">订单号：{{ order?.orderId }}</div>
      </div>
    </div>

    <div class="timer-section">
      <div class="timer-card">
        <div class="timer-label">服务计时</div>
        <div class="timer-value">{{ formatTime(serviceSeconds) }}</div>
        <div class="timer-tip">预估服务时长：{{ order?.duration }}小时</div>
      </div>
    </div>

    <div class="tips-section">
      <div class="section-title">服务注意事项</div>
      <div class="tips-list">
        <div class="tip-item" v-for="(tip, idx) in serviceTips" :key="idx">
          <div class="tip-icon">📌</div>
          <div class="tip-text">{{ tip }}</div>
        </div>
      </div>
    </div>

    <div class="order-detail-section">
      <div class="section-title">订单信息</div>
      <div class="detail-card">
        <div class="detail-row">
          <span class="detail-label">📍 详细地址</span>
          <span class="detail-value">{{ order?.address }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">🏢 具体位置</span>
          <span class="detail-value">{{ order?.detailAddress }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">🍺 酒水类型</span>
          <span class="detail-value">{{ order?.drinkType }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">💰 服务费用</span>
          <span class="detail-value price">¥{{ order?.price }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">🎭 才艺需求</span>
          <span class="detail-value">{{ order?.needTalent ? order?.talentType : '不需要' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">👥 参与人数</span>
          <span class="detail-value">{{ order?.peopleCount }}人</span>
        </div>
      </div>
    </div>

    <div class="customer-section">
      <div class="section-title">客户信息</div>
      <div class="customer-card">
        <div class="customer-avatar">
          <div class="avatar-circle">客</div>
        </div>
        <div class="customer-info">
          <div class="customer-name">客户 *先生/女士</div>
          <div class="customer-note">为保护隐私，信息已脱敏</div>
        </div>
        <nut-button type="primary" size="small" plain @click="contactCustomer">
          联系客户
        </nut-button>
      </div>
    </div>

    <div class="emergency-section">
      <nut-button type="danger" size="small" plain block @click="handleEmergency">
        🚨 紧急联系平台
      </nut-button>
    </div>

    <div class="bottom-action">
      <div class="earnings-preview">
        <span>预计收入</span>
        <span class="amount">¥{{ order?.price }}</span>
      </div>
      <nut-button
        type="primary"
        size="large"
        @click="handleComplete"
        :loading="completing"
      >
        结束服务
      </nut-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrderStore } from '@/store'
import { serviceTips } from '@/mock/data'
import { showToast, showDialog } from '@nutui/nutui'

const route = useRoute()
const router = useRouter()
const orderStore = useOrderStore()

const orderId = computed(() => route.params.orderId)
const order = computed(() => {
  return orderStore.orders.find((o) => o.orderId === orderId.value || o.id === orderId.value) || orderStore.currentOrder
})

const serviceSeconds = ref(0)
const completing = ref(false)
let timer = null

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

const startTimer = () => {
  if (order.value?.startTime) {
    const startTime = new Date(order.value.startTime).getTime()
    serviceSeconds.value = Math.floor((Date.now() - startTime) / 1000)
  }
  timer = setInterval(() => {
    serviceSeconds.value += 1
  }, 1000)
}

const contactCustomer = () => {
  showToast({ content: '正在联系客户...' })
}

const handleEmergency = () => {
  showDialog({
    title: '紧急联系',
    content: '确定要拨打平台紧急联系电话吗？',
    okText: '立即拨打',
    cancelText: '取消'
  })
    .then(() => {
      showToast({ content: '已拨打平台客服电话 400-XXX-XXXX' })
    })
    .catch(() => {})
}

const handleComplete = async () => {
  try {
    await showDialog({
      title: '结束服务',
      content: '确认要结束本次服务吗？结束后将进入战果上传页面。',
      okText: '确认结束',
      cancelText: '继续服务'
    })

    completing.value = true
    setTimeout(() => {
      completing.value = false
      showToast({ content: '服务已结束', type: 'success' })
      setTimeout(() => {
        router.push(`/complete/${order.value?.orderId || order.value?.id}`)
      }, 800)
    }, 800)
  } catch {}
}

onMounted(() => {
  startTimer()
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<style lang="scss" scoped>
.service-page {
  width: 100%;
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 100px;
}

.service-header {
  padding: 20px 16px;
  padding-top: calc(env(safe-area-inset-top) + 20px);
  background: linear-gradient(135deg, #1989fa, #5db3ff);
  color: #fff;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 12px;
  font-size: 13px;
  margin-bottom: 12px;
}

.status-dot {
  width: 6px;
  height: 6px;
  background: #52c41a;
  border-radius: 50%;
  margin-right: 6px;
  animation: blink 1.5s infinite;
}

@keyframes blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

.order-info {
  .order-title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 4px;
  }

  .order-id {
    font-size: 12px;
    opacity: 0.85;
  }
}

.timer-section {
  padding: 16px;
  margin-top: -10px;
}

.timer-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.timer-label {
  font-size: 14px;
  color: #999;
  margin-bottom: 8px;
}

.timer-value {
  font-size: 42px;
  font-weight: bold;
  color: #1989fa;
  letter-spacing: 2px;
  margin-bottom: 8px;
  font-family: 'Courier New', monospace;
}

.timer-tip {
  font-size: 12px;
  color: #999;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  padding: 0 16px;
}

.tips-section {
  margin-bottom: 16px;
}

.tips-list {
  margin: 0 16px;
  background: #fff;
  border-radius: 12px;
  padding: 4px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.tip-item {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }
}

.tip-icon {
  margin-right: 10px;
  font-size: 14px;
}

.tip-text {
  flex: 1;
  font-size: 13px;
  color: #666;
  line-height: 1.6;
}

.order-detail-section {
  margin-bottom: 16px;
}

.detail-card {
  margin: 0 16px;
  background: #fff;
  border-radius: 12px;
  padding: 4px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.detail-row {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
  font-size: 13px;

  &:last-child {
    border-bottom: none;
  }
}

.detail-label {
  width: 100px;
  color: #999;
  flex-shrink: 0;
}

.detail-value {
  flex: 1;
  color: #333;

  &.price {
    color: #ff5000;
    font-weight: bold;
    font-size: 15px;
  }
}

.customer-section {
  margin-bottom: 16px;
}

.customer-card {
  margin: 0 16px;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.customer-avatar {
  margin-right: 12px;
}

.avatar-circle {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1989fa, #5db3ff);
  color: #fff;
  border-radius: 50%;
  font-size: 18px;
  font-weight: bold;
}

.customer-info {
  flex: 1;
  min-width: 0;
}

.customer-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.customer-note {
  font-size: 12px;
  color: #999;
}

.emergency-section {
  padding: 0 16px;
  margin-bottom: 16px;
}

.bottom-action {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  padding-bottom: calc(env(safe-area-inset-bottom) + 12px);
  background: #fff;
  border-top: 1px solid #eee;
  gap: 16px;
  z-index: 100;
}

.earnings-preview {
  flex: 1;
  display: flex;
  flex-direction: column;

  span:first-child {
    font-size: 12px;
    color: #999;
  }

  .amount {
    font-size: 22px;
    font-weight: bold;
    color: #ff5000;
  }
}

:deep(.nut-button) {
  min-width: 140px;
}
</style>

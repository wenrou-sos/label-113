<template>
  <div class="complete-page">
    <div class="page-header">
      <div class="back-btn" @click="goBack">
        ‹
      </div>
      <div class="page-title">上传战果</div>
      <div class="placeholder"></div>
    </div>

    <div class="success-banner">
      <div class="success-icon">🎉</div>
      <div class="success-title">服务完成！</div>
      <div class="success-subtitle">请填写本次服务的战果信息</div>
    </div>

    <div class="form-section">
      <div class="section-title">饮酒量记录</div>
      <div class="form-card">
        <div class="input-item">
          <div class="input-label">实际饮酒量</div>
          <div class="input-wrapper">
            <nut-inputnumber
              v-model="formData.drinkAmount"
              :min="0"
              :max="10"
              :step="0.1"
              :decimal-places="1"
            />
            <span class="unit">斤</span>
          </div>
        </div>
        <div class="input-tip">
          💡 请如实填写实际饮酒量（精确到0.1斤）
        </div>
      </div>
    </div>

    <div class="form-section">
      <div class="section-title">客户评价</div>
      <div class="form-card">
        <nut-textarea
          v-model="formData.review"
          placeholder="请输入客户给您的评价内容，这将影响您的好评率和等级"
          :rows="4"
          :max-length="200"
          show-count
        />
        <div class="tag-suggest">
          <div class="tag-label">快速标签：</div>
          <div class="tag-list">
            <span
              v-for="tag in quickTags"
              :key="tag"
              class="quick-tag"
              @click="addQuickTag(tag)"
            >
              {{ tag }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="form-section">
      <div class="section-title">代驾服务</div>
      <div class="form-card">
        <div class="switch-item">
          <div class="switch-info">
            <div class="switch-title">客户是否需要代驾</div>
            <div class="switch-desc">如客户需要，可提供代驾服务并收取额外费用</div>
          </div>
          <nut-switch v-model="formData.needDesignatedDriver" />
        </div>

        <div class="driver-fee" v-if="formData.needDesignatedDriver">
          <div class="fee-title">代驾收费标准</div>
          <div class="fee-list">
            <div
              v-for="(item, idx) in designatedDriverFeeList"
              :key="idx"
              class="fee-item"
            >
              <span class="fee-distance">{{ item.distance }}</span>
              <span class="fee-amount">¥{{ item.fee }}</span>
            </div>
          </div>
          <div class="fee-select">
            <div class="fee-select-label">选择代驾费用：</div>
            <nut-radio-group v-model="formData.driverFeeIndex">
              <nut-radio
                v-for="(item, idx) in designatedDriverFeeList"
                :key="idx"
                :label="idx"
              >
                {{ item.distance }} - ¥{{ item.fee }}
              </nut-radio>
            </nut-radio-group>
          </div>
        </div>
      </div>
    </div>

    <div class="summary-section" v-if="order">
      <div class="section-title">本次收益</div>
      <div class="summary-card">
        <div class="summary-row">
          <span>基础服务费</span>
          <span>¥{{ order.price }}</span>
        </div>
        <div class="summary-row" v-if="formData.needDesignatedDriver">
          <span>代驾服务费</span>
          <span>¥{{ driverFee }}</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-row total">
          <span>预计总收入</span>
          <span class="total-amount">¥{{ totalAmount }}</span>
        </div>
      </div>
    </div>

    <div class="bottom-action">
      <nut-button
        type="primary"
        size="large"
        block
        :disabled="isSubmitting || !isFormValid"
        :loading="isSubmitting"
        @click="handleSubmit"
      >
        {{ isSubmitting ? '提交中...' : '提交战果' }}
      </nut-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrderStore, useUserStore } from '@/store'
import { designatedDriverFeeList } from '@/mock/data'
import { showToast } from '@nutui/nutui'

const route = useRoute()
const router = useRouter()
const orderStore = useOrderStore()
const userStore = useUserStore()

const orderId = computed(() => route.params.orderId)
const order = computed(() => {
  return orderStore.orders.find((o) => o.orderId === orderId.value || o.id === orderId.value) || orderStore.currentOrder
})

const isSubmitting = ref(false)

const formData = reactive({
  drinkAmount: 0.5,
  review: '',
  needDesignatedDriver: false,
  driverFeeIndex: 0
})

const quickTags = ['海量', '稳如泰山', '气氛组', '千杯不醉', '服务周到', '酒量惊人']

const driverFee = computed(() => {
  if (!formData.needDesignatedDriver) return 0
  return designatedDriverFeeList[formData.driverFeeIndex]?.fee || 0
})

const totalAmount = computed(() => {
  if (!order.value) return 0
  return order.value.price + driverFee.value
})

const isFormValid = computed(() => {
  return formData.drinkAmount > 0 && formData.review.trim().length > 0
})

const goBack = () => {
  router.back()
}

const addQuickTag = (tag) => {
  if (formData.review.length === 0) {
    formData.review = tag
  } else if (!formData.review.includes(tag)) {
    formData.review = formData.review + '、' + tag
  }
}

const handleSubmit = async () => {
  if (!isFormValid.value) {
    showToast({ content: '请填写完整的战果信息' })
    return
  }

  if (!order.value) return

  isSubmitting.value = true

  try {
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const result = {
      drinkAmount: formData.drinkAmount.toString(),
      review: formData.review,
      needDesignatedDriver: formData.needDesignatedDriver,
      designatedDriverFee: driverFee.value
    }

    orderStore.completeOrder(order.value.orderId || order.value.id, result)

    const totalAmount = order.value.price + driverFee.value
    const isGoodReview = checkGoodReview(formData.review)
    userStore.updateStats(formData.drinkAmount, isGoodReview, totalAmount)

    extractAndAddTags(formData.review)

    isSubmitting.value = false
    showToast({ content: '战果提交成功！', type: 'success' })

    setTimeout(() => {
      router.replace('/profile')
    }, 1500)
  } catch (e) {
    isSubmitting.value = false
    showToast({ content: '提交失败，请重试', type: 'fail' })
  }
}

const checkGoodReview = (review) => {
  const badKeywords = ['差', '不好', '不行', '烂', '糟糕', '失望']
  return !badKeywords.some((kw) => review.includes(kw))
}

const extractAndAddTags = (review) => {
  const tagKeywords = ['海量', '稳如泰山', '气氛组', '千杯不醉', '能歌善舞', '段子手', '酒量惊人', '服务周到', '幽默风趣', '游戏达人']
  tagKeywords.forEach((tag) => {
    if (review.includes(tag)) {
      userStore.addTag(tag)
    }
  })
}

onMounted(() => {
  if (!order.value) {
    showToast({ content: '订单信息不存在' })
    setTimeout(() => {
      router.replace('/home')
    }, 1000)
  }
})
</script>

<style lang="scss" scoped>
.complete-page {
  width: 100%;
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 100px;
}

.page-header {
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

.success-banner {
  padding: 32px 16px 24px;
  text-align: center;
  background: linear-gradient(135deg, #52c41a, #73d13d);
  color: #fff;
}

.success-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.success-title {
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 4px;
}

.success-subtitle {
  font-size: 13px;
  opacity: 0.9;
}

.form-section {
  margin-top: 16px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
  padding: 0 16px;
}

.form-card {
  margin: 0 16px;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.input-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid #f5f5f5;
}

.input-label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.unit {
  font-size: 14px;
  color: #666;
}

.input-tip {
  padding-top: 12px;
  font-size: 12px;
  color: #999;
}

.tag-suggest {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #f5f5f5;
}

.tag-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-tag {
  padding: 5px 12px;
  background: #f0f7ff;
  color: #1989fa;
  font-size: 12px;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:active {
    background: #d6e8ff;
  }
}

.switch-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.switch-info {
  flex: 1;
  padding-right: 16px;
}

.switch-title {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  margin-bottom: 4px;
}

.switch-desc {
  font-size: 12px;
  color: #999;
}

.driver-fee {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f5f5f5;
}

.fee-title {
  font-size: 13px;
  color: #666;
  margin-bottom: 10px;
}

.fee-list {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}

.fee-item {
  flex: 1;
  padding: 10px 6px;
  background: #fafafa;
  border-radius: 8px;
  text-align: center;
}

.fee-distance {
  display: block;
  font-size: 11px;
  color: #999;
  margin-bottom: 4px;
}

.fee-amount {
  font-size: 15px;
  font-weight: bold;
  color: #ff5000;
}

.fee-select {
  padding-top: 12px;
  border-top: 1px solid #f5f5f5;
}

.fee-select-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.summary-section {
  margin-top: 16px;
}

.summary-card {
  margin: 0 16px;
  background: linear-gradient(135deg, #fff8e1, #fff3e0);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 14px;
  color: #666;

  &.total {
    font-size: 16px;
    color: #333;
    font-weight: 500;
  }
}

.summary-divider {
  height: 1px;
  background: #ffe0b2;
  margin: 8px 0;
}

.total-amount {
  font-size: 22px;
  font-weight: bold;
  color: #ff5000;
}

.bottom-action {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  padding: 12px 16px;
  padding-bottom: calc(env(safe-area-inset-bottom) + 12px);
  background: #fff;
  border-top: 1px solid #eee;
  z-index: 100;
}
</style>

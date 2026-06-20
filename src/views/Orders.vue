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

    <div class="tag-filter-bar" v-if="allOrderTags.length > 0">
      <div class="filter-label">🏷️ 按标签筛选：</div>
      <div class="filter-scroll">
        <div class="filter-tags">
          <span
            :class="['filter-tag', { active: selectedTag === '' }]"
            @click="selectedTag = ''"
          >
            全部
          </span>
          <span
            v-for="tag in allOrderTags"
            :key="tag.name"
            :class="['filter-tag', { active: selectedTag === tag.name }]"
            @click="toggleFilterTag(tag.name)"
          >
            {{ tag.name }}
            <span class="tag-count">{{ tag.count }}</span>
          </span>
        </div>
      </div>
    </div>

    <div class="filter-result-tip" v-if="selectedTag">
      已筛选包含「{{ selectedTag }}」的订单，共 {{ filteredOrders.length }} 单
      <span class="clear-filter" @click="selectedTag = ''">清除筛选 ×</span>
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

        <div class="order-tags-section">
          <div class="tags-header">
            <span class="tags-label">🏷️ 订单标签</span>
            <span
              v-if="order.status === 'completed'"
              class="tags-action"
              @click="openTagEditor(order)"
            >
              {{ order.tags && order.tags.length ? '管理标签' : '+ 添加标签' }}
            </span>
          </div>
          <div class="tags-content" v-if="order.tags && order.tags.length">
            <span
              v-for="tag in order.tags"
              :key="tag"
              class="order-tag-chip"
              :class="{ highlighted: selectedTag === tag }"
              @click="toggleFilterTag(tag)"
            >
              {{ tag }}
            </span>
          </div>
          <div class="tags-empty" v-else>
            <span v-if="order.status === 'completed'" class="empty-text">暂无标签，点击右上角添加</span>
            <span v-else class="empty-text">订单完成后可添加标签</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">📋</div>
      <div class="empty-text">暂无相关订单</div>
    </div>

    <nut-popup
      v-model:visible="showTagEditor"
      position="bottom"
      round
      :style="{ height: '70%' }"
    >
      <div class="tag-editor">
        <div class="editor-header">
          <div class="editor-title">管理订单标签</div>
          <div class="editor-close" @click="showTagEditor = false">×</div>
        </div>

        <div class="editor-order-info" v-if="editingOrder">
          <div class="editor-order-title">{{ editingOrder.title }}</div>
          <div class="editor-order-sub">¥{{ editingOrder.price }} · {{ editingOrder.orderId }}</div>
        </div>

        <div class="editor-suggest">
          <div class="editor-section-title">推荐标签</div>
          <div class="editor-tag-list">
            <span
              v-for="tag in suggestedOrderTags"
              :key="tag"
              :class="['editor-suggest-tag', { selected: editingTags.includes(tag) }]"
              @click="toggleEditTag(tag)"
            >
              {{ tag }}
            </span>
          </div>
        </div>

        <div class="editor-custom">
          <div class="editor-section-title">自定义标签</div>
          <div class="editor-input-row">
            <nut-input
              v-model="editingCustomInput"
              placeholder="自定义标签，如“客户大方”"
              :max-length="8"
              clearable
              @keyup.enter="addEditingCustomTag"
            />
            <nut-button type="primary" size="small" @click="addEditingCustomTag">添加</nut-button>
          </div>
        </div>

        <div class="editor-selected">
          <div class="editor-section-title">已选标签（{{ editingTags.length }}）</div>
          <div class="editor-selected-list" v-if="editingTags.length > 0">
            <span
              v-for="tag in editingTags"
              :key="tag"
              class="editor-selected-tag"
              @click="toggleEditTag(tag)"
            >
              {{ tag }} <span class="remove-icon">×</span>
            </span>
          </div>
          <div class="editor-empty" v-else>还没有添加任何标签</div>
        </div>

        <div class="editor-footer">
          <nut-button type="default" block @click="showTagEditor = false">取消</nut-button>
          <nut-button type="primary" block @click="saveTags">保存</nut-button>
        </div>
      </div>
    </nut-popup>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useOrderStore } from '@/store'
import { showToast } from '@nutui/nutui'

const orderStore = useOrderStore()

const tabs = [
  { label: '全部', value: 'all' },
  { label: '进行中', value: 'active' },
  { label: '已完成', value: 'completed' }
]

const activeTab = ref('all')
const selectedTag = ref('')

const allOrderTags = computed(() => orderStore.allOrderTags)

const filteredOrders = computed(() => {
  let orders = orderStore.myOrders
  if (activeTab.value === 'active') {
    orders = orders.filter((o) => ['accepted', 'arrived', 'servicing'].includes(o.status))
  } else if (activeTab.value === 'completed') {
    orders = orders.filter((o) => o.status === 'completed')
  }
  if (selectedTag.value) {
    orders = orders.filter((o) => o.tags && o.tags.includes(selectedTag.value))
  }
  return orders
})

const toggleFilterTag = (tagName) => {
  selectedTag.value = selectedTag.value === tagName ? '' : tagName
}

const suggestedOrderTags = ['客户大方', '路太远', '氛围好', '酒品好', '客户挑剔', '环境优雅', '人多热闹', '小费多']

const showTagEditor = ref(false)
const editingOrder = ref(null)
const editingTags = ref([])
const editingCustomInput = ref('')

const openTagEditor = (order) => {
  editingOrder.value = order
  editingTags.value = Array.isArray(order.tags) ? [...order.tags] : []
  editingCustomInput.value = ''
  showTagEditor.value = true
}

const toggleEditTag = (tag) => {
  const idx = editingTags.value.indexOf(tag)
  if (idx > -1) {
    editingTags.value.splice(idx, 1)
  } else {
    editingTags.value.push(tag)
  }
}

const addEditingCustomTag = () => {
  const name = editingCustomInput.value.trim()
  if (!name) {
    showToast({ content: '请输入标签名称' })
    return
  }
  if (name.length > 8) {
    showToast({ content: '标签最多8个字' })
    return
  }
  if (editingTags.value.includes(name)) {
    showToast({ content: '该标签已添加' })
    editingCustomInput.value = ''
    return
  }
  editingTags.value.push(name)
  editingCustomInput.value = ''
}

const saveTags = () => {
  if (!editingOrder.value) return
  const orderId = editingOrder.value.orderId || editingOrder.value.id
  orderStore.addOrderTags(orderId, editingTags.value)
  showTagEditor.value = false
  showToast({ content: '标签已保存', type: 'success' })
}

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

.tag-filter-bar {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 10px 16px;
  border-bottom: 1px solid #f5f5f5;
  gap: 8px;

  .filter-label {
    font-size: 12px;
    color: #999;
    flex-shrink: 0;
    white-space: nowrap;
  }

  .filter-scroll {
    flex: 1;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .filter-tags {
    display: inline-flex;
    gap: 8px;
    white-space: nowrap;
  }

  .filter-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 12px;
    background: #f5f5f5;
    color: #666;
    font-size: 12px;
    border-radius: 14px;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;

    .tag-count {
      font-size: 10px;
      background: rgba(0, 0, 0, 0.12);
      border-radius: 8px;
      padding: 0 5px;
      line-height: 14px;
    }

    &.active {
      background: #1989fa;
      color: #fff;
      border-color: #1989fa;

      .tag-count {
        background: rgba(255, 255, 255, 0.3);
      }
    }
  }
}

.filter-result-tip {
  padding: 10px 16px;
  font-size: 12px;
  color: #1989fa;
  background: #f0f7ff;

  .clear-filter {
    margin-left: 8px;
    color: #ff5000;
    cursor: pointer;
  }
}

.order-tags-section {
  padding: 12px 16px;
  border-top: 1px solid #f5f5f5;

  .tags-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .tags-label {
    font-size: 12px;
    color: #999;
  }

  .tags-action {
    font-size: 12px;
    color: #1989fa;
    cursor: pointer;
  }

  .tags-content {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .order-tag-chip {
    padding: 4px 10px;
    background: #fff7e6;
    color: #fa8c16;
    font-size: 12px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;

    &.highlighted {
      background: #fa8c16;
      color: #fff;
    }
  }

  .tags-empty {
    .empty-text {
      font-size: 12px;
      color: #ccc;
    }
  }
}

.tag-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;

  .editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: #fff;
    border-bottom: 1px solid #f0f0f0;

    .editor-title {
      font-size: 16px;
      font-weight: 600;
    }

    .editor-close {
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

  .editor-order-info {
    padding: 12px 16px;
    background: #fff;
    border-bottom: 1px solid #f5f5f5;

    .editor-order-title {
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }

    .editor-order-sub {
      font-size: 12px;
      color: #999;
      margin-top: 4px;
    }
  }

  .editor-suggest,
  .editor-custom,
  .editor-selected {
    margin: 12px;
    background: #fff;
    border-radius: 12px;
    padding: 14px;
  }

  .editor-section-title {
    font-size: 13px;
    font-weight: 600;
    color: #333;
    margin-bottom: 10px;
  }

  .editor-tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .editor-suggest-tag {
    padding: 5px 12px;
    background: #f5f5f5;
    color: #666;
    font-size: 12px;
    border-radius: 14px;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.2s;

    &.selected {
      background: #e6f7ff;
      color: #1989fa;
      border-color: #1989fa;
      font-weight: 500;
    }
  }

  .editor-input-row {
    display: flex;
    gap: 8px;
    align-items: center;

    :deep(.nut-input) {
      flex: 1;
    }
  }

  .editor-selected-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .editor-selected-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 10px 5px 12px;
    background: linear-gradient(135deg, #ff6b35, #f7931e);
    color: #fff;
    font-size: 12px;
    border-radius: 14px;
    cursor: pointer;

    .remove-icon {
      font-size: 14px;
      line-height: 1;
      opacity: 0.85;
    }
  }

  .editor-empty {
    font-size: 12px;
    color: #ccc;
  }

  .editor-footer {
    margin-top: auto;
    display: flex;
    gap: 12px;
    padding: 12px 16px;
    padding-bottom: calc(env(safe-area-inset-bottom) + 12px);
    background: #fff;
    border-top: 1px solid #f0f0f0;

    :deep(.nut-button) {
      flex: 1;
    }
  }
}
</style>

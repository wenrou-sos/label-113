import { defineStore } from 'pinia'
import { mockUser, mockOrders, mockHotspots, mockUserStats, mockTags } from '@/mock/data'

const STORAGE_KEYS = {
  USER_STATS: 'drink_helper_user_stats',
  USER_TAGS: 'drink_helper_user_tags',
  ORDERS: 'drink_helper_orders'
}

const loadFromStorage = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  } catch {
    return defaultValue
  }
}

const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn('Storage save failed:', e)
  }
}

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: { ...mockUser },
    userStats: loadFromStorage(STORAGE_KEYS.USER_STATS, { ...mockUserStats }),
    tags: loadFromStorage(STORAGE_KEYS.USER_TAGS, [...mockTags]),
    currentLocation: {
      lat: 31.2304,
      lng: 121.4737,
      address: '上海市黄浦区人民广场'
    }
  }),
  getters: {
    levelInfo: (state) => {
      const totalOrders = state.userStats.totalOrders
      const goodRate = state.userStats.goodRate
      let level = 'bronze'
      let levelName = '青铜'
      let nextLevel = '白银'
      let progress = 0

      if (totalOrders >= 200 && goodRate >= 98) {
        level = 'diamond'
        levelName = '钻石'
        nextLevel = '最高等级'
        progress = 100
      } else if (totalOrders >= 100 && goodRate >= 95) {
        level = 'platinum'
        levelName = '铂金'
        nextLevel = '钻石'
        progress = Math.min(100, ((totalOrders - 100) / 100) * 100)
      } else if (totalOrders >= 50 && goodRate >= 92) {
        level = 'gold'
        levelName = '黄金'
        nextLevel = '铂金'
        progress = Math.min(100, ((totalOrders - 50) / 50) * 100)
      } else if (totalOrders >= 20 && goodRate >= 88) {
        level = 'silver'
        levelName = '白银'
        nextLevel = '黄金'
        progress = Math.min(100, ((totalOrders - 20) / 30) * 100)
      } else {
        progress = Math.min(100, (totalOrders / 20) * 100)
      }

      return { level, levelName, nextLevel, progress }
    },
    sortedTags: (state) => {
      return [...state.tags].sort((a, b) => b.count - a.count)
    }
  },
  actions: {
    updateStats(drinkAmount, isGoodReview, orderAmount = 0) {
      this.userStats.totalOrders += 1
      this.userStats.totalDrinkAmount = (parseFloat(this.userStats.totalDrinkAmount) + parseFloat(drinkAmount)).toFixed(1)
      this.userStats.totalEarnings += orderAmount
      if (isGoodReview) {
        this.userStats.goodOrders += 1
      }
      this.userStats.goodRate = this.userStats.totalOrders > 0
        ? Math.round((this.userStats.goodOrders / this.userStats.totalOrders) * 100)
        : 0
      saveToStorage(STORAGE_KEYS.USER_STATS, this.userStats)
    },
    addTag(tagName) {
      const existingTag = this.tags.find((t) => t.name === tagName)
      if (existingTag) {
        existingTag.count += 1
        saveToStorage(STORAGE_KEYS.USER_TAGS, this.tags)
      }
    },
    resetData() {
      this.userStats = { ...mockUserStats }
      this.tags = [...mockTags]
      localStorage.removeItem(STORAGE_KEYS.USER_STATS)
      localStorage.removeItem(STORAGE_KEYS.USER_TAGS)
    }
  }
})

export const useOrderStore = defineStore('order', {
  state: () => {
    const savedOrders = loadFromStorage(STORAGE_KEYS.ORDERS, [...mockOrders])
    const firstActiveOrder = savedOrders.find((o) =>
      ['accepted', 'arrived', 'servicing'].includes(o.status)
    )
    return {
      hotspots: [...mockHotspots],
      orders: savedOrders,
      currentOrder: firstActiveOrder || null
    }
  },
  getters: {
    pendingHotspots: (state) => {
      return state.hotspots.filter((h) => h.status === 'pending')
    },
    myOrders: (state) => {
      return state.orders.filter((o) => o.status !== 'pending')
    },
    activeOrders: (state) => {
      return state.orders.filter((o) => ['accepted', 'arrived', 'servicing'].includes(o.status))
    },
    hasActiveOrders: (state) => {
      return state.orders.some((o) => ['accepted', 'arrived', 'servicing'].includes(o.status))
    },
    activeOrder: (state) => {
      return state.orders.find((o) => ['accepted', 'arrived', 'servicing'].includes(o.status))
    }
  },
  actions: {
    _persistOrders() {
      saveToStorage(STORAGE_KEYS.ORDERS, this.orders)
    },
    acceptOrder(hotspotId) {
      const hotspot = this.hotspots.find((h) => h.id === hotspotId)
      if (hotspot) {
        hotspot.status = 'accepted'
        const newOrder = {
          ...hotspot,
          orderId: 'ORD' + Date.now(),
          status: 'accepted',
          acceptTime: new Date().toISOString(),
          arriveTime: null,
          startTime: null,
          endTime: null,
          result: null
        }
        this.orders.unshift(newOrder)
        this.currentOrder = newOrder
        this._persistOrders()
        return newOrder
      }
      return null
    },
    arriveOrder(orderId) {
      const order = this.orders.find((o) => o.id === orderId || o.orderId === orderId)
      if (order) {
        order.status = 'arrived'
        order.arriveTime = new Date().toISOString()
        this.currentOrder = order
        this._persistOrders()
      }
    },
    startService(orderId) {
      const order = this.orders.find((o) => o.id === orderId || o.orderId === orderId)
      if (order) {
        order.status = 'servicing'
        order.startTime = new Date().toISOString()
        this.currentOrder = order
        this._persistOrders()
      }
    },
    completeOrder(orderId, result) {
      const order = this.orders.find((o) => o.id === orderId || o.orderId === orderId)
      if (order) {
        order.status = 'completed'
        order.endTime = new Date().toISOString()
        order.result = result
        const remainingActive = this.orders.filter((o) =>
          ['accepted', 'arrived', 'servicing'].includes(o.status)
        )
        this.currentOrder = remainingActive.length > 0 ? remainingActive[0] : null
        this._persistOrders()
      }
    },
    setCurrentOrder(orderId) {
      const order = this.orders.find((o) => o.id === orderId || o.orderId === orderId)
      if (order) {
        this.currentOrder = order
      }
    },
    updateOrderStatus(orderId, status) {
      const order = this.orders.find((o) => o.id === orderId || o.orderId === orderId)
      if (order) {
        order.status = status
        if (status === 'cancelled') {
          const remainingActive = this.orders.filter((o) =>
            ['accepted', 'arrived', 'servicing'].includes(o.status)
          )
          this.currentOrder = remainingActive.length > 0 ? remainingActive[0] : null
        }
        this._persistOrders()
      }
    },
    ignoreHotspot(hotspotId) {
      const hotspot = this.hotspots.find((h) => h.id === hotspotId)
      if (hotspot) {
        hotspot.status = 'ignored'
      }
    },
    refreshHotspots() {
      const newHotspots = mockHotspots.map((h, idx) => ({
        ...h,
        id: 'HS' + Date.now() + idx,
        lat: 31.2304 + (Math.random() - 0.5) * 0.05,
        lng: 121.4737 + (Math.random() - 0.5) * 0.05,
        price: Math.floor(100 + Math.random() * 900),
        duration: (1 + Math.floor(Math.random() * 5)).toString(),
        status: 'pending'
      }))
      this.hotspots = newHotspots
    },
    loadMoreHotspots() {
      const additionalHotspots = Array.from({ length: 5 }, (_, idx) => {
        const base = mockHotspots[idx % mockHotspots.length]
        return {
          ...base,
          id: 'HS' + Date.now() + 'EXTRA' + idx,
          lat: 31.2304 + (Math.random() - 0.5) * 0.08,
          lng: 121.4737 + (Math.random() - 0.5) * 0.08,
          price: Math.floor(100 + Math.random() * 900),
          duration: (1 + Math.floor(Math.random() * 5)).toString(),
          status: 'pending'
        }
      })
      this.hotspots.push(...additionalHotspots)
    },
    resetData() {
      this.orders = [...mockOrders]
      this.currentOrder = null
      this._persistOrders()
    }
  }
})

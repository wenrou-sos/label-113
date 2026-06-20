import { defineStore } from 'pinia'
import { mockUser, mockOrders, mockHotspots, mockUserStats, mockTags } from '@/mock/data'

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: { ...mockUser },
    userStats: { ...mockUserStats },
    tags: [...mockTags],
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
    updateStats(drinkAmount, isGoodReview) {
      this.userStats.totalOrders += 1
      this.userStats.totalDrinkAmount = (parseFloat(this.userStats.totalDrinkAmount) + parseFloat(drinkAmount)).toFixed(1)
      if (isGoodReview) {
        this.userStats.goodOrders += 1
      }
      this.userStats.goodRate = Math.round((this.userStats.goodOrders / this.userStats.totalOrders) * 100)
    },
    addTag(tagName) {
      const existingTag = this.tags.find((t) => t.name === tagName)
      if (existingTag) {
        existingTag.count += 1
      }
    }
  }
})

export const useOrderStore = defineStore('order', {
  state: () => ({
    hotspots: [...mockHotspots],
    orders: [...mockOrders],
    currentOrder: null
  }),
  getters: {
    pendingHotspots: (state) => {
      return state.hotspots.filter((h) => h.status === 'pending')
    },
    myOrders: (state) => {
      return state.orders.filter((o) => o.status !== 'pending')
    },
    activeOrder: (state) => {
      return state.orders.find((o) => ['accepted', 'arrived', 'servicing'].includes(o.status))
    }
  },
  actions: {
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
      }
    },
    startService(orderId) {
      const order = this.orders.find((o) => o.id === orderId || o.orderId === orderId)
      if (order) {
        order.status = 'servicing'
        order.startTime = new Date().toISOString()
        this.currentOrder = order
      }
    },
    completeOrder(orderId, result) {
      const order = this.orders.find((o) => o.id === orderId || o.orderId === orderId)
      if (order) {
        order.status = 'completed'
        order.endTime = new Date().toISOString()
        order.result = result
        this.currentOrder = null
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
    }
  }
})

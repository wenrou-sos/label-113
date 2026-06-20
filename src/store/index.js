import { defineStore } from 'pinia'
import { mockUser, mockOrders, mockHotspots, mockUserStats, mockTags } from '@/mock/data'

const STORAGE_KEYS = {
  USER_STATS: 'drink_helper_user_stats',
  USER_TAGS: 'drink_helper_user_tags',
  ORDERS: 'drink_helper_orders',
  PREFERENCES: 'drink_helper_preferences',
  SAVED_ADDRESSES: 'drink_helper_saved_addresses',
  MONTHLY_GOAL: 'drink_helper_monthly_goal'
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

const getLocalDateKey = (timeStr) => {
  if (!timeStr) return null
  const d = new Date(String(timeStr).replace(' ', 'T'))
  if (isNaN(d.getTime())) return null
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: { ...mockUser },
    userStats: loadFromStorage(STORAGE_KEYS.USER_STATS, { ...mockUserStats }),
    tags: loadFromStorage(STORAGE_KEYS.USER_TAGS, [...mockTags]),
    preferences: loadFromStorage(STORAGE_KEYS.PREFERENCES, { drinkTypes: [], talentTypes: [] }),
    savedAddresses: loadFromStorage(STORAGE_KEYS.SAVED_ADDRESSES, []),
    monthlyGoal: loadFromStorage(STORAGE_KEYS.MONTHLY_GOAL, { amount: 0, month: '' }),
    currentLocation: {
      lat: 31.2304,
      lng: 121.4737,
      address: '上海市黄浦区人民广场'
    }
  }),
  getters: {
    hasPreferences: (state) => {
      return state.preferences.drinkTypes.length > 0 || state.preferences.talentTypes.length > 0
    },
    preferenceCount: (state) => {
      return state.preferences.drinkTypes.length + state.preferences.talentTypes.length
    },
    savedAddressCount: (state) => {
      return state.savedAddresses.length
    },
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
    setPreferences(drinkTypes, talentTypes) {
      this.preferences = {
        drinkTypes: [...drinkTypes],
        talentTypes: [...talentTypes]
      }
      saveToStorage(STORAGE_KEYS.PREFERENCES, this.preferences)
    },
    clearPreferences() {
      this.preferences = { drinkTypes: [], talentTypes: [] }
      saveToStorage(STORAGE_KEYS.PREFERENCES, this.preferences)
    },
    addSavedAddress({ name, lat, lng, address }) {
      const trimmedName = (name || '').trim()
      if (!trimmedName) return false
      const exists = this.savedAddresses.some(
        (a) => a.name === trimmedName && a.lat === lat && a.lng === lng
      )
      if (exists) return false
      this.savedAddresses.push({
        id: 'ADDR' + Date.now(),
        name: trimmedName,
        lat,
        lng,
        address: address || trimmedName
      })
      saveToStorage(STORAGE_KEYS.SAVED_ADDRESSES, this.savedAddresses)
      return true
    },
    removeSavedAddress(id) {
      this.savedAddresses = this.savedAddresses.filter((a) => a.id !== id)
      saveToStorage(STORAGE_KEYS.SAVED_ADDRESSES, this.savedAddresses)
    },
    setCurrentLocation({ lat, lng, address }) {
      this.currentLocation = { lat, lng, address }
    },
    setMonthlyGoal(amount) {
      const d = new Date()
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      this.monthlyGoal = {
        amount: Math.max(0, Number(amount) || 0),
        month
      }
      saveToStorage(STORAGE_KEYS.MONTHLY_GOAL, this.monthlyGoal)
    },
    resetData() {
      this.userStats = { ...mockUserStats }
      this.tags = [...mockTags]
      this.preferences = { drinkTypes: [], talentTypes: [] }
      this.savedAddresses = []
      this.monthlyGoal = { amount: 0, month: '' }
      localStorage.removeItem(STORAGE_KEYS.USER_STATS)
      localStorage.removeItem(STORAGE_KEYS.USER_TAGS)
      localStorage.removeItem(STORAGE_KEYS.PREFERENCES)
      localStorage.removeItem(STORAGE_KEYS.SAVED_ADDRESSES)
      localStorage.removeItem(STORAGE_KEYS.MONTHLY_GOAL)
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
    monthlyEarnings: (state) => {
      const now = new Date()
      const curYear = now.getFullYear()
      const curMonth = now.getMonth()
      let total = 0
      state.orders.forEach((order) => {
        if (order.status !== 'completed') return
        const dateKey = getLocalDateKey(order.acceptTime)
        if (!dateKey) return
        const [y, m] = dateKey.split('-')
        if (Number(y) !== curYear || Number(m) - 1 !== curMonth) return
        total += (order.price || 0) + (order.result?.designatedDriverFee || 0)
      })
      return total
    },
    activeOrder: (state) => {
      return state.orders.find((o) => ['accepted', 'arrived', 'servicing'].includes(o.status))
    },
    allOrderTags: (state) => {
      const counter = {}
      state.orders.forEach((o) => {
        if (Array.isArray(o.tags)) {
          o.tags.forEach((t) => {
            counter[t] = (counter[t] || 0) + 1
          })
        }
      })
      return Object.keys(counter)
        .map((name) => ({ name, count: counter[name] }))
        .sort((a, b) => b.count - a.count)
    },
    calendarDailyData: (state) => {
      const dateMap = {}
      state.orders.forEach((order) => {
        if (order.status !== 'completed') return
        const dateKey = getLocalDateKey(order.acceptTime)
        if (!dateKey) return
        if (!dateMap[dateKey]) {
          dateMap[dateKey] = { orders: [], count: 0, earnings: 0 }
        }
        const ddFee = order.result?.designatedDriverFee || 0
        dateMap[dateKey].orders.push(order)
        dateMap[dateKey].count += 1
        dateMap[dateKey].earnings += (order.price || 0) + ddFee
      })
      return dateMap
    },
    calendarMaxDailyEarnings: (state) => {
      const dateMap = {}
      state.orders.forEach((order) => {
        if (order.status !== 'completed') return
        const dateKey = getLocalDateKey(order.acceptTime)
        if (!dateKey) return
        const ddFee = order.result?.designatedDriverFee || 0
        dateMap[dateKey] = (dateMap[dateKey] || 0) + (order.price || 0) + ddFee
      })
      let max = 0
      Object.values(dateMap).forEach((v) => {
        if (v > max) max = v
      })
      return max
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
    addOrderTags(orderId, tags) {
      const order = this.orders.find((o) => o.id === orderId || o.orderId === orderId)
      if (order) {
        const unique = []
        tags.forEach((t) => {
          const name = (t || '').trim()
          if (name && !unique.includes(name)) unique.push(name)
        })
        order.tags = unique
        this._persistOrders()
      }
    },
    ignoreHotspot(hotspotId) {
      const hotspot = this.hotspots.find((h) => h.id === hotspotId)
      if (hotspot) {
        hotspot.status = 'ignored'
      }
    },
    refreshHotspots(center = { lat: 31.2304, lng: 121.4737 }) {
      const { lat, lng } = center
      const newHotspots = mockHotspots.map((h, idx) => ({
        ...h,
        id: 'HS' + Date.now() + idx,
        lat: lat + (Math.random() - 0.5) * 0.05,
        lng: lng + (Math.random() - 0.5) * 0.05,
        price: Math.floor(100 + Math.random() * 900),
        duration: (1 + Math.floor(Math.random() * 5)).toString(),
        status: 'pending'
      }))
      this.hotspots = newHotspots
    },
    loadMoreHotspots(center = { lat: 31.2304, lng: 121.4737 }) {
      const { lat, lng } = center
      const additionalHotspots = Array.from({ length: 5 }, (_, idx) => {
        const base = mockHotspots[idx % mockHotspots.length]
        return {
          ...base,
          id: 'HS' + Date.now() + 'EXTRA' + idx,
          lat: lat + (Math.random() - 0.5) * 0.08,
          lng: lng + (Math.random() - 0.5) * 0.08,
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

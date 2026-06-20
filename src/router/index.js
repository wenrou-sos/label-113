import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '附近酒局', showTab: true, index: 0 }
  },
  {
    path: '/navigation/:orderId',
    name: 'Navigation',
    component: () => import('@/views/Navigation.vue'),
    meta: { title: '前往目的地', showTab: false, index: 1 }
  },
  {
    path: '/service/:orderId',
    name: 'Service',
    component: () => import('@/views/Service.vue'),
    meta: { title: '服务中', showTab: false, index: 2 }
  },
  {
    path: '/complete/:orderId',
    name: 'Complete',
    component: () => import('@/views/Complete.vue'),
    meta: { title: '上传战果', showTab: false, index: 3 }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { title: '个人中心', showTab: true, index: 1 }
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('@/views/Orders.vue'),
    meta: { title: '我的订单', showTab: false, index: 4 }
  },
  {
    path: '/earnings',
    name: 'Earnings',
    component: () => import('@/views/Earnings.vue'),
    meta: { title: '收益统计', showTab: false, index: 5 }
  },
  {
    path: '/level-rules',
    name: 'LevelRules',
    component: () => import('@/views/LevelRules.vue'),
    meta: { title: '等级规则', showTab: false, index: 6 }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title
  }
  next()
})

export default router

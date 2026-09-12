import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
  { path: '/products', name: 'products', component: () => import('../views/ProductsView.vue') },
  { path: '/product/:id', name: 'product', component: () => import('../views/ProductDetailView.vue') },
  { path: '/stores', name: 'stores', component: () => import('../views/StoresView.vue') },
  { path: '/store/:id', name: 'store', component: () => import('../views/StoreView.vue') },
  { path: '/order/:id/logistics', name: 'logistics', component: () => import('../views/OrderLogisticsView.vue') },
  { path: '/community', name: 'community', component: () => import('../views/CommunityView.vue') },
  { path: '/join', name: 'join', component: () => import('../views/JoinView.vue') },
  { path: '/auth', name: 'auth', component: () => import('../views/AuthView.vue') },
  { path: '/profile', name: 'profile', component: () => import('../views/ProfileView.vue') },
  { path: '/merchant', name: 'merchant', component: () => import('../views/MerchantView.vue') },
  { path: '/admin', name: 'admin', component: () => import('../views/AdminView.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

export default createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

<script setup>
// 移动端 / App 底部导航（仅 ≤768px 显示；桌面端隐藏）
// 小程序有 tabBar，App 里补一个，保证「我的」随时可达
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { auth } from '../store/auth'

const route = useRoute()

const TABS = [
  { to: '/', name: 'home', icon: '🏠', label: '首页' },
  { to: '/products', name: 'products', icon: '🌿', label: '药材' },
  { to: '/community', name: 'community', icon: '💬', label: '社区' }
]

// 未登录点「我的」→ 登录页；已登录 → 个人中心
const mineTarget = computed(() => (auth.token ? '/profile' : '/auth'))
const mineActive = computed(() => route.name === 'profile' || route.name === 'auth')
</script>

<template>
  <nav class="mtab">
    <router-link
      v-for="t in TABS"
      :key="t.to"
      :to="t.to"
      class="mtab-item"
      :class="{ on: route.name === t.name }"
    >
      <span class="mtab-ico">{{ t.icon }}</span>
      <span class="mtab-txt">{{ t.label }}</span>
    </router-link>

    <router-link :to="mineTarget" class="mtab-item" :class="{ on: mineActive }">
      <span class="mtab-ico">👤</span>
      <span class="mtab-txt">我的</span>
    </router-link>
  </nav>
</template>

<style scoped>
.mtab { display: none; }

@media (max-width: 768px) {
  .mtab {
    display: flex;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 130;
    background: #fff;
    border-top: 1px solid var(--line, #eceae4);
    padding-bottom: env(safe-area-inset-bottom);
    box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.06);
  }

  .mtab-item {
    flex: 1;
    height: 56px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    color: #86909c;
    text-decoration: none;
  }

  .mtab-item.on { color: var(--red, #8c1f28); }

  .mtab-ico { font-size: 18px; line-height: 1; }

  .mtab-txt { font-size: 11px; }
}
</style>

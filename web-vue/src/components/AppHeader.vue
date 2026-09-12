<script setup>
// 顶栏 + 页头（由旧 js/main.js topbarHTML/headerHTML 1:1 移植）
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { auth } from '../store/auth'
import { openHelp } from '../ui'

const route = useRoute()
const user = computed(() => auth.user)

// 原页面 nav 高亮：首页=home、列表页=products、社区=community、入驻=join，其余为 home
const ACTIVE_MAP = { products: 'products', community: 'community', join: 'join' }
const active = computed(() => ACTIVE_MAP[route.name] || 'home')
</script>

<template>
  <div>
    <div class="topbar">
      <div class="container">
        <span class="slogan">系统公告 · 炎黄济世现已开放商家入驻申请</span>
        <span>
          <router-link to="/join">商家入驻</router-link>
          <router-link to="/community">社区</router-link>
          <a href="javascript:void(0)" @click="openHelp('contact')">客服中心</a>
        </span>
      </div>
    </div>

    <header class="header">
      <div class="container">
        <router-link class="logo" to="/">
          <div class="logo-badge serif">炎</div>
          <div class="logo-text">
            <div class="cn serif">炎黄济世</div>
            <div class="en">YANHUANG JISHI</div>
          </div>
        </router-link>

        <nav class="nav">
          <router-link to="/" :class="{ active: active === 'home' }">首页</router-link>
          <router-link to="/community" :class="{ active: active === 'community' }">养生社区</router-link>
          <router-link to="/join" :class="{ active: active === 'join' }">商家入驻</router-link>
        </nav>

        <div class="header-actions">
          <router-link class="btn-join" to="/join"><span class="plus">＋</span>商店入驻</router-link>
          <template v-if="user">
            <router-link v-if="user.role === 'merchant'" to="/merchant" style="font-size:13px;color:var(--red)">商家工作台</router-link>
            <router-link v-else-if="user.role === 'admin'" to="/admin" style="font-size:13px;color:var(--red)">管理后台</router-link>
            <router-link to="/profile" style="font-size:13px;color:var(--red)">👤 {{ user.nickname }}</router-link>
          </template>
          <router-link v-else to="/auth" style="font-size:13px;color:var(--red)">登录 / 注册</router-link>
        </div>
      </div>
    </header>
  </div>
</template>

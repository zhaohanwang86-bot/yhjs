<script setup>
// 入驻店铺列表页（由旧 stores.html 1:1 移植）
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { STORES } from '../data'
import StoreCard from '../components/StoreCard.vue'
import { showToast } from '../ui'

const route = useRoute()
const router = useRouter()

const TABS = [['rating', '口碑优先'], ['sales', '人气优先'], ['count', '品类丰富']]
const stSort = computed(() => String(route.query.sort || 'rating'))

const list = computed(() => {
  const arr = STORES.slice()
  if (stSort.value === 'sales') arr.sort((a, b) => b.followers - a.followers)
  else if (stSort.value === 'rating') arr.sort((a, b) => b.rating - a.rating)
  else if (stSort.value === 'count') arr.sort((a, b) => b.productsCount - a.productsCount)
  return arr
})

function changeSort(s) {
  router.push({ name: 'stores', query: { sort: s } })
}
function notYet(label) {
  showToast(label + '（Vue 版暂未迁移，敬请期待）')
}
</script>

<template>
  <div class="container">
    <div class="breadcrumb">
      <router-link to="/">首页</router-link><span class="sep">/</span><span>入驻店铺</span>
    </div>

    <div class="section-head">
      <h2 class="section-title">入驻店铺 <span class="sub">查看店铺口碑与评分</span></h2>
      <button class="btn btn-primary" style="padding:8px 20px;font-size:13px" @click="notYet('商家入驻')">＋ 申请入驻</button>
    </div>

    <div class="store-rank-tabs">
      <button v-for="t in TABS" :key="t[0]" :class="{ on: stSort === t[0] }" @click="changeSort(t[0])">{{ t[1] }}</button>
    </div>

    <div class="market-count">共 <b>{{ list.length }}</b> 家入驻店铺 · 平台均分 <b>4.8</b> ★</div>

    <div class="store-grid">
      <div v-for="s in list" :key="s.id" style="position:relative">
        <StoreCard :store="s" />
      </div>
    </div>
  </div>
</template>

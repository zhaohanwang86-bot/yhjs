<script setup>
// 商品列表页（由旧 products.html 1:1 移植）
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CATEGORIES, PRODUCTS, STORES, storeOf, categoryOf } from '../data'
import ProductCard from '../components/ProductCard.vue'

const route = useRoute()
const router = useRouter()

const SORTS = [['default', '综合'], ['sales', '销量'], ['rating', '评分'], ['priceAsc', '价格↑'], ['priceDesc', '价格↓']]

const q = computed(() => route.query)
const stCat = computed(() => String(q.value.cat || ''))
const stKw = computed(() => String(q.value.kw || '').toLowerCase())
const stStore = computed(() => String(q.value.store || ''))
const stSort = computed(() => String(q.value.sort || 'default'))

// 每个分类下商品数量
const catCount = computed(() => {
  const m = {}
  PRODUCTS.forEach((p) => { m[p.cat] = (m[p.cat] || 0) + 1 })
  return m
})

// 过滤商品：分类、店铺、关键词
const list = computed(() => {
  let arr = PRODUCTS.filter((p) => {
    if (stCat.value && p.cat !== stCat.value) return false
    if (stStore.value && p.storeId !== stStore.value) return false
    if (stKw.value) {
      const so = storeOf(p.storeId) || { name: '' }
      if ((p.name + so.name).toLowerCase().indexOf(stKw.value) < 0) return false
    }
    return true
  })
  if (stSort.value === 'sales') arr = arr.slice().sort((a, b) => b.sales - a.sales)
  else if (stSort.value === 'rating') arr = arr.slice().sort((a, b) => b.rating - a.rating)
  else if (stSort.value === 'priceAsc') arr = arr.slice().sort((a, b) => a.price - b.price)
  else if (stSort.value === 'priceDesc') arr = arr.slice().sort((a, b) => b.price - a.price)
  return arr
})

const hasFilter = computed(() => !!(stCat.value || stStore.value || stKw.value))

function go(params) {
  router.push({ name: 'products', query: params })
}

function sortLink(s) {
  const out = {}
  if (stCat.value) out.cat = stCat.value
  if (q.value.kw) out.kw = q.value.kw
  if (stStore.value) out.store = stStore.value
  out.sort = s
  return out
}

function goSort(s) { go(sortLink(s)) }

function doMarketSearch() {
  const box = document.getElementById('kwInput')
  const val = box ? box.value.trim() : String(q.value.kw || '')
  go(val ? { kw: val } : {})
}

function quickCat(cid) { go({ cat: cid }) }
function allStoresLink() {
  const out = {}
  if (stCat.value) out.cat = stCat.value
  if (q.value.kw) out.kw = q.value.kw
  out.sort = stSort.value
  return out
}
</script>

<template>
  <div class="container">
    <div class="breadcrumb">
      <router-link to="/">首页</router-link><span class="sep">/</span><span>药材商城</span>
    </div>

    <div class="section-head">
      <h2 class="section-title">药材商城 <span class="sub">浏览不同品类 · 查看店铺与药材评分</span></h2>
    </div>

    <div class="market-layout">
      <!-- 左侧分类/店铺 -->
      <aside class="market-side">
        <h3>药材分类</h3>
        <a href="javascript:void(0)" class="cat-link" :class="{ on: !stCat }" @click="go({})">
          <span>🌸 全部药材</span><span class="cnt">{{ PRODUCTS.length }}款</span>
        </a>
        <a v-for="c in CATEGORIES" :key="c.id" href="javascript:void(0)" class="cat-link"
          :class="{ on: stCat === c.id }" @click="quickCat(c.id)">
          <span>{{ c.icon }} {{ c.name }}</span><span class="cnt">{{ catCount[c.id] || 0 }}款</span>
        </a>

        <h3 style="margin-top:18px">入驻店铺</h3>
        <a href="javascript:void(0)" class="cat-link" :class="{ on: !stStore }" @click="go(allStoresLink())">
          <span>🏪 全部店铺</span>
        </a>
        <a v-for="s in STORES.slice(0, 4)" :key="s.id" href="javascript:void(0)" class="cat-link"
          :class="{ on: stStore === s.id }" @click="go({ store: s.id })">
          <span>{{ s.name }}</span><span class="cnt">★{{ s.rating.toFixed(1) }}</span>
        </a>

        <h3 style="margin-top:18px">更多</h3>
        <router-link class="cat-link" to="/stores"><span>查看全部店铺 →</span></router-link>
      </aside>

      <!-- 右侧主内容 -->
      <div class="market-main">
        <div class="market-toolbar">
          <div class="search-box">
            <input id="kwInput" type="text" placeholder="搜索药材名 / 店铺名" :value="q.kw || ''"
              @keyup.enter="doMarketSearch()">
            <button @click="doMarketSearch()">搜索</button>
          </div>
          <div class="sort-tabs">
            <button v-for="s in SORTS" :key="s[0]" :class="{ on: stSort === s[0] }"
              @click="goSort(s[0])">{{ s[1] }}</button>
          </div>
        </div>

        <div class="market-count">
          共找到 <b>{{ list.length }}</b> 款道地药材
          <template v-if="stStore"> · 来自 <b>{{ (storeOf(stStore) || { name: '' }).name }}</b></template>
        </div>

        <div v-if="hasFilter" class="breadcrumb">
          <router-link to="/">首页</router-link><span class="sep">/</span><span>药材商城</span>
          <template v-if="stStore"><span class="sep">/</span><router-link to="/stores">店铺</router-link><span class="sep">/</span><span>{{ (storeOf(stStore) || { name: '未知店铺' }).name }}</span></template>
          <template v-else-if="stCat"><span class="sep">/</span><span>{{ (categoryOf(stCat) || { name: '未知分类' }).name }}</span></template>
          <template v-if="stKw"><span class="sep">/</span><span>搜索「{{ q.kw }}」</span></template>
        </div>

        <div v-if="list.length" class="product-grid">
          <ProductCard v-for="p in list" :key="p.id" :product="p" />
        </div>
        <div v-else class="empty-box">
          <div class="big">🍃</div>
          <p>没有找到匹配的药材，换个关键词试试～<br><br>
            <button class="btn btn-ghost" @click="go({})">查看全部药材</button>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

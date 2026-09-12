<script setup>
// 商品卡片（由旧 js/main.js productCardHTML 1:1 移植）
import { computed } from 'vue'
import { storeOf, starsHTML, fmt } from '../data'

const props = defineProps({ product: { type: Object, required: true } })
const storeName = computed(() => {
  const s = storeOf(props.product.storeId)
  return s ? s.name : ''
})
</script>

<template>
  <router-link class="product-card" :to="{ name: 'product', params: { id: product.id } }">
    <div class="product-img">
      <span v-if="product.tag" class="tag" :class="{ hot: product.tag === '热卖' || product.tag === '新品' }">{{ product.tag }}</span>
      <img :src="product.img" :alt="product.name">
    </div>
    <div class="product-info">
      <h4>{{ product.name }}</h4>
      <div class="store-name">{{ storeName }}</div>
      <div class="rate-row">
        <span v-html="starsHTML(product.rating)"></span>
        <span class="rate-num">{{ product.rating.toFixed(1) }}</span>
        <span class="rate-count">{{ fmt(product.ratingCount) }}人评分</span>
      </div>
      <div class="product-bottom">
        <span class="price">¥{{ product.price }}<span class="unit">/件</span>
          <span v-if="product.originalPrice" class="orig">¥{{ product.originalPrice }}</span>
        </span>
        <span class="sales">已售{{ fmt(product.sales) }}</span>
      </div>
    </div>
  </router-link>
</template>

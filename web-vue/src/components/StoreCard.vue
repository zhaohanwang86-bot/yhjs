<script setup>
// 店铺卡片（由旧 js/main.js storeCardHTML 1:1 移植）
import { computed } from 'vue'
import { productsOf, imgUrl, starsHTML, fmt } from '../data'

const props = defineProps({ store: { type: Object, required: true } })

const cover = computed(() => {
  const prods = productsOf(props.store.id)
  return prods[0] ? prods[0].img : imgUrl('古色古香的中药铺子')
})
const grad = computed(() => 'linear-gradient(135deg,' + props.store.colors[0] + ',' + props.store.colors[1] + ')')
</script>

<template>
  <router-link class="store-card" :to="{ name: 'store', params: { id: store.id } }">
    <div class="store-cover">
      <img :src="cover" :alt="store.name">
      <span class="flag" :class="store.badgeType">{{ store.badge }}</span>
    </div>
    <div class="store-body">
      <div class="store-logo" :style="{ background: grad }">{{ store.name.charAt(0) }}</div>
      <h3>{{ store.name }}</h3>
      <div class="store-tags"><span>📍{{ store.city }}</span><span>🌿{{ store.productsCount }}款药材</span></div>
      <div class="rate-row">
        <span v-html="starsHTML(store.rating)"></span>
        <span class="rate-num">{{ store.rating.toFixed(1) }}</span>
        <span class="rate-count">({{ fmt(store.ratingCount) }})</span>
      </div>
      <div class="store-meta"><span>已售{{ fmt(store.followers) }}+</span></div>
    </div>
  </router-link>
</template>

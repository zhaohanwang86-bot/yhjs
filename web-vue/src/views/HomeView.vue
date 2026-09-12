<script setup>
// 首页（由旧 index.html 1:1 移植）
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { CATEGORIES, STORES, PRODUCTS, imgUrl } from '../data'
import ProductCard from '../components/ProductCard.vue'
import StoreCard from '../components/StoreCard.vue'

const router = useRouter()
const kw = ref('')

const HERO_IMG = imgUrl(
  '中国传统中医药主题横幅照片，古色古香的中药铺内外景，一排排实木药柜与现代店铺结合，悬挂红灯笼，暖金色光线，专业商业摄影',
  'landscape_16_9'
)

function doSearch() {
  router.push({ name: 'products', query: { kw: kw.value } })
}
function quickSearch(k) {
  router.push({ name: 'products', query: { kw: k } })
}
function goCategory(cid) {
  router.push({ name: 'products', query: { cat: cid } })
}
function scrollToShop() {
  document.getElementById('shops')?.scrollIntoView({ behavior: 'smooth' })
}
function goJoin() {
  router.push('/join')
}
</script>

<template>
  <div>
    <!-- ============ 英雄区 ============ -->
    <section class="hero">
      <div class="container">
        <div class="hero-copy">
          <span class="kicker serif">承炎黄之法 · 济世人之需</span>
          <h1 class="serif">全国中医药店铺<br><span class="gold">一 站 直 达</span></h1>
          <p>平台聚合各地百年老字号与道地药铺，从长白山野山参到新会十年陈皮，一味一证、商家评分、全程可溯。让每一味好药，都从产地直达你的餐桌。</p>
          <div class="hero-stats">
            <div><div class="num">8</div><div class="label">入驻药铺</div></div>
            <div><div class="num">16</div><div class="label">道地药材</div></div>
            <div><div class="num">4.8</div><div class="label">平台均分</div></div>
          </div>
          <div class="hero-btns">
            <button class="btn btn-primary" @click="scrollToShop()">立即逛好店</button>
            <button class="btn btn-ghost" @click="goJoin()">成为入驻商家</button>
          </div>
        </div>
        <div class="hero-visual">
          <div class="hero-float f1">🏆 平台店铺均分 <span class="big">4.8</span> ★</div>
          <div class="hero-float f2">🌿 200+ 道地药材 · 品质可溯</div>
          <img :src="HERO_IMG" alt="中医药铺">
        </div>
      </div>
    </section>

    <!-- ============ 搜索条 ============ -->
    <section class="search-bar">
      <div class="container">
        <div class="box">
          <input v-model="kw" type="text" placeholder="搜索道地药材，如：人参、枸杞、陈皮……" @keyup.enter="doSearch()">
          <button class="btn btn-primary" @click="doSearch()">搜索</button>
        </div>
        <div class="search-hot">热门：
          <a href="javascript:void(0)" @click="quickSearch('野山参')">野山参</a>
          <a href="javascript:void(0)" @click="quickSearch('阿胶')">阿胶</a>
          <a href="javascript:void(0)" @click="quickSearch('陈皮')">陈皮</a>
          <a href="javascript:void(0)" @click="quickSearch('枸杞')">枸杞</a>
        </div>
      </div>
    </section>

    <!-- ============ 分类区 ============ -->
    <section class="section">
      <div class="container">
        <div class="section-head">
          <h2 class="section-title">药材分类 <span class="sub">按需挑选 · 全国万店直供</span></h2>
          <router-link class="section-more" to="/products">查看全部 →</router-link>
        </div>
        <div class="category-grid">
          <div v-for="c in CATEGORIES" :key="c.id" class="cat-item" @click="goCategory(c.id)">
            <div class="icon">{{ c.icon }}</div>
            <div class="name">{{ c.name }}</div>
            <div class="count">{{ c.count }}款</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ 精选店铺 ============ -->
    <section class="section" id="shops">
      <div class="container">
        <div class="section-head">
          <h2 class="section-title">入驻名店 <span class="sub">百年老字号 · 每一家都可评分</span></h2>
          <router-link class="section-more" to="/stores">更多店铺 →</router-link>
        </div>
        <div class="store-grid">
          <StoreCard v-for="s in STORES" :key="s.id" :store="s" />
        </div>
      </div>
    </section>

    <!-- ============ 爆款好药 ============ -->
    <section class="section">
      <div class="container">
        <div class="section-head">
          <h2 class="section-title">爆款好药 <span class="sub">用户评分精选 · 一件也是批发价</span></h2>
          <router-link class="section-more" to="/products">查看全部 →</router-link>
        </div>
        <div class="product-grid">
          <ProductCard v-for="p in PRODUCTS" :key="p.id" :product="p" />
        </div>
      </div>
    </section>

    <!-- ============ 商家入驻横幅 ============ -->
    <section class="container">
      <div class="merchant-banner">
        <h2 class="serif">诚邀全国中医药店入驻</h2>
        <p>炎黄济世现面向全国招募优质药铺、药材商、滋补品商家。平台提供评分体系与社区流量扶持，帮助你的好药材被更多人看见。</p>
        <div class="merchant-points">
          <div class="pt"><span class="ico">📊</span>店铺 / 药材双评分</div>
          <div class="pt"><span class="ico">📣</span>社区种草引流</div>
          <div class="pt"><span class="ico">🔍</span>产地溯源背书</div>
          <div class="pt"><span class="ico">📦</span>平台先行赔付</div>
        </div>
        <button class="btn btn-gold" style="color:#fff" @click="goJoin()">立即申请入驻 →</button>
      </div>
    </section>
  </div>
</template>

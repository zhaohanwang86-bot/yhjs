<script setup>
// 页脚（由旧 js/main.js footerHTML 1:1 移植）
import { openHelp } from '../ui'
</script>

<template>
  <footer class="footer">
    <div class="container">
      <div class="brand">
        <div class="cn serif">炎黄济世</div>
        <p>承炎黄之法，济世人之需。<br>集成全国道地药材店铺的中转平台，从产地到餐桌，一味一证，全程可溯。</p>
      </div>
      <div>
        <h4>平台服务</h4>
        <router-link to="/products">药材商城</router-link>
        <router-link to="/stores">入驻店铺</router-link>
        <router-link to="/community">养生社区</router-link>
        <router-link to="/join">商家入驻</router-link>
      </div>
      <div>
        <h4>帮助中心</h4>
        <a href="javascript:void(0)" @click="openHelp('faq')">常见问题</a>
        <a href="javascript:void(0)" @click="openHelp('service')">售后保障</a>
        <a href="javascript:void(0)" @click="openHelp('contact')">联系方式</a>
      </div>
      <div>
        <h4>关于我们</h4>
        <a href="javascript:void(0)" @click="openHelp('about')">平台愿景</a>
        <a href="javascript:void(0)" @click="openHelp('join')">商务合作</a>
      </div>
    </div>
    <div class="container copyright">© 2026 炎黄济世 · 当前页面内容仅用于功能展示，店铺与药材信息以正式上线版本为准</div>
  </footer>
</template>

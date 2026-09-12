<script setup>
// 全局布局：顶栏+页头 / 页面 / 页脚 + 帮助弹窗 + Toast + AI 助手
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import AiAssistant from './components/AiAssistant.vue'
import MobileTabBar from './components/MobileTabBar.vue'
import { ui, closeHelp, switchHelp, HELP_SECTIONS } from './ui'
</script>

<template>
  <div>
    <AppHeader />
    <router-view />
    <AppFooter />

    <!-- 帮助中心弹窗 -->
    <div v-if="ui.helpOpen" class="modal-mask" :class="{ show: ui.helpOpen }" @click.self="closeHelp()">
      <div class="modal modal-help">
        <h3 class="serif">帮助中心</h3>
        <div class="help-tabs">
          <a v-for="(sec, k) in HELP_SECTIONS" :key="k" href="javascript:void(0)"
            class="help-tab" :class="{ on: ui.helpTab === k }" @click="switchHelp(k)">{{ sec.title }}</a>
        </div>
        <div class="help-body" v-html="HELP_SECTIONS[ui.helpTab].body"></div>
        <div style="text-align:center;margin-top:16px"><button class="btn btn-ghost" @click="closeHelp()">关闭</button></div>
      </div>
    </div>

    <div class="toast" :class="{ show: !!ui.toast }">{{ ui.toast }}</div>

    <AiAssistant />
    <MobileTabBar />
  </div>
</template>

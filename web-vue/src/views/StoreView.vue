<script setup>
// 店铺详情页（由旧 store.html 1:1 移植）
import { computed, ref, watch, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { STORES, productsOf, storeOf, starsHTML, fmt, ratingDistribution, effectiveRating,
  loadLS, loadReviews, saveReviews } from '../data'
import { apiGet, apiPost, isLoggedIn } from '../api'
import { showToast } from '../ui'
import ProductCard from '../components/ProductCard.vue'

const route = useRoute()
const storeId = ref(String(route.params.id || 's1'))
const store = computed(() => storeOf(storeId.value) || STORES[0])

const tab = ref('products')
const eff = computed(() => effectiveRating(store.value.id, store.value.rating, store.value.ratingCount))
const dist = computed(() => ratingDistribution(store.value.id, store.value.ratingCount))
const distTot = computed(() => dist.value.reduce((a, b) => a + b, 0))
const prods = computed(() => productsOf(store.value.id))

// ---------- 店铺评价（localStorage + 种子评价，与旧页一致） ----------
const userReviews = computed(() => loadReviews().filter((r) => r.key === store.value.id))
const selectedScore = ref(5)
const rvContent = ref('')

function switchTab(which) {
  tab.value = which
  if (which === 'reviews') selectedScore.value = 5
}

function submitStoreReview() {
  const text = rvContent.value.trim()
  if (!text) { showToast('请填写评价内容'); return }
  const rvs = loadReviews()
  rvs.push({
    key: store.value.id,
    name: '匿名用户' + Math.floor(Math.random() * 900 + 100),
    score: selectedScore.value, text: text, dims: ['服务', '品质']
  })
  saveReviews(rvs)
  rvContent.value = ''
  selectedScore.value = 5
  showToast('评价成功，感谢你的真实反馈！')
}

// ---------- 联系商家聊天 ----------
const showChat = ref(false)
const convId = ref(null)
const msgs = ref([])
const chatText = ref('')
const chatBox = ref(null)
const chatBusy = ref(false)

async function openStoreChat() {
  if (!isLoggedIn()) { showToast('请先登录后再联系商家'); return }
  try {
    const r = await apiGet('/stores')
    const match = (r.data || []).find((s) => s.name === store.value.name)
    if (!match) { showToast('店铺信息暂未同步'); return }
    storeIdDb = match.id
    showChat.value = true
    convId.value = null
    msgs.value = []
    await loadStoreChat()
  } catch (e) {
    showToast(e.message || '店铺信息暂未同步')
  }
}
let storeIdDb = null

async function loadStoreChat() {
  try {
    const r = await apiGet('/chat/conversations')
    const conv = (r.data || []).find((c) => Number(c.store_id) === Number(storeIdDb))
    convId.value = conv ? conv.id : null
    if (!convId.value) {
      msgs.value = []
      return
    }
    const r2 = await apiGet('/chat/conversations/' + convId.value + '/messages')
    msgs.value = r2.data || []
    nextTick(() => { if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight })
  } catch (e) {
    showToast(e.message || '历史消息加载失败')
  }
}

async function sendStoreChat() {
  const content = chatText.value.trim()
  if (!content || !storeIdDb || chatBusy.value) return
  chatBusy.value = true
  try {
    if (convId.value) {
      await apiPost('/chat/conversations/' + convId.value + '/messages', { content })
    } else {
      const r = await apiPost('/chat/conversations', { storeId: storeIdDb, content })
      if (r.data && r.data.conversationId) convId.value = r.data.conversationId
    }
    chatText.value = ''
    const r2 = await apiGet('/chat/conversations/' + convId.value + '/messages')
    msgs.value = r2.data || []
    nextTick(() => { if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight })
  } catch (e) {
    showToast(e.message || '发送失败')
  } finally {
    chatBusy.value = false
  }
}

function mTime(v) {
  return String(v).substring(0, 16).replace('T', ' ')
}
function isMe(m) {
  const me = loadLS('yhjs_user', null)
  return me ? Number(m.sender_id) === Number(me.id) : false
}

function init() {
  storeId.value = String(route.params.id || 's1')
  tab.value = 'products'
  selectedScore.value = 5
  rvContent.value = ''
}
watch(() => route.params.id, init)
onMounted(init)
</script>

<template>
  <div class="container">
    <!-- 面包屑 -->
    <div class="breadcrumb">
      <router-link to="/">首页</router-link><span class="sep">/</span><span>{{ store.name }}</span>
    </div>

    <!-- 店铺头 -->
    <div class="store-head">
      <div class="shop-avatar" :style="{ background: 'linear-gradient(135deg,' + store.colors[0] + ',' + store.colors[1] + ')' }">{{ store.name.charAt(0) }}</div>
      <div style="flex:1">
        <h1 class="serif">{{ store.name }}</h1>
        <div class="badges">
          <span class="gold">★ 老字号认证</span>
          <span>{{ store.badge }}</span>
          <span>产地直供</span>
          <span>全程可溯</span>
        </div>
        <div class="head-meta">
          <span>📍 {{ store.city }}</span>
          <span>🗓 经营 {{ store.years }} 年</span>
          <span>🌿 <b>{{ store.productsCount }}</b> 款药材</span>
          <span>👥 收藏 <b>{{ fmt(store.followers) }}</b></span>
        </div>
        <button class="btn btn-primary" style="margin-top:14px" @click="openStoreChat()">💬 联系商家</button>
      </div>
    </div>

    <!-- 评分面板 -->
    <div class="rating-panel">
      <div class="rating-summary">
        <div class="score">{{ eff.rating.toFixed(1) }}</div>
        <div class="rate-row" style="justify-content:center"><span v-html="starsHTML(eff.rating)"></span></div>
        <div class="desc">共 {{ fmt(eff.count) }} 人参与评分</div>
        <div class="desc">口碑评分 · 非常好</div>
      </div>
      <div class="rating-bars">
        <div v-for="(n, i) in dist" :key="i" class="rating-bar">
          <span class="lbl">{{ 5 - i }} 星</span>
          <div class="track"><div class="fill" :style="{ width: (distTot ? Math.round(n / distTot * 100) : 0) + '%' }"></div></div>
          <span class="pct">{{ distTot ? Math.round(n / distTot * 100) : 0 }}%</span>
        </div>
      </div>
    </div>

    <!-- Tab -->
    <div class="tabs">
      <button :class="{ active: tab === 'products' }" @click="switchTab('products')">全部药材 ({{ prods.length }})</button>
      <button :class="{ active: tab === 'reviews' }" @click="switchTab('reviews')">店铺评价</button>
    </div>

    <template v-if="tab === 'products'">
      <div class="product-grid">
        <ProductCard v-for="p in prods" :key="p.id" :product="p" />
      </div>
    </template>

    <template v-else>
      <div class="review-form">
        <h3>✍️ 为本店评分</h3>
        <div class="form-row">
          <label>店铺体验评分</label>
          <div class="star-input">
            <button v-for="i in 5" :key="i" type="button" :class="{ on: i <= selectedScore }" @click="selectedScore = i">★</button>
          </div>
        </div>
        <div class="form-row">
          <label>评价内容（真实体验会帮助其他用户）</label>
          <textarea v-model="rvContent" placeholder="这家店的服务、包装、药材品质如何？"></textarea>
        </div>
        <button class="btn btn-primary" @click="submitStoreReview()">提交评价</button>
      </div>

      <div class="review-list">
        <template v-if="userReviews.length">
          <div v-for="(r, i) in userReviews" :key="'u' + i" class="review-item">
            <div class="rv-head">
              <div class="rv-user"><span class="rv-avatar">{{ r.name.charAt(0) }}</span>{{ r.name }}</div>
              <span class="rv-time">刚刚</span>
            </div>
            <div class="rv-dim">
              <span v-html="starsHTML(r.score)"></span>
              <span>在此店 <b>{{ (r.dims && r.dims.join('、')) || '口碑' }}</b> 不错</span>
            </div>
            <p>{{ r.text }}</p>
          </div>
        </template>
        <div v-else class="review-item" style="text-align:center;color:var(--ink-light)">还没有评价，来抢首评吧～</div>

        <div class="review-item">
          <div class="rv-head"><div class="rv-user"><span class="rv-avatar">老</span>老药工阿福</div><span class="rv-time">3天前</span></div>
          <div class="rv-dim"><span v-html="starsHTML(eff.rating)"></span> 店内口碑不错</div>
          <p>包装非常扎实，人参带溯源证书，跟描述一致。大店就是让人放心。</p>
        </div>
        <div class="review-item">
          <div class="rv-head"><div class="rv-user"><span class="rv-avatar">春</span>春城小花</div><span class="rv-time">1个月前</span></div>
          <div class="rv-dim"><span v-html="starsHTML(eff.rating)"></span> 店内口碑不错</div>
          <p>客服很专业，介绍了不同参龄的区别，买到适合自己的，满意。</p>
        </div>
      </div>
    </template>

    <!-- 联系商家聊天弹窗 -->
    <div v-if="showChat" class="modal-mask show" @click.self="showChat = false">
      <div class="modal-chat">
        <div class="chat-head">联系商家 · {{ store.name }}
          <button class="close" @click="showChat = false">×</button>
        </div>
        <div ref="chatBox" class="chat-msgs" style="flex:1;overflow-y:auto">
          <template v-if="msgs.length">
            <div v-for="(m, i) in msgs" :key="i" class="chat-msg" :class="isMe(m) ? 'me' : 'other'">
              <div class="bubble">{{ m.content }}</div>
              <div class="m-time">{{ mTime(m.created_at) }}</div>
            </div>
          </template>
          <div v-else class="wb-sub" style="padding:20px">还没有历史消息，发送第一条消息开始咨询吧。</div>
        </div>
        <div class="chat-input">
          <input v-model="chatText" placeholder="输入消息…" @keyup.enter="sendStoreChat()">
          <button :disabled="chatBusy" @click="sendStoreChat()">发送</button>
        </div>
      </div>
    </div>
  </div>
</template>

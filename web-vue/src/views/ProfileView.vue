<script setup>
// 个人中心（由旧 profile.html 1:1 移植）
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiGet, apiPost, apiPut } from '../api'
import { auth, isLoggedIn, setUser, clearSession } from '../store/auth'
import { showToast } from '../ui'

const route = useRoute()
const router = useRouter()

const ROLE_NAMES = { user: '普通用户', merchant: '商家账号', admin: '平台管理员' }
const profileData = ref(auth.user)
const panel = ref('overview')
const loading = ref(true)

// 资料表单
const pf = ref({ nickname: '', avatar_url: '', gender: 'unknown', birthday: '', bio: '' })

// 列表数据
const favorites = ref([])
const orders = ref([])
const conversations = ref([])
const msgs = ref([])
const activeConvId = ref(null)
const chatText = ref('')

function fmtTime(t) {
  if (!t) return ''
  return String(t).substring(0, 16).replace('T', ' ')
}
function orderStatusText(s) {
  const map = {
    pending_payment: '待付款', paid: '已付款', shipped: '已发货', completed: '已完成', cancelled: '已取消'
  }
  return map[s] || s
}

onMounted(async () => {
  if (!isLoggedIn()) {
    router.replace({ name: 'auth', query: { redirect: '/profile' } })
    return
  }
  try {
    const r = await apiGet('/auth/me')
    profileData.value = r.data
    setUser(r.data)
    initForm()
  } catch (e) {
    clearSession()
    router.replace({ name: 'auth', query: { redirect: '/profile' } })
    return
  }
  loading.value = false
  showPanel('overview')
})

function initForm() {
  const u = profileData.value || {}
  pf.value = {
    nickname: u.nickname || '',
    avatar_url: u.avatar_url || '',
    gender: u.gender || 'unknown',
    birthday: u.birthday ? String(u.birthday).slice(0, 10) : '',
    bio: u.bio || ''
  }
}

function showPanel(name) {
  panel.value = name
  if (name === 'favorites') loadFavorites()
  else if (name === 'orders') loadOrders()
  else if (name === 'messages') loadMessages()
}

async function loadFavorites() {
  try {
    const r = await apiGet('/favorites')
    favorites.value = r.data || []
  } catch (e) { showToast(e.message) }
}

async function loadOrders() {
  try {
    const r = await apiGet('/orders')
    orders.value = r.data || []
  } catch (e) { showToast(e.message) }
}

async function saveProfile() {
  try {
    const payload = {
      nickname: pf.value.nickname,
      avatarUrl: pf.value.avatar_url,
      gender: pf.value.gender,
      birthday: pf.value.birthday || null,
      bio: pf.value.bio
    }
    const result = await apiPut('/auth/profile', payload)
    profileData.value = result.data
    setUser(result.data)
    initForm()
    showToast('个人资料已保存')
  } catch (e) {
    showToast('保存失败：' + e.message)
  }
}

// ---------- 消息 / 商家会话 ----------
async function loadMessages() {
  try {
    const r = await apiGet('/chat/conversations')
    conversations.value = r.data || []
    if (conversations.value.length) openConv(conversations.value[0].id)
    else msgs.value = []
  } catch (e) { showToast(e.message) }
}

async function openConv(id) {
  activeConvId.value = id
  const active = conversations.value.find((c) => c.id === id)
  try {
    const r = await apiGet('/chat/conversations/' + id + '/messages')
    msgs.value = r.data || []
    nextTick(scrollBottom)
    const r2 = await apiGet('/chat/conversations')
    conversations.value = r2.data || []
  } catch (e) { showToast(e.message) }
}
const chatBox = ref(null)
function scrollBottom() {
  if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight
}

async function sendMsg() {
  const text = chatText.value.trim()
  if (!text || !activeConvId.value) return
  try {
    await apiPost('/chat/conversations/' + activeConvId.value + '/messages', { content: text })
    chatText.value = ''
    await openConv(activeConvId.value)
  } catch (e) { showToast(e.message) }
}

async function logout() {
  try { await apiPost('/auth/logout', {}) } catch (e) { /* ignore */ }
  clearSession()
  router.replace('/')
}

const currentUser = computed(() => profileData.value)
const isMerchant = computed(() => profileData.value && profileData.value.role === 'merchant')
function avatarText(u) {
  if (u && u.avatar_url) return ''
  return (u && u.nickname || '炎').charAt(0).toUpperCase()
}
</script>

<template>
  <div class="container">
    <div class="breadcrumb">
      <router-link to="/">首页</router-link><span class="sep">/</span><span>个人中心</span>
    </div>

    <div v-if="loading" style="text-align:center;padding:60px 0;color:var(--ink-light)">加载中…</div>

    <div v-else-if="currentUser" class="profile-shell">
      <!-- 侧边栏 -->
      <aside class="profile-side">
        <div class="avatar">
          <img v-if="currentUser.avatar_url" :src="currentUser.avatar_url" alt="头像">
          <template v-else>{{ avatarText(currentUser) }}</template>
        </div>
        <h2>{{ currentUser.nickname }}</h2>
        <div class="phone">{{ currentUser.phone }}</div>
        <span class="role-pill">{{ ROLE_NAMES[currentUser.role] || '平台用户' }}</span>
        <div class="profile-nav">
          <button :class="{ on: panel === 'overview' }" @click="panel = 'overview'">账户概览</button>
          <button :class="{ on: panel === 'profile' }" @click="initForm(); panel = 'profile'">个人资料</button>
          <button :class="{ on: panel === 'favorites' }" @click="showPanel('favorites')">我的收藏</button>
          <button :class="{ on: panel === 'orders' }" @click="showPanel('orders')">我的订单</button>
          <button :class="{ on: panel === 'messages' }" @click="showPanel('messages')">我的消息</button>
          <button v-if="isMerchant" @click="router.push('/join')">商家入驻资料</button>
          <button @click="logout()">退出登录</button>
        </div>
      </aside>

      <!-- 主内容 -->
      <div>
        <!-- 账户概览 -->
        <div v-if="panel === 'overview'" class="profile-card">
          <h1 class="serif">欢迎回来，{{ currentUser.nickname }}</h1>
          <div class="sub">在这里查看你的账户信息、收藏、订单和互动记录。</div>
          <div class="summary-grid">
            <div class="summary-item"><div class="num">{{ currentUser.role === 'merchant' ? '商家' : '用户' }}</div><div class="label">账户身份</div></div>
            <div class="summary-item"><div class="num">{{ currentUser.bio ? '已完善' : '待完善' }}</div><div class="label">个人资料</div></div>
            <div class="summary-item"><div class="num">安全</div><div class="label">登录状态</div></div>
          </div>
          <div class="order-addr">
            🔐 当前账号已通过安全会话登录。你的评分、发帖、收藏和订单都会绑定到这个账号。
          </div>
          <button class="btn btn-primary" @click="initForm(); panel = 'profile'">完善个人资料</button>
        </div>

        <!-- 个人资料 -->
        <div v-else-if="panel === 'profile'" class="profile-card">
          <h1 class="serif">个人资料</h1>
          <div class="sub">头像、用户名和介绍会展示在你的社区互动中。</div>
          <form class="profile-form" @submit.prevent="saveProfile()">
            <div><label>用户名</label><input v-model="pf.nickname" required maxlength="40"></div>
            <div><label>头像地址</label><input v-model="pf.avatar_url" placeholder="可填写图片 URL"></div>
            <div>
              <label>性别</label>
              <select v-model="pf.gender">
                <option value="unknown">暂不设置</option>
                <option value="male">男</option>
                <option value="female">女</option>
              </select>
            </div>
            <div><label>生日</label><input v-model="pf.birthday" type="date"></div>
            <div class="full"><label>个人简介</label><textarea v-model="pf.bio" maxlength="300" placeholder="例如：喜欢研究药食同源和四时养生……"></textarea></div>
            <div class="actions"><button class="btn btn-primary" type="submit">保存资料</button></div>
          </form>
        </div>

        <!-- 我的收藏 -->
        <div v-else-if="panel === 'favorites'" class="profile-card">
          <h1 class="serif">我的收藏</h1>
          <div class="sub">数据来自你的平台账户。</div>
          <div v-if="favorites.length" class="data-list">
            <div v-for="item in favorites" :key="item.id" class="data-row">
              <span>♡ {{ item.target_name }}</span>
              <span class="muted">{{ item.target_type === 'product' ? '药材' : '店铺' }}</span>
            </div>
          </div>
          <div v-else class="empty-state">还没有收藏内容，去商城看看吧。</div>
        </div>

        <!-- 我的订单 -->
        <div v-else-if="panel === 'orders'" class="profile-card">
          <h1 class="serif">我的订单</h1>
          <div class="sub">数据来自你的平台账户。</div>
          <div v-if="orders.length" class="data-list">
            <div v-for="item in orders" :key="item.id" class="data-row">
              <span><b>{{ item.order_no }}</b><br><span class="muted">{{ item.store_name }} · ¥{{ item.total_amount }}</span></span>
              <span style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
                <span>{{ orderStatusText(item.status) }}</span>
                <router-link
                  :to="{ name: 'logistics', params: { id: item.id } }"
                  style="color:var(--red);font-size:12px">物流查询 ›</router-link>
              </span>
            </div>
          </div>
          <div v-else class="empty-state">还没有订单，去商城看看感兴趣的药材吧。</div>
        </div>

        <!-- 我的消息 -->
        <div v-else class="profile-card">
          <h1 class="serif">我的消息</h1>
          <div class="sub">与商家的售前咨询记录。</div>
          <div v-if="!conversations.length" class="empty-state">还没有会话，去店铺详情页点击「联系商家」发起咨询吧。</div>
          <div v-else class="chat-layout">
            <div class="chat-list">
              <div v-for="c in conversations" :key="c.id" class="chat-list-item" :class="{ on: c.id === activeConvId }" @click="openConv(c.id)">
                <div class="c-ava">{{ (c.store_name || '店').charAt(0) }}</div>
                <div class="c-main">
                  <div class="c-name">{{ c.store_name }}<span v-if="c.unread_user > 0" class="chat-unread">{{ c.unread_user }}</span></div>
                  <div class="c-preview">{{ c.last_message || '' }}</div>
                </div>
              </div>
            </div>
            <div class="chat-thread">
              <div v-if="activeConvId" style="display:flex;flex-direction:column;height:100%">
                <div class="chat-head">与 {{ (conversations.find((c) => c.id === activeConvId) || {}).store_name || '商家' }} 的对话</div>
                <div ref="chatBox" class="chat-msgs">
                  <template v-if="msgs.length">
                    <div v-for="(m, i) in msgs" :key="i" class="chat-msg" :class="Number(m.sender_id) === Number(currentUser.id) ? 'me' : 'other'">
                      <div class="bubble">{{ m.content }}</div>
                      <div class="m-time">{{ fmtTime(m.created_at) }}</div>
                    </div>
                  </template>
                  <div v-else class="wb-sub">暂无消息</div>
                </div>
                <div class="chat-input">
                  <input v-model="chatText" placeholder="输入消息…" @keyup.enter="sendMsg()">
                  <button @click="sendMsg()">发送</button>
                </div>
              </div>
              <div v-else class="chat-head">选择左侧会话开始查看</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-shell { display: grid; grid-template-columns: 250px 1fr; gap: 20px; margin: 24px 0 50px; }
.profile-side, .profile-card { background: #fff; border: 1px solid var(--line); border-radius: 16px; }
.profile-side { padding: 22px; text-align: center; align-self: start; }
.avatar { width: 92px; height: 92px; margin: 0 auto 12px; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--red), var(--gold)); color: #fff; font-size: 34px; font-weight: 700; }
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.profile-side h2 { font-size: 20px; margin-bottom: 4px; }
.profile-side .phone { color: var(--ink-light); font-size: 12px; }
.role-pill { display: inline-block; margin: 10px 0 18px; padding: 3px 12px; border-radius: 999px; background: var(--jade-light); color: var(--jade); font-size: 12px; }
.profile-nav { border-top: 1px solid var(--line); padding-top: 12px; text-align: left; }
.profile-nav button { width: 100%; padding: 10px 12px; color: var(--ink-light); border-radius: 8px; text-align: left; }
.profile-nav button:hover, .profile-nav button.on { color: var(--red); background: rgba(140, 31, 40, 0.07); }
.profile-card { padding: 24px; min-height: 420px; }
.profile-card h1 { font-size: 22px; margin-bottom: 5px; }
.profile-card .sub { color: var(--ink-light); font-size: 13px; margin-bottom: 22px; }
.profile-form { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; max-width: 680px; }
.profile-form .full { grid-column: 1 / -1; }
.profile-form label { display: block; color: var(--ink-light); font-size: 13px; margin-bottom: 6px; }
.profile-form input, .profile-form select, .profile-form textarea { width: 100%; padding: 11px 13px; border: 1px solid var(--line); border-radius: 8px; background: var(--paper); outline: none; }
.profile-form textarea { min-height: 90px; resize: vertical; }
.profile-form input:focus, .profile-form select:focus, .profile-form textarea:focus { border-color: var(--red); background: #fff; }
.profile-form .actions { grid-column: 1 / -1; margin-top: 4px; }
.summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin: 20px 0; }
.summary-item { padding: 18px; background: var(--paper); border-radius: 10px; }
.summary-item .num { color: var(--red-dark); font-size: 25px; font-weight: 700; }
.summary-item .label { color: var(--ink-light); font-size: 12px; }
.data-list { display: flex; flex-direction: column; gap: 10px; }
.data-row { padding: 14px; background: var(--paper); border-radius: 9px; display: flex; justify-content: space-between; gap: 14px; font-size: 13px; }
.data-row .muted { color: var(--ink-light); }
.empty-state { text-align: center; padding: 55px 0; color: var(--ink-light); }
@media (max-width: 760px) {
  .profile-shell { grid-template-columns: 1fr; }
  .profile-form { grid-template-columns: 1fr; }
  .profile-form .full, .profile-form .actions { grid-column: auto; }
  .summary-grid { grid-template-columns: 1fr; }
}
</style>

<script setup>
// 商家工作台（由旧 merchant.html 1:1 移植）
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet, apiPost, apiPut } from '../api'
import { auth, isLoggedIn, setUser, clearSession } from '../store/auth'
import { showToast } from '../ui'

const router = useRouter()
const me = ref(null)
const store = ref(null)
const stats = ref(null)
const categories = ref([])
const products = ref([])
const conversations = ref([])
const activeConvId = ref(null)
const msgs = ref([])
const chatText = ref('')
const tab = ref('overview')
const loading = ref(true)
const chatBox = ref(null)

const nf = ref({ name: '', categoryId: '', price: '', stock: '', origin: '', imageUrl: '', description: '' })

function fmtTime(t) {
  if (!t) return ''
  return String(t).substring(0, 16).replace('T', ' ')
}
function pill(status) {
  const map = {
    on_sale: { cls: 'green', txt: '在售' }, off_shelf: { cls: 'gray', txt: '已下架' }, draft: { cls: 'gold', txt: '草稿' },
    pending_payment: { cls: 'gold', txt: '待付款' }, paid: { cls: 'gold', txt: '已付款' },
    shipped: { cls: 'green', txt: '已发货' }, completed: { cls: 'green', txt: '已完成' }, cancelled: { cls: 'gray', txt: '已取消' }
  }
  const m = map[status]
  return m ? { cls: m.cls, txt: m.txt } : { cls: 'gray', txt: status }
}
function pimg(p) {
  return p.image_url || 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=' + encodeURIComponent('传统中药材商品') + '&image_size=square_hd'
}

onMounted(async () => {
  if (!isLoggedIn()) { router.replace({ name: 'auth', query: { redirect: '/merchant' } }); return }
  try {
    const r = await apiGet('/auth/me')
    me.value = r.data
    if (me.value.role !== 'merchant') {
      showToast('当前账号不是商家')
      router.replace('/profile')
      return
    }
    setUser(r.data)
    loading.value = false
    showTab('overview')
  } catch (e) {
    clearSession()
    router.replace({ name: 'auth', query: { redirect: '/merchant' } })
  }
})

function showTab(name) {
  tab.value = name
  if (name === 'overview') loadOverview()
  else if (name === 'products') loadProducts()
  else if (name === 'orders') loadOrders()
  else if (name === 'settlement') loadSettlement()
  else if (name === 'chat') loadChat()
}

// ---------------- 概览 ----------------
async function loadOverview() {
  try {
    const [s, st] = await Promise.all([apiGet('/merchant/store'), apiGet('/merchant/store/stats')])
    store.value = s.data
    stats.value = st.data
  } catch (e) {
    showToast(e.message)
    store.value = null
  }
}
const trendBars = computed(() => {
  const trend = (stats.value && stats.value.trend) || []
  const max = trend.reduce((m, t) => Math.max(m, Number(t.cnt) || 0), 1)
  return trend.map((t) => ({ cnt: t.cnt, d: t.d, h: Math.max(6, Math.round((Number(t.cnt) || 0) / max * 100)) }))
})
const shopLink = computed(() => location.origin + '/' + '#' + '/store/' + (store.value ? 's' + store.value.id : ''))
const shopQr = computed(() => 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(shopLink.value))
function copyShopLink() {
  const text = shopLink.value
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => showToast('链接已复制'))
  } else { showToast(text) }
}

// ---------------- 商品管理 ----------------
async function loadProducts() {
  try {
    const [p, c] = await Promise.all([apiGet('/merchant/products'), apiGet('/categories')])
    products.value = p.data || []
    categories.value = c.data || []
  } catch (e) { showToast(e.message) }
}
async function setProductStatus(id, status) {
  try {
    await apiPut('/merchant/products/' + id, { status })
    showToast(status === 'on_sale' ? '已上架' : '已下架')
    loadProducts()
  } catch (e) { showToast(e.message) }
}
async function setProductPublic(id, isPublic) {
  try {
    await apiPut('/merchant/products/' + id + '/public', { isPublic: isPublic ? 1 : 0 })
    showToast(isPublic ? '已设为公域展示' : '已设为仅私域')
    loadProducts()
  } catch (e) { showToast(e.message) }
}
async function submitProduct() {
  try {
    await apiPost('/merchant/products', {
      name: nf.value.name, categoryId: nf.value.categoryId, price: nf.value.price,
      stock: nf.value.stock, origin: nf.value.origin, imageUrl: nf.value.imageUrl, description: nf.value.description
    })
    showToast('商品已上架')
    Object.assign(nf.value, { name: '', price: '', stock: '', origin: '', imageUrl: '', description: '' })
    loadProducts()
  } catch (e) { showToast(e.message) }
}

// ---------------- 订单管理 ----------------
const orders = ref([])
async function loadOrders() {
  try {
    const r = await apiGet('/merchant/orders')
    orders.value = r.data || []
  } catch (e) { showToast(e.message) }
}
async function setOrderStatus(id, status) {
  try {
    await apiPut('/merchant/orders/' + id + '/status', { status })
    showToast('订单已更新')
    loadOrders()
  } catch (e) { showToast(e.message) }
}

// ---------------- 对账佣金 ----------------
const settlement = ref(null)
async function loadSettlement() {
  try {
    const r = await apiGet('/merchant/settlement')
    settlement.value = r.data
  } catch (e) { showToast(e.message) }
}

// ---------------- 消息中心 ----------------
async function loadChat() {
  try {
    const r = await apiGet('/chat/conversations')
    conversations.value = r.data || []
    msgs.value = []
    activeConvId.value = null
    if (conversations.value.length) openConversation(conversations.value[0].id)
  } catch (e) { showToast(e.message) }
}
function scrollBottom() {
  if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight
}
async function openConversation(id) {
  activeConvId.value = id
  try {
    const r = await apiGet('/chat/conversations/' + id + '/messages')
    msgs.value = r.data || []
    nextTick(scrollBottom)
    const r2 = await apiGet('/chat/conversations')
    conversations.value = r2.data || []
  } catch (e) { showToast(e.message) }
}
async function sendChatMessage() {
  const text = chatText.value.trim()
  if (!text || !activeConvId.value) return
  try {
    await apiPost('/chat/conversations/' + activeConvId.value + '/messages', { content: text })
    chatText.value = ''
    await openConversation(activeConvId.value)
  } catch (e) { showToast(e.message) }
}

async function logout() {
  try { await apiPost('/auth/logout', {}) } catch (e) { /* ignore */ }
  clearSession()
  router.replace('/')
}
</script>

<template>
  <div class="container">
    <div class="breadcrumb">
      <router-link to="/">首页</router-link><span class="sep">/</span><span>商家工作台</span>
    </div>

    <div v-if="loading" style="text-align:center;padding:60px 0;color:var(--ink-light)">加载中…</div>

    <div v-else class="workbench">
      <!-- 侧边栏 -->
      <aside class="workbench-side">
        <div class="wb-brand">
          <div class="wb-avatar">{{ (me.nickname || '商').charAt(0) }}</div>
          <div><div class="wb-name">{{ me.nickname }}</div><div class="wb-role">商家工作台</div></div>
        </div>
        <nav class="wb-nav">
          <button :class="{ on: tab === 'overview' }" @click="showTab('overview')">经营概览</button>
          <button :class="{ on: tab === 'products' }" @click="showTab('products')">商品管理</button>
          <button :class="{ on: tab === 'orders' }" @click="showTab('orders')">订单管理</button>
          <button :class="{ on: tab === 'settlement' }" @click="showTab('settlement')">对账佣金</button>
          <button :class="{ on: tab === 'chat' }" @click="showTab('chat')">消息中心</button>
          <button @click="router.push('/')">返回商城</button>
          <button @click="logout()">退出登录</button>
        </nav>
      </aside>

      <main class="wb-main">
        <!-- 经营概览 -->
        <template v-if="tab === 'overview'">
          <div v-if="store && stats" class="wb-card">
            <h1 class="serif">{{ store.name }}</h1>
            <div class="wb-sub">店铺评分 {{ Number(store.rating).toFixed(1) }} · {{ store.city }} · 经营 {{ store.years_in_business }} 年</div>
            <div class="stat-grid">
              <div class="stat-card"><div class="num">{{ stats.total_visits }}</div><div class="label">累计访问量</div></div>
              <div class="stat-card jade"><div class="num">{{ stats.today_visits }}</div><div class="label">今日访问</div></div>
              <div class="stat-card gold"><div class="num">{{ stats.product_count }}</div><div class="label">在售商品</div></div>
              <div class="stat-card"><div class="num">¥{{ Number(stats.total_sales).toFixed(2) }}</div><div class="label">累计销售额</div></div>
            </div>
            <div class="stat-grid">
              <div class="stat-card"><div class="num">{{ stats.order_count }}</div><div class="label">成交订单</div></div>
              <div class="stat-card jade"><div class="num">{{ store.product_count }}</div><div class="label">商品总数</div></div>
              <div class="stat-card gold"><div class="num">{{ store.follower_count }}</div><div class="label">收藏数</div></div>
              <div class="stat-card"><div class="num">{{ store.rating_count }}</div><div class="label">评分人数</div></div>
            </div>
            <h3 style="font-size:15px;margin-bottom:6px">近7天店铺流量</h3>
            <div v-if="trendBars.length" class="chart-bars">
              <div v-for="(t, i) in trendBars" :key="i" class="bar-col">
                <div class="bar-val">{{ t.cnt }}</div>
                <div class="bar" :style="{ height: t.h + '%' }"></div>
                <div class="bar-lbl">{{ t.d }}</div>
              </div>
            </div>
            <div v-else class="wb-sub">近7天暂无访问记录，店铺详情被浏览后即可看到流量趋势。</div>
          </div>
          <div v-if="store" class="wb-card">
            <h1 class="serif">店铺专属链接</h1>
            <div class="wb-sub">把该链接或二维码发给你的线下、微信老客户，客户会直接进入你的店铺，不跳转平台首页，避免被同行分流。</div>
            <div style="display:flex;gap:24px;align-items:center;flex-wrap:wrap">
              <img :src="shopQr" alt="店铺二维码" style="width:160px;height:160px;border:1px solid var(--line);border-radius:12px">
              <div style="flex:1;min-width:260px">
                <div style="font-size:12px;color:var(--ink-light);margin-bottom:6px">专属链接</div>
                <div style="display:flex;gap:8px">
                  <input readonly :value="shopLink" style="flex:1;border:1px solid var(--line);border-radius:8px;padding:9px 12px;font-size:13px;background:var(--paper)">
                  <button class="mini-btn primary" @click="copyShopLink()">复制</button>
                </div>
                <div style="font-size:12px;color:var(--ink-light);margin-top:12px">当前佣金比例：<b style="color:var(--red)">{{ Number(store.commission_rate).toFixed(2) }}%</b>（平台按成交订单计提）</div>
              </div>
            </div>
          </div>
        </template>

        <!-- 商品管理 -->
        <template v-else-if="tab === 'products'">
          <div class="wb-card">
            <h1 class="serif">商品管理</h1><div class="wb-sub">上架新药材或调整在售商品状态。</div>
            <div style="overflow-x:auto">
              <table class="wb-table">
                <thead><tr><th></th><th>商品</th><th>分类</th><th>价格</th><th>库存</th><th>销量</th><th>状态</th><th>操作</th></tr></thead>
                <tbody>
                  <tr v-if="!products.length"><td colspan="8" style="text-align:center;color:var(--ink-light)">暂无商品，请在下方上架。</td></tr>
                  <tr v-for="p in products" :key="p.id">
                    <td><img class="thumb" :src="pimg(p)" alt=""></td>
                    <td><b>{{ p.name }}</b></td>
                    <td>{{ p.category_name || '' }}</td>
                    <td>¥{{ Number(p.price).toFixed(2) }}</td>
                    <td>{{ p.stock }}</td>
                    <td>{{ p.sales_count }}</td>
                    <td>
                      <span class="pill" :class="pill(p.status).cls">{{ pill(p.status).txt }}</span>
                      <div style="margin-top:4px"><span class="pill" :class="p.is_public ? 'gold' : 'gray'">{{ p.is_public ? '公域展示' : '仅私域' }}</span></div>
                    </td>
                    <td>
                      <button v-if="p.status !== 'on_sale'" class="mini-btn primary" @click="setProductStatus(p.id, 'on_sale')">上架</button>
                      <button v-if="p.status === 'on_sale'" class="mini-btn" @click="setProductStatus(p.id, 'off_shelf')">下架</button>
                      <button class="mini-btn" @click="setProductPublic(p.id, p.is_public ? 0 : 1)">{{ p.is_public ? '设为私域' : '设为公域' }}</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="wb-card">
            <h1 class="serif">上架新商品</h1><div class="wb-sub">提交后默认进入在售状态。</div>
            <form class="form-inline" @submit.prevent="submitProduct()">
              <div class="full"><label>商品名称</label><input v-model="nf.name" required placeholder="例如：长白山野山参 · 15年足龄"></div>
              <div><label>分类</label><select v-model="nf.categoryId" required><option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option></select></div>
              <div><label>价格（元）</label><input v-model="nf.price" type="number" min="0" step="0.01" required placeholder="0.00"></div>
              <div><label>库存</label><input v-model="nf.stock" type="number" min="0" required placeholder="0"></div>
              <div><label>产地</label><input v-model="nf.origin" placeholder="例如：吉林长白山"></div>
              <div class="full"><label>商品图片 URL（可留空）</label><input v-model="nf.imageUrl" placeholder="https://…"></div>
              <div class="full"><label>商品描述</label><textarea v-model="nf.description" placeholder="产地、品质、食用/使用方法等"></textarea></div>
              <div class="full"><button class="btn btn-primary" type="submit">提交上架</button></div>
            </form>
          </div>
        </template>

        <!-- 订单管理 -->
        <template v-else-if="tab === 'orders'">
          <div class="wb-card">
            <h1 class="serif">订单管理</h1><div class="wb-sub">处理本店订单的发货与完成状态。</div>
            <div style="overflow-x:auto">
              <table class="wb-table">
                <thead><tr><th>订单号</th><th>买家</th><th>收货信息</th><th>金额</th><th>状态</th><th>下单时间</th><th>操作</th></tr></thead>
                <tbody>
                  <tr v-if="!orders.length"><td colspan="7" style="text-align:center;color:var(--ink-light)">暂无订单。</td></tr>
                  <tr v-for="o in orders" :key="o.id">
                    <td>{{ o.order_no }}</td>
                    <td>{{ o.buyer_nickname || '匿名用户' }}</td>
                    <td>{{ o.receiver_name || '' }}<br><span style="color:var(--ink-light);font-size:11px">{{ o.receiver_phone || '' }}</span></td>
                    <td>¥{{ Number(o.total_amount).toFixed(2) }}</td>
                    <td><span class="pill" :class="pill(o.status).cls">{{ pill(o.status).txt }}</span></td>
                    <td>{{ fmtTime(o.created_at) }}</td>
                    <td>
                      <button v-if="o.status === 'paid'" class="mini-btn primary" @click="setOrderStatus(o.id, 'shipped')">发货</button>
                      <button v-if="o.status === 'shipped'" class="mini-btn primary" @click="setOrderStatus(o.id, 'completed')">完成</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

        <!-- 对账佣金 -->
        <template v-else-if="tab === 'settlement'">
          <div v-if="settlement" class="wb-card">
            <h1 class="serif">对账佣金</h1><div class="wb-sub">平台按成交订单自动计提佣金，退款/取消订单佣金自动回滚。</div>
            <div class="stat-grid">
              <div class="stat-card"><div class="num">{{ settlement.order_count }}</div><div class="label">成交订单</div></div>
              <div class="stat-card jade"><div class="num">¥{{ Number(settlement.total_sales).toFixed(2) }}</div><div class="label">成交额</div></div>
              <div class="stat-card gold"><div class="num">¥{{ Number(settlement.total_commission).toFixed(2) }}</div><div class="label">应付佣金</div></div>
              <div class="stat-card"><div class="num">¥{{ Number(settlement.net_amount).toFixed(2) }}</div><div class="label">结算净额</div></div>
            </div>
            <div style="overflow-x:auto">
              <table class="wb-table">
                <thead><tr><th>订单号</th><th>来源</th><th>金额</th><th>佣金率</th><th>佣金</th><th>状态</th><th>时间</th></tr></thead>
                <tbody>
                  <tr v-if="!settlement.orders || !settlement.orders.length"><td colspan="7" style="text-align:center;color:var(--ink-light)">暂无成交订单。</td></tr>
                  <tr v-for="o in settlement.orders || []" :key="o.id">
                    <td>{{ o.order_no }}</td>
                    <td><span class="pill" :class="o.source === 'private' ? 'gray' : 'gold'">{{ o.source === 'private' ? '私域' : '公域' }}</span></td>
                    <td>¥{{ Number(o.total_amount).toFixed(2) }}</td>
                    <td>{{ Number(o.commission_rate).toFixed(2) }}%</td>
                    <td>¥{{ Number(o.commission_amount).toFixed(2) }}</td>
                    <td><span class="pill" :class="pill(o.status).cls">{{ pill(o.status).txt }}</span></td>
                    <td>{{ fmtTime(o.created_at) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

        <!-- 消息中心 -->
        <template v-else>
          <div v-if="!conversations.length" class="wb-card">
            <h1 class="serif">消息中心</h1>
            <div class="wb-sub">暂无用户咨询，用户通过店铺详情页的「联系商家」发起对话后会显示在这里。</div>
          </div>
          <div v-else class="wb-card" style="padding:14px">
            <h1 class="serif" style="padding:12px 8px 0">消息中心</h1>
            <div class="wb-sub" style="padding:4px 8px 12px">回复用户的售前咨询。</div>
            <div class="chat-layout">
              <div class="chat-list">
                <div v-for="c in conversations" :key="c.id" class="chat-list-item" :class="{ on: c.id === activeConvId }" @click="openConversation(c.id)">
                  <div class="c-ava">{{ (c.other_nickname || '客').charAt(0) }}</div>
                  <div class="c-main">
                    <div class="c-name">{{ c.other_nickname }}<span v-if="c.unread_merchant > 0" class="chat-unread">{{ c.unread_merchant }}</span></div>
                    <div class="c-preview">{{ c.last_message || '' }}</div>
                  </div>
                </div>
              </div>
              <div class="chat-thread">
                <div v-if="activeConvId" style="display:flex;flex-direction:column;height:100%">
                  <div class="chat-head">与 {{ (conversations.find((c) => c.id === activeConvId) || {}).other_nickname || '用户' }} 的对话</div>
                  <div ref="chatBox" class="chat-msgs">
                    <template v-if="msgs.length">
                      <div v-for="(m, i) in msgs" :key="i" class="chat-msg" :class="Number(m.sender_id) === Number(me.id) ? 'me' : 'other'">
                        <div class="bubble">{{ m.content }}</div>
                        <div class="m-time">{{ fmtTime(m.created_at) }}</div>
                      </div>
                    </template>
                    <div v-else class="wb-sub">暂无消息</div>
                  </div>
                  <div class="chat-input">
                    <input v-model="chatText" placeholder="输入回复…" @keyup.enter="sendChatMessage()">
                    <button @click="sendChatMessage()">发送</button>
                  </div>
                </div>
                <div v-else class="chat-head">选择左侧会话开始回复</div>
              </div>
            </div>
          </div>
        </template>
      </main>
    </div>
  </div>
</template>

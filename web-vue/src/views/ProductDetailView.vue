<script setup>
// 药材详情页（由旧 product.html 1:1 移植）
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PRODUCTS, productOf, storeOf, starsHTML, fmt, loadLS, saveLS, loadFavs, saveFavs } from '../data'
import { apiGet, apiPost, apiPut, isLoggedIn } from '../api'
import { showToast } from '../ui'

const route = useRoute()
const router = useRouter()

const pid = ref(String(route.params.id || 'p1'))
const p = computed(() => productOf(pid.value) || PRODUCTS[0])
const s = computed(() => storeOf(p.value.storeId) || { name: '', colors: ['#8c1f28', '#6e161d'], rating: 5 })
const productDbId = computed(() => Number(String(p.value.id).replace(/^\D+/, '')) || 0)

const favOn = ref(false)
const reviews = ref([])
const selectedScore = ref(5)
const rvContent = ref('')
const showOrder = ref(false)
const qty = ref(1)
const buying = ref(false)

// ---------- 真实下单 + 沙盒支付 ----------
const receiverName = ref('')
const receiverPhone = ref('')
const receiverAddress = ref('')
const showPay = ref(false)
const paying = ref(false)
const payDone = ref(false)
const payOrderNo = ref('')
const payOrderId = ref(0)
const payTotal = ref('0.00')
const payChannel = ref('wechat')
const storeDbId = computed(() => Number(String(s.value.id).replace(/\D+/g, '')) || 0)

// ---------- 评价 ----------
const eff = computed(() => {
  const base = reviews.value.length
  if (!base) return { rating: p.value.rating, count: p.value.ratingCount }
  let sum = p.value.ratingCount * p.value.rating
  reviews.value.forEach((r) => { sum += Number(r.score) || 0 })
  return { rating: Math.round((sum / (p.value.ratingCount + base)) * 10) / 10, count: p.value.ratingCount + base }
})

const ratingDist = computed(() => {
  const dist = [0, 0, 0, 0, 0]
  const per = [0.88, 0.08, 0.028, 0.007, 0.005]
  const total = p.value.ratingCount || 1000
  for (let i = 0; i < 5; i++) dist[i] = Math.round(total * per[i])
  reviews.value.forEach((r) => {
    const sc = Math.max(1, Math.min(5, Math.round(Number(r.score) || 0)))
    dist[5 - sc]++
  })
  return dist
})
const distTot = computed(() => ratingDist.value.reduce((a, b) => a + b, 0))

function formatReviewTime(value) {
  if (!value) return '刚刚'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.getFullYear() + '-' +
    String(date.getMonth() + 1).padStart(2, '0') + '-' +
    String(date.getDate()).padStart(2, '0')
}

async function loadReviews() {
  try {
    const r = await apiGet('/reviews', { targetType: 'product', targetId: productDbId.value, pageSize: 20 })
    reviews.value = r.data || []
  } catch (e) {
    reviews.value = []
    showToast('评价加载失败：' + e.message)
  }
}

// ---------- 收藏：已登录写后端（我的收藏），未登录才用本地演示 ----------
function localIsFav(key) { return loadFavs().indexOf(key) >= 0 }

async function syncFavState() {
  if (!isLoggedIn()) { favOn.value = localIsFav(p.value.id); return }
  try {
    const r = await apiGet('/favorites')
    favOn.value = (r.data || []).some(
      (f) => f.target_type === 'product' && Number(f.target_id) === productDbId.value)
  } catch (e) {
    favOn.value = localIsFav(p.value.id)
  }
}

async function toggleProductFav() {
  if (isLoggedIn()) {
    try {
      const r = await apiPost('/favorites/toggle', { targetType: 'product', targetId: productDbId.value })
      favOn.value = !!(r.data && r.data.favorited)
      showToast(favOn.value ? '已加入收藏 ❤' : '已取消收藏')
    } catch (e) {
      showToast(e.message || '收藏失败')
    }
    return
  }
  const list = loadFavs()
  const i = list.indexOf(p.value.id)
  if (i >= 0) {
    list.splice(i, 1)
    saveFavs(list)
    favOn.value = false
    showToast('已取消收藏')
  } else {
    list.push(p.value.id)
    saveFavs(list)
    favOn.value = true
    showToast('已加入收藏 ❤')
  }
}

// ---------- 下单：需登录，创建真实后端订单 ----------
function openOrder() {
  if (!isLoggedIn()) {
    showToast('请先登录后再下单')
    router.push({ path: '/auth', query: { redirect: route.fullPath } })
    return
  }
  qty.value = 1
  const saved = loadLS('yhjs_receiver', null)
  receiverName.value = (saved && saved.name) || ''
  receiverPhone.value = (saved && saved.phone) || ''
  receiverAddress.value = (saved && saved.address) || ''
  showOrder.value = true
}
function closeOrder() { showOrder.value = false }
function changeQty(d) { qty.value = Math.min(99, Math.max(1, qty.value + d)) }

async function submitOrder() {
  if (!receiverName.value.trim() || !receiverPhone.value.trim() || !receiverAddress.value.trim()) {
    showToast('请填写完整的收货信息'); return
  }
  if (!storeDbId.value || !productDbId.value) { showToast('该商品暂不支持在线下单'); return }
  buying.value = true
  try {
    const res = await apiPost('/orders', {
      storeId: storeDbId.value,
      receiverName: receiverName.value.trim(),
      receiverPhone: receiverPhone.value.trim(),
      receiverAddress: receiverAddress.value.trim(),
      items: [{ productId: productDbId.value, quantity: qty.value }],
      source: 'market',
      clientToken: takeClientToken()
    })
    pendingClientToken = ''
    saveLS('yhjs_receiver', {
      name: receiverName.value.trim(),
      phone: receiverPhone.value.trim(),
      address: receiverAddress.value.trim()
    })
    payOrderId.value = res.data.id
    payOrderNo.value = res.data.orderNo
    payTotal.value = Number(res.data.totalAmount || p.value.price * qty.value).toFixed(2)
    payChannel.value = 'wechat'
    payDone.value = false
    showOrder.value = false
    showPay.value = true
  } catch (e) {
    showToast(e.message || '下单失败')
  } finally {
    buying.value = false
  }
}

// ---------- 沙盒支付：模拟微信/支付宝，调后端把订单置为已付款 ----------
async function doPay() {
  if (!payOrderId.value) return
  paying.value = true
  try {
    await apiPost('/orders/' + payOrderId.value + '/pay')
    payDone.value = true
    showToast('支付成功，商家将尽快发货 🎉')
  } catch (e) {
    showToast(e.message || '支付失败')
  } finally {
    paying.value = false
  }
}
async function cancelOrder() {
  try { await apiPut('/orders/' + payOrderId.value + '/cancel') } catch (e) { /* 状态已变则忽略 */ }
  closePay()
  showToast('订单已取消')
}
function closePay() { showPay.value = false; payOrderId.value = 0 }
function goOrders() { closePay(); router.push('/profile') }
function goLogistics() {
  const id = payOrderId.value
  closePay()
  router.push({ name: 'logistics', params: { id } })
}

// ---------- 提交评价 ----------
async function submitReview() {
  const text = rvContent.value.trim()
  if (!text) { showToast('请填写评价内容'); return }
  if (!isLoggedIn()) { showToast('请先登录后再评价'); return }
  buying.value = true
  try {
    await apiPost('/reviews', {
      targetType: 'product', targetId: productDbId.value, score: selectedScore.value, content: text
    })
    showToast('评价已提交，感谢你的反馈')
    rvContent.value = ''
    await loadReviews()
  } catch (e) {
    showToast('提交失败：' + e.message)
  } finally {
    buying.value = false
  }
}

function init() {
  pid.value = String(route.params.id || 'p1')
  selectedScore.value = 5
  rvContent.value = ''
  syncFavState()
  loadReviews()
}
watch(() => route.params.id, init)
onMounted(init)
</script>

<template>
  <div class="container">
    <!-- 面包屑 -->
    <div class="breadcrumb">
      <router-link to="/">首页</router-link><span class="sep">/</span>
      <router-link :to="{ name: 'store', params: { id: s.id } }">{{ s.name }}</router-link><span class="sep">/</span>
      <span>{{ p.name }}</span>
    </div>

    <!-- 商品主体 -->
    <div class="product-detail">
      <div class="p-img"><img :src="p.img" :alt="p.name"></div>
      <div class="p-info">
        <h1 class="serif">{{ p.name }}</h1>
        <div class="p-rating">
          <div class="item">
            <div class="val">{{ p.rating.toFixed(1) }}</div>
            <div class="lbl"><span v-html="starsHTML(p.rating)"></span> 药材评分</div>
          </div>
          <div class="item"><div class="val">{{ fmt(p.ratingCount) }}</div><div class="lbl">人评分</div></div>
          <div class="item"><div class="val">{{ fmt(p.sales) }}</div><div class="lbl">人已买</div></div>
        </div>
        <div class="p-price-row">
          <span class="price">¥{{ p.price }}<span class="unit">/件</span>
            <span v-if="p.originalPrice" class="orig">¥{{ p.originalPrice }}</span>
          </span>
          <div class="meta">
            <span>🔥 已售 {{ fmt(p.sales) }} 件</span><span>🚚 产地顺丰直发</span><span>🛡 平台先行赔付</span>
          </div>
        </div>
        <h3 class="serif">— 药材详情 —</h3>
        <p>{{ p.desc }}</p>
        <div class="shop-bar">
          <div class="s-logo" :style="{ background: 'linear-gradient(135deg,' + s.colors[0] + ',' + s.colors[1] + ')' }">{{ s.name.charAt(0) }}</div>
          <div>
            <div class="s-name">{{ s.name }}</div>
            <div class="s-rate"><span v-html="starsHTML(s.rating)"></span> {{ s.rating.toFixed(1) }} · 已售{{ fmt(s.followers) }}+</div>
          </div>
          <router-link class="btn btn-ghost" :to="{ name: 'store', params: { id: s.id } }">进店逛逛</router-link>
        </div>
        <div class="p-actions">
          <button class="btn btn-ghost" @click="toggleProductFav()">{{ favOn ? '♥ 已收藏' : '♡ 收藏' }}</button>
          <button class="btn btn-primary" @click="openOrder()">立即购买</button>
        </div>
      </div>
    </div>

    <!-- 评分 + 评价 -->
    <div id="review-area">
      <div class="rating-panel">
        <div class="rating-summary">
          <div class="score">{{ eff.rating.toFixed(1) }}</div>
          <div class="rate-row" style="justify-content:center"><span v-html="starsHTML(eff.rating)"></span></div>
          <div class="desc">共 {{ fmt(eff.count) }} 人评价 · 用户真实反馈实时计入</div>
        </div>
        <div class="rating-bars">
          <div v-for="(n, i) in ratingDist" :key="i" class="rating-bar">
            <span class="lbl">{{ 5 - i }} 星</span>
            <div class="track"><div class="fill" :style="{ width: (distTot ? Math.round(n / distTot * 100) : 0) + '%' }"></div></div>
            <span class="pct">{{ distTot ? Math.round(n / distTot * 100) : 0 }}%</span>
          </div>
        </div>
      </div>

      <div class="tabs"><button class="active">药材评分</button></div>

      <div class="review-form">
        <h3>✍️ 为这味药材评分</h3>
        <div class="form-row">
          <label>药材品质评分</label>
          <div class="star-input">
            <button v-for="i in 5" :key="i" type="button" :class="{ on: i <= selectedScore }" @click="selectedScore = i">★</button>
          </div>
        </div>
        <div class="form-row">
          <label>评价内容（请分享真实的口感、气味、泡发状态）</label>
          <textarea v-model="rvContent" placeholder="这味药材是否道地？分量足吗？"></textarea>
        </div>
        <button class="btn btn-primary" :disabled="buying" @click="submitReview()">提交评价</button>
      </div>

      <div class="review-list">
        <template v-if="reviews.length">
          <div v-for="rv in reviews" :key="rv.id" class="review-item">
            <div class="rv-head">
              <div class="rv-user"><span class="rv-avatar">{{ (rv.nickname || '匿名用户').charAt(0) }}</span>{{ rv.nickname || '匿名用户' }}</div>
              <span class="rv-time">{{ formatReviewTime(rv.created_at) }}</span>
            </div>
            <div class="rv-dim"><span v-html="starsHTML(rv.score)"></span> · 来自 <b>{{ s.name }}</b></div>
            <p>{{ rv.content }}</p>
          </div>
        </template>
        <div v-else class="review-item" style="text-align:center;color:var(--ink-light)">还没有评价，来抢首评吧～</div>
      </div>
    </div>

    <!-- 订单确认弹窗 -->
    <div v-if="showOrder" class="modal-mask show" @click.self="closeOrder()">
      <div class="modal" style="max-width:440px;width:92%;text-align:left;padding:28px 30px">
        <h3 class="serif" style="text-align:center;margin-bottom:16px">确认订单</h3>
        <div class="order-line"><span class="k">药材</span><span>{{ p.name }}</span></div>
        <div class="order-line"><span class="k">店铺</span><span>{{ s.name }}</span></div>
        <div class="order-line">
          <span class="k">数量</span>
          <span class="qty-box">
            <button @click="changeQty(-1)">−</button>
            <input :value="qty" readonly>
            <button @click="changeQty(1)">＋</button>
          </span>
        </div>
        <div style="margin-top:10px">
          <div class="order-line" style="margin-bottom:4px"><span class="k">收货信息</span></div>
          <input v-model="receiverName" placeholder="收件人姓名" class="rv-input">
          <input v-model="receiverPhone" placeholder="手机号（用于物流联系）" class="rv-input">
          <input v-model="receiverAddress" placeholder="详细收货地址（省市区+街道门牌）" class="rv-input">
        </div>
        <div class="order-line total"><span class="k">应付合计</span><span class="v">¥{{ (p.price * qty).toFixed(2) }}</span></div>
        <div style="display:flex;gap:12px;margin-top:20px">
          <button class="btn btn-ghost" style="flex:1;justify-content:center" @click="closeOrder()">取消</button>
          <button class="btn btn-primary" style="flex:1;justify-content:center" :disabled="buying" @click="submitOrder()">{{ buying ? '提交中…' : '提交订单' }}</button>
        </div>
      </div>
    </div>

    <!-- 沙盒支付弹窗 -->
    <div v-if="showPay" class="modal-mask show" @click.self="payDone && closePay()">
      <div class="modal" style="max-width:400px;width:92%;text-align:left;padding:28px 30px">
        <h3 class="serif" style="text-align:center;margin-bottom:4px">沙盒支付</h3>
        <p style="text-align:center;color:var(--ink-light,#888);font-size:12px;margin-bottom:12px">模拟支付通道，不产生真实扣款</p>
        <template v-if="!payDone">
          <div class="order-line" style="font-size:13px"><span class="k">订单号</span><span>{{ payOrderNo }}</span></div>
          <div class="order-line total"><span class="k">应付金额</span><span class="v" style="color:var(--red,#c0392b)">¥{{ payTotal }}</span></div>
          <div style="margin:14px 0 8px;font-size:13px;font-weight:600">选择支付方式</div>
          <div style="display:flex;gap:10px">
            <button class="btn" :class="payChannel === 'wechat' ? 'btn-primary' : 'btn-ghost'"
                    style="flex:1;justify-content:center" @click="payChannel = 'wechat'">🟢 微信支付</button>
            <button class="btn" :class="payChannel === 'alipay' ? 'btn-primary' : 'btn-ghost'"
                    style="flex:1;justify-content:center" @click="payChannel = 'alipay'">🔵 支付宝</button>
          </div>
          <div style="display:flex;gap:12px;margin-top:20px">
            <button class="btn btn-ghost" style="flex:1;justify-content:center" :disabled="paying" @click="cancelOrder()">取消订单</button>
            <button class="btn btn-primary" style="flex:1;justify-content:center" :disabled="paying" @click="doPay()">{{ paying ? '支付中…' : '确认支付' }}</button>
          </div>
        </template>
        <div v-else style="text-align:center;padding:8px 0 2px">
          <div style="font-size:42px">✅</div>
          <p style="margin:8px 0 2px;font-weight:600">支付成功</p>
          <p style="font-size:12px;color:#888;margin-bottom:14px">订单号 {{ payOrderNo }}（{{ payChannel === 'wechat' ? '微信支付' : '支付宝' }}）</p>
          <div style="display:flex;gap:12px">
            <button class="btn btn-ghost" style="flex:1;justify-content:center" @click="goOrders()">我的订单</button>
            <button class="btn btn-primary" style="flex:1;justify-content:center" @click="goLogistics()">查看物流 ›</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rv-input {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 9px 11px;
  margin: 0 0 8px;
  border: 1px solid #e5e0d6;
  border-radius: 8px;
  font-size: 13px;
  outline: none;
}
.rv-input:focus { border-color: var(--red, #c0392b); }
</style>

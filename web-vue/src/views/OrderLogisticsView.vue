<script setup>
// 订单物流轨迹页：Leaflet + OpenStreetMap 真实地图
// 起点=店铺城市坐标，终点=收货地址(浏览器定位，失败用默认)；轨迹进度随订单状态变化
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { apiGet } from '../api'
import { isLoggedIn } from '../store/auth'
import { showToast } from '../ui'

const route = useRoute()
const router = useRouter()

const order = ref(null)
const loading = ref(true)
const error = ref('')
const locating = ref(false)
const destLabel = ref('')
const orderId = ref(String(route.params.id || ''))
const mapEl = ref(null)

let map = null
let line = null
let truckMarker = null
let startMarker = null
let endMarker = null
let animFrame = 0

// 常见店铺城市坐标（真实地图标注用）
const CITY_COORDS = {
  北京: [39.9042, 116.4074], 昆明: [24.8801, 102.8329], 杭州: [30.2741, 120.1551],
  长沙: [28.2282, 112.9388], 漳州: [24.5130, 117.6471], 聊城: [36.4567, 115.9807],
  南阳: [32.9907, 112.5283], 广州: [23.1291, 113.2644]
}
const DEFAULT_COORD = [31.2304, 121.4737] // 上海（定位失败兜底）

const fmtTime = (t) => (t ? String(t).substring(0, 16).replace('T', ' ') : '')

const STATUS_MAP = {
  pending_payment: { zh: '待付款', progress: 0, stepIdx: 0 },
  paid: { zh: '已付款 · 待发货', progress: 0, stepIdx: 1 },
  shipped: { zh: '运输中', progress: 0.55, stepIdx: 2 },
  completed: { zh: '已签收', progress: 1, stepIdx: 4 }
}

const statusInfo = computed(() => STATUS_MAP[order.value?.status] || { zh: order.value?.status || '', progress: 0, stepIdx: 0 })

// 时间线（时间基于下单时间模拟推算，仅供参考）
const steps = computed(() => {
  const created = order.value ? new Date(String(order.value.created_at).replace(' ', 'T')) : new Date()
  const at = (min) => {
    if (Number.isNaN(created.getTime())) return ''
    const d = new Date(created.getTime() + min * 60000)
    const p = (n) => String(n).padStart(2, '0')
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes())
  }
  const mins = [0, 30, 8 * 60, 40 * 60, 3 * 24 * 60]
  const names = [
    { t: '订单已提交', d: '订单创建成功' },
    { t: '已完成支付', d: '等待商家安排发货' },
    { t: '商家已揽收', d: '包裹已从产地店铺发出' },
    { t: '运输途中', d: '干线运输 / 即将抵达收货城市' },
    { t: '已签收', d: '包裹已送达，感谢惠顾' }
  ]
  const idx = statusInfo.value.stepIdx
  const labels = []
  names.forEach((n, i) => {
    labels.push({
      title: n.t, desc: n.d,
      done: i < idx || order.value?.status === 'completed',
      current: order.value?.status === 'shipped' && i === idx,
      time: i <= idx ? at(mins[i]) : ''
    })
  })
  return labels
})

const orderMeta = computed(() => {
  if (!order.value) return []
  const items = order.value.items || []
  return [
    { k: '订单号', v: order.value.order_no },
    { k: '店铺', v: order.value.store_name + '（' + (order.value.store_city || '') + '）' },
    { k: '收货地址', v: order.value.receiver_name + ' ' + (order.value.receiver_phone || '') + ' · ' + order.value.receiver_address },
    { k: '商品', v: items.length ? items.map((i) => i.name + ' ×' + i.quantity).join('、') : '—' },
    { k: '实付', v: '¥' + Number(order.value.total_amount).toFixed(2) }
  ]
})

// 起点坐标
function originCoord() {
  const city = order.value?.store_city
  const c = CITY_COORDS[String(city || '')]
  return c ? c.slice() : [...DEFAULT_COORD]
}

function samplePath(a, b, n = 48) {
  const [lat1, lng1] = a
  const [lat2, lng2] = b
  // 中间控制点略微外凸，形成自然弧线
  const midLat = (lat1 + lat2) / 2
  const midLng = (lng1 + lng2) / 2
  const dlng = lng2 - lng1
  const dlat = lat2 - lat1
  const len = Math.hypot(dlat, dlng)
  const bend = Math.min(2.5, Math.max(0.4, len * 0.12))
  const ctrl = [midLat + (-dlng / (len || 1)) * bend, midLng + (dlat / (len || 1)) * bend]
  const pts = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const u = 1 - t
    pts.push([
      u * u * lat1 + 2 * u * t * ctrl[0] + t * t * lat2,
      u * u * lng1 + 2 * u * t * ctrl[1] + t * t * lng2
    ])
  }
  return pts
}

function pointAt(pts, f) {
  const idx = Math.min(pts.length - 1, Math.max(0, Math.round(f * (pts.length - 1))))
  return pts[idx]
}

function iconHTML(html) {
  return L.divIcon({
    html, className: 'lg-icon', iconSize: [30, 30], iconAnchor: [15, 15]
  })
}

async function initMap(dest) {
  await nextTick()
  if (!mapEl.value || map) return
  map = L.map(mapEl.value, { zoomControl: true, attributionControl: false }).setView([31, 108], 5)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18
  }).addTo(map)

  const start = originCoord()
  startMarker = L.marker(start, { icon: iconHTML('<div class="lg-pin lg-start">🏪</div>') })
    .addTo(map)
    .bindPopup('<b>' + (order.value.store_name || '') + '</b><br>产地 · ' + (order.value.store_city || '未知'))

  endMarker = L.marker(dest, { icon: iconHTML('<div class="lg-pin lg-end">🏠</div>') })
    .addTo(map)
    .bindPopup('<b>收货地</b><br>' + destLabel.value)

  const pts = samplePath(start, dest)
  line = L.polyline(pts, { color: '#c0392b', weight: 4, opacity: 0.75, dashArray: null }).addTo(map)

  truckMarker = L.marker(start, { icon: iconHTML('<div class="lg-truck">🚚</div>') }).addTo(map)

  const bounds = L.latLngBounds([start, dest])
  map.fitBounds(bounds, { padding: [40, 40] })

  const progress = statusInfo.value.progress
  if (progress > 0) animateTo(progress)
}

function animateTo(target) {
  const pts = line.getLatLngs().length ? line.getLatLngs() : null
  if (!pts) return
  cancelAnimationFrame(animFrame)
  const from = statusInfo.value.progress
  const start = performance.now()
  const dur = 1600
  const tick = (now) => {
    const k = Math.min(1, (now - start) / dur)
    const f = Math.min(target, from + (target - from) * (1 - Math.pow(1 - k, 2)))
    const p = pointAt(pts, f)
    truckMarker.setLatLng(p)
    if (k < 1) animFrame = requestAnimationFrame(tick)
  }
  animFrame = requestAnimationFrame(tick)
}

function resolveDest() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { destLabel.value = '默认收货地（无法定位）'; resolve(DEFAULT_COORD); return }
    locating.value = true
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        locating.value = false
        destLabel.value = '我的当前位置'
        resolve([pos.coords.latitude, pos.coords.longitude])
      },
      () => {
        locating.value = false
        destLabel.value = '默认收货地（定位被拒绝）'
        resolve(DEFAULT_COORD)
      },
      { timeout: 8000, maximumAge: 60000 }
    )
  })
}

onMounted(async () => {
  if (!isLoggedIn()) {
    router.replace({ name: 'auth', query: { redirect: route.fullPath } })
    return
  }
  try {
    const r = await apiGet('/orders/' + orderId.value)
    order.value = r.data
    loading.value = false
    const dest = await resolveDest()
    await initMap(dest)
  } catch (e) {
    loading.value = false
    error.value = e.message || '订单加载失败'
    showToast(error.value)
  }
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animFrame)
  if (map) { map.remove(); map = null }
})

function backToOrders() { router.push('/profile') }
</script>

<template>
  <div class="container" style="padding:18px 16px 60px">
    <div class="breadcrumb">
      <router-link to="/">首页</router-link><span class="sep">/</span>
      <router-link to="/profile">个人中心</router-link><span class="sep">/</span><span>订单物流</span>
    </div>

    <div v-if="loading" class="empty">加载中…</div>

    <div v-else-if="error" class="empty">
      物流信息加载失败：{{ error }}
      <div style="margin-top:16px"><button class="btn btn-ghost" @click="backToOrders()">返回我的订单</button></div>
    </div>

    <template v-else-if="order">
      <div class="lg-card">
        <div class="lg-head">
          <div>
            <h1 class="serif">订单物流</h1>
            <div class="lg-no">订单号 {{ order.order_no }}</div>
          </div>
          <span class="pill lg-status">{{ statusInfo.zh }}</span>
        </div>
        <div v-for="m in orderMeta" :key="m.k" class="lg-row">
          <span class="lg-k">{{ m.k }}</span>
          <span class="lg-v">{{ m.v }}</span>
        </div>
      </div>

      <div v-if="statusInfo.stepIdx < 1" class="lg-tip">📌 该订单尚未支付/发货，付款后商家发货即可查看实时物流轨迹。</div>
      <div v-else-if="locating" class="lg-tip">📍 正在定位你的当前位置…（若未授权将使用默认收货地）</div>
      <div v-else class="lg-tip">📍 {{ destLabel }} —— 轨迹从「{{ order.store_name }}（{{ order.store_city }}）」发出，随包裹位置实时移动。</div>

      <div class="lg-map-box">
        <div ref="mapEl" class="lg-map"></div>
      </div>

      <div class="lg-card">
        <h3 class="serif">物流状态</h3>
        <div class="lg-steps">
          <div v-for="(s, i) in steps" :key="i" class="lg-step" :class="{ done: s.done, current: s.current }">
            <div class="lg-dot">{{ s.done ? '✓' : i + 1 }}</div>
            <div class="lg-step-main">
              <b>{{ s.title }}</b>
              <span class="lg-step-desc">{{ s.desc }}</span>
            </div>
            <span v-if="s.time" class="lg-step-time">{{ s.time }}</span>
          </div>
        </div>
      </div>

      <div style="text-align:center;margin-top:18px">
        <button class="btn btn-ghost" @click="backToOrders()">返回我的订单</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.lg-card { background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 18px 20px; margin-bottom: 16px; }
.lg-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.lg-no { color: var(--ink-light); font-size: 12px; margin-top: 4px; }
.lg-status { background: rgba(140,31,40,.08); color: var(--red); }
.lg-row { display: flex; gap: 14px; padding: 7px 0; font-size: 13px; border-bottom: 1px dashed var(--line); }
.lg-row:last-child { border-bottom: none; }
.lg-k { color: var(--ink-light); width: 64px; flex-shrink: 0; }
.lg-v { color: var(--ink); word-break: break-all; }
.lg-tip { font-size: 13px; color: var(--ink-light); padding: 0 2px 10px; }
.lg-map-box { border-radius: 14px; overflow: hidden; border: 1px solid var(--line); margin-bottom: 16px; box-shadow: var(--shadow); }
.lg-map { height: 380px; width: 100%; background: #eef0ea; }
.lg-steps { margin-top: 8px; }
.lg-step { display: flex; gap: 12px; align-items: flex-start; position: relative; padding: 0 0 20px 0; }
.lg-step:not(:last-child)::before { content: ''; position: absolute; left: 15px; top: 30px; bottom: -2px; width: 2px; background: var(--line); }
.lg-step.done:not(:last-child)::before { background: var(--red); opacity: .35; }
.lg-dot { width: 32px; height: 32px; border-radius: 50%; background: var(--paper-dark); color: var(--ink-light); display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; position: relative; z-index: 1; }
.lg-step.done .lg-dot { background: var(--red); color: #fff; }
.lg-step.current .lg-dot { background: var(--gold); color: #fff; animation: lgPulse 1.4s infinite; }
.lg-step-main { flex: 1; padding-top: 5px; }
.lg-step-main b { font-size: 14px; display: block; }
.lg-step.done .lg-step-main b { color: var(--ink); }
.lg-step-current .lg-step-main b { color: var(--red); }
.lg-step-desc { font-size: 12px; color: var(--ink-light); }
.lg-step-time { font-size: 12px; color: var(--ink-light); padding-top: 6px; flex-shrink: 0; }
@keyframes lgPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(201,160,99,.4); } 50% { box-shadow: 0 0 0 6px rgba(201,160,99,0); } }
@media (max-width: 560px) { .lg-map { height: 300px; } }
</style>

<style>
/* Leaflet 标记（非 scoped，作用于地图内部 DOM） */
.lg-icon { background: transparent; border: none; }
.lg-pin { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 16px; background: #fff; border: 2px solid var(--red, #c0392b); box-shadow: 0 2px 6px rgba(0,0,0,.2); }
.lg-end { border-color: #2e6e5e; }
.lg-truck { font-size: 22px; filter: drop-shadow(0 2px 3px rgba(0,0,0,.3)); }
.leaflet-popup-content { font-size: 12px; }
</style>

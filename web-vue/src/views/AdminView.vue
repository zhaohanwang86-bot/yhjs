<script setup>
// 管理后台（由旧 admin.html 1:1 移植）
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet, apiPost, apiPut } from '../api'
import { isLoggedIn, setUser, clearSession } from '../store/auth'
import { showToast } from '../ui'

const router = useRouter()
const me = ref(null)
const stats = ref(null)
const applications = ref([])
const contentList = ref([])
const contentType = ref('post')
const conversations = ref([])
const activeConvId = ref(null)
const flowMsgs = ref([])
const auditRows = ref([])
const tab = ref('overview')
const loading = ref(true)

function fmtTime(t) {
  if (!t) return ''
  return String(t).substring(0, 16).replace('T', ' ')
}
function pill(status) {
  const map = {
    pending: { cls: 'gold', txt: '待审核' }, approved: { cls: 'green', txt: '已通过' },
    rejected: { cls: 'red', txt: '已驳回' }, visible: { cls: 'green', txt: '显示' },
    hidden: { cls: 'gray', txt: '已隐藏' }, suspended: { cls: 'red', txt: '已停用' }
  }
  const m = map[status]
  return m ? { cls: m.cls, txt: m.txt } : { cls: 'gray', txt: status }
}

const pendingApps = computed(() => (stats.value ? Number(stats.value.pendingApplications) || 0 : 0))

onMounted(async () => {
  if (!isLoggedIn()) { router.replace({ name: 'auth', query: { redirect: '/admin' } }); return }
  try {
    const r = await apiGet('/auth/me')
    me.value = r.data
    if (me.value.role !== 'admin') {
      showToast('当前账号不是管理员')
      router.replace('/profile')
      return
    }
    setUser(r.data)
    loading.value = false
    showTab('overview')
  } catch (e) {
    clearSession()
    router.replace({ name: 'auth', query: { redirect: '/admin' } })
  }
})

function showTab(name) {
  tab.value = name
  if (name === 'overview') loadOverview()
  else if (name === 'applications') loadApplications()
  else if (name === 'contents') loadContents()
  else if (name === 'flow') loadFlow()
  else if (name === 'audit') loadAudit()
}

// ---------------- 平台概览 ----------------
async function loadOverview() {
  try {
    const r = await apiGet('/admin/stats')
    stats.value = r.data
  } catch (e) { showToast(e.message) }
}

// ---------------- 资质审核 ----------------
async function loadApplications() {
  try {
    const r = await apiGet('/admin/merchant-applications')
    applications.value = r.data || []
  } catch (e) { showToast(e.message) }
}
async function reviewApp(id, status) {
  let note = ''
  if (status === 'rejected') {
    note = prompt('请输入驳回原因（可选）') || ''
  }
  try {
    await apiPut('/admin/merchant-applications/' + id + '/review', { status, note })
    showToast(status === 'approved' ? '已通过该商家' : '已驳回该申请')
    await loadApplications()
    const r = await apiGet('/admin/stats')
    stats.value = r.data
  } catch (e) { showToast(e.message) }
}

// ---------------- 内容审核 ----------------
async function loadContents() {
  try {
    const r = await apiGet('/admin/contents', { type: contentType.value })
    contentList.value = r.data || []
  } catch (e) { showToast(e.message) }
}
function switchContentType(type) {
  contentType.value = type
  loadContents()
}
async function setContentStatus(type, id, status) {
  try {
    await apiPut('/admin/contents/' + type + '/' + id + '/status', { status })
    showToast('已更新内容状态')
    await loadContents()
  } catch (e) { showToast(e.message) }
}
function contentExtra(c) {
  if (contentType.value === 'post') return c.title || ''
  if (contentType.value === 'comment') return '帖子：' + (c.post_title || '')
  return ''
}

// ---------------- 信息流动监测 ----------------
async function loadFlow() {
  try {
    const r = await apiGet('/admin/conversations')
    conversations.value = r.data || []
    flowMsgs.value = []
  } catch (e) { showToast(e.message) }
}
async function viewConversation(id) {
  activeConvId.value = id
  try {
    const r = await apiGet('/admin/conversations/' + id + '/messages')
    flowMsgs.value = r.data || []
  } catch (e) { showToast(e.message) }
}

// ---------------- 审计日志 ----------------
async function loadAudit() {
  try {
    const r = await apiGet('/admin/audit-logs')
    auditRows.value = r.data || []
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
      <router-link to="/">首页</router-link><span class="sep">/</span><span>管理后台</span>
    </div>

    <div v-if="loading" style="text-align:center;padding:60px 0;color:var(--ink-light)">加载中…</div>

    <div v-else class="workbench">
      <aside class="workbench-side">
        <div class="wb-brand">
          <div class="wb-avatar">{{ (me.nickname || '管').charAt(0) }}</div>
          <div><div class="wb-name">{{ me.nickname }}</div><div class="wb-role">平台管理后台</div></div>
        </div>
        <nav class="wb-nav">
          <button :class="{ on: tab === 'overview' }" @click="showTab('overview')">平台概览</button>
          <button :class="{ on: tab === 'applications' }" @click="showTab('applications')">资质审核<span v-if="pendingApps" class="badge-dot">{{ pendingApps }}</span></button>
          <button :class="{ on: tab === 'contents' }" @click="showTab('contents')">内容审核</button>
          <button :class="{ on: tab === 'flow' }" @click="showTab('flow')">信息监测</button>
          <button :class="{ on: tab === 'audit' }" @click="showTab('audit')">审计日志</button>
          <button @click="router.push('/')">返回商城</button>
          <button @click="logout()">退出登录</button>
        </nav>
      </aside>

      <main class="wb-main">
        <!-- 平台概览 -->
        <template v-if="tab === 'overview'">
          <div v-if="stats" class="wb-card">
            <h1 class="serif">平台概览</h1><div class="wb-sub">炎黄济世平台整体运行情况。</div>
            <div class="stat-grid">
              <div class="stat-card"><div class="num">{{ stats.users }}</div><div class="label">普通用户</div></div>
              <div class="stat-card jade"><div class="num">{{ stats.merchants }}</div><div class="label">商家账号</div></div>
              <div class="stat-card gold"><div class="num">{{ stats.stores }}</div><div class="label">入驻店铺</div></div>
              <div class="stat-card"><div class="num">{{ stats.products }}</div><div class="label">在售商品</div></div>
            </div>
            <div class="stat-grid">
              <div class="stat-card"><div class="num">{{ stats.orders }}</div><div class="label">订单总数</div></div>
              <div class="stat-card jade"><div class="num">{{ stats.posts }}</div><div class="label">社区帖子</div></div>
              <div class="stat-card gold"><div class="num">{{ stats.comments }}</div><div class="label">帖子评论</div></div>
              <div class="stat-card"><div class="num">{{ stats.reviews }}</div><div class="label">商品/店铺评价</div></div>
            </div>
            <div class="stat-grid">
              <div class="stat-card" style="border-color:var(--gold)"><div class="num">{{ stats.pendingApplications }}</div><div class="label">待审核资质申请</div></div>
            </div>
          </div>
        </template>

        <!-- 资质审核 -->
        <template v-else-if="tab === 'applications'">
          <div class="wb-card">
            <h1 class="serif">商家资质审核</h1><div class="wb-sub">审核通过后，申请账号将自动切换为商家角色。</div>
            <div style="overflow-x:auto">
              <table class="wb-table">
                <thead><tr><th>ID</th><th>店铺信息</th><th>申请人</th><th>城市</th><th>证照号</th><th>状态</th><th>申请时间</th><th>操作</th></tr></thead>
                <tbody>
                  <tr v-if="!applications.length"><td colspan="8" style="text-align:center;color:var(--ink-light)">暂无入驻申请。</td></tr>
                  <tr v-for="a in applications" :key="a.id">
                    <td>{{ a.id }}</td>
                    <td><b>{{ a.store_name }}</b><br><span style="color:var(--ink-light);font-size:11px">{{ a.store_type }} · {{ a.main_category || '' }}</span></td>
                    <td>{{ a.applicant_nickname || '' }}<br><span style="color:var(--ink-light);font-size:11px">{{ a.applicant_phone || '' }}</span></td>
                    <td>{{ a.city }}</td>
                    <td>{{ a.license_no || '—' }}</td>
                    <td><span class="pill" :class="pill(a.status).cls">{{ pill(a.status).txt }}</span></td>
                    <td>{{ fmtTime(a.created_at) }}</td>
                    <td>
                      <template v-if="a.status === 'pending'">
                        <button class="mini-btn primary" @click="reviewApp(a.id, 'approved')">通过</button>
                        <button class="mini-btn danger" @click="reviewApp(a.id, 'rejected')">驳回</button>
                      </template>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

        <!-- 内容审核 -->
        <template v-else-if="tab === 'contents'">
          <div class="wb-card">
            <h1 class="serif">内容审核</h1><div class="wb-sub">监测社区帖子、评论与评价，违规内容可隐藏处理。</div>
            <div style="margin-bottom:14px">
              <button class="mini-btn" :class="contentType === 'post' ? 'primary' : ''" @click="switchContentType('post')">帖子</button>
              <button class="mini-btn" :class="contentType === 'comment' ? 'primary' : ''" @click="switchContentType('comment')">评论</button>
              <button class="mini-btn" :class="contentType === 'review' ? 'primary' : ''" @click="switchContentType('review')">评价</button>
            </div>
            <div style="overflow-x:auto">
              <table class="wb-table">
                <thead><tr><th>ID</th><th>作者</th><th>内容</th><th>状态</th><th>时间</th><th>操作</th></tr></thead>
                <tbody>
                  <tr v-if="!contentList.length"><td colspan="6" style="text-align:center;color:var(--ink-light)">暂无内容。</td></tr>
                  <tr v-for="c in contentList" :key="c.id">
                    <td>{{ c.id }}</td>
                    <td>{{ c.nickname || '匿名用户' }}</td>
                    <td style="max-width:320px">
                      {{ c.content || c.title || '' }}<br>
                      <span v-if="contentType === 'review'" style="color:var(--gold);font-size:12px">★ {{ c.score }}</span>
                      <span v-else style="color:var(--ink-light);font-size:11px">{{ contentExtra(c) }}</span>
                    </td>
                    <td><span class="pill" :class="pill(c.status).cls">{{ pill(c.status).txt }}</span></td>
                    <td>{{ fmtTime(c.created_at) }}</td>
                    <td>
                      <button class="mini-btn" @click="setContentStatus(contentType, c.id, 'hidden')">隐藏</button>
                      <button class="mini-btn primary" @click="setContentStatus(contentType, c.id, 'visible')">显示</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

        <!-- 信息流动监测 -->
        <template v-else-if="tab === 'flow'">
          <div v-if="!conversations.length" class="wb-card">
            <h1 class="serif">信息流动监测</h1><div class="wb-sub">暂无用户与商家之间的会话记录。</div>
          </div>
          <div v-else class="wb-card" style="padding:14px">
            <h1 class="serif" style="padding:12px 8px 0">信息流动监测</h1>
            <div class="wb-sub" style="padding:4px 8px 12px">查看用户与商家之间的沟通记录。</div>
            <div class="chat-layout">
              <div class="chat-list">
                <div v-for="c in conversations" :key="c.id" class="chat-list-item" :class="{ on: c.id === activeConvId }" @click="viewConversation(c.id)">
                  <div class="c-ava">{{ (c.user_nickname || '用').charAt(0) }}</div>
                  <div class="c-main">
                    <div class="c-name">{{ c.user_nickname }} → {{ c.store_name }}</div>
                    <div class="c-preview">{{ c.last_message || '' }}</div>
                  </div>
                </div>
              </div>
              <div class="chat-thread">
                <template v-if="activeConvId">
                  <div class="chat-head">消息记录（只读）</div>
                  <div class="chat-msgs">
                    <template v-if="flowMsgs.length">
                      <div v-for="(m, i) in flowMsgs" :key="i" class="chat-msg other">
                        <div class="bubble">{{ m.content }}</div>
                        <div class="m-time">{{ m.sender_nickname || '匿名用户' }} · {{ fmtTime(m.created_at) }}</div>
                      </div>
                    </template>
                    <div v-else class="wb-sub">暂无消息</div>
                  </div>
                </template>
                <div v-else class="chat-head">选择会话查看消息记录</div>
              </div>
            </div>
          </div>
        </template>

        <!-- 审计日志 -->
        <template v-else>
          <div class="wb-card">
            <h1 class="serif">审计日志</h1><div class="wb-sub">平台关键操作留痕记录。</div>
            <div style="overflow-x:auto">
              <table class="wb-table">
                <thead><tr><th>ID</th><th>操作者</th><th>动作</th><th>资源类型</th><th>资源ID</th><th>IP</th><th>时间</th></tr></thead>
                <tbody>
                  <tr v-if="!auditRows.length"><td colspan="7" style="text-align:center;color:var(--ink-light)">暂无审计日志。</td></tr>
                  <tr v-for="a in auditRows" :key="a.id">
                    <td>{{ a.id }}</td><td>{{ a.nickname || '' }}</td><td>{{ a.action || '' }}</td>
                    <td>{{ a.resource_type || '' }}</td><td>{{ a.resource_id || '' }}</td><td>{{ a.ip_address || '' }}</td>
                    <td>{{ fmtTime(a.created_at) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
      </main>
    </div>
  </div>
</template>

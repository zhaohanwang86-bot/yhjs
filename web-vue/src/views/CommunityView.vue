<script setup>
// 养生社区（由旧 community.html 1:1 移植）
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet, apiPost } from '../api'
import { isLoggedIn } from '../store/auth'
import { showToast } from '../ui'

const router = useRouter()
const posts = ref([])
const loading = ref(true)

const title = ref('')
const content = ref('')
const tag = ref('养生讨论')
const TAGS = ['养生讨论', '选购求助', '药材知识', '科普分享', '平台共建']

const openMap = reactive({})       // postId -> true 展开
const commentsMap = reactive({})   // postId -> comments
const commentText = reactive({})   // postId -> input text
const likedSet = reactive({})

function fmtTime(t) {
  if (!t) return ''
  return String(t).substring(0, 16).replace('T', ' ')
}

function requireLogin() {
  if (!isLoggedIn()) {
    showToast('请先登录')
    router.push({ name: 'auth', query: { redirect: '/community' } })
    return false
  }
  return true
}

function seedPosts() {
  return [
    { id: 'p001', nickname: '本草研习者', tag: '药材知识', created_at: '2026-08-10 09:30', title: '如何简单辨别优质黄芪', content: '挑选黄芪看断面，断面黄白色、粉性足为佳。不要选择颜色过于雪白的，可能经过硫磺熏制。日常泡水少量即可。', like_count: 26, comment_count: 1 },
    { id: 'p002', nickname: '山野采药人', tag: '选购求助', created_at: '2026-08-12 14:00', title: '网上购买药材如何避坑？', content: '优先选择平台入驻店铺，查看产地证书与质检信息。不要轻信低价神效药材，理性看待偏方。', like_count: 18, comment_count: 0 }
  ]
}

async function load() {
  loading.value = true
  try {
    const r = await apiGet('/posts')
    posts.value = r.data || []
  } catch (e) {
    posts.value = seedPosts()
  } finally {
    loading.value = false
  }
}

const totals = computed(() => {
  const all = posts.value
  return {
    likes: all.reduce((a, x) => a + (Number(x.like_count) || 0), 0),
    comments: all.reduce((a, x) => a + (Number(x.comment_count) || 0), 0)
  }
})

function toggleComments(id) {
  if (openMap[id]) {
    openMap[id] = false
    return
  }
  openMap[id] = true
  commentsMap[id] = null
  loadComments(id)
}

async function loadComments(id) {
  commentsMap[id] = null
  try {
    const r = await apiGet('/posts/' + id + '/comments')
    commentsMap[id] = r.data || []
  } catch (e) {
    commentsMap[id] = []
  }
}

async function addComment(id) {
  if (!requireLogin()) return
  const text = (commentText[id] || '').trim()
  if (!text) { showToast('请输入评论内容'); return }
  try {
    await apiPost('/posts/' + id + '/comments', { content: text })
    commentText[id] = ''
    showToast('评论成功')
    await loadComments(id)
    const p = posts.value.find((x) => x.id === id)
    if (p) p.comment_count = (Number(p.comment_count) || 0) + 1
  } catch (e) {
    showToast(e.message || '评论失败')
  }
}

async function toggleLike(id) {
  if (!requireLogin()) return
  const p = posts.value.find((x) => x.id === id)
  if (!p) return
  try {
    const r = await apiPost('/posts/' + id + '/like', {})
    const liked = r.data && r.data.liked
    likedSet[id] = !!liked
    p.like_count = Math.max(0, (Number(p.like_count) || 0) + (liked ? 1 : -1))
  } catch (e) {
    showToast(e.message || '操作失败')
  }
}

async function publishPost() {
  if (!requireLogin()) return
  if (!title.value.trim() || !content.value.trim()) { showToast('请填写标题和内容'); return }
  try {
    await apiPost('/posts', { title: title.value, content: content.value, tag: tag.value })
    showToast('发布成功！')
    title.value = ''
    content.value = ''
    await load()
  } catch (e) {
    showToast(e.message || '发布失败')
  }
}

async function sharePost(post) {
  const url = location.href
  const text = '来自炎黄济世养生社区的帖子：' + post.title
  if (navigator.share) {
    navigator.share({ title: post.title, text, url }).catch(() => {})
  } else if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => showToast('链接已复制，快去分享给朋友吧')).catch(() => showToast(url))
  } else {
    showToast(url)
  }
}

load()
</script>

<template>
  <div class="container">
    <div class="breadcrumb">
      <router-link to="/">首页</router-link><span class="sep">/</span><span>养生社区</span>
    </div>

    <div class="section-head">
      <h2 class="section-title">养生社区 <span class="sub">识药 · 问药 · 共养</span></h2>
      <a class="section-more" href="javascript:void(0)" @click="showToast('社区规则：文明交流，拒绝虚假宣传')">社区公约</a>
    </div>

    <div class="community-layout">
      <!-- 侧边栏 -->
      <aside class="community-side">
        <div class="side-card">
          <h3>社区数据</h3>
          <div class="side-item"><span class="k">主题帖</span><span class="v">{{ posts.length }} 篇</span></div>
          <div class="side-item"><span class="k">累计获赞</span><span class="v">{{ totals.likes }} 个</span></div>
          <div class="side-item"><span class="k">累计评论</span><span class="v">{{ totals.comments }} 条</span></div>
        </div>
        <div class="side-card">
          <h3>社区公约</h3>
          <p style="font-size:12px;color:var(--ink-light);line-height:1.8">本社区仅供养生知识交流，不构成医疗建议。涉及病症请及时就医，勿轻信偏方。<br><br>💊 平台倡导：理性养生 · 科学用药</p>
        </div>
        <router-link class="btn btn-primary" style="width:100%;justify-content:center" to="/join">邀请药铺入驻 →</router-link>
      </aside>

      <!-- 主列表 -->
      <div>
        <div class="post-form">
          <h3>✍️ 发起讨论</h3>
          <div class="form-row"><div class="form-flex">
            <input v-model="title" type="text" placeholder="标题：一句话说清问题">
            <select v-model="tag">
              <option v-for="t in TAGS" :key="t" :value="t">{{ t }}</option>
            </select>
          </div></div>
          <div class="form-row"><textarea v-model="content" placeholder="详细说说你的问题或经验分享……"></textarea></div>
          <button class="btn btn-primary" @click="publishPost()">发布到社区</button>
        </div>

        <div v-if="loading" style="text-align:center;padding:50px 0;color:var(--ink-light)">加载中…</div>
        <div v-else-if="!posts.length" style="text-align:center;padding:50px 0;color:var(--ink-light)">还没有帖子，来发布第一条讨论吧～</div>

        <div v-else id="post-list">
          <div v-for="post in posts" :key="post.id" class="post-card" :class="{ open: openMap[post.id] }">
            <div class="p-head">
              <div class="p-author"><span class="p-avatar">{{ (post.nickname || '匿').charAt(0) }}</span> {{ post.nickname || '匿名用户' }}</div>
              <span class="p-tag">{{ post.tag || '养生' }}</span>
              <span class="p-time">{{ fmtTime(post.created_at) }}</span>
            </div>
            <h3>{{ post.title }}</h3>
            <div class="p-content">{{ post.content }}</div>
            <div class="p-foot">
              <button :class="{ liked: likedSet[post.id] }" @click="toggleLike(post.id)">👍 {{ post.like_count || 0 }}</button>
              <button @click="toggleComments(post.id)">💬 <span class="cmt-count">{{ post.comment_count || 0 }}</span> 评论</button>
              <button @click="sharePost(post)">↗ 分享</button>
            </div>
            <div v-if="openMap[post.id]" class="comments">
              <div class="comment-list">
                <template v-if="commentsMap[post.id] === null">
                  <span class="c-time">加载中…</span>
                </template>
                <template v-else-if="commentsMap[post.id] && commentsMap[post.id].length">
                  <div v-for="(c, i) in commentsMap[post.id]" :key="i" class="comment-item">
                    <span class="c-avatar">{{ (c.nickname || '匿').charAt(0) }}</span>
                    <div><span class="c-name">{{ c.nickname || '匿名用户' }}</span> {{ c.content || '' }} <span class="c-time">{{ fmtTime(c.created_at) }}</span></div>
                  </div>
                </template>
                <span v-else class="c-time">还没有评论，来抢首评吧～</span>
              </div>
              <div class="comment-input">
                <input v-model="commentText[post.id]" :placeholder="'说点什么…'" @keyup.enter="addComment(post.id)">
                <button @click="addComment(post.id)">发表</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// AI 养生助手悬浮窗（由旧 js/main.js aiWidget 1:1 移植，后端 /api/ai/chat）
import { nextTick, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiPost, isLoggedIn } from '../api'
import { showToast } from '../ui'

const router = useRouter()
const QUICK = ['🌿 枸杞怎么吃最好', '🍲 有什么祛湿食疗推荐', '🏪 如何入驻成为商家', '📄 平台都卖哪些药材']

const panelOpen = ref(false)
const inited = ref(false)
const sending = ref(false)
const input = ref('')
const history = reactive([])
const bodyEl = ref(null)

async function send() {
  if (!isLoggedIn()) {
    showToast('请先登录后使用 AI 助手')
    router.push('/auth')
    return
  }
  const text = input.value.trim()
  if (!text || sending.value) return
  input.value = ''
  append('me', text)
  sending.value = true
  try {
    const r = await apiPost('/ai/chat', { messages: history.slice(-12).map((m) => ({ role: m.role, content: m.text })) })
    append('bot', (r.data && r.data.reply) || '（未收到回复，请重试）')
  } catch (e) {
    append('bot', '抱歉，我暂时开小差了：' + ((e && e.message) || '网络异常'))
  } finally {
    sending.value = false
  }
}

function quick(q) {
  input.value = q
  send()
}

function append(role, text) {
  history.push({ role: role === 'me' ? 'user' : 'assistant', text })
  if (history.length > 25) history.shift()
  nextTick(() => { if (bodyEl.value) bodyEl.value.scrollTop = bodyEl.value.scrollHeight })
}

function toggle() {
  panelOpen.value = !panelOpen.value
  if (panelOpen.value && !inited.value) {
    inited.value = true
    append('bot', '你好呀，我是「炎黄济世」的 AI 养生顾问「济世小郎中」🌿\n可以问我：中药材与食疗养生、体质调理、平台选购与下单、商家入驻等。（建议仅供参考，不能替代医生诊断哦）')
  }
}

// Markdown → 预览（先转义防 XSS，再解析常用语法）
function md(text) {
  const esc = String(text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
  const inline = (s) => s
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  let html = ''
  let listType = null
  const closeList = () => { if (listType) { html += '</' + listType + '>'; listType = null } }
  esc.split('\n').forEach((raw) => {
    const line = raw.replace(/\s+$/, '')
    const t = line.trim()
    if (!t) { closeList(); html += '<p></p>'; return }
    const ul = t.match(/^[-*•]\s+(.*)$/)
    const ol = t.match(/^\d+[.)]\s+(.*)$/)
    if (ul || ol) {
      const type = ul ? 'ul' : 'ol'
      if (listType !== type) { closeList(); html += '<' + type + '>'; listType = type }
      html += '<li>' + inline(ul ? ul[1] : ol[1]) + '</li>'
      return
    }
    closeList()
    if (/^#{1,3}\s/.test(t)) {
      const lvl = Math.min(t.match(/^#+/)[0].length, 3)
      html += '<h' + lvl + '>' + inline(t.replace(/^#+\s+/, '')) + '</h' + lvl + '>'
    } else {
      html += '<p>' + inline(t) + '</p>'
    }
  })
  closeList()
  return html
}
</script>

<template>
  <div>
    <div class="ai-fab" @click="toggle">🤖 AI 养生助手</div>

    <div v-show="panelOpen" class="ai-panel">
      <div class="ai-head">
        <span>🌿 济世小郎中 · AI 顾问</span>
        <span class="ai-close" @click="toggle">×</span>
      </div>
      <div ref="bodyEl" class="ai-body">
        <div v-for="(m, i) in history" :key="i" class="ai-msg" :class="m.role === 'user' ? 'me' : 'bot'">
          <div v-if="m.role === 'user'" class="ai-b">{{ m.text }}</div>
          <div v-else class="ai-b ai-md" v-html="md(m.text)"></div>
        </div>
      </div>
      <div class="ai-quick">
        <span v-for="q in QUICK" :key="q" class="ai-q" @click="quick(q)">{{ q }}</span>
      </div>
      <div class="ai-input">
        <input v-model="input" placeholder="问养生、问药材、问平台…" @keyup.enter="send" />
        <button class="ai-send" :disabled="sending" @click="send">{{ sending ? '思考中…' : '发送' }}</button>
      </div>
    </div>
  </div>
</template>

<style>
/* 与旧网页内联 AI 样式完全一致 */
.ai-fab { position: fixed; right: 22px; bottom: 26px; z-index: 9990; display: flex; align-items: center; gap: 6px;
  background: linear-gradient(135deg, #8c1f28, #6e141c); color: #fff; font-size: 14px; padding: 12px 18px;
  border-radius: 999px; cursor: pointer; box-shadow: 0 6px 18px rgba(108, 20, 28, .35); user-select: none; }
.ai-fab:hover { transform: translateY(-2px); }
.ai-panel { position: fixed; right: 22px; bottom: 88px; z-index: 9995; width: 360px; max-width: calc(100vw - 40px);
  background: #fff; border-radius: 16px; box-shadow: 0 12px 40px rgba(0, 0, 0, .18); display: flex; flex-direction: column;
  overflow: hidden; font-size: 14px; line-height: 1.6; color: #1d2129; }
.ai-head { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px;
  background: linear-gradient(135deg, #8c1f28, #6e141c); color: #fff; }
.ai-close { cursor: pointer; font-size: 20px; line-height: 1; opacity: .85; }
.ai-body { height: 320px; overflow-y: auto; padding: 12px 14px; background: #f7f5f0; }
.ai-msg { margin: 8px 0; display: flex; }
.ai-msg.me { justify-content: flex-end; }
.ai-b { max-width: 82%; padding: 9px 13px; border-radius: 12px; white-space: normal; word-break: break-word; }
.ai-b.ai-md { white-space: normal; }
.ai-b.ai-md p { margin: 4px 0; }
.ai-b.ai-md h1, .ai-b.ai-md h2, .ai-b.ai-md h3 { font-size: 14px; font-weight: 700; margin: 8px 0 4px; }
.ai-b.ai-md ul, .ai-b.ai-md ol { margin: 4px 0 4px 18px; padding: 0; }
.ai-b.ai-md li { margin: 2px 0; }
.ai-b.ai-md code { background: #f0ece6; border-radius: 4px; padding: 1px 5px; font-size: 12px; }
.ai-b.ai-md strong { font-weight: 700; }
.ai-msg.bot .ai-b { background: #fff; border: 1px solid #ece7e0; border-bottom-left-radius: 3px; }
.ai-msg.me .ai-b { background: #8c1f28; color: #fff; border-bottom-right-radius: 3px; }
.ai-quick { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 14px 8px; background: #f7f5f0; }
.ai-q { font-size: 12px; color: #4e5969; border: 1px solid #e4ddd4; background: #fff; border-radius: 999px;
  padding: 5px 12px; cursor: pointer; }
.ai-input { display: flex; gap: 8px; padding: 10px 12px; border-top: 1px solid #f0ece6; }
.ai-input input { flex: 1; border: 1px solid #e4ddd4; border-radius: 999px; padding: 9px 14px; font-size: 14px; outline: none; }
.ai-send { border: 0; border-radius: 999px; background: #8c1f28; color: #fff; padding: 0 18px; cursor: pointer; font-size: 14px; }
.ai-send:disabled { opacity: .6; cursor: not-allowed; }
</style>

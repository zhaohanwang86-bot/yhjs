import React, { useRef, useState } from 'react'
import { View, Text, ScrollView, Input } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { apiPost } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import styles from './index.module.scss'

interface Msg {
  role: 'user' | 'assistant'
  content: string
}

const QUICK = ['🌿 枸杞怎么吃最好', '🍲 有什么祛湿食疗推荐', '🏪 如何入驻成为商家', '📦 怎么查询我的订单']

const WELCOME =
  '你好呀，我是「炎黄济世」的 AI 养生顾问「济世小郎中」🌿\n' +
  '可以问我：中药材与食疗养生、体质调理、平台选购与下单、商家入驻等。\n' +
  '（养生建议仅供参考，不能替代医生诊断哦）'

// ---------- 轻量 Markdown → 预览格式（与 Web 端一致，不显示原始符号） ----------
type BlockType = 'p' | 'h1' | 'h2' | 'h3' | 'ul' | 'ol' | 'code'

interface Block {
  type: BlockType
  text?: string
  items?: string[]
}

function parseBlocks(raw: string): Block[] {
  const lines = String(raw || '').replace(/\r/g, '').split('\n')
  const blocks: Block[] = []
  let list: { type: 'ul' | 'ol'; items: string[] } | null = null
  let codeBuf: string[] | null = null
  const flushList = () => {
    if (list) {
      blocks.push({ type: list.type, items: list.items })
      list = null
    }
  }
  lines.forEach((line) => {
    const t = line.trim()
    // 代码块围栏
    if (t.startsWith('```')) {
      if (codeBuf) {
        blocks.push({ type: 'code', text: codeBuf.join('\n') })
        codeBuf = null
      } else {
        flushList()
        codeBuf = []
      }
      return
    }
    if (codeBuf) {
      codeBuf.push(line)
      return
    }
    if (!t) {
      flushList()
      return
    }
    const ul = t.match(/^[-*•]\s+(.*)$/)
    const ol = t.match(/^\d+[.)]\s+(.*)$/)
    if (ul || ol) {
      const type: 'ul' | 'ol' = ul ? 'ul' : 'ol'
      if (!list || list.type !== type) {
        flushList()
        list = { type, items: [] }
      }
      list.items.push((ul ? ul[1] : ol[1]) as string)
      return
    }
    flushList()
    const h = t.match(/^(#{1,3})\s+(.*)$/)
    if (h) {
      blocks.push({ type: (`h${h[1].length}`) as BlockType, text: h[2] })
      return
    }
    blocks.push({ type: 'p', text: t })
  })
  flushList()
  if (codeBuf && codeBuf.length) {
    blocks.push({ type: 'code', text: codeBuf.join('\n') })
  }
  return blocks
}

// 行内：**加粗** 与 `代码`
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g
  let last = 0
  let idx = 0
  let m: RegExpExecArray | null
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) {
      nodes.push(<Text key={`${keyPrefix}-t${idx++}`}>{text.slice(last, m.index)}</Text>)
    }
    const token = m[0]
    if (token.startsWith('**')) {
      nodes.push(
        <Text key={`${keyPrefix}-b${idx++}`} className={styles.mdBold}>
          {token.slice(2, -2)}
        </Text>
      )
    } else {
      nodes.push(
        <Text key={`${keyPrefix}-c${idx++}`} className={styles.mdCodeInline}>
          {token.slice(1, -1)}
        </Text>
      )
    }
    last = m.index + token.length
  }
  if (last < text.length) {
    nodes.push(<Text key={`${keyPrefix}-t${idx++}`}>{text.slice(last)}</Text>)
  }
  return nodes
}

// 富文本渲染：AI 回复统一走这里（预览格式）
function renderRich(content: string): React.ReactNode {
  return (
    <View className={styles.md}>
      {parseBlocks(content).map((b, bi) => {
        if (b.type === 'ul' || b.type === 'ol') {
          return (
            <View key={bi} className={styles.mdList}>
              {(b.items || []).map((it, ii) => (
                <View key={ii} className={styles.mdLi}>
                  <Text className={styles.mdBullet}>{b.type === 'ol' ? `${ii + 1}.` : '•'}</Text>
                  <Text className={styles.mdText}>{renderInline(it, `${bi}-${ii}`)}</Text>
                </View>
              ))}
            </View>
          )
        }
        if (b.type === 'code') {
          return (
            <View key={bi} className={styles.mdCodeBlock}>
              <Text className={styles.mdCodeText}>{b.text}</Text>
            </View>
          )
        }
        const heading = b.type === 'h1' || b.type === 'h2' || b.type === 'h3'
        return (
          <Text key={bi} className={`${styles.mdText} ${heading ? styles.mdHeading : ''}`}>
            {renderInline(b.text || '', String(bi))}
          </Text>
        )
      })}
    </View>
  )
}

const AiPage: React.FC = () => {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const [messages, setMessages] = useState<Msg[]>([{ role: 'assistant', content: WELCOME }])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<ScrollView | null>(null)

  useDidShow(() => {
    if (!isLoggedIn()) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      Taro.navigateTo({ url: '/pages/login/index' })
    }
  })

  const send = async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || sending) return
    const next: Msg[] = [...messages, { role: 'user', content }]
    setMessages(next)
    setInput('')
    setSending(true)
    try {
      const res = await apiPost<{ reply: string }>('/ai/chat', {
        messages: next.map((m) => ({ role: m.role, content: m.content }))
      })
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data?.reply || '（未收到回复，请重试）' }])
    } catch (err) {
      const msg = (err as Error).message || '请求失败'
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '抱歉，我暂时开小差了：' + msg }
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <View className={styles.page}>
      <ScrollView scrollY className={styles.msgList} enhanced showScrollbar={false}>
        <View className={styles.inner}>
          {messages.map((m, i) => (
            <View key={i} className={m.role === 'user' ? styles.rowMe : styles.rowBot}>
              {m.role === 'assistant' && (
                <View className={styles.avatar}>
                  <Text className={styles.avatarText}>医</Text>
                </View>
              )}
              <View className={m.role === 'user' ? styles.bubbleMe : styles.bubbleBot}>
                {m.role === 'user' ? (
                  <Text className={styles.bubbleText}>{m.content}</Text>
                ) : (
                  renderRich(m.content)
                )}
              </View>
            </View>
          ))}
          {sending && (
            <View className={styles.rowBot}>
              <View className={styles.avatar}>
                <Text className={styles.avatarText}>医</Text>
              </View>
              <View className={styles.bubbleBot}>
                <Text className={styles.bubbleText}>正在思考中…</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {messages.length <= 1 && (
        <View className={styles.quickWrap}>
          {QUICK.map((q) => (
            <View key={q} className={styles.quickChip} onClick={() => send(q)}>
              <Text className={styles.quickText}>{q}</Text>
            </View>
          ))}
        </View>
      )}

      <View className={styles.inputBar}>
        <Input
          className={styles.input}
          value={input}
          placeholder='问点养生的、药材的、平台的问题…'
          confirmType='send'
          onInput={(e) => setInput(e.detail.value)}
          onConfirm={() => send()}
        />
        <View className={`${styles.sendBtn} ${sending ? styles.sendBtnDisabled : ''}`} onClick={() => send()}>
          <Text className={styles.sendText}>发送</Text>
        </View>
      </View>
    </View>
  )
}

export default AiPage

import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { apiGet, apiPut } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import { formatTime } from '@/utils/format'
import styles from './index.module.scss'

// ---------- 类型 ----------
interface AdminStats {
  users: number
  merchants: number
  stores: number
  products: number
  orders: number
  posts: number
  comments: number
  reviews: number
  pendingApplications: number
}

interface Application {
  id: number
  store_name: string
  store_type?: string
  main_category?: string
  applicant_nickname?: string
  applicant_phone?: string
  city?: string
  license_no?: string
  status: string
  review_note?: string
  created_at: string
}

interface ContentItem {
  id: number
  title?: string
  content?: string
  post_title?: string
  score?: number
  status: string
  nickname: string
  created_at: string
}

interface AdminConv {
  id: number
  user_nickname?: string
  store_name?: string
  last_message?: string
  last_message_at?: string
}

interface AdminMsg {
  id: number
  sender_id: number
  sender_nickname?: string
  content: string
  created_at: string
}

interface AuditLog {
  id: number
  nickname?: string
  action?: string
  resource_type?: string
  resource_id?: string | number
  ip_address?: string
  created_at: string
}

const TABS = [
  { key: 'overview', name: '平台概览' },
  { key: 'applications', name: '资质审核' },
  { key: 'contents', name: '内容审核' },
  { key: 'flow', name: '信息监测' },
  { key: 'audit', name: '审计日志' }
]

const CONTENT_TYPES = [
  { key: 'post', name: '帖子' },
  { key: 'comment', name: '评论' },
  { key: 'review', name: '评价' }
]

function statusPillClass(status: string): string {
  if (['approved', 'visible'].includes(status)) return styles.pillGreen
  if (['pending', 'hidden'].includes(status)) return styles.pillGold
  return styles.pillGray
}

function statusText(status: string): string {
  const map: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已驳回',
    visible: '显示',
    hidden: '已隐藏',
    suspended: '已停用'
  }
  return map[status] || status
}

const AdminPage: React.FC = () => {
  const { isLoggedIn } = useAuthStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)

  const [stats, setStats] = useState<AdminStats | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [contentType, setContentType] = useState('post')
  const [contents, setContents] = useState<ContentItem[]>([])
  const [convs, setConvs] = useState<AdminConv[]>([])
  const [activeConv, setActiveConv] = useState<AdminConv | null>(null)
  const [messages, setMessages] = useState<AdminMsg[]>([])
  const [logs, setLogs] = useState<AuditLog[]>([])

  useEffect(() => {
    if (!isLoggedIn()) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      Taro.navigateTo({ url: '/pages/login/index' })
    }
  }, [isLoggedIn])

  const loadStats = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiGet<AdminStats>('/admin/stats')
      setStats(res.data)
    } catch (err) {
      console.error('[Admin] loadStats error:', err)
      Taro.showToast({ title: (err as Error).message || '加载统计失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }, [])

  const loadApplications = useCallback(async () => {
    try {
      const res = await apiGet<Application[]>('/admin/merchant-applications')
      setApplications(res.data || [])
    } catch (err) {
      console.error('[Admin] loadApplications error:', err)
      Taro.showToast({ title: (err as Error).message || '加载申请失败', icon: 'none' })
    }
  }, [])

  const loadContents = useCallback(async (type: string) => {
    try {
      const res = await apiGet<ContentItem[]>('/admin/contents', { type })
      setContents(res.data || [])
    } catch (err) {
      console.error('[Admin] loadContents error:', err)
      Taro.showToast({ title: (err as Error).message || '加载内容失败', icon: 'none' })
    }
  }, [])

  const loadConvs = useCallback(async () => {
    try {
      const res = await apiGet<AdminConv[]>('/admin/conversations')
      setConvs(res.data || [])
    } catch (err) {
      console.error('[Admin] loadConvs error:', err)
      Taro.showToast({ title: (err as Error).message || '加载会话失败', icon: 'none' })
    }
  }, [])

  const loadLogs = useCallback(async () => {
    try {
      const res = await apiGet<AuditLog[]>('/admin/audit-logs')
      setLogs(res.data || [])
    } catch (err) {
      console.error('[Admin] loadLogs error:', err)
      Taro.showToast({ title: (err as Error).message || '加载日志失败', icon: 'none' })
    }
  }, [])

  useEffect(() => {
    if (isLoggedIn()) {
      loadStats()
    }
  }, [isLoggedIn, loadStats])

  const switchTab = (key: string) => {
    setActiveTab(key)
    setActiveConv(null)
    setMessages([])
    if (key === 'applications' && !applications.length && !loading) {
      loadApplications()
    } else if (key === 'contents' && !contents.length && !loading) {
      loadContents(contentType)
    } else if (key === 'flow' && !convs.length && !loading) {
      loadConvs()
    } else if (key === 'audit' && !logs.length && !loading) {
      loadLogs()
    }
  }

  const switchContentType = (type: string) => {
    setContentType(type)
    setContents([])
    loadContents(type)
  }

  // ---------- 操作 ----------
  const reviewApp = async (id: number, status: 'approved' | 'rejected') => {
    let note = ''
    try {
      if (status === 'rejected') {
        const r = await Taro.showModal({
          title: '驳回申请',
          content: '请输入驳回原因（可选）',
          editable: true,
          placeholderText: '驳回原因'
        })
        if (!r.confirm) return
        note = r.content || ''
      } else {
        const r = await Taro.showModal({ title: '通过审核', content: '确认通过该商家资质申请？' })
        if (!r.confirm) return
      }
      await apiPut(`/admin/merchant-applications/${id}/review`, { status, note })
      Taro.showToast({ title: status === 'approved' ? '已通过该商家' : '已驳回该申请', icon: 'none' })
      loadApplications()
      loadStats()
    } catch (err) {
      Taro.showToast({ title: (err as Error).message || '操作失败', icon: 'none' })
    }
  }

  const setContentStatus = async (type: string, id: number, status: string) => {
    try {
      await apiPut(`/admin/contents/${type}/${id}/status`, { status })
      Taro.showToast({ title: status === 'hidden' ? '已隐藏' : '已显示', icon: 'none' })
      loadContents(type)
    } catch (err) {
      Taro.showToast({ title: (err as Error).message || '操作失败', icon: 'none' })
    }
  }

  const viewConv = async (conv: AdminConv) => {
    setActiveConv(conv)
    setMessages([])
    try {
      const res = await apiGet<AdminMsg[]>(`/admin/conversations/${conv.id}/messages`)
      setMessages(res.data || [])
    } catch (err) {
      console.error('[Admin] viewConv error:', err)
      Taro.showToast({ title: (err as Error).message || '加载消息失败', icon: 'none' })
    }
  }

  // ---------- 渲染 ----------
  const renderOverview = () => {
    if (!stats) return <View className={styles.loadingBox}>加载中…</View>
    const items = [
      { label: '普通用户', value: String(stats.users) },
      { label: '商家账号', value: String(stats.merchants), gold: true },
      { label: '入驻店铺', value: String(stats.stores) },
      { label: '在售商品', value: String(stats.products) },
      { label: '订单总数', value: String(stats.orders) },
      { label: '社区帖子', value: String(stats.posts), gold: true },
      { label: '帖子评论', value: String(stats.comments) },
      { label: '商品评价', value: String(stats.reviews) }
    ]
    return (
      <View>
        <View className={styles.card}>
          <Text className={styles.cardTitle}>平台概览</Text>
          <Text className={styles.subText}>炎黄济世平台整体运行情况。</Text>
          <View className={styles.statGrid}>
            {items.map((it, i) => (
              <View key={i} className={styles.statCard}>
                <Text className={it.gold ? styles.statNumGold : styles.statNum}>{it.value}</Text>
                <Text className={styles.statLabel}>{it.label}</Text>
              </View>
            ))}
          </View>
        </View>
        {Number(stats.pendingApplications) > 0 && (
          <View className={styles.card}>
            <View className={styles.pendingRow}>
              <Text className={styles.pendingLabel}>待审核资质申请</Text>
              <Text className={styles.pendingValue}>{stats.pendingApplications}</Text>
            </View>
          </View>
        )}
      </View>
    )
  }

  const renderApplications = () => {
    return (
      <View className={styles.card}>
        <Text className={styles.cardTitle}>商家资质审核</Text>
        <Text className={styles.subText}>审核通过后，申请账号将自动切换为商家角色。</Text>
        {applications.length === 0 ? (
          <Text className={styles.emptyText}>暂无入驻申请。</Text>
        ) : (
          applications.map((a) => (
            <View key={a.id} className={styles.appRow}>
              <View className={styles.appHead}>
                <Text className={styles.appName}>{a.store_name}</Text>
                <Text className={`${styles.pill} ${statusPillClass(a.status)}`}>{statusText(a.status)}</Text>
              </View>
              <Text className={styles.appMeta}>{[a.store_type, a.main_category].filter(Boolean).join(' · ')}</Text>
              <Text className={styles.appMeta}>
                申请人：{a.applicant_nickname || '-'} {a.applicant_phone || ''}
              </Text>
              <Text className={styles.appMeta}>城市：{a.city || '-'} · 证照号：{a.license_no || '—'}</Text>
              {a.review_note && <Text className={styles.appNote}>驳回原因：{a.review_note}</Text>}
              <View className={styles.appFoot}>
                <Text className={styles.orderTime}>{formatTime(a.created_at)}</Text>
                {a.status === 'pending' && (
                  <View className={styles.rowBtns}>
                    <Text className={styles.btnPrimary} onClick={() => reviewApp(a.id, 'approved')}>通过</Text>
                    <Text className={styles.btnDanger} onClick={() => reviewApp(a.id, 'rejected')}>驳回</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    )
  }

  const renderContents = () => {
    return (
      <View>
        <View className={styles.segBar}>
          {CONTENT_TYPES.map((t) => (
            <View
              key={t.key}
              className={`${styles.segItem} ${contentType === t.key ? styles.segItemOn : ''}`}
              onClick={() => switchContentType(t.key)}
            >
              <Text className={styles.segName}>{t.name}</Text>
            </View>
          ))}
        </View>
        <View className={styles.card}>
          <Text className={styles.cardTitle}>内容审核</Text>
          <Text className={styles.subText}>监测社区帖子、评论与评价，违规内容可隐藏处理。</Text>
          {contents.length === 0 ? (
            <Text className={styles.emptyText}>暂无内容。</Text>
          ) : (
            contents.map((c) => (
              <View key={c.id} className={styles.appRow}>
                <View className={styles.appHead}>
                  <Text className={styles.appName}>{c.nickname || '匿名用户'}</Text>
                  <Text className={`${styles.pill} ${statusPillClass(c.status)}`}>{statusText(c.status)}</Text>
                </View>
                <Text className={styles.contText}>{c.content || c.title || ''}</Text>
                {contentType === 'post' && c.title && <Text className={styles.appMeta}>标题：{c.title}</Text>}
                {contentType === 'comment' && c.post_title && <Text className={styles.appMeta}>帖子：{c.post_title}</Text>}
                {contentType === 'review' && (
                  <Text className={styles.scoreText}>★ {Number(c.score).toFixed(1)}</Text>
                )}
                <View className={styles.appFoot}>
                  <Text className={styles.orderTime}>{formatTime(c.created_at)}</Text>
                  <View className={styles.rowBtns}>
                    <Text className={styles.btnPlain} onClick={() => setContentStatus(contentType, c.id, 'hidden')}>隐藏</Text>
                    <Text className={styles.btnPrimary} onClick={() => setContentStatus(contentType, c.id, 'visible')}>显示</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    )
  }

  const renderFlow = () => {
    if (activeConv) {
      return (
        <View className={styles.chatBox}>
          <View className={styles.chatHead}>
            <Text className={styles.chatBack} onClick={() => { setActiveConv(null); setMessages([]) }}>‹ 返回</Text>
            <Text className={styles.chatTitle}>{activeConv.user_nickname || '用户'} → {activeConv.store_name || ''}</Text>
          </View>
          <ScrollView scrollY className={styles.chatMsgs}>
            {messages.length === 0 ? (
              <Text className={styles.emptyText}>暂无消息</Text>
            ) : (
              messages.map((m) => (
                <View key={m.id} className={styles.msgRow}>
                  <View className={styles.bubbleOther}>{m.content}</View>
                  <Text className={styles.msgTime}>{(m.sender_nickname || '匿名用户')} · {formatTime(m.created_at)}</Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )
    }
    return (
      <View className={styles.card}>
        <Text className={styles.cardTitle}>信息流动监测</Text>
        <Text className={styles.subText}>查看用户与商家之间的沟通记录（只读）。</Text>
        {convs.length === 0 ? (
          <Text className={styles.emptyText}>暂无用户与商家之间的会话记录。</Text>
        ) : (
          convs.map((c) => (
            <View key={c.id} className={styles.convRow} onClick={() => viewConv(c)}>
              <View className={styles.convAvatar}>
                <Text className={styles.convAvatarText}>{(c.user_nickname || '用').charAt(0)}</Text>
              </View>
              <View className={styles.convMain}>
                <Text className={styles.convName}>{c.user_nickname || '用户'} → {c.store_name || '店铺'}</Text>
                <Text className={styles.convPreview}>{c.last_message || ''}</Text>
              </View>
              <Text className={styles.convArrow}>›</Text>
            </View>
          ))
        )}
      </View>
    )
  }

  const renderAudit = () => {
    return (
      <View className={styles.card}>
        <Text className={styles.cardTitle}>审计日志</Text>
        <Text className={styles.subText}>平台关键操作留痕记录。</Text>
        {logs.length === 0 ? (
          <Text className={styles.emptyText}>暂无审计日志。</Text>
        ) : (
          logs.map((a) => (
            <View key={a.id} className={styles.appRow}>
              <View className={styles.logTop}>
                <Text className={styles.logAction}>{a.action || '-'}</Text>
                <Text className={styles.orderTime}>{formatTime(a.created_at)}</Text>
              </View>
              <Text className={styles.appMeta}>操作者：{a.nickname || '-'}</Text>
              <Text className={styles.appMeta}>
                资源：{a.resource_type || '-'} #{a.resource_id ?? '-'} · IP：{a.ip_address || '-'}
              </Text>
            </View>
          ))
        )}
      </View>
    )
  }

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>平台管理后台</Text>
        <Text className={styles.headerSub}>炎黄济世 · 商家与内容治理</Text>
      </View>

      <View className={styles.tabBar}>
        {TABS.map((t) => (
          <View
            key={t.key}
            className={`${styles.tabItem} ${activeTab === t.key ? styles.tabItemOn : ''}`}
            onClick={() => switchTab(t.key)}
          >
            <Text className={styles.tabName}>{t.name}</Text>
          </View>
        ))}
      </View>

      <View className={styles.content}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'applications' && renderApplications()}
        {activeTab === 'contents' && renderContents()}
        {activeTab === 'flow' && renderFlow()}
        {activeTab === 'audit' && renderAudit()}
      </View>
    </View>
  )
}

export default AdminPage

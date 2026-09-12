import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, Image, Input, Textarea, Picker, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { apiGet, apiPost, apiPut } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import { WEB_ORIGIN } from '@/config'
import type { Category } from '@/types'
import { formatPrice, formatTime, resolveImage } from '@/utils/format'
import { productImageById } from '@/data/images'
import styles from './index.module.scss'

// ---------- 类型 ----------
interface MerchantStore {
  id: number
  name: string
  city: string
  years_in_business: number
  rating: string | number
  rating_count: number
  follower_count: number
  product_count: number
  commission_rate: string | number
  introduction: string
}

interface Stats {
  total_visits: number
  today_visits: number
  product_count: number
  order_count: number
  total_sales: number
  trend: { d: string; cnt: number }[]
}

interface MerchantProduct {
  id: number
  name: string
  category_name?: string
  price: string | number
  stock: number
  sales_count: number
  status: string
  is_public: number
  image_url: string | null
  description?: string
  origin?: string
}

interface MerchantOrder {
  id: number
  order_no: string
  buyer_nickname?: string
  receiver_name?: string
  receiver_phone?: string
  total_amount: string | number
  status: string
  created_at: string
}

interface Settlement {
  order_count: number
  total_sales: number
  total_commission: number
  net_amount: number
  orders: (MerchantOrder & {
    source?: string
    commission_rate?: string | number
    commission_amount?: string | number
  })[]
}

interface Conversation {
  id: number
  other_nickname?: string
  store_name?: string
  last_message?: string
  unread_merchant?: number
}

interface ChatMessage {
  id: number
  sender_id: number
  content: string
  created_at: string
  sender_nickname?: string
}

// ---------- 常量 ----------
const TABS = [
  { key: 'overview', name: '经营概览', icon: '📊' },
  { key: 'products', name: '商品管理', icon: '🌿' },
  { key: 'orders', name: '订单管理', icon: '📦' },
  { key: 'settlement', name: '对账佣金', icon: '💰' },
  { key: 'chat', name: '消息中心', icon: '💬' }
]

const STATUS_TEXT: Record<string, string> = {
  on_sale: '在售',
  off_shelf: '已下架',
  draft: '草稿',
  pending_payment: '待付款',
  paid: '已付款',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消'
}

function statusClass(status: string): string {
  if (['on_sale', 'shipped', 'completed'].includes(status)) return styles.pillGreen
  if (['draft', 'paid', 'pending_payment'].includes(status)) return styles.pillGold
  return styles.pillGray
}

const MerchantPage: React.FC = () => {
  const { isLoggedIn, user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [storeError, setStoreError] = useState('')

  const [store, setStore] = useState<MerchantStore | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [products, setProducts] = useState<MerchantProduct[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [orders, setOrders] = useState<MerchantOrder[]>([])
  const [settlement, setSettlement] = useState<Settlement | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [msgInput, setMsgInput] = useState('')
  const [msgSending, setMsgSending] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    categoryId: 0,
    price: '',
    stock: '',
    origin: '',
    imageUrl: '',
    description: ''
  })
  const msgScrollRef = useRef<ScrollView | null>(null)

  // 未登录拦截
  useEffect(() => {
    if (!isLoggedIn()) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      Taro.navigateTo({ url: '/pages/login/index' })
    }
  }, [isLoggedIn])

  // ---------- 数据加载 ----------
  const loadStore = useCallback(async () => {
    setStoreError('')
    try {
      const [storeRes, statsRes] = await Promise.all([
        apiGet<MerchantStore>('/merchant/store'),
        apiGet<Stats>('/merchant/store/stats')
      ])
      setStore(storeRes.data)
      setStats(statsRes.data)
    } catch (err) {
      console.error('[Merchant] loadStore error:', err)
      setStoreError((err as Error).message || '加载店铺失败')
    }
  }, [])

  const loadProducts = useCallback(async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        apiGet<MerchantProduct[]>('/merchant/products'),
        apiGet<Category[]>('/categories')
      ])
      setProducts(prodRes.data || [])
      setCategories(catRes.data || [])
      if (catRes.data?.length) {
        setForm((f) => (f.categoryId ? f : { ...f, categoryId: catRes.data![0].id }))
      }
    } catch (err) {
      console.error('[Merchant] loadProducts error:', err)
      Taro.showToast({ title: (err as Error).message || '加载商品失败', icon: 'none' })
    }
  }, [])

  const loadOrders = useCallback(async () => {
    try {
      const res = await apiGet<MerchantOrder[]>('/merchant/orders')
      setOrders(res.data || [])
    } catch (err) {
      console.error('[Merchant] loadOrders error:', err)
      Taro.showToast({ title: (err as Error).message || '加载订单失败', icon: 'none' })
    }
  }, [])

  const loadSettlement = useCallback(async () => {
    try {
      const res = await apiGet<Settlement>('/merchant/settlement')
      setSettlement(res.data)
    } catch (err) {
      console.error('[Merchant] loadSettlement error:', err)
      Taro.showToast({ title: (err as Error).message || '加载对账失败', icon: 'none' })
    }
  }, [])

  const loadChat = useCallback(async () => {
    try {
      const res = await apiGet<Conversation[]>('/chat/conversations')
      setConversations(res.data || [])
    } catch (err) {
      console.error('[Merchant] loadChat error:', err)
    }
  }, [])

  const loadMessages = useCallback(async (convId: number) => {
    try {
      const res = await apiGet<ChatMessage[]>(`/chat/conversations/${convId}/messages`)
      setMessages(res.data || [])
    } catch (err) {
      console.error('[Merchant] loadMessages error:', err)
      Taro.showToast({ title: (err as Error).message || '加载消息失败', icon: 'none' })
    }
  }, [])

  // 初始化：加载概览数据
  useEffect(() => {
    if (isLoggedIn()) {
      setLoading(true)
      loadStore().finally(() => setLoading(false))
    }
  }, [isLoggedIn, loadStore])

  // ---------- Tab 切换 ----------
  const switchTab = (key: string) => {
    setActiveTab(key)
    if (key === 'products' && !products.length && !loading) {
      loadProducts()
    } else if (key === 'orders' && !orders.length && !loading) {
      loadOrders()
    } else if (key === 'settlement' && !settlement && !loading) {
      loadSettlement()
    } else if (key === 'chat' && !conversations.length && !loading) {
      loadChat()
    }
  }

  // ---------- 商品操作 ----------
  const setProductStatus = async (id: number, status: string) => {
    try {
      await apiPut(`/merchant/products/${id}`, { status })
      Taro.showToast({ title: status === 'on_sale' ? '已上架' : '已下架', icon: 'none' })
      loadProducts()
    } catch (err) {
      Taro.showToast({ title: (err as Error).message || '操作失败', icon: 'none' })
    }
  }

  const setProductPublic = async (id: number, isPublic: number) => {
    try {
      await apiPut(`/merchant/products/${id}/public`, { isPublic })
      Taro.showToast({ title: isPublic ? '已设为公域展示' : '已设为仅私域', icon: 'none' })
      loadProducts()
    } catch (err) {
      Taro.showToast({ title: (err as Error).message || '操作失败', icon: 'none' })
    }
  }

  const submitProduct = async () => {
    if (!form.name.trim() || !form.categoryId || !form.price || !form.stock) {
      Taro.showToast({ title: '名称、分类、价格、库存不能为空', icon: 'none' })
      return
    }
    try {
      await apiPost('/merchant/products', {
        name: form.name.trim(),
        categoryId: form.categoryId,
        price: Number(form.price),
        stock: Number(form.stock),
        origin: form.origin.trim(),
        imageUrl: form.imageUrl.trim(),
        description: form.description.trim()
      })
      Taro.showToast({ title: '商品已上架', icon: 'none' })
      setShowForm(false)
      setForm({ name: '', categoryId: form.categoryId, price: '', stock: '', origin: '', imageUrl: '', description: '' })
      loadProducts()
    } catch (err) {
      Taro.showToast({ title: (err as Error).message || '上架失败', icon: 'none' })
    }
  }

  // ---------- 订单操作 ----------
  const setOrderStatus = async (id: number, status: string) => {
    try {
      await apiPut(`/merchant/orders/${id}/status`, { status })
      Taro.showToast({ title: status === 'shipped' ? '已发货' : status === 'completed' ? '已完成' : '已取消', icon: 'none' })
      loadOrders()
    } catch (err) {
      Taro.showToast({ title: (err as Error).message || '操作失败', icon: 'none' })
    }
  }

  // ---------- 消息操作 ----------
  const openConversation = async (conv: Conversation) => {
    setActiveConv(conv)
    setMsgInput('')
    await loadMessages(conv.id)
  }

  const backToList = () => {
    setActiveConv(null)
    setMessages([])
    loadChat()
  }

  const sendMessage = async () => {
    const content = msgInput.trim()
    if (!content || !activeConv || msgSending) return
    setMsgSending(true)
    try {
      await apiPost(`/chat/conversations/${activeConv.id}/messages`, { content })
      setMsgInput('')
      await loadMessages(activeConv.id)
      loadChat()
    } catch (err) {
      Taro.showToast({ title: (err as Error).message || '发送失败', icon: 'none' })
    } finally {
      setMsgSending(false)
    }
  }

  // ---------- 渲染辅助 ----------
  // 店铺专属网页链接与二维码（与 Web 端商家工作台一致）
  const shopWebUrl = (id: number) => `${WEB_ORIGIN}/#/store/s${id}`
  const shopQrUrl = (id: number) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(shopWebUrl(id))}`
  const copyShopLink = (id: number) => {
    Taro.setClipboardData({ data: shopWebUrl(id) })
      .then(() => Taro.showToast({ title: '链接已复制', icon: 'none' }))
      .catch(() => {})
  }

  const renderTrend = () => {
    const trend = stats?.trend || []
    const max = Math.max(1, ...trend.map((t) => t.cnt))
    if (!trend.length) {
      return <Text className={styles.emptyText}>近7天暂无访问记录，店铺详情被浏览后即可看到流量趋势。</Text>
    }
    return (
      <View className={styles.chart}>
        {trend.map((t, i) => (
          <View key={i} className={styles.chartCol}>
            <Text className={styles.chartVal}>{t.cnt}</Text>
            <View className={styles.chartTrack}>
              <View className={styles.chartBar} style={{ height: `${Math.max(6, Math.round((t.cnt / max) * 100))}%` }} />
            </View>
            <Text className={styles.chartLbl}>{t.d}</Text>
          </View>
        ))}
      </View>
    )
  }

  const renderStatsGrid = () => {
    if (!stats || !store) return null
    const items = [
      { label: '累计访问', value: String(stats.total_visits) },
      { label: '今日访问', value: String(stats.today_visits), gold: true },
      { label: '在售商品', value: String(stats.product_count) },
      { label: '累计销售额', value: `¥${formatPrice(stats.total_sales)}` },
      { label: '成交订单', value: String(stats.order_count) },
      { label: '商品总数', value: String(store.product_count) },
      { label: '收藏数', value: String(store.follower_count) },
      { label: '评分人数', value: String(store.rating_count) }
    ]
    return (
      <View className={styles.statGrid}>
        {items.map((it, i) => (
          <View key={i} className={styles.statCard}>
            <Text className={it.gold ? styles.statNumGold : styles.statNum}>{it.value}</Text>
            <Text className={styles.statLabel}>{it.label}</Text>
          </View>
        ))}
      </View>
    )
  }

  const renderOverview = () => {
    if (loading) return <View className={styles.loadingBox}>加载中…</View>
    if (!store) {
      return (
        <View className={styles.card}>
          <Text className={styles.errorTitle}>无法加载商家工作台</Text>
          <Text className={styles.errorText}>{storeError || '未关联店铺'}</Text>
          <Text className={styles.errorHint}>请使用商家账号登录（示例：13643396844 / 123456），或在「我的」页面确认当前账号角色为商家。</Text>
        </View>
      )
    }
    return (
      <View>
        <View className={styles.card}>
          <Text className={styles.storeName}>{store.name}</Text>
          <Text className={styles.storeMeta}>
            店铺评分 {Number(store.rating).toFixed(1)} · {store.city} · 经营 {store.years_in_business} 年
          </Text>
          <Text className={styles.storeIntro}>{store.introduction}</Text>
        </View>
        <View className={styles.card}>{renderStatsGrid()}</View>
        <View className={styles.card}>
          <Text className={styles.cardTitle}>近7天店铺流量</Text>
          {renderTrend()}
        </View>
        <View className={styles.card}>
          <Text className={styles.cardTitle}>店铺专属链接</Text>
          <Text className={styles.storeMeta}>把该二维码或链接发给线下、微信老客户，微信扫码直达本店网页。</Text>
          <View className={styles.shopQrCard}>
            <Image className={styles.shopQr} src={shopQrUrl(store.id)} mode='aspectFit' showMenuByLongpress />
            <View className={styles.shopQrInfo}>
              <Text className={styles.qrTip}>长按二维码可保存/识别分享</Text>
              <View className={styles.qrLinkRow}>
                <Text className={styles.qrLink} selectable>{shopWebUrl(store.id)}</Text>
                <Text className={styles.qrCopy} onClick={() => copyShopLink(store.id)}>复制</Text>
              </View>
            </View>
          </View>
          <View className={styles.commissionRow}>
            <Text className={styles.commissionLabel}>当前佣金比例</Text>
            <Text className={styles.commissionValue}>{Number(store.commission_rate).toFixed(2)}%</Text>
            <Text className={styles.commissionNote}>（平台按成交订单计提）</Text>
          </View>
        </View>
      </View>
    )
  }

  const renderProducts = () => {
    return (
      <View>
        <View className={styles.card}>
          <View className={styles.cardHeader}>
            <Text className={styles.cardTitle}>商品管理</Text>
            <Text className={styles.cardBtn} onClick={() => setShowForm((v) => !v)}>
              {showForm ? '收起' : '+ 上架新商品'}
            </Text>
          </View>
          {products.length === 0 ? (
            <Text className={styles.emptyText}>暂无商品，点击右上角「上架新商品」。</Text>
          ) : (
            products.map((p) => (
              <View key={p.id} className={styles.productRow}>
                <Image className={styles.productThumb} src={resolveImage(p.image_url, productImageById(p.id))} mode='aspectFill' />
                <View className={styles.productInfo}>
                  <Text className={styles.productName}>{p.name}</Text>
                  <View className={styles.productMetaRow}>
                    <Text className={styles.productMeta}>{p.category_name || '-'}</Text>
                    <Text className={styles.productMeta}>¥{formatPrice(p.price)}</Text>
                    <Text className={styles.productMeta}>库存 {p.stock}</Text>
                    <Text className={styles.productMeta}>销量 {p.sales_count}</Text>
                  </View>
                  <View className={styles.productMetaRow}>
                    <Text className={`${styles.pill} ${statusClass(p.status)}`}>{STATUS_TEXT[p.status] || p.status}</Text>
                    <Text className={`${styles.pill} ${p.is_public ? styles.pillGold : styles.pillGray}`}>
                      {p.is_public ? '公域展示' : '仅私域'}
                    </Text>
                  </View>
                </View>
                <View className={styles.productActions}>
                  {p.status !== 'on_sale' ? (
                    <Text className={styles.btnPrimary} onClick={() => setProductStatus(p.id, 'on_sale')}>上架</Text>
                  ) : (
                    <Text className={styles.btnPlain} onClick={() => setProductStatus(p.id, 'off_shelf')}>下架</Text>
                  )}
                  <Text className={styles.btnPlain} onClick={() => setProductPublic(p.id, p.is_public ? 0 : 1)}>
                    {p.is_public ? '私域' : '公域'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {showForm && (
          <View className={styles.card}>
            <Text className={styles.cardTitle}>上架新商品</Text>
            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>商品名称</Text>
              <Input className={styles.formInput} value={form.name} placeholder='例如：长白山野山参 · 15年足龄'
                onInput={(e) => setForm((f) => ({ ...f, name: e.detail.value }))} />
            </View>
            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>分类</Text>
              <Picker mode='selector' range={categories.map((c) => c.name)}
                value={Math.max(0, categories.findIndex((c) => c.id === form.categoryId))}
                onChange={(e) => {
                  const idx = Number(e.detail.value)
                  if (categories[idx]) setForm((f) => ({ ...f, categoryId: categories[idx].id }))
                }}>
                <View className={styles.formPicker}>
                  {categories.find((c) => c.id === form.categoryId)?.name || '请选择分类'}
                </View>
              </Picker>
            </View>
            <View className={styles.formRow}>
              <View className={`${styles.formGroup} ${styles.flex1}`}>
                <Text className={styles.formLabel}>价格（元）</Text>
                <Input className={styles.formInput} type='digit' value={form.price} placeholder='0.00'
                  onInput={(e) => setForm((f) => ({ ...f, price: e.detail.value }))} />
              </View>
              <View className={`${styles.formGroup} ${styles.flex1}`}>
                <Text className={styles.formLabel}>库存</Text>
                <Input className={styles.formInput} type='number' value={form.stock} placeholder='0'
                  onInput={(e) => setForm((f) => ({ ...f, stock: e.detail.value }))} />
              </View>
            </View>
            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>产地</Text>
              <Input className={styles.formInput} value={form.origin} placeholder='例如：吉林长白山'
                onInput={(e) => setForm((f) => ({ ...f, origin: e.detail.value }))} />
            </View>
            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>商品图片 URL（可留空）</Text>
              <Input className={styles.formInput} value={form.imageUrl} placeholder='https://…'
                onInput={(e) => setForm((f) => ({ ...f, imageUrl: e.detail.value }))} />
            </View>
            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>商品描述</Text>
              <Textarea className={styles.formTextarea} value={form.description} placeholder='产地、品质、食用/使用方法等'
                onInput={(e) => setForm((f) => ({ ...f, description: e.detail.value }))} />
            </View>
            <View className={styles.formSubmit} onClick={submitProduct}>
              <Text className={styles.formSubmitText}>提交上架</Text>
            </View>
          </View>
        )}
      </View>
    )
  }

  const renderOrders = () => {
    return (
      <View className={styles.card}>
        <Text className={styles.cardTitle}>订单管理</Text>
        <Text className={styles.subText}>处理本店订单的发货与完成状态。</Text>
        {orders.length === 0 ? (
          <Text className={styles.emptyText}>暂无订单。</Text>
        ) : (
          orders.map((o) => (
            <View key={o.id} className={styles.orderRow}>
              <View className={styles.orderHead}>
                <Text className={styles.orderNo}>{o.order_no}</Text>
                <Text className={`${styles.pill} ${statusClass(o.status)}`}>{STATUS_TEXT[o.status] || o.status}</Text>
              </View>
              <Text className={styles.orderMeta}>买家：{o.buyer_nickname || '匿名用户'}</Text>
              <Text className={styles.orderMeta}>收货：{o.receiver_name || '-'} {o.receiver_phone || ''}</Text>
              <View className={styles.orderFoot}>
                <Text className={styles.orderAmount}>¥{formatPrice(o.total_amount)}</Text>
                <Text className={styles.orderTime}>{formatTime(o.created_at)}</Text>
              </View>
              {(o.status === 'paid' || o.status === 'shipped') && (
                <View className={styles.orderActions}>
                  {o.status === 'paid' ? (
                    <Text className={styles.btnPrimary} onClick={() => setOrderStatus(o.id, 'shipped')}>发货</Text>
                  ) : (
                    <Text className={styles.btnPrimary} onClick={() => setOrderStatus(o.id, 'completed')}>完成</Text>
                  )}
                  <Text className={styles.btnDanger} onClick={() => setOrderStatus(o.id, 'cancelled')}>取消</Text>
                </View>
              )}
            </View>
          ))
        )}
      </View>
    )
  }

  const renderSettlement = () => {
    if (!settlement) return <View className={styles.loadingBox}>加载中…</View>
    const cards = [
      { label: '成交订单', value: String(settlement.order_count) },
      { label: '成交额', value: `¥${formatPrice(settlement.total_sales)}`, gold: true },
      { label: '应付佣金', value: `¥${formatPrice(settlement.total_commission)}` },
      { label: '结算净额', value: `¥${formatPrice(settlement.net_amount)}` }
    ]
    return (
      <View>
        <View className={styles.card}>
          <Text className={styles.cardTitle}>对账佣金</Text>
          <Text className={styles.subText}>平台按成交订单自动计提佣金，退款/取消订单佣金自动回滚。</Text>
          <View className={styles.statGrid}>
            {cards.map((c, i) => (
              <View key={i} className={styles.statCard}>
                <Text className={c.gold ? styles.statNumGold : styles.statNum}>{c.value}</Text>
                <Text className={styles.statLabel}>{c.label}</Text>
              </View>
            ))}
          </View>
        </View>
        <View className={styles.card}>
          <Text className={styles.cardTitle}>订单明细</Text>
          {settlement.orders.length === 0 ? (
            <Text className={styles.emptyText}>暂无成交订单。</Text>
          ) : (
            settlement.orders.map((o) => (
              <View key={o.id} className={styles.orderRow}>
                <View className={styles.orderHead}>
                  <Text className={styles.orderNo}>{o.order_no}</Text>
                  <Text className={`${styles.pill} ${o.source === 'private' ? styles.pillGray : styles.pillGold}`}>
                    {o.source === 'private' ? '私域' : '公域'}
                  </Text>
                  <Text className={`${styles.pill} ${statusClass(o.status)}`}>{STATUS_TEXT[o.status] || o.status}</Text>
                </View>
                <View className={styles.orderFoot}>
                  <Text className={styles.orderAmount}>¥{formatPrice(o.total_amount)}</Text>
                  <Text className={styles.orderMeta}>佣金 {Number(o.commission_rate).toFixed(2)}% → ¥{formatPrice(o.commission_amount)}</Text>
                </View>
                <Text className={styles.orderTime}>{formatTime(o.created_at)}</Text>
              </View>
            ))
          )}
        </View>
      </View>
    )
  }

  const renderChat = () => {
    if (activeConv) {
      return (
        <View className={styles.chatBox}>
          <View className={styles.chatHead}>
            <Text className={styles.chatBack} onClick={backToList}>‹ 返回</Text>
            <Text className={styles.chatTitle}>与 {activeConv.other_nickname || '用户'} 的对话</Text>
          </View>
          <ScrollView
            ref={msgScrollRef}
            scrollY
            className={styles.chatMsgs}
          >
            {messages.length === 0 ? (
              <Text className={styles.emptyText}>暂无消息</Text>
            ) : (
              messages.map((m) => {
                const isMe = Number(m.sender_id) === Number(user?.id)
                return (
                  <View key={m.id} className={isMe ? styles.msgRowMe : styles.msgRow}>
                    <View className={isMe ? styles.bubbleMe : styles.bubbleOther}>{m.content}</View>
                    <Text className={styles.msgTime}>{formatTime(m.created_at)}</Text>
                  </View>
                )
              })
            )}
          </ScrollView>
          <View className={styles.chatInputBar}>
            <Input
              className={styles.chatInput}
              value={msgInput}
              placeholder='输入回复…'
              confirmType='send'
              onInput={(e) => setMsgInput(e.detail.value)}
              onConfirm={sendMessage}
            />
            <View className={styles.chatSend} onClick={sendMessage}>
              <Text className={styles.chatSendText}>发送</Text>
            </View>
          </View>
        </View>
      )
    }
    if (conversations.length === 0) {
      return (
        <View className={styles.card}>
          <Text className={styles.cardTitle}>消息中心</Text>
          <Text className={styles.emptyText}>暂无用户咨询，用户通过店铺详情页的「联系商家」发起对话后会显示在这里。</Text>
        </View>
      )
    }
    return (
      <View className={styles.card}>
        <Text className={styles.cardTitle}>消息中心</Text>
        <Text className={styles.subText}>回复用户的售前咨询。</Text>
        {conversations.map((c) => (
          <View key={c.id} className={styles.convRow} onClick={() => openConversation(c)}>
            <View className={styles.convAvatar}>
              <Text className={styles.convAvatarText}>{(c.other_nickname || '客').charAt(0)}</Text>
            </View>
            <View className={styles.convMain}>
              <View className={styles.convNameRow}>
                <Text className={styles.convName}>{c.other_nickname || '用户'}</Text>
                {Number(c.unread_merchant || 0) > 0 && (
                  <View className={styles.convBadge}>
                    <Text className={styles.convBadgeText}>{c.unread_merchant}</Text>
                  </View>
                )}
              </View>
              <Text className={styles.convPreview}>{c.last_message || ''}</Text>
            </View>
            <Text className={styles.convArrow}>›</Text>
          </View>
        ))}
      </View>
    )
  }

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.headerBrand}>
          <Text className={styles.headerTitle}>商家工作台</Text>
          <Text className={styles.headerSub}>{store ? store.name : '炎黄济世'}</Text>
        </View>
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
        {activeTab === 'products' && renderProducts()}
        {activeTab === 'orders' && renderOrders()}
        {activeTab === 'settlement' && renderSettlement()}
        {activeTab === 'chat' && renderChat()}
      </View>
    </View>
  )
}

export default MerchantPage

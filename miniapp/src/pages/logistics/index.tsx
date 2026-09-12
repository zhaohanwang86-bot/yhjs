import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, Map } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { apiGet } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import type { Order } from '@/types'
import { formatPrice, formatTime } from '@/utils/format'
import styles from './index.module.scss'

// 常见店铺城市坐标（与 Web 端物流页保持一致）
const CITY_COORDS: Record<string, [number, number]> = {
  北京: [39.9042, 116.4074],
  昆明: [24.8801, 102.8329],
  杭州: [30.2741, 120.1551],
  长沙: [28.2282, 112.9388],
  漳州: [24.513, 117.6471],
  聊城: [36.4567, 115.9807],
  南阳: [32.9907, 112.5283],
  广州: [23.1291, 113.2644]
}
// 定位失败兜底：上海
const DEFAULT_COORD: [number, number] = [31.2304, 121.4737]

const STATUS_MAP: Record<string, { zh: string; progress: number; stepIdx: number }> = {
  pending_payment: { zh: '待付款', progress: 0, stepIdx: 0 },
  paid: { zh: '已付款 · 待发货', progress: 0, stepIdx: 1 },
  shipped: { zh: '运输中', progress: 0.55, stepIdx: 2 },
  completed: { zh: '已签收', progress: 1, stepIdx: 4 }
}

const STEP_NAMES = [
  { t: '订单已提交', d: '订单创建成功' },
  { t: '已完成支付', d: '等待商家安排发货' },
  { t: '商家已揽收', d: '包裹已从产地店铺发出' },
  { t: '运输途中', d: '干线运输 / 即将抵达收货城市' },
  { t: '已签收', d: '包裹已送达，感谢惠顾' }
]

interface OrderItem {
  productId: number
  name: string
  price: string | number
  quantity: number
  subtotal: string | number
}

function parseItems(order: Order | null): OrderItem[] {
  if (!order) return []
  let items: unknown = order.items
  if (typeof items === 'string') {
    try {
      items = JSON.parse(items)
    } catch (err) {
      items = []
    }
  }
  return Array.isArray(items) ? (items as OrderItem[]) : []
}

// 按比例取两点之间的插值坐标
function lerp(a: [number, number], b: [number, number], f: number): [number, number] {
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]
}

const LogisticsPage: React.FC = () => {
  const router = useRouter()
  const orderId = Number(router.params.orderId || 0)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dest, setDest] = useState<[number, number]>(DEFAULT_COORD)
  const [destLabel, setDestLabel] = useState('默认收货地（定位不可用）')

  useEffect(() => {
    if (!isLoggedIn()) {
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    if (!orderId) {
      setError('参数错误')
      setLoading(false)
      return
    }
    apiGet<Order>(`/orders/${orderId}`)
      .then((res) => {
        setOrder(res.data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('[Logistics] load error:', err)
        setError((err as Error).message || '订单加载失败')
        setLoading(false)
      })
  }, [isLoggedIn, orderId])

  // 用户当前位置（作为收货地），失败则用兜底坐标
  useEffect(() => {
    Taro.getLocation({ type: 'gcj02' })
      .then((res) => {
        setDest([res.latitude, res.longitude])
        setDestLabel('我的当前位置')
      })
      .catch(() => {
        setDestLabel('默认收货地（定位不可用）')
      })
  }, [])

  const statusInfo = STATUS_MAP[order?.status || ''] || {
    zh: order?.status || '',
    progress: 0,
    stepIdx: 0
  }

  const start = useMemo<[number, number]>(() => {
    const city = String(order?.store_city || '')
    return CITY_COORDS[city] ? [...CITY_COORDS[city]] as [number, number] : [...DEFAULT_COORD] as [number, number]
  }, [order?.store_city])

  // 时间线（时间基于下单时间模拟推算，仅供参考）
  const steps = useMemo(() => {
    const created = order ? new Date(String(order.created_at).replace(' ', 'T')) : new Date()
    const at = (min: number) => {
      if (Number.isNaN(created.getTime())) return ''
      const d = new Date(created.getTime() + min * 60000)
      const p = (n: number) => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
    }
    const mins = [0, 30, 8 * 60, 40 * 60, 3 * 24 * 60]
    return STEP_NAMES.map((n, i) => ({
      ...n,
      done: i < statusInfo.stepIdx || order?.status === 'completed',
      current: order?.status === 'shipped' && i === statusInfo.stepIdx,
      time: i <= statusInfo.stepIdx ? at(mins[i]) : ''
    }))
  }, [order, statusInfo.stepIdx])

  const polyline = useMemo(
    () => [
      {
        points: [
          { latitude: start[0], longitude: start[1] },
          { latitude: dest[0], longitude: dest[1] }
        ],
        color: '#c0392b',
        width: 4,
        arrowLine: true
      }
    ],
    [start, dest]
  )

  // 起终点 marker（带常显气泡，保证地图上一定有可见标记）
  const markers = useMemo(
    () => [
      {
        id: 1,
        latitude: start[0],
        longitude: start[1],
        iconPath: 'assets/tabbar/category.png',
        width: 32,
        height: 32,
        callout: {
          content: `产地 · ${order?.store_name || ''}${order?.store_city ? `（${order.store_city}）` : ''}`,
          color: '#1d2129',
          fontSize: 12,
          borderRadius: 6,
          padding: 6,
          bgColor: '#ffffff',
          display: 'ALWAYS',
          textAlign: 'center'
        }
      },
      {
        id: 2,
        latitude: dest[0],
        longitude: dest[1],
        iconPath: 'assets/tabbar/home.png',
        width: 32,
        height: 32,
        callout: {
          content: `收货 · ${destLabel}`,
          color: '#1d2129',
          fontSize: 12,
          borderRadius: 6,
          padding: 6,
          bgColor: '#ffffff',
          display: 'ALWAYS',
          textAlign: 'center'
        }
      }
    ],
    [start, dest, order?.store_name, order?.store_city, destLabel]
  )

  const circles = useMemo(() => {
    const list: Array<Record<string, unknown>> = [
      { latitude: start[0], longitude: start[1], color: '#8c1f28', fillColor: '#8c1f2833', radius: 40000 },
      { latitude: dest[0], longitude: dest[1], color: '#2e7d32', fillColor: '#2e7d3233', radius: 40000 }
    ]
    if (statusInfo.progress > 0 && statusInfo.progress < 1) {
      const cur = lerp(start, dest, statusInfo.progress)
      list.push({ latitude: cur[0], longitude: cur[1], color: '#1e6fd9', fillColor: '#1e6fd933', radius: 30000 })
    }
    return list
  }, [start, dest, statusInfo.progress])

  const includePoints = useMemo(
    () => [
      { latitude: start[0], longitude: start[1] },
      { latitude: dest[0], longitude: dest[1] }
    ],
    [start, dest]
  )

  const items = parseItems(order)
  const mid = useMemo<[number, number]>(
    () => [(start[0] + dest[0]) / 2, (start[1] + dest[1]) / 2],
    [start, dest]
  )

  if (loading) {
    return (
      <View className={styles.page}>
        <View className={styles.tip}>物流信息加载中…</View>
      </View>
    )
  }

  if (error) {
    return (
      <View className={styles.page}>
        <View className={styles.tip}>物流信息加载失败：{error}</View>
      </View>
    )
  }

  return (
    <View className={styles.page}>
      {/* 状态头部 */}
      <View className={styles.hero}>
        <Text className={styles.heroStatus}>{statusInfo.zh}</Text>
        <Text className={styles.heroNo}>订单号：{order?.order_no}</Text>
      </View>

      {/* 地图轨迹 */}
      <View className={styles.mapWrap}>
        <Map
          className={styles.map}
          style={{ width: '100%', height: '520rpx' }}
          latitude={mid[0]}
          longitude={mid[1]}
          scale={5}
          markers={markers as never}
          polyline={polyline as never}
          circles={circles as never}
          includePoints={includePoints}
          showLocation
        />
        <View className={styles.legend}>
          <View className={styles.legendItem}>
            <Text className={styles.dotStart} />
            <Text className={styles.legendText}>产地 · {order?.store_name}{order?.store_city ? `（${order.store_city}）` : ''}</Text>
          </View>
          <View className={styles.legendItem}>
            <Text className={styles.dotEnd} />
            <Text className={styles.legendText}>收货 · {destLabel}</Text>
          </View>
        </View>
        {statusInfo.stepIdx < 1 && (
          <View className={styles.mapTip}>📌 该订单尚未支付，付款后商家发货即可查看实时物流轨迹。</View>
        )}
      </View>

      {/* 时间线 */}
      <View className={styles.card}>
        <Text className={styles.cardTitle}>物流状态</Text>
        {steps.map((s, i) => (
          <View key={i} className={styles.step}>
            <View className={styles.stepAxis}>
              <View
                className={`${styles.stepDot} ${s.done ? styles.stepDotDone : ''} ${s.current ? styles.stepDotCurrent : ''}`}
              />
              {i < steps.length - 1 && <View className={`${styles.stepLine} ${s.done ? styles.stepLineDone : ''}`} />}
            </View>
            <View className={styles.stepBody}>
              <Text className={`${styles.stepTitle} ${s.done || s.current ? styles.stepTitleDone : ''}`}>{s.t}</Text>
              <Text className={styles.stepDesc}>{s.d}</Text>
              {s.time ? <Text className={styles.stepTime}>{s.time}</Text> : null}
            </View>
          </View>
        ))}
      </View>

      {/* 订单信息 */}
      <View className={styles.card}>
        <Text className={styles.cardTitle}>订单信息</Text>
        <View className={styles.metaRow}>
          <Text className={styles.metaKey}>店铺</Text>
          <Text className={styles.metaValue}>{order?.store_name}{order?.store_city ? `（${order.store_city}）` : ''}</Text>
        </View>
        <View className={styles.metaRow}>
          <Text className={styles.metaKey}>收货地址</Text>
          <Text className={styles.metaValue}>
            {order?.receiver_name} {order?.receiver_phone} · {order?.receiver_address}
          </Text>
        </View>
        {items.length > 0 && (
          <View className={styles.metaRow}>
            <Text className={styles.metaKey}>商品</Text>
            <Text className={styles.metaValue}>{items.map((it) => `${it.name} ×${it.quantity}`).join('、')}</Text>
          </View>
        )}
        <View className={styles.metaRow}>
          <Text className={styles.metaKey}>实付</Text>
          <Text className={styles.metaPrice}>¥{formatPrice(order?.total_amount)}</Text>
        </View>
        <View className={styles.metaRow}>
          <Text className={styles.metaKey}>下单时间</Text>
          <Text className={styles.metaValue}>{formatTime(order?.created_at)}</Text>
        </View>
      </View>
    </View>
  )
}

export default LogisticsPage

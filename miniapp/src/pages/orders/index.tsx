import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import classnames from 'classnames'
import { apiGet, apiPost, apiPut } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import type { Order } from '@/types'
import { formatPrice, formatTime } from '@/utils/format'
import styles from './index.module.scss'

const STATUS_NAMES: Record<string, string> = {
  pending_payment: '待付款',
  paid: '待发货',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
  refunding: '退款中',
  refunded: '已退款'
}

const TABS = [
  { key: '', name: '全部' },
  { key: 'pending_payment', name: '待付款' },
  { key: 'paid', name: '待发货' },
  { key: 'shipped', name: '已发货' },
  { key: 'completed', name: '已完成' },
  { key: 'cancelled', name: '已取消' }
]

interface OrderItem {
  productId: number
  name: string
  price: string | number
  quantity: number
  subtotal: string | number
}

function parseItems(order: Order): OrderItem[] {
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

const OrdersPage: React.FC = () => {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const [activeTab, setActiveTab] = useState('')
  const [orders, setOrders] = useState<Order[]>([])

  const loadOrders = useCallback(async () => {
    if (!isLoggedIn()) {
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    try {
      const res = await apiGet<Order[]>('/orders')
      setOrders(res.data || [])
    } catch (err) {
      console.error('[Orders] loadOrders error:', err)
      Taro.showToast({ title: err instanceof Error ? err.message : '加载失败', icon: 'none' })
    }
  }, [isLoggedIn])

  useDidShow(() => {
    loadOrders()
  })

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  // ---------- 状态操作 ----------
  const goLogistics = (order: Order) => {
    Taro.navigateTo({ url: `/pages/logistics/index?orderId=${order.id}` })
  }

  const payOrder = async (order: Order) => {
    const pick = await Taro.showActionSheet({
      itemList: ['微信支付（沙盒）', '支付宝（沙盒）']
    }).catch(() => null)
    if (!pick) return
    const channel = pick.tapIndex === 1 ? '支付宝' : '微信支付'
    const r = await Taro.showModal({
      title: '沙盒支付',
      content: `${channel} · 确认支付 ¥${formatPrice(order.total_amount)}？\n（模拟通道，不产生真实扣款）`,
      confirmText: '确认支付'
    })
    if (!r.confirm) return
    try {
      await apiPost(`/orders/${order.id}/pay`)
      const done = await Taro.showModal({
        title: '支付成功',
        content: '商家将尽快发货，可查看物流进度。',
        confirmText: '查看物流',
        cancelText: '知道了'
      })
      loadOrders()
      if (done.confirm) {
        goLogistics(order)
      }
    } catch (err) {
      Taro.showToast({ title: (err as Error).message || '支付失败', icon: 'none' })
    }
  }

  const cancelOrder = async (order: Order) => {
    const r = await Taro.showModal({ title: '取消订单', content: '确认取消该订单？' })
    if (!r.confirm) return
    try {
      await apiPut(`/orders/${order.id}/cancel`)
      Taro.showToast({ title: '订单已取消', icon: 'none' })
      loadOrders()
    } catch (err) {
      Taro.showToast({ title: (err as Error).message || '取消失败', icon: 'none' })
    }
  }

  const confirmOrder = async (order: Order) => {
    const r = await Taro.showModal({ title: '确认收货', content: '确认已收到货？确认后订单完成。' })
    if (!r.confirm) return
    try {
      await apiPut(`/orders/${order.id}/confirm`)
      Taro.showToast({ title: '交易完成', icon: 'none' })
      loadOrders()
    } catch (err) {
      Taro.showToast({ title: (err as Error).message || '操作失败', icon: 'none' })
    }
  }

  const renderActions = (order: Order) => {
    // 每笔订单都可查看自己的物流
    const logisticsBtn = (
      <Text className={styles.btnGhost} onClick={() => goLogistics(order)}>物流查询</Text>
    )
    if (order.status === 'pending_payment') {
      return (
        <View className={styles.actions}>
          {logisticsBtn}
          <Text className={styles.btnGhost} onClick={() => cancelOrder(order)}>取消订单</Text>
          <Text className={styles.btnPrimary} onClick={() => payOrder(order)}>去支付</Text>
        </View>
      )
    }
    if (order.status === 'shipped') {
      return (
        <View className={styles.actions}>
          {logisticsBtn}
          <Text className={styles.btnPrimary} onClick={() => confirmOrder(order)}>确认收货</Text>
        </View>
      )
    }
    return <View className={styles.actions}>{logisticsBtn}</View>
  }

  const filtered = activeTab ? orders.filter((o) => o.status === activeTab) : orders

  return (
    <View className={styles.page}>
      <ScrollView scrollX className={styles.tabs} enhanced showScrollbar={false}>
        {TABS.map((tab) => (
          <View
            key={tab.key}
            className={classnames(styles.tab, activeTab === tab.key && styles.tabActive)}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text className={styles.tabText}>{tab.name}</Text>
          </View>
        ))}
      </ScrollView>

      <ScrollView scrollY className={styles.list}>
        {filtered.length === 0 ? (
          <View className={styles.empty}>暂无相关订单</View>
        ) : (
          filtered.map((order) => {
            const items = parseItems(order)
            return (
              <View key={order.id} className={styles.card}>
                <View className={styles.cardHeader}>
                  <Text className={styles.orderNo}>{order.order_no}</Text>
                  <Text className={styles.status}>{STATUS_NAMES[order.status] || order.status}</Text>
                </View>
                <Text className={styles.storeName}>{order.store_name}</Text>
                {items.map((it, idx) => (
                  <View key={idx} className={styles.itemRow}>
                    <Text className={styles.itemName}>{it.name}</Text>
                    <Text className={styles.itemQty}>x{it.quantity}</Text>
                    <Text className={styles.itemPrice}>¥{formatPrice(it.subtotal)}</Text>
                  </View>
                ))}
                <Text className={styles.address}>收货：{order.receiver_name} {order.receiver_phone} · {order.receiver_address}</Text>
                <View className={styles.cardFooter}>
                  <Text className={styles.time}>{formatTime(order.created_at)}</Text>
                  <Text className={styles.amount}>共{items.reduce((n, i) => n + i.quantity, 0)}件 合计 ¥{formatPrice(order.total_amount)}</Text>
                </View>
                {renderActions(order)}
              </View>
            )
          })
        )}
      </ScrollView>
    </View>
  )
}

export default OrdersPage

import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, Image, Input, Textarea } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { apiGet, apiPost, apiPut } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import type { Product } from '@/types'
import { formatPrice, resolveImage } from '@/utils/format'
import { productImageById } from '@/data/images'
import styles from './index.module.scss'

const CheckoutPage: React.FC = () => {
  const router = useRouter()
  const productId = Number(router.params.productId || 0)
  const storeId = Number(router.params.storeId || 0)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  // 下单幂等键：同一次下单意图复用同一个键，失败重试不会产生第二笔订单；下单成功后释放
  const pendingClientToken = useRef('')
  const takeClientToken = useCallback(() => {
    if (!pendingClientToken.current) {
      pendingClientToken.current = `ct-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
    }
    return pendingClientToken.current
  }, [])

  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  const [receiverName, setReceiverName] = useState('')
  const [receiverPhone, setReceiverPhone] = useState('')
  const [receiverAddress, setReceiverAddress] = useState('')

  // 沙盒支付弹层状态
  const [currentOrder, setCurrentOrder] = useState<{ id: number; orderNo: string; totalAmount: number } | null>(null)
  const [payVisible, setPayVisible] = useState(false)
  const [payChannel, setPayChannel] = useState<'wechat' | 'alipay'>('wechat')
  const [paying, setPaying] = useState(false)
  const [paidDone, setPaidDone] = useState(false)

  useEffect(() => {
    if (!isLoggedIn()) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    if (!productId) {
      Taro.showToast({ title: '参数错误', icon: 'none' })
      return
    }
    apiGet<Product>(`/products/${productId}`)
      .then((res) => setProduct(res.data))
      .catch((err) => {
        console.error('[Checkout] load error:', err)
        Taro.showToast({ title: (err as Error).message || '加载失败', icon: 'none' })
      })
  }, [isLoggedIn, productId])

  const changeQty = (delta: number) => {
    setQuantity((q) => {
      const stock = Number(product?.stock || 0)
      const next = q + delta
      if (next < 1) return 1
      if (next > stock) {
        Taro.showToast({ title: `库存仅 ${stock} 件`, icon: 'none' })
        return stock || 1
      }
      return next
    })
  }

  const total = product ? Number(product.price) * quantity : 0

  const submit = useCallback(async () => {
    if (!product || !storeId) return
    if (!receiverName.trim() || !receiverPhone.trim() || !receiverAddress.trim()) {
      Taro.showToast({ title: '请填写收货人、电话和地址', icon: 'none' })
      return
    }
    setSubmitting(true)
    try {
      const res = await apiPost<{ id: number; orderNo: string; totalAmount: number; status: string }>('/orders', {
        storeId,
        receiverName: receiverName.trim(),
        receiverPhone: receiverPhone.trim(),
        receiverAddress: receiverAddress.trim(),
        items: [{ productId: product.id, quantity }],
        source: 'market'
      })
      setCurrentOrder({
        id: res.data?.id,
        orderNo: res.data?.orderNo || '',
        totalAmount: Number(res.data?.totalAmount ?? total)
      })
      setPayChannel('wechat')
      setPaidDone(false)
      setPayVisible(true)
    } catch (err) {
      console.error('[Checkout] submit error:', err)
      Taro.showToast({ title: (err as Error).message || '下单失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }, [product, storeId, quantity, receiverName, receiverPhone, receiverAddress, total, takeClientToken])

  // 沙盒支付：模拟微信/支付宝，调用后端把订单置为已付款
  const confirmPay = useCallback(async () => {
    if (!currentOrder?.id) return
    setPaying(true)
    try {
      await apiPost(`/orders/${currentOrder.id}/pay`)
      setPaidDone(true)
      Taro.showToast({ title: '支付成功', icon: 'none' })
    } catch (err) {
      Taro.showToast({ title: (err as Error).message || '支付失败', icon: 'none' })
    } finally {
      setPaying(false)
    }
  }, [currentOrder])

  const cancelPayOrder = useCallback(async () => {
    if (currentOrder?.id) {
      try {
        await apiPut(`/orders/${currentOrder.id}/cancel`)
      } catch (err) {
        // 状态已变更则忽略
      }
    }
    setPayVisible(false)
    Taro.showToast({ title: '订单已取消', icon: 'none' })
    setTimeout(() => Taro.navigateTo({ url: '/pages/orders/index' }), 600)
  }, [currentOrder])

  const goOrders = useCallback(() => {
    setPayVisible(false)
    Taro.navigateTo({ url: '/pages/orders/index' })
  }, [])

  const goLogistics = useCallback(() => {
    const id = currentOrder?.id
    setPayVisible(false)
    if (id) {
      Taro.navigateTo({ url: `/pages/logistics/index?orderId=${id}` })
    }
  }, [currentOrder])

  return (
    <View className={styles.page}>
      {/* 商品信息 */}
      <View className={styles.card}>
        <Text className={styles.cardTitle}>商品信息</Text>
        {product ? (
          <View className={styles.productRow}>
            <Image className={styles.thumb} src={resolveImage(product.image_url, productImageById(product.id))} mode='aspectFill' />
            <View className={styles.productInfo}>
              <Text className={styles.productName}>{product.name}</Text>
              <Text className={styles.productMeta}>¥{formatPrice(product.price)} · 库存 {product.stock}</Text>
              <Text className={styles.productMeta}>店铺：{product.store_name}</Text>
            </View>
          </View>
        ) : (
          <Text className={styles.loadingText}>加载中…</Text>
        )}
      </View>

      {/* 数量 */}
      <View className={styles.card}>
        <View className={styles.qtyRow}>
          <Text className={styles.qtyLabel}>购买数量</Text>
          <View className={styles.qtyCtrl}>
            <View className={`${styles.qtyBtn} ${quantity <= 1 ? styles.qtyBtnDisabled : ''}`} onClick={() => changeQty(-1)}>
              <Text className={styles.qtyBtnText}>−</Text>
            </View>
            <Text className={styles.qtyNum}>{quantity}</Text>
            <View className={styles.qtyBtn} onClick={() => changeQty(1)}>
              <Text className={styles.qtyBtnText}>+</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 收货信息 */}
      <View className={styles.card}>
        <Text className={styles.cardTitle}>收货信息</Text>
        <View className={styles.field}>
          <Text className={styles.fieldLabel}>收货人</Text>
          <Input className={styles.fieldInput} value={receiverName} placeholder='请输入收货人姓名'
            onInput={(e) => setReceiverName(e.detail.value)} />
        </View>
        <View className={styles.field}>
          <Text className={styles.fieldLabel}>手机号</Text>
          <Input className={styles.fieldInput} type='number' value={receiverPhone} placeholder='请输入联系电话'
            onInput={(e) => setReceiverPhone(e.detail.value)} />
        </View>
        <View className={styles.field}>
          <Text className={styles.fieldLabel}>收货地址</Text>
          <Textarea className={styles.fieldTextarea} value={receiverAddress} placeholder='省市区 + 详细地址'
            onInput={(e) => setReceiverAddress(e.detail.value)} />
        </View>
      </View>

      {/* 底部结算 */}
      <View className={styles.footer}>
        <View className={styles.totalWrap}>
          <Text className={styles.totalLabel}>合计：</Text>
          <Text className={styles.totalPrice}>¥{formatPrice(total)}</Text>
        </View>
        <View className={`${styles.submitBtn} ${submitting ? styles.submitBtnDisabled : ''}`} onClick={submit}>
          <Text className={styles.submitText}>{submitting ? '提交中…' : '提交订单'}</Text>
        </View>
      </View>

      {/* 沙盒支付弹层 */}
      {payVisible && (
        <View className={styles.payMask}>
          <View className={styles.paySheet}>
            <Text className={styles.payTitle}>沙盒支付</Text>
            <Text className={styles.payHint}>模拟支付通道，不产生真实扣款</Text>
            {!paidDone ? (
              <View>
                <View className={styles.payLine}>
                  <Text className={styles.payLabel}>订单号</Text>
                  <Text className={styles.payValue}>{currentOrder?.orderNo}</Text>
                </View>
                <View className={styles.payLine}>
                  <Text className={styles.payLabel}>应付金额</Text>
                  <Text className={styles.payAmount}>¥{formatPrice(currentOrder?.totalAmount)}</Text>
                </View>
                <Text className={styles.channelTitle}>选择支付方式</Text>
                <View className={styles.channelRow}>
                  <View
                    className={`${styles.channelBtn} ${payChannel === 'wechat' ? styles.channelBtnActive : ''}`}
                    onClick={() => setPayChannel('wechat')}
                  >
                    <Text className={`${styles.channelText} ${payChannel === 'wechat' ? styles.channelTextActive : ''}`}>
                      🟢 微信支付
                    </Text>
                  </View>
                  <View
                    className={`${styles.channelBtn} ${payChannel === 'alipay' ? styles.channelBtnActive : ''}`}
                    onClick={() => setPayChannel('alipay')}
                  >
                    <Text className={`${styles.channelText} ${payChannel === 'alipay' ? styles.channelTextActive : ''}`}>
                      🔵 支付宝
                    </Text>
                  </View>
                </View>
                <View className={styles.payActions}>
                  <View className={styles.payBtnGhost} onClick={cancelPayOrder}>
                    <Text className={styles.payBtnGhostText}>取消订单</Text>
                  </View>
                  <View className={`${styles.payBtnPrimary} ${paying ? styles.payBtnDisabled : ''}`} onClick={confirmPay}>
                    <Text className={styles.payBtnPrimaryText}>{paying ? '支付中…' : '确认支付'}</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View className={styles.paidBox}>
                <Text className={styles.paidIcon}>✅</Text>
                <Text className={styles.paidText}>支付成功</Text>
                <Text className={styles.paidNo}>
                  订单号 {currentOrder?.orderNo}（{payChannel === 'wechat' ? '微信支付' : '支付宝'}）
                </Text>
                <View className={styles.payActions}>
                  <View className={styles.payBtnGhost} onClick={goOrders}>
                    <Text className={styles.payBtnGhostText}>我的订单</Text>
                  </View>
                  <View className={styles.payBtnPrimary} onClick={goLogistics}>
                    <Text className={styles.payBtnPrimaryText}>查看物流</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  )
}

export default CheckoutPage

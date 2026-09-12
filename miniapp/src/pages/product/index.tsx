import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { apiGet, apiPost } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import type { Product, Review, Store } from '@/types'
import { formatPrice, formatRating, formatTime, resolveImage } from '@/utils/format'
import { productImageById } from '@/data/images'
import styles from './index.module.scss'

const ProductPage: React.FC = () => {
  const router = useRouter()
  const id = Number(router.params.id || 0)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const [product, setProduct] = useState<Product | null>(null)
  const [store, setStore] = useState<Store | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [favorited, setFavorited] = useState(false)

  const loadDetail = useCallback(async () => {
    if (!id) {
      return
    }
    try {
      const res = await apiGet<Product>(`/products/${id}`)
      setProduct(res.data)
      if (res.data.store_id) {
        const storeRes = await apiGet<Store & { products?: Product[] }>(`/stores/${res.data.store_id}`)
        setStore(storeRes.data)
      }
      const reviewRes = await apiGet<Review[]>('/reviews', { targetType: 'product', targetId: id, pageSize: 20 })
      setReviews(reviewRes.data || [])
    } catch (err) {
      console.error('[Product] loadDetail error:', err)
      Taro.showToast({ title: '商品不存在', icon: 'none' })
    }
  }, [id])

  useEffect(() => {
    loadDetail()
  }, [loadDetail])

  const toggleFavorite = async () => {
    if (!isLoggedIn()) {
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    try {
      const res = await apiPost<{ favorited: boolean }>('/favorites/toggle', {
        targetType: 'product',
        targetId: id
      })
      setFavorited(res.data.favorited)
      Taro.showToast({ title: res.data.favorited ? '已收藏' : '已取消收藏', icon: 'none' })
    } catch (err) {
      console.error('[Product] toggleFavorite error:', err)
    }
  }

  const goStore = () => {
    if (store) {
      Taro.navigateTo({ url: `/pages/store/index?id=${store.id}` })
    }
  }

  const goBuy = () => {
    if (!product) {
      return
    }
    if (!isLoggedIn()) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    Taro.navigateTo({ url: `/pages/checkout/index?productId=${product.id}&storeId=${product.store_id}` })
  }

  if (!product) {
    return <View className={styles.loading}>加载中…</View>
  }

  return (
    <View className={styles.page}>
      <Image className={styles.hero} src={resolveImage(product.image_url, productImageById(product.id))} mode='aspectFill' />

      <View className={styles.card}>
        <View className={styles.priceRow}>
          <Text className={styles.price}>¥{formatPrice(product.price)}</Text>
          {product.original_price ? (
            <Text className={styles.originalPrice}>¥{formatPrice(product.original_price)}</Text>
          ) : null}
          {product.tag ? <Text className={styles.tag}>{product.tag}</Text> : null}
        </View>
        <Text className={styles.name}>{product.name}</Text>
        <View className={styles.metaRow}>
          <Text className={styles.meta}>已售 {product.sales_count}</Text>
          <Text className={styles.meta}>库存 {product.stock}</Text>
          <Text className={styles.meta}>★ {formatRating(product.rating)}</Text>
        </View>
      </View>

      {(product.origin || product.trace_code) && (
        <View className={styles.card}>
          <Text className={styles.cardTitle}>产地与溯源</Text>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>产地</Text>
            <Text className={styles.infoValue}>{product.origin || '-'}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>溯源编码</Text>
            <Text className={styles.infoValue}>{product.trace_code || '-'}</Text>
          </View>
        </View>
      )}

      {store && (
        <View className={styles.card} onClick={goStore}>
          <Text className={styles.cardTitle}>所在店铺</Text>
          <View className={styles.storeRow}>
            <View className={styles.storeLogo}>
              <Text>{store.name ? store.name.charAt(0) : '店'}</Text>
            </View>
            <View className={styles.storeInfo}>
              <Text className={styles.storeName}>{store.name}</Text>
              <Text className={styles.storeMeta}>
                ★ {formatRating(store.rating)} · {store.city} · {store.product_count}件商品
              </Text>
            </View>
            <Text className={styles.arrow}>›</Text>
          </View>
        </View>
      )}

      <View className={styles.card}>
        <Text className={styles.cardTitle}>商品评价</Text>
        {reviews.length === 0 ? (
          <Text className={styles.empty}>暂无评价</Text>
        ) : (
          reviews.map((review) => (
            <View key={review.id} className={styles.reviewItem}>
              <View className={styles.reviewHeader}>
                <Text className={styles.reviewUser}>{review.nickname}</Text>
                <Text className={styles.reviewScore}>★ {review.score}.0</Text>
              </View>
              <Text className={styles.reviewContent}>{review.content}</Text>
              <Text className={styles.reviewTime}>{formatTime(review.created_at)}</Text>
            </View>
          ))
        )}
      </View>

      <View className={styles.footer}>
        <View className={styles.favBtn} onClick={toggleFavorite}>
          <Text className={styles.favText}>{favorited ? '❤️ 已收藏' : '🤍 收藏'}</Text>
        </View>
        <View className={styles.buyBtn} onClick={goBuy}>
          <Text className={styles.buyText}>立即购买</Text>
        </View>
      </View>
    </View>
  )
}

export default ProductPage

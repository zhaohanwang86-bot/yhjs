import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import ProductCard from '@/components/ProductCard'
import { apiGet } from '@/services/api'
import type { Product, Store } from '@/types'
import { formatRating, formatCount, resolveImage } from '@/utils/format'
import styles from './index.module.scss'

const FALLBACK_COVER = 'https://picsum.photos/id/225/750/400'
const FALLBACK_LOGO = 'https://picsum.photos/id/225/200/200'

const StorePage: React.FC = () => {
  const router = useRouter()
  const id = Number(router.params.id || 0)
  const [store, setStore] = useState<Store | null>(null)
  const [products, setProducts] = useState<Product[]>([])

  const loadDetail = useCallback(async () => {
    if (!id) {
      return
    }
    try {
      const res = await apiGet<Store & { products?: Product[] }>(`/stores/${id}`)
      const { products: list, ...storeInfo } = res.data
      setStore(storeInfo)
      setProducts(list || [])
    } catch (err) {
      console.error('[Store] loadDetail error:', err)
      Taro.showToast({ title: '店铺不存在', icon: 'none' })
    }
  }, [id])

  useEffect(() => {
    loadDetail()
  }, [loadDetail])

  if (!store) {
    return <View className={styles.loading}>加载中…</View>
  }

  return (
    <View className={styles.page}>
      <Image
        className={styles.cover}
        src={resolveImage(store.cover_url, FALLBACK_COVER)}
        mode='aspectFill'
      />
      <View className={styles.headerCard}>
        <Image
          className={styles.logo}
          src={resolveImage(store.logo_url, FALLBACK_LOGO)}
          mode='aspectFill'
        />
        <View className={styles.headerInfo}>
          <View className={styles.nameRow}>
            <Text className={styles.name}>{store.name}</Text>
            {store.badge ? <Text className={styles.badge}>{store.badge}</Text> : null}
          </View>
          <Text className={styles.meta}>★ {formatRating(store.rating)} · {store.city} · 经营{store.years_in_business}年</Text>
          <Text className={styles.meta}>{formatCount(store.follower_count)}人关注 · {store.product_count}件在售</Text>
        </View>
      </View>

      {store.introduction ? (
        <View className={styles.card}>
          <Text className={styles.cardTitle}>店铺简介</Text>
          <Text className={styles.intro}>{store.introduction}</Text>
        </View>
      ) : null}

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>在售商品</Text>
        {products.length === 0 ? (
          <View className={styles.empty}>暂无在售商品</View>
        ) : (
          <View className={styles.grid}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} small />
            ))}
          </View>
        )}
      </View>
    </View>
  )
}

export default StorePage

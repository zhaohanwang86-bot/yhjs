import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { usePullDownRefresh, useReachBottom } from '@tarojs/taro'
import ProductCard from '@/components/ProductCard'
import StoreCard from '@/components/StoreCard'
import { apiGet } from '@/services/api'
import type { Category, Product, Store } from '@/types'
import styles from './index.module.scss'

const PAGE_SIZE = 10

const HomePage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const loadHome = useCallback(async () => {
    try {
      const [catRes, storeRes, prodRes] = await Promise.all([
        apiGet<Category[]>('/categories'),
        apiGet<Store[]>('/stores', { sort: 'rating' }),
        apiGet<Product[]>('/products', { sort: 'rating', page: 1, pageSize: PAGE_SIZE })
      ])
      setCategories(catRes.data || [])
      setStores(storeRes.data || [])
      setProducts(prodRes.data || [])
      setTotal(prodRes.pagination?.total || 0)
    } catch (err) {
      console.error('[Home] loadHome error:', err)
      Taro.showToast({ title: '加载失败，请检查后端服务', icon: 'none' })
    }
  }, [])

  useEffect(() => {
    loadHome()
  }, [loadHome])

  usePullDownRefresh(async () => {
    await loadHome()
    Taro.stopPullDownRefresh()
  })

  useReachBottom(async () => {
    if (loading || products.length >= total) {
      return
    }
    setLoading(true)
    try {
      const next = page + 1
      const res = await apiGet<Product[]>('/products', { sort: 'rating', page: next, pageSize: PAGE_SIZE })
      setProducts((prev) => [...prev, ...(res.data || [])])
      setPage(next)
      setTotal(res.pagination?.total || 0)
    } catch (err) {
      console.error('[Home] loadMore error:', err)
    } finally {
      setLoading(false)
    }
  })

  const goCategory = () => {
    Taro.switchTab({ url: '/pages/category/index' })
  }

  const goCommunity = () => {
    Taro.switchTab({ url: '/pages/community/index' })
  }

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.brand}>
          <Text className={styles.title}>炎黄济世</Text>
          <Text className={styles.slogan}>道地药材 · 药食同源 · 品质甄选</Text>
        </View>
        <View className={styles.search} onClick={goCategory}>
          <Text className={styles.searchText}>🔍 搜索药材、店铺…</Text>
        </View>
      </View>

      {categories.length > 0 && (
        <View className={styles.section}>
          <ScrollView scrollX className={styles.catList} enhanced showScrollbar={false}>
            {categories.map((cat) => (
              <View key={cat.id} className={styles.catItem} onClick={goCategory}>
                <View className={styles.catIcon}>
                  <Text>{cat.icon || '🌿'}</Text>
                </View>
                <Text className={styles.catName}>{cat.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {stores.length > 0 && (
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>精选店铺</Text>
            <Text className={styles.sectionMore} onClick={goCategory}>更多 ›</Text>
          </View>
          <ScrollView scrollX className={styles.storeList} enhanced showScrollbar={false}>
            {stores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </ScrollView>
        </View>
      )}

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>为你推荐</Text>
          <Text className={styles.sectionMore} onClick={goCategory}>更多 ›</Text>
        </View>
        <View className={styles.grid}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} small />
          ))}
        </View>
        <View className={styles.loading}>
          {products.length >= total ? '— 已经到底啦 —' : '加载中…'}
        </View>
      </View>

      <View className={styles.loading} onClick={goCommunity}>
        逛逛养生社区 ›
      </View>
    </View>
  )
}

export default HomePage

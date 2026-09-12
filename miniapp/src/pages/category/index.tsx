import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView, Input } from '@tarojs/components'
import { useReachBottom } from '@tarojs/taro'
import classnames from 'classnames'
import ProductCard from '@/components/ProductCard'
import { apiGet } from '@/services/api'
import type { Category, Product } from '@/types'
import styles from './index.module.scss'

const PAGE_SIZE = 10

const CategoryPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [activeId, setActiveId] = useState<number | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const loadCategories = useCallback(async () => {
    try {
      const res = await apiGet<Category[]>('/categories')
      const list = res.data || []
      setCategories(list)
      if (list.length > 0 && activeId === null) {
        setActiveId(list[0].id)
      }
    } catch (err) {
      console.error('[Category] loadCategories error:', err)
    }
  }, [activeId])

  const loadProducts = useCallback(
    async (reset = false) => {
      const targetPage = reset ? 1 : page
      setLoading(true)
      try {
        const params: Record<string, unknown> = {
          page: targetPage,
          pageSize: PAGE_SIZE,
          sort: 'default'
        }
        if (activeId) {
          params.categoryId = activeId
        }
        if (keyword.trim()) {
          params.keyword = keyword.trim()
        }
        const res = await apiGet<Product[]>('/products', params)
        const data = res.data || []
        setProducts((prev) => (reset ? data : [...prev, ...data]))
        setPage(targetPage + 1)
        setTotal(res.pagination?.total || 0)
      } catch (err) {
        console.error('[Category] loadProducts error:', err)
      } finally {
        setLoading(false)
      }
    },
    [activeId, keyword, page]
  )

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    if (activeId !== null) {
      loadProducts(true)
    }
  }, [activeId, keyword])

  useReachBottom(() => {
    if (!loading && products.length < total) {
      loadProducts(false)
    }
  })

  const onSearch = () => {
    setPage(1)
    setProducts([])
    loadProducts(true)
  }

  return (
    <View className={styles.page}>
      <View className={styles.searchBar}>
        <Input
          className={styles.searchInput}
          placeholder='搜索药材名称/产地'
          value={keyword}
          confirmType='search'
          onInput={(e) => setKeyword(e.detail.value)}
          onConfirm={onSearch}
        />
      </View>
      <View className={styles.body}>
        <ScrollView scrollY className={styles.side}>
          {categories.map((cat) => (
            <View
              key={cat.id}
              className={classnames(styles.sideItem, activeId === cat.id && styles.sideItemActive)}
              onClick={() => setActiveId(cat.id)}
            >
              <Text className={styles.sideName}>{cat.name}</Text>
            </View>
          ))}
        </ScrollView>
        <ScrollView scrollY className={styles.main}>
          <View className={styles.grid}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} small />
            ))}
          </View>
          {products.length === 0 && !loading ? (
            <View className={styles.empty}>
              <Text>暂无相关商品</Text>
            </View>
          ) : (
            <View className={styles.loading}>
              {products.length >= total ? '— 已经到底啦 —' : '加载中…'}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  )
}

export default CategoryPage

import React, { useCallback, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { apiGet, apiPost } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import type { Favorite } from '@/types'
import { formatTime } from '@/utils/format'
import styles from './index.module.scss'

const TYPE_NAMES: Record<string, string> = {
  product: '商品',
  store: '店铺'
}

const FavoritesPage: React.FC = () => {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const [favorites, setFavorites] = useState<Favorite[]>([])

  const loadFavorites = useCallback(async () => {
    if (!isLoggedIn()) {
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    try {
      const res = await apiGet<Favorite[]>('/favorites')
      setFavorites(res.data || [])
    } catch (err) {
      console.error('[Favorites] load error:', err)
    }
  }, [isLoggedIn])

  useDidShow(() => {
    loadFavorites()
  })

  const goTarget = (item: Favorite) => {
    if (item.target_type === 'product') {
      Taro.navigateTo({ url: `/pages/product/index?id=${item.target_id}` })
    } else {
      Taro.navigateTo({ url: `/pages/store/index?id=${item.target_id}` })
    }
  }

  const removeFavorite = async (item: Favorite) => {
    try {
      await apiPost('/favorites/toggle', { targetType: item.target_type, targetId: item.target_id })
      loadFavorites()
    } catch (err) {
      console.error('[Favorites] remove error:', err)
    }
  }

  return (
    <View className={styles.page}>
      <ScrollView scrollY className={styles.list}>
        {favorites.length === 0 ? (
          <View className={styles.empty}>还没有收藏内容，去商城逛逛吧</View>
        ) : (
          favorites.map((item) => (
            <View key={item.id} className={styles.card} onClick={() => goTarget(item)}>
              <View className={styles.info}>
                <Text className={styles.typePill}>{TYPE_NAMES[item.target_type] || item.target_type}</Text>
                <Text className={styles.name}>{item.target_name}</Text>
                <Text className={styles.time}>{formatTime(item.created_at)}</Text>
              </View>
              <View
                className={styles.removeBtn}
                onClick={(e) => {
                  e.stopPropagation()
                  removeFavorite(item)
                }}
              >
                <Text className={styles.removeText}>取消</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}

export default FavoritesPage

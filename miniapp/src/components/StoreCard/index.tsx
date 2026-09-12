import React from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import type { Store } from '@/types'
import { formatRating, formatCount, resolveImage } from '@/utils/format'
import { storeLogoById } from '@/data/images'
import styles from './index.module.scss'

interface Props {
  store: Store
}

const StoreCard: React.FC<Props> = ({ store }) => {
  const goDetail = () => {
    Taro.navigateTo({ url: `/pages/store/index?id=${store.id}` })
  }

  return (
    <View className={styles.card} onClick={goDetail}>
      <Image
        className={styles.logo}
        src={resolveImage(store.logo_url, storeLogoById(store.id))}
        mode='aspectFill'
      />
      <View className={styles.info}>
        <Text className={styles.name}>{store.name}</Text>
        {store.badge ? (
          <Text className={styles.badge}>{store.badge}</Text>
        ) : null}
        <View className={styles.meta}>
          <Text className={styles.rating}>★ {formatRating(store.rating)}</Text>
          <Text className={styles.sub}>月销 {formatCount(store.follower_count)}</Text>
        </View>
      </View>
    </View>
  )
}

export default StoreCard

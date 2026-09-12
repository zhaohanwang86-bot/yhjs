import React from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import type { Product } from '@/types'
import { formatPrice, formatRating, resolveImage } from '@/utils/format'
import { productImageById } from '@/data/images'
import styles from './index.module.scss'

interface Props {
  product: Product
  small?: boolean
}

const ProductCard: React.FC<Props> = ({ product, small = false }) => {
  const goDetail = () => {
    Taro.navigateTo({ url: `/pages/product/index?id=${product.id}` })
  }

  return (
    <View className={classnames(styles.card, small && styles.small)} onClick={goDetail}>
      <Image
        className={styles.image}
        src={resolveImage(product.image_url, productImageById(product.id))}
        mode='aspectFill'
      />
      <View className={styles.body}>
        {product.tag ? <Text className={styles.tag}>{product.tag}</Text> : null}
        <Text className={styles.name}>{product.name}</Text>
        <View className={styles.meta}>
          <Text className={styles.price}>¥{formatPrice(product.price)}</Text>
          <Text className={styles.sales}>已售{product.sales_count}</Text>
        </View>
        <View className={styles.footer}>
          <Text className={styles.rating}>★ {formatRating(product.rating)}</Text>
          <Text className={styles.storeName}>{product.store_name || ''}</Text>
        </View>
      </View>
    </View>
  )
}

export default ProductCard

// 本地演示图（数据库 image_url 为空时的兜底图，随包发布、无需网络）
import product1 from '@/assets/images/product_1.jpg'
import product2 from '@/assets/images/product_2.jpg'
import product3 from '@/assets/images/product_3.jpg'
import product4 from '@/assets/images/product_4.jpg'
import product5 from '@/assets/images/product_5.jpg'
import product6 from '@/assets/images/product_6.jpg'
import product7 from '@/assets/images/product_7.jpg'
import product8 from '@/assets/images/product_8.jpg'
import product9 from '@/assets/images/product_9.jpg'
import product10 from '@/assets/images/product_10.jpg'
import product11 from '@/assets/images/product_11.jpg'
import product12 from '@/assets/images/product_12.jpg'
import product13 from '@/assets/images/product_13.jpg'
import product14 from '@/assets/images/product_14.jpg'
import product15 from '@/assets/images/product_15.jpg'
import product16 from '@/assets/images/product_16.jpg'
import store1 from '@/assets/images/store_1.jpg'
import store2 from '@/assets/images/store_2.jpg'
import store3 from '@/assets/images/store_3.jpg'
import store4 from '@/assets/images/store_4.jpg'
import store5 from '@/assets/images/store_5.jpg'
import store6 from '@/assets/images/store_6.jpg'
import store7 from '@/assets/images/store_7.jpg'
import store8 from '@/assets/images/store_8.jpg'
import cover from '@/assets/images/cover.jpg'

export const PRODUCT_IMAGES: Record<number, string> = {
  1: product1,
  2: product2,
  3: product3,
  4: product4,
  5: product5,
  6: product6,
  7: product7,
  8: product8,
  9: product9,
  10: product10,
  11: product11,
  12: product12,
  13: product13,
  14: product14,
  15: product15,
  16: product16
}

export const STORE_LOGOS: Record<number, string> = {
  1: store1,
  2: store2,
  3: store3,
  4: store4,
  5: store5,
  6: store6,
  7: store7,
  8: store8
}

export const COVER_IMAGE = cover

// 按商品 id 取兜底图；未收录的返回通用封面
export function productImageById(id: number | undefined): string {
  return id ? PRODUCT_IMAGES[id] || cover : cover
}

export function storeLogoById(id: number | undefined): string {
  return id ? STORE_LOGOS[id] || store1 : store1
}

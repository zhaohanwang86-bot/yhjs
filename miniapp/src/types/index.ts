// 全局类型定义（与后端 API 返回字段对齐）

export interface Category {
  id: number
  name: string
  icon: string
  sort_order: number
  product_count: number
}

export interface Product {
  id: number
  store_id: number
  store_name: string
  city: string
  category_id: number
  category_name: string
  category_icon: string
  name: string
  description: string
  price: string | number
  original_price: string | number | null
  stock: number
  sales_count: number
  rating: string | number
  rating_count: number
  tag: string | null
  image_url: string | null
  origin: string | null
  trace_code: string | null
}

export interface Store {
  id: number
  name: string
  city: string
  years_in_business: number
  introduction: string
  logo_url: string | null
  cover_url: string | null
  brand_color: string | null
  badge: string | null
  badge_type: string
  rating: string | number
  rating_count: number
  follower_count: number
  product_count: number
}

export interface Review {
  id: number
  target_type: string
  target_id: number
  score: number
  content: string
  quality_score: number | null
  service_score: number | null
  logistics_score: number | null
  created_at: string
  nickname: string
  avatar_url: string | null
}

export interface Post {
  id: number
  title: string
  content: string
  tag: string
  like_count: number
  comment_count: number
  created_at: string
  nickname: string
  avatar_url: string | null
}

export interface Comment {
  id: number
  content: string
  created_at: string
  nickname: string
  avatar_url: string | null
}

export interface User {
  id: number
  nickname: string
  phone: string
  avatar_url: string | null
  bio: string | null
  gender: string
  birthday: string | null
  role: string
  status: string
}

export interface Order {
  id: number
  order_no: string
  store_id: number
  store_name: string
  store_city?: string | null
  receiver_name: string
  receiver_phone: string
  receiver_address: string
  total_amount: string | number
  status: string
  created_at: string
  items: string | Array<{ productId: number; name: string; price: string | number; quantity: number; subtotal: string | number }>
}

export interface Favorite {
  id: number
  target_type: 'store' | 'product'
  target_id: number
  target_name: string
  created_at: string
}

export interface ApiResult<T = unknown> {
  ok: boolean
  data: T
  message?: string
  pagination?: {
    page: number
    pageSize: number
    total?: number
  }
}

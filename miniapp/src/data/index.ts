// 炎黄济世小程序 · H5 预览 Mock 数据（与后端字段结构一致）
// 仅在非微信端（H5 预览等）使用；微信小程序端走真实后端 API

export interface MockCategory {
  id: number
  name: string
  icon: string
  sort_order: number
  product_count: number
}

export const mockCategories: MockCategory[] = [
  { id: 1, name: '参茸滋补', icon: '🌿', sort_order: 10, product_count: 3 },
  { id: 2, name: '花茶养生', icon: '🍵', sort_order: 20, product_count: 2 },
  { id: 3, name: '药食同源', icon: '🥣', sort_order: 30, product_count: 2 },
  { id: 4, name: '精品饮片', icon: '🌾', sort_order: 40, product_count: 2 },
  { id: 5, name: '中成药', icon: '💊', sort_order: 50, product_count: 1 },
  { id: 6, name: '滋补膏方', icon: '🍯', sort_order: 60, product_count: 2 },
  { id: 7, name: '艾灸理疗', icon: '🕯️', sort_order: 70, product_count: 1 },
  { id: 8, name: '药膳汤料', icon: '🥘', sort_order: 80, product_count: 1 }
]

export interface MockProduct {
  id: number
  store_id: number
  store_name: string
  city: string
  category_id: number
  category_name: string
  category_icon: string
  name: string
  description: string
  price: number
  original_price: number | null
  stock: number
  sales_count: number
  rating: number
  rating_count: number
  tag: string | null
  image_url: string | null
  origin: string | null
  trace_code: string | null
}

export const mockProducts: MockProduct[] = [
  { id: 1, store_id: 1, store_name: '华夏本草旗舰店', city: '北京', category_id: 1, category_name: '参茸滋补', category_icon: '🌿', name: '长白山野山参 · 15年足龄', description: '产自长白山原始林下，15年足龄林下参，附产地溯源证书。', price: 268, original_price: 328, stock: 500, sales_count: 8600, rating: 4.9, rating_count: 2300, tag: '镇店之宝', image_url: null, origin: '吉林长白山', trace_code: 'JL-YRS-0001' },
  { id: 2, store_id: 1, store_name: '华夏本草旗舰店', city: '北京', category_id: 3, category_name: '药食同源', category_icon: '🥣', name: '宁夏头茬枸杞 · 500g 免洗', description: '宁夏中宁头茬枸杞，皮薄肉厚籽少，免洗即食。', price: 39.9, original_price: 59.9, stock: 3000, sales_count: 32600, rating: 4.8, rating_count: 8900, tag: '热卖', image_url: null, origin: '宁夏中宁', trace_code: 'NX-GQ-0002' },
  { id: 3, store_id: 2, store_name: '云岭道地药材馆', city: '昆明', category_id: 4, category_name: '精品饮片', category_icon: '🌾', name: '云南文山三七粉 · 40头精磨', description: '文山道地三七，40头精磨300目细粉，附检测报告。', price: 128, original_price: 158, stock: 1200, sales_count: 15200, rating: 4.8, rating_count: 5600, tag: '地道', image_url: null, origin: '云南文山', trace_code: 'YN-SQ-0003' },
  { id: 4, store_id: 2, store_name: '云岭道地药材馆', city: '昆明', category_id: 1, category_name: '参茸滋补', category_icon: '🌿', name: '云南野生黑玛咖', description: '海拔3500米以上野生黑玛咖，煲汤泡酒皆宜。', price: 88, original_price: 118, stock: 900, sales_count: 6400, rating: 4.7, rating_count: 1800, tag: '新品', image_url: null, origin: '云南丽江', trace_code: 'YN-MK-0004' },
  { id: 5, store_id: 3, store_name: '江南本草滋补馆', city: '杭州', category_id: 6, category_name: '滋补膏方', category_icon: '🍯', name: '东阿阿胶糕 · 即食装 250g', description: '古法熬制阿胶配核桃、黑芝麻，独立小包装。', price: 199, original_price: 259, stock: 800, sales_count: 22100, rating: 4.9, rating_count: 9700, tag: '滋补佳品', image_url: null, origin: '山东东阿', trace_code: 'SD-AJ-0005' },
  { id: 6, store_id: 3, store_name: '江南本草滋补馆', city: '杭州', category_id: 2, category_name: '花茶养生', category_icon: '🍵', name: '杭州白菊 · 胎菊王 250g', description: '杭白菊胎菊王，清香四溢，日常泡水佳品。', price: 45, original_price: 65, stock: 1600, sales_count: 18800, rating: 4.7, rating_count: 7200, tag: '热卖', image_url: null, origin: '浙江桐乡', trace_code: 'ZJ-JH-0006' },
  { id: 7, store_id: 4, store_name: '湖湘养生堂', city: '长沙', category_id: 1, category_name: '参茸滋补', category_icon: '🌿', name: '湖南平江野生灵芝', description: '平江深山野生灵芝，煮水煲汤皆宜。', price: 158, original_price: 198, stock: 400, sales_count: 4300, rating: 4.6, rating_count: 1500, tag: '养生', image_url: null, origin: '湖南平江', trace_code: 'HN-LZ-0007' },
  { id: 8, store_id: 4, store_name: '湖湘养生堂', city: '长沙', category_id: 3, category_name: '药食同源', category_icon: '🥣', name: '河南焦作铁棍山药', description: '焦作温县垆土铁棍山药，粉糯香甜。', price: 29.9, original_price: 42, stock: 2400, sales_count: 28700, rating: 4.7, rating_count: 8100, tag: '药食同源', image_url: null, origin: '河南焦作', trace_code: 'HN-SY-0008' },
  { id: 9, store_id: 5, store_name: '闽南国药馆', city: '漳州', category_id: 5, category_name: '中成药', category_icon: '💊', name: '漳州片仔癀胶囊', description: '源于明代宫廷秘方，一物一码，全程可溯源。', price: 880, original_price: 960, stock: 200, sales_count: 2100, rating: 4.8, rating_count: 1100, tag: '传奇名方', image_url: null, origin: '福建漳州', trace_code: 'FJ-PZH-0009' },
  { id: 10, store_id: 6, store_name: '胶东滋补直营店', city: '聊城', category_id: 2, category_name: '花茶养生', category_icon: '🍵', name: '山东平阴重瓣玫瑰花茶', description: '平阴重瓣玫瑰头期花，低温烘干锁香。', price: 36, original_price: 49, stock: 1400, sales_count: 13400, rating: 4.8, rating_count: 5200, tag: '花茶', image_url: null, origin: '山东平阴', trace_code: 'SD-MG-0012' }
]

export interface MockStore {
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
  rating: number
  rating_count: number
  follower_count: number
  product_count: number
}

export const mockStores: MockStore[] = [
  { id: 1, name: '华夏本草旗舰店', city: '北京', years_in_business: 18, introduction: '精选全国道地药材，建立从产地筛选到仓储发货的品质管理流程。', logo_url: null, cover_url: null, brand_color: '#8c1f28', badge: '品质甄选', badge_type: 'gold', rating: 4.9, rating_count: 186200, follower_count: 96200, product_count: 2 },
  { id: 2, name: '云岭道地药材馆', city: '昆明', years_in_business: 12, introduction: '扎根西南药材产区，主打三七、菌类与高原特色食材，坚持产地直采。', logo_url: null, cover_url: null, brand_color: '#4c7a5c', badge: '产地直供', badge_type: 'red', rating: 4.8, rating_count: 92400, follower_count: 58800, product_count: 2 },
  { id: 3, name: '江南本草滋补馆', city: '杭州', years_in_business: 15, introduction: '专注阿胶、膏方与药膳汤料，精选江南特色滋补食材。', logo_url: null, cover_url: null, brand_color: '#a87f3f', badge: '江南甄选', badge_type: 'gold', rating: 4.9, rating_count: 76300, follower_count: 41200, product_count: 2 },
  { id: 4, name: '湖湘养生堂', city: '长沙', years_in_business: 11, introduction: '主做平价养生茶饮、代用茶与药食同源食材，精选湖湘特色风味。', logo_url: null, cover_url: null, brand_color: '#3f5f8c', badge: '湖湘风味', badge_type: 'red', rating: 4.7, rating_count: 51200, follower_count: 33600, product_count: 2 },
  { id: 5, name: '闽南国药馆', city: '漳州', years_in_business: 9, introduction: '精选闽南特色药材与滋补食材，重视批次管理和产地信息展示。', logo_url: null, cover_url: null, brand_color: '#6b4a8c', badge: '闽南甄选', badge_type: 'red', rating: 4.8, rating_count: 38900, follower_count: 21400, product_count: 1 }
]

export interface MockPost {
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

export const mockPosts: MockPost[] = [
  { id: 1, title: '第一次在平台上买参，如何辨别野山参和园参？', content: '看中一家店的长白山野山参，价格不便宜。想知道怎么从芦、艼、体、须几个方面辨别真伪？', tag: '选购求助', like_count: 42, comment_count: 2, created_at: '2026-08-28 09:12:00', nickname: '识药小草', avatar_url: null },
  { id: 2, title: '东阿阿胶糕怎么选？即食装和传统胶块哪个更适合日常保养？', content: '准备给家里长辈买阿胶，即食糕方便但是怕糖分高，大家怎么选？', tag: '养生讨论', like_count: 28, comment_count: 2, created_at: '2026-08-27 14:30:00', nickname: '华夏本草掌柜', avatar_url: null },
  { id: 3, title: '新会陈皮的年份到底怎么看？', content: '同一产区不同店卖的五年陈、十年陈价格差一倍，年份这个东西是不是智商税？', tag: '药材知识', like_count: 51, comment_count: 2, created_at: '2026-08-26 20:05:00', nickname: '识药小草', avatar_url: null },
  { id: 4, title: '征集：大家所在城市有哪些值得入驻炎黄济世的本土药铺？', content: '炎黄济世正在邀请各大药铺入驻，欢迎推荐身边的宝藏店铺。', tag: '平台共建', like_count: 96, comment_count: 3, created_at: '2026-08-25 10:00:00', nickname: '平台管理员', avatar_url: null },
  { id: 5, title: '药食同源科普：枸杞每天吃多少合适？', content: '枸杞性温，每天20g以内为宜，感冒发烧、腹泻期间不宜食用。', tag: '科普分享', like_count: 132, comment_count: 2, created_at: '2026-08-24 18:40:00', nickname: '华夏本草掌柜', avatar_url: null },
  { id: 6, title: '秋冬进补，如何选择适合自己体质的膏方？', content: '膏方滋补但不可盲目跟风，需结合体质辨证选用，建议先咨询专业人士。', tag: '养生讨论', like_count: 18, comment_count: 1, created_at: '2026-08-23 08:20:00', nickname: '老药工阿福', avatar_url: null }
]

export interface MockComment {
  id: number
  content: string
  created_at: string
  nickname: string
  avatar_url: string | null
}

export const mockComments: Record<number, MockComment[]> = {
  1: [
    { id: 1, content: '记住口诀：芦碗清晰、艼须下垂、体态灵巧、须长有珍珠点。', created_at: '2026-08-28 09:30:00', nickname: '老药工阿福', avatar_url: null },
    { id: 2, content: '多谢指教！那家店给了产地证书编号，我可以放心下单了。', created_at: '2026-08-28 10:02:00', nickname: '识药小草', avatar_url: null }
  ],
  2: [
    { id: 3, content: '日常保养选即食糕更省心，注意看配料表。', created_at: '2026-08-27 15:00:00', nickname: '识药小草', avatar_url: null },
    { id: 4, content: '传统胶块更适合炖煮入膳，看个人习惯。', created_at: '2026-08-27 16:20:00', nickname: '老药工阿福', avatar_url: null }
  ],
  3: [
    { id: 5, content: '年份差在香气醇厚度和油室转化，十年陈更温润。', created_at: '2026-08-26 21:10:00', nickname: '华夏本草掌柜', avatar_url: null }
  ]
}

export interface MockReview {
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

export const mockReviews: MockReview[] = [
  { id: 1, target_type: 'store', target_id: 1, score: 5, content: '包装非常扎实，人参带溯源证书，跟描述一致。', quality_score: 5, service_score: 5, logistics_score: 5, created_at: '2026-08-20 11:00:00', nickname: '老药工阿福', avatar_url: null },
  { id: 2, target_type: 'store', target_id: 1, score: 5, content: '客服很专业，介绍了不同参龄的区别。', quality_score: 5, service_score: 5, logistics_score: 4, created_at: '2026-08-19 15:30:00', nickname: '识药小草', avatar_url: null },
  { id: 3, target_type: 'product', target_id: 1, score: 5, content: '成色很正，跟描述一致，泡出来香气足。', quality_score: 5, service_score: 5, logistics_score: 5, created_at: '2026-08-18 09:10:00', nickname: '识药小草', avatar_url: null },
  { id: 4, target_type: 'product', target_id: 1, score: 4, content: '干净无异味，份量足，产地证书齐全。', quality_score: 4, service_score: 5, logistics_score: 4, created_at: '2026-08-17 20:45:00', nickname: '老药工阿福', avatar_url: null },
  { id: 5, target_type: 'product', target_id: 5, score: 5, content: '阿胶糕口感很好，独立包装方便携带。', quality_score: 5, service_score: 5, logistics_score: 5, created_at: '2026-08-16 12:00:00', nickname: '识药小草', avatar_url: null }
]

export interface MockOrder {
  id: number
  order_no: string
  store_id: number
  store_name: string
  receiver_name: string
  receiver_phone: string
  receiver_address: string
  total_amount: number
  status: string
  created_at: string
  items: string
}

export const mockOrders: MockOrder[] = [
  { id: 1, order_no: 'YH202608300000001', store_id: 1, store_name: '华夏本草旗舰店', receiver_name: '张三', receiver_phone: '13800000000', receiver_address: '北京市朝阳区测试路1号', total_amount: 268, status: 'paid', created_at: '2026-08-30 09:00:00', items: '[]' },
  { id: 2, order_no: 'YH202608280000002', store_id: 2, store_name: '云岭道地药材馆', receiver_name: '张三', receiver_phone: '13800000000', receiver_address: '北京市朝阳区测试路1号', total_amount: 128, status: 'shipped', created_at: '2026-08-28 14:20:00', items: '[]' },
  { id: 3, order_no: 'YH202608250000003', store_id: 3, store_name: '江南本草滋补馆', receiver_name: '张三', receiver_phone: '13800000000', receiver_address: '北京市朝阳区测试路1号', total_amount: 199, status: 'completed', created_at: '2026-08-25 10:30:00', items: '[]' }
]

export interface MockFavorite {
  id: number
  target_type: 'store' | 'product'
  target_id: number
  target_name: string
  created_at: string
}

export const mockFavorites: MockFavorite[] = [
  { id: 1, target_type: 'product', target_id: 1, target_name: '长白山野山参 · 15年足龄', created_at: '2026-08-26 08:00:00' },
  { id: 2, target_type: 'store', target_id: 2, target_name: '云岭道地药材馆', created_at: '2026-08-25 16:00:00' }
]

export const mockUser = {
  id: 1,
  nickname: '识药小草',
  phone: '13800000002',
  avatar_url: null,
  bio: null,
  gender: 'unknown',
  birthday: null,
  role: 'user',
  status: 'active'
}

// 图片占位（picsum，遵循图片 mock 规范）
export const IMG = {
  product: (id: number) => `https://picsum.photos/id/${id}/300/300`,
  banner: (id: number) => `https://picsum.photos/id/${id}/750/400`,
  avatar: (id: number) => `https://picsum.photos/id/${id}/200/200`
}

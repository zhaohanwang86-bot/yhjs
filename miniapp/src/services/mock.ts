// H5 预览 mock 请求分发：仅在非微信端使用
// 微信小程序端（weapp）由 api.ts 走真实后端 HTTP 请求
import {
  mockCategories,
  mockProducts,
  mockStores,
  mockPosts,
  mockComments,
  mockReviews,
  mockOrders,
  mockFavorites,
  mockUser
} from '@/data'
import type { ApiResult } from '@/types'

// 演示订单池（H5 预览内存态，刷新后重置）
let mockOrderList = [...mockOrders]

interface MockOptions {
  method?: string
  data?: Record<string, unknown>
}

function ok<T>(data: T, pagination?: ApiResult['pagination']): ApiResult<T> {
  return { ok: true, data, pagination }
}

function fail(message: string): ApiResult<never> {
  return { ok: false, data: null as never, message }
}

// 分页工具
function paginate<T>(list: T[], data: Record<string, unknown> | undefined): ApiResult<T[]> {
  const page = Number(data?.page || 1)
  const pageSize = Number(data?.pageSize || 20)
  const total = list.length
  const start = (page - 1) * pageSize
  return ok(list.slice(start, start + pageSize), { page, pageSize, total })
}

// 商品/店铺图片：mock 数据 image_url 为空，由组件 resolveImage 回落到本地对应图
// （src/data/images.ts 按 id 映射的本地图片，H5 与微信端展示一致）

export async function mockRequest<T = unknown>(path: string, options: MockOptions = {}): Promise<ApiResult<T>> {
  const method = options.method || 'GET'
  const data = options.data || {}
  console.log(`[Mock] ${method} ${path}`, data)

  // ---------- 分类 ----------
  if (path === '/categories') {
    return ok(mockCategories as unknown as T)
  }

  // ---------- 店铺 ----------
  if (path === '/stores') {
    return ok(mockStores as unknown as T)
  }
  const storeMatch = path.match(/^\/stores\/(\d+)$/)
  if (storeMatch && method === 'GET') {
    const id = Number(storeMatch[1])
    const store = mockStores.find((s) => s.id === id)
    if (!store) {
      return fail('店铺不存在')
    }
    const products = mockProducts.filter((p) => p.store_id === id)
    return ok({ ...store, products } as unknown as T)
  }

  // ---------- 商品 ----------
  if (path === '/products' && method === 'GET') {
    let list = mockProducts
    if (data.categoryId) {
      list = list.filter((p) => p.category_id === Number(data.categoryId))
    }
    if (data.keyword) {
      const kw = String(data.keyword)
      list = list.filter(
        (p) => p.name.includes(kw) || p.origin?.includes(kw) || p.store_name.includes(kw)
      )
    }
    const sort = String(data.sort || 'default')
    if (sort === 'rating') {
      list = [...list].sort((a, b) => b.rating - a.rating)
    } else if (sort === 'sales') {
      list = [...list].sort((a, b) => b.sales_count - a.sales_count)
    }
    return paginate(list, data) as unknown as ApiResult<T>
  }
  const productMatch = path.match(/^\/products\/(\d+)$/)
  if (productMatch && method === 'GET') {
    const id = Number(productMatch[1])
    const product = mockProducts.find((p) => p.id === id)
    if (!product) {
      return fail('药材不存在')
    }
    return ok(product as unknown as T)
  }

  // ---------- 评分 ----------
  if (path === '/reviews' && method === 'GET') {
    const list = mockReviews.filter(
      (r) => r.target_type === data.targetType && r.target_id === Number(data.targetId)
    )
    return ok(list as unknown as T)
  }

  // ---------- 帖子 ----------
  if (path === '/posts' && method === 'GET') {
    let list = mockPosts
    if (data.tag) {
      list = list.filter((p) => p.tag === data.tag)
    }
    return paginate(list, data) as unknown as ApiResult<T>
  }
  const postMatch = path.match(/^\/posts\/(\d+)$/)
  if (postMatch && method === 'GET') {
    const id = Number(postMatch[1])
    const post = mockPosts.find((p) => p.id === id)
    if (!post) {
      return fail('帖子不存在')
    }
    return ok(post as unknown as T)
  }
  const commentMatch = path.match(/^\/posts\/(\d+)\/comments$/)
  if (commentMatch && method === 'GET') {
    return ok((mockComments[Number(commentMatch[1])] || []) as unknown as T)
  }
  if (commentMatch && method === 'POST') {
    return ok({ id: Date.now() } as unknown as T)
  }
  const likeMatch = path.match(/^\/posts\/(\d+)\/like$/)
  if (likeMatch && method === 'POST') {
    return ok({ liked: true } as unknown as T)
  }

  // ---------- 登录 / 用户 ----------
  if (path === '/auth/login' || path === '/auth/register') {
    if (method === 'POST') {
      return ok({ token: 'mock-token-yhjs', user: mockUser } as unknown as T)
    }
  }
  if (path === '/auth/me' && method === 'GET') {
    return ok(mockUser as unknown as T)
  }
  if (path === '/auth/profile' && method === 'PUT') {
    return ok({ ...mockUser, ...(data as object) } as unknown as T)
  }
  if (path === '/auth/logout') {
    return ok(null as unknown as T)
  }

  // ---------- 收藏 ----------
  if (path === '/favorites' && method === 'GET') {
    return ok(mockFavorites as unknown as T)
  }
  if (path === '/favorites/toggle' && method === 'POST') {
    return ok({ favorited: true } as unknown as T)
  }

  // ---------- 订单 ----------
  if (path === '/orders' && method === 'GET') {
    return ok(mockOrderList as unknown as T)
  }
  if (path === '/orders' && method === 'POST') {
    const d = data as Record<string, unknown>
    const items = (d.items as { productId?: number; quantity?: number }[]) || []
    const storeId = Number(d.storeId)
    const store = mockStores.find((s) => s.id === storeId)
    const first = items[0] || {}
    const prod = mockProducts.find((p) => p.id === Number(first.productId))
    if (!store || !prod) {
      return fail('商品或店铺不存在')
    }
    const qty = Number(first.quantity) || 1
    const total = Number(prod.price) * qty
    const no = 'YH' + Date.now()
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const order = {
      id: Date.now(),
      order_no: no,
      store_id: store.id,
      store_name: store.name,
      receiver_name: String(d.receiverName || ''),
      receiver_phone: String(d.receiverPhone || ''),
      receiver_address: String(d.receiverAddress || ''),
      total_amount: total,
      status: 'pending_payment',
      created_at: now,
      items: JSON.stringify([
        { productId: prod.id, name: prod.name, price: prod.price, quantity: qty, subtotal: total }
      ])
    }
    mockOrderList = [order, ...mockOrderList]
    return ok({ id: order.id, orderNo: no, totalAmount: total, status: 'pending_payment' } as unknown as T)
  }
  const orderDetail = path.match(/^\/orders\/(\d+)$/)
  if (orderDetail && method === 'GET') {
    const oid = Number(orderDetail[1])
    const order = mockOrderList.find((o) => o.id === oid)
    if (!order) {
      return fail('订单不存在')
    }
    const store = mockStores.find((s) => s.id === order.store_id)
    return ok({ ...order, store_city: store?.city || '' } as unknown as T)
  }
  const orderAct = path.match(/^\/orders\/(\d+)\/(pay|cancel|confirm)$/)
  if (orderAct) {
    const oid = Number(orderAct[1])
    const act = orderAct[2]
    const order = mockOrderList.find((o) => o.id === oid)
    if (!order) {
      return fail('订单不存在')
    }
    if (act === 'pay' && order.status === 'pending_payment') {
      order.status = 'paid'
    } else if (act === 'cancel' && order.status === 'pending_payment') {
      order.status = 'cancelled'
    } else if (act === 'confirm' && order.status === 'shipped') {
      order.status = 'completed'
    } else {
      return fail('当前状态不允许该操作')
    }
    return ok(null as unknown as T)
  }

  // ---------- AI 客服（H5 预览简易本地回答） ----------
  if (path === '/ai/chat' && method === 'POST') {
    const d = data as { messages?: { role?: string; content?: string }[] }
    const last = [...(d.messages || [])].reverse().find((m) => m.role === 'user')
    const text = last?.content || ''
    let reply: string
    if (/枸杞|红枣|补血/.test(text)) {
      reply = '枸杞性平味甘，归肝、肾经，可养肝明目、滋补肝肾。日常可取 10-15 粒泡水或煲汤。注意事项：感冒发热、腹泻期间不宜食用；血糖偏高者需控制用量。平台「宁夏头茬枸杞」500g 装是不错的选择，可在分类「药食同源」中找到哦～'
    } else if (/祛湿|湿气|薏米/.test(text)) {
      reply = '祛湿常见思路是健脾利湿：可常食薏米、赤小豆、茯苓、山药等，少食生冷油腻。推荐红豆薏米粥或山药排骨汤。需要说明的是，中医讲究辨证，若症状明显建议线下找中医面诊。'
    } else if (/入驻|商家|开店/.test(text)) {
      reply = '入驻流程：1) 用普通用户账号在「我的 → 入驻商家」填写店铺名称、城市、联系人、电话、类型与主营品类提交；2) 平台 1-3 个工作日审核；3) 审核通过后退出重新登录，即可在「我的 → 商家工作台」上架经营。'
    } else if (/订单|下单|支付|退款|收货/.test(text)) {
      reply = '选购商品后点击「立即购买」，填写收货信息提交订单，随后在「我的订单」里可去支付（当前为演示支付）。商家发货后订单变为「已发货」，你确认收货后交易完成。任何状态问题都可在订单页操作。'
    } else if (/失眠|睡眠|安神/.test(text)) {
      reply = '改善睡眠可尝试酸枣仁、百合、莲子、桂圆等安神食材，如莲子百合瘦肉汤。睡前一小时减少手机使用，保持规律作息。若长期失眠，请务必咨询专业医生。'
    } else {
      reply = '我是「炎黄济世」AI 养生顾问。可以问我：各类药材的食用方法、应季食疗、平台商品查找、下单与订单、商家入驻等。演示预览版为固定知识回复，正式接入 DeepSeek 后即可自由对话。'
    }
    return ok({ reply } as unknown as T)
  }

  return fail(`Mock 未实现：${method} ${path}`)
}

// 通用工具函数

// 价格格式化：转成保留两位小数的字符串
export function formatPrice(value: string | number | null | undefined): string {
  const num = Number(value || 0)
  return num.toFixed(2)
}

// 时间格式化：展示为 yyyy-MM-dd HH:mm
export function formatTime(value: string | null | undefined): string {
  if (!value) {
    return ''
  }
  return String(value).replace('T', ' ').substring(0, 16)
}

// 商品/店铺图片兜底
export function resolveImage(url: string | null | undefined, fallback: string): string {
  return url || fallback
}

// 评分展示：保留一位小数
export function formatRating(value: string | number | null | undefined): string {
  return Number(value || 0).toFixed(1)
}

// 数量缩写：如 186200 -> 18.6w
export function formatCount(value: string | number | null | undefined): string {
  const num = Number(value || 0)
  if (num >= 10000) {
    return (num / 10000).toFixed(1).replace(/\.0$/, '') + 'w'
  }
  return String(num)
}

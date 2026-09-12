import Taro from '@tarojs/taro'
import { BASE_URL, TOKEN_KEY } from '@/config'
import { mockRequest } from './mock'
import type { ApiResult } from '@/types'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: Record<string, unknown>
}

// 平台分流：H5 预览（非微信端）走 mock 数据；微信小程序端走真实后端 API
const isWeapp = process.env.TARO_ENV === 'weapp'

// 统一请求封装：自动携带 Bearer token，解析 { ok, data, message } 结构
export async function request<T = unknown>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  if (!isWeapp) {
    return mockRequest<T>(path, options)
  }
  const token = Taro.getStorageSync(TOKEN_KEY) || ''
  const header: Record<string, string> = {
    'Content-Type': 'application/json',
    // 兼容 localtunnel 隧道：绕过其浏览器提醒页（511）
    'bypass-tunnel-reminder': '1'
  }
  if (token) {
    header.Authorization = `Bearer ${token}`
  }
  console.log(`[API] ${options.method || 'GET'} ${path}`, options.data || '')
  try {
    const res = await Taro.request({
      url: `${BASE_URL}${path}`,
      method: options.method || 'GET',
      data: options.data,
      header
    })
    const payload = res.data as ApiResult<T>
    if (res.statusCode < 200 || res.statusCode >= 300 || payload.ok === false) {
      const message = payload.message || `请求失败（${res.statusCode}）`
      console.error(`[API] ${path} failed:`, message)
      throw new Error(message)
    }
    return payload
  } catch (err) {
    console.error(`[API] ${path} error:`, err)
    throw err
  }
}

export function apiGet<T = unknown>(path: string, data?: Record<string, unknown>): Promise<ApiResult<T>> {
  return request<T>(path, { method: 'GET', data })
}

export function apiPost<T = unknown>(path: string, data?: Record<string, unknown>): Promise<ApiResult<T>> {
  return request<T>(path, { method: 'POST', data })
}

export function apiPut<T = unknown>(path: string, data?: Record<string, unknown>): Promise<ApiResult<T>> {
  return request<T>(path, { method: 'PUT', data })
}

// 与后端一致的请求封装：Bearer token + 可配置 API 基址
const TOKEN_KEY = 'yhjs_token'

// 开发环境：相对 /api → 由 Vite 代理转发到 localhost:49996
// 生产环境：直连微信云托管后端（前端部署到阿里云等独立域名时，后端 CORS 已放开 /api/**）
// 如需临时换后端，可用环境变量 VITE_API_BASE 覆盖（值需以 /api 结尾）
const API_BASE = import.meta.env.VITE_API_BASE
  || (import.meta.env.DEV ? '/api' : 'https://yhjs-305651-5-1478144094.sh.run.tcloudbase.com/api')

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY) || ''
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (token) headers.Authorization = 'Bearer ' + token

  const res = await fetch(API_BASE + path, {
    method: options.method || 'GET',
    headers,
    body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined
  })
  let payload = {}
  try {
    payload = await res.json()
  } catch (e) {
    /* 忽略非 JSON */
  }
  if (!res.ok || payload.ok === false) {
    throw new Error(payload.message || '请求失败（' + res.status + '）')
  }
  return payload
}

export function apiGet(path, params) {
  const qs = params
    ? '?' + Object.keys(params).filter((k) => params[k] !== undefined && params[k] !== '' && params[k] !== null)
        .map((k) => k + '=' + encodeURIComponent(params[k])).join('&')
    : ''
  return apiRequest(path + qs)
}

export function apiPost(path, body) {
  return apiRequest(path, { method: 'POST', body })
}

export function apiPut(path, body) {
  return apiRequest(path, { method: 'PUT', body })
}

export function isLoggedIn() {
  return !!localStorage.getItem(TOKEN_KEY)
}

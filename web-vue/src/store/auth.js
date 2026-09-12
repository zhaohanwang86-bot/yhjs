// 登录会话（响应式，供头部/页面共享）
import { reactive } from 'vue'

function readUser() {
  try { return JSON.parse(localStorage.getItem('yhjs_user') || 'null') } catch (e) { return null }
}

export const auth = reactive({
  token: localStorage.getItem('yhjs_token') || '',
  user: readUser()
})

export function setSession(result) {
  const data = (result && result.data) || result || {}
  auth.token = data.token || auth.token
  auth.user = data.user || readUser()
  localStorage.setItem('yhjs_token', auth.token)
  if (auth.user) localStorage.setItem('yhjs_user', JSON.stringify(auth.user))
}

export function setUser(u) {
  auth.user = u
  localStorage.setItem('yhjs_user', JSON.stringify(u))
}

export function clearSession() {
  auth.token = ''
  auth.user = null
  localStorage.removeItem('yhjs_token')
  localStorage.removeItem('yhjs_user')
}

export function isLoggedIn() {
  return !!auth.token
}

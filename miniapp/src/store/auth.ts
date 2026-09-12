import { create } from 'zustand'
import Taro from '@tarojs/taro'
import { TOKEN_KEY } from '@/config'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  token: string
  setAuth: (token: string, user: User) => void
  setUser: (user: User) => void
  logout: () => void
  isLoggedIn: () => boolean
}

function readToken(): string {
  return Taro.getStorageSync(TOKEN_KEY) || ''
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: readToken(),
  setAuth: (token, user) => {
    Taro.setStorageSync(TOKEN_KEY, token)
    set({ token, user })
  },
  setUser: (user) => set({ user }),
  logout: () => {
    Taro.removeStorageSync(TOKEN_KEY)
    set({ token: '', user: null })
  },
  isLoggedIn: () => Boolean(get().token)
}))

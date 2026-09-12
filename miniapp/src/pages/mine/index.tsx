import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { apiGet, apiPost } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import type { User } from '@/types'
import styles from './index.module.scss'

const ROLE_NAMES: Record<string, string> = {
  user: '平台用户',
  merchant: '商家',
  admin: '管理员'
}

const MinePage: React.FC = () => {
  const { user, token, setUser, logout, isLoggedIn } = useAuthStore()
  const [me, setMe] = useState<User | null>(user)

  const loadMe = useCallback(async () => {
    if (!isLoggedIn()) {
      return
    }
    try {
      const res = await apiGet<User>('/auth/me')
      setMe(res.data)
      setUser(res.data)
    } catch (err) {
      console.error('[Mine] loadMe error:', err)
    }
  }, [isLoggedIn, setUser])

  useDidShow(() => {
    loadMe()
  })

  useEffect(() => {
    setMe(user)
  }, [user])

  const goLogin = () => {
    Taro.navigateTo({ url: '/pages/login/index' })
  }

  const goOrders = () => {
    if (!isLoggedIn()) {
      goLogin()
      return
    }
    Taro.navigateTo({ url: '/pages/orders/index' })
  }

  const goFavorites = () => {
    if (!isLoggedIn()) {
      goLogin()
      return
    }
    Taro.navigateTo({ url: '/pages/favorites/index' })
  }

  const goMerchant = () => {
    if (!isLoggedIn()) {
      goLogin()
      return
    }
    Taro.navigateTo({ url: '/pages/merchant/index' })
  }

  const goAdmin = () => {
    if (!isLoggedIn()) {
      goLogin()
      return
    }
    Taro.navigateTo({ url: '/pages/admin/index' })
  }

  const goJoin = () => {
    if (!isLoggedIn()) {
      goLogin()
      return
    }
    Taro.navigateTo({ url: '/pages/join/index' })
  }

  const goAi = () => {
    if (!isLoggedIn()) {
      goLogin()
      return
    }
    Taro.navigateTo({ url: '/pages/ai/index' })
  }

  const handleLogout = async () => {
    try {
      await apiPost('/auth/logout')
    } catch (err) {
      console.error('[Mine] logout error:', err)
    }
    logout()
    setMe(null)
    Taro.showToast({ title: '已退出登录', icon: 'none' })
  }

  const avatarText = me?.nickname ? me.nickname.charAt(0) : '炎'

  return (
    <View className={styles.page}>
      <View className={styles.userCard} onClick={me ? undefined : goLogin}>
        {me?.avatar_url ? (
          <Image className={styles.avatar} src={me.avatar_url} mode='aspectFill' />
        ) : (
          <View className={styles.avatar}>
            <Text>{avatarText}</Text>
          </View>
        )}
        <View className={styles.userInfo}>
          {me ? (
            <>
              <Text className={styles.nickname}>{me.nickname}</Text>
              <Text className={styles.phone}>{me.phone}</Text>
              <Text className={styles.rolePill}>{ROLE_NAMES[me.role] || '平台用户'}</Text>
            </>
          ) : (
            <Text className={styles.loginHint}>点击登录，开启养生之旅 ›</Text>
          )}
        </View>
      </View>

      {token && (
        <View className={styles.entryGrid}>
          <View className={styles.entryItem} onClick={goOrders}>
            <Text className={styles.entryIcon}>📦</Text>
            <Text className={styles.entryName}>我的订单</Text>
          </View>
          <View className={styles.entryItem} onClick={goFavorites}>
            <Text className={styles.entryIcon}>⭐</Text>
            <Text className={styles.entryName}>我的收藏</Text>
          </View>
          {me?.role === 'user' && (
            <View className={styles.entryItem} onClick={goJoin}>
              <Text className={styles.entryIcon}>🏪</Text>
              <Text className={styles.entryName}>入驻商家</Text>
            </View>
          )}
          {me?.role === 'merchant' && (
            <View className={styles.entryItem} onClick={goMerchant}>
              <Text className={styles.entryIcon}>🏪</Text>
              <Text className={styles.entryName}>商家工作台</Text>
            </View>
          )}
          {me?.role === 'admin' && (
            <View className={styles.entryItem} onClick={goAdmin}>
              <Text className={styles.entryIcon}>🛡️</Text>
              <Text className={styles.entryName}>管理后台</Text>
            </View>
          )}
        </View>
      )}

      <View className={styles.listCard}>
        <View className={styles.listItem} onClick={goAi}>
          <Text className={styles.listLabel}>🤖 AI 养生顾问</Text>
          <Text className={styles.arrow}>›</Text>
        </View>
        <View className={styles.listItem} onClick={goFavorites}>
          <Text className={styles.listLabel}>我的收藏</Text>
          <Text className={styles.arrow}>›</Text>
        </View>
        <View className={styles.listItem} onClick={goOrders}>
          <Text className={styles.listLabel}>我的订单</Text>
          <Text className={styles.arrow}>›</Text>
        </View>
        <View className={styles.listItem}>
          <Text className={styles.listLabel}>关于炎黄济世</Text>
          <Text className={styles.arrow}>›</Text>
        </View>
      </View>

      {token && (
        <View className={styles.logoutBtn} onClick={handleLogout}>
          <Text className={styles.logoutText}>退出登录</Text>
        </View>
      )}
    </View>
  )
}

export default MinePage

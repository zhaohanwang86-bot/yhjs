import React, { useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import { apiPost } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import type { User } from '@/types'
import styles from './index.module.scss'

interface LoginResult {
  token: string
  user: User
}

const LoginPage: React.FC = () => {
  const setAuth = useAuthStore((s) => s.setAuth)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!/^1\d{10}$/.test(phone)) {
      Taro.showToast({ title: '请输入11位手机号', icon: 'none' })
      return
    }
    if (password.length < 6) {
      Taro.showToast({ title: '密码至少6位', icon: 'none' })
      return
    }
    if (mode === 'register' && !nickname.trim()) {
      Taro.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }
    setSubmitting(true)
    try {
      const body: Record<string, unknown> = { phone, password }
      if (mode === 'register') {
        body.nickname = nickname.trim()
      }
      const res = await apiPost<LoginResult>(mode === 'login' ? '/auth/login' : '/auth/register', body)
      setAuth(res.data.token, res.data.user)
      Taro.showToast({ title: mode === 'login' ? '登录成功' : '注册成功', icon: 'success' })
      setTimeout(() => {
        Taro.navigateBack()
      }, 500)
    } catch (err) {
      console.error('[Login] submit error:', err)
      Taro.showToast({ title: err instanceof Error ? err.message : '操作失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className={styles.page}>
      <View className={styles.brand}>
        <Text className={styles.title}>炎黄济世</Text>
        <Text className={styles.slogan}>道地药材 · 品质养生</Text>
      </View>

      <View className={styles.card}>
        <View className={styles.tabs}>
          <Text
            className={classnames(styles.tab, mode === 'login' && styles.tabActive)}
            onClick={() => setMode('login')}
          >
            登录
          </Text>
          <Text
            className={classnames(styles.tab, mode === 'register' && styles.tabActive)}
            onClick={() => setMode('register')}
          >
            注册
          </Text>
        </View>

        {mode === 'register' && (
          <Input
            className={styles.input}
            placeholder='昵称'
            value={nickname}
            onInput={(e) => setNickname(e.detail.value)}
          />
        )}
        <Input
          className={styles.input}
          placeholder='手机号'
          type='number'
          maxlength={11}
          value={phone}
          onInput={(e) => setPhone(e.detail.value)}
        />
        <Input
          className={styles.input}
          placeholder='密码（至少6位）'
          password
          value={password}
          onInput={(e) => setPassword(e.detail.value)}
        />

        <View className={styles.submitBtn} onClick={submit}>
          <Text className={styles.submitText}>{submitting ? '处理中…' : mode === 'login' ? '登 录' : '注 册'}</Text>
        </View>
        <Text className={styles.tip}>
          {mode === 'login' ? '还没有账号？' : '已有账号？'}
          <Text className={styles.tipLink} onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? '立即注册' : '去登录'}
          </Text>
        </Text>
      </View>
    </View>
  )
}

export default LoginPage

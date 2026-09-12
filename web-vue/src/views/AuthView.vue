<script setup>
// 登录 / 注册（由旧 auth.html 1:1 移植）
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiPost } from '../api'
import { setSession } from '../store/auth'

const route = useRoute()
const router = useRouter()

const mode = ref('login')
const nickname = ref('')
const phone = ref('')
const password = ref('')
const error = ref('')
const submitting = ref(false)

function switchAuth(m) {
  mode.value = m
  error.value = ''
}

async function submit() {
  error.value = '提交中…'
  submitting.value = true
  try {
    let result
    if (mode.value === 'login') {
      result = await apiPost('/auth/login', { phone: phone.value, password: password.value })
    } else {
      result = await apiPost('/auth/register', { nickname: nickname.value, phone: phone.value, password: password.value })
    }
    setSession(result)
    const redirectUrl = String(route.query.redirect || '')
    const role = result.data.user.role
    let target = redirectUrl && redirectUrl !== '/auth' ? redirectUrl : ''
    if (!target) {
      if (role === 'admin') target = '/admin'
      else if (role === 'merchant') target = '/merchant'
      else target = '/'
    }
    router.replace(target)
  } catch (e) {
    error.value = e.message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="container">
    <div class="breadcrumb">
      <router-link to="/">首页</router-link><span class="sep">/</span><span>账户中心</span>
    </div>

    <div class="auth-shell">
      <div class="auth-card">
        <h1 class="serif">炎黄济世</h1>
        <div class="auth-sub">注册即成为平台用户，开店请登录后单独申请入驻</div>
        <div class="auth-tabs">
          <button :class="{ on: mode === 'login' }" @click="switchAuth('login')">登录</button>
          <button :class="{ on: mode === 'register' }" @click="switchAuth('register')">注册</button>
        </div>
        <form class="auth-form" @submit.prevent="submit()">
          <div v-if="mode === 'register'" class="form-group">
            <label>昵称</label>
            <input v-model="nickname" required placeholder="请输入昵称">
          </div>
          <div class="form-group">
            <label>手机号</label>
            <input v-model="phone" required pattern="1[0-9]{10}" maxlength="11" placeholder="请输入11位手机号">
          </div>
          <div class="form-group">
            <label>密码</label>
            <input v-model="password" required minlength="6" type="password" placeholder="至少6位密码">
          </div>
          <div class="auth-error">{{ error }}</div>
          <button class="btn btn-primary" type="submit" :disabled="submitting">{{ mode === 'login' ? '登录' : '注册并登录' }}</button>
        </form>
        <div class="auth-tip">
          账户安全提示：密码仅以加密哈希形式保存。注册后如需开店，请登录后从“商家入驻”单独提交店铺资质申请。
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-shell { max-width: 460px; margin: 52px auto; }
.auth-card { background: #fff; border: 1px solid var(--line); border-radius: 16px; padding: 30px; box-shadow: var(--shadow); }
.auth-card h1 { text-align: center; font-size: 25px; letter-spacing: 3px; margin-bottom: 8px; }
.auth-sub { text-align: center; color: var(--ink-light); font-size: 13px; margin-bottom: 22px; }
.auth-tabs { display: flex; border-bottom: 1px solid var(--line); margin-bottom: 20px; }
.auth-tabs button { flex: 1; padding: 10px; color: var(--ink-light); border-bottom: 2px solid transparent; }
.auth-tabs button.on { color: var(--red); border-color: var(--red); font-weight: 600; }
.auth-form .form-group { margin-bottom: 14px; }
.auth-form label { display: block; font-size: 13px; margin-bottom: 6px; color: var(--ink-light); }
.auth-form input, .auth-form select { width: 100%; padding: 11px 13px; border: 1px solid var(--line); border-radius: 8px; background: var(--paper); outline: none; }
.auth-form input:focus, .auth-form select:focus { border-color: var(--red); background: #fff; }
.auth-form .btn { width: 100%; justify-content: center; margin-top: 8px; }
.auth-form .btn:disabled { opacity: .6; cursor: not-allowed; }
.auth-tip { margin-top: 18px; padding: 12px; background: var(--jade-light); color: var(--ink-light); border-radius: 8px; font-size: 12px; line-height: 1.8; }
.auth-error { color: var(--red); min-height: 22px; font-size: 13px; margin: 8px 0; }
</style>

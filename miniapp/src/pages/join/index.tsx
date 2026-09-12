import React, { useCallback, useState } from 'react'
import { View, Text, Input, Textarea, Picker } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { apiGet, apiPost } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import { formatTime } from '@/utils/format'
import styles from './index.module.scss'

const STORE_TYPES = ['中医药店 / 老字号', '药材批发商', '滋补品品牌商', '农户 / 合作社', '其他']

const MAIN_CATEGORIES = [
  '参茸滋补',
  '花茶养生',
  '药食同源',
  '精品饮片',
  '中成药',
  '滋补膏方',
  '艾灸理疗',
  '药膳汤料'
]

interface MyApplication {
  id: number
  store_name: string
  city: string
  store_type?: string
  main_category?: string
  status: string
  review_note?: string
  created_at: string
  reviewed_at?: string
}

function appStatusClass(status: string): string {
  if (status === 'approved') return styles.pillGreen
  if (status === 'pending') return styles.pillGold
  return styles.pillGray
}

function appStatusText(status: string): string {
  return { pending: '待审核', approved: '已通过', rejected: '已驳回' }[status] || status
}

const JoinPage: React.FC = () => {
  const { isLoggedIn } = useAuthStore()
  const [app, setApp] = useState<MyApplication | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    storeName: '',
    city: '',
    contactName: '',
    contactPhone: '',
    storeType: STORE_TYPES[0],
    mainCategory: MAIN_CATEGORIES[0],
    introduction: '',
    qualificationNote: ''
  })

  const loadMine = useCallback(async () => {
    if (!isLoggedIn()) return
    try {
      const res = await apiGet<MyApplication[]>('/merchant-applications/mine')
      setApp((res.data && res.data.length ? res.data[0] : null) || null)
    } catch (err) {
      console.error('[Join] loadMine error:', err)
    } finally {
      setLoaded(true)
    }
  }, [isLoggedIn])

  useDidShow(() => {
    if (!isLoggedIn()) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    loadMine()
  })

  const submit = async () => {
    if (!form.storeName.trim() || !form.city.trim() || !form.contactName.trim() || !form.contactPhone.trim()) {
      Taro.showToast({ title: '请填写店铺名称、城市、联系人和电话', icon: 'none' })
      return
    }
    setSubmitting(true)
    try {
      await apiPost('/merchant-applications', {
        storeName: form.storeName.trim(),
        city: form.city.trim(),
        contactName: form.contactName.trim(),
        contactPhone: form.contactPhone.trim(),
        storeType: form.storeType,
        mainCategory: form.mainCategory,
        introduction: form.introduction.trim(),
        qualificationNote: form.qualificationNote.trim()
      })
      Taro.showModal({
        title: '申请已提交',
        content: '感谢对「炎黄济世」的信任！招商专员将在 3 个工作日内与你联系。',
        showCancel: false,
        confirmText: '好的'
      })
      setForm({
        storeName: '',
        city: '',
        contactName: '',
        contactPhone: '',
        storeType: STORE_TYPES[0],
        mainCategory: MAIN_CATEGORIES[0],
        introduction: '',
        qualificationNote: ''
      })
      loadMine()
    } catch (err) {
      Taro.showToast({ title: (err as Error).message || '提交失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  const canApply = app === null || app.status === 'rejected'

  const renderStatusCard = () => {
    if (!app) return null
    const approved = app.status === 'approved'
    const pending = app.status === 'pending'
    return (
      <View className={styles.card}>
        <Text className={styles.cardTitle}>入驻进度</Text>
        {pending && (
          <Text className={styles.subText}>你的申请已提交，平台正在审核中（1-3 个工作日），请耐心等待。</Text>
        )}
        {approved && (
          <Text className={styles.subText}>恭喜，资质已审核通过！请退出后重新登录，即可在「我的」进入商家工作台。</Text>
        )}
        {app.status === 'rejected' && (
          <Text className={styles.subText}>很抱歉，本次申请未通过。你可以修改资料后重新提交。</Text>
        )}
        <View className={styles.appRow}>
          <Text className={styles.appName}>{app.store_name}</Text>
          <Text className={`${styles.pill} ${appStatusClass(app.status)}`}>{appStatusText(app.status)}</Text>
        </View>
        <Text className={styles.appMeta}>城市：{app.city} · 类型：{app.store_type || '-'}</Text>
        <Text className={styles.appMeta}>主营：{app.main_category || '-'}</Text>
        {app.review_note && <Text className={styles.appNote}>驳回原因：{app.review_note}</Text>}
        <Text className={styles.appTime}>申请时间：{formatTime(app.created_at)}</Text>
        {approved && (
          <View className={styles.tipBox}>
            <Text className={styles.tipText}>账号角色已切换为「商家」。退出登录后用相同账号重新登录，即可使用商家工作台。</Text>
          </View>
        )}
      </View>
    )
  }

  return (
    <View className={styles.page}>
      <View className={styles.hero}>
        <Text className={styles.heroTitle}>诚邀入驻 · 让好药材被看见</Text>
        <Text className={styles.heroSub}>面向全国中医药店、药材商、滋补品牌开放入驻，共建覆盖店铺与药材评价的中医药选购平台。</Text>
      </View>

      {loaded && renderStatusCard()}

      {canApply && (
        <View className={styles.card}>
          <Text className={styles.cardTitle}>入驻申请表</Text>
          <Text className={styles.reqTip}>标注 * 为必填项</Text>

          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>店铺名称 <Text className={styles.req}>*</Text></Text>
            <Input className={styles.formInput} value={form.storeName} placeholder='如：华夏本草旗舰店'
              onInput={(e) => setForm((f) => ({ ...f, storeName: e.detail.value }))} />
          </View>
          <View className={styles.formRow}>
            <View className={`${styles.formGroup} ${styles.flex1}`}>
              <Text className={styles.formLabel}>所在城市 <Text className={styles.req}>*</Text></Text>
              <Input className={styles.formInput} value={form.city} placeholder='如：北京'
                onInput={(e) => setForm((f) => ({ ...f, city: e.detail.value }))} />
            </View>
            <View className={`${styles.formGroup} ${styles.flex1}`}>
              <Text className={styles.formLabel}>联系人 <Text className={styles.req}>*</Text></Text>
              <Input className={styles.formInput} value={form.contactName} placeholder='负责人姓名'
                onInput={(e) => setForm((f) => ({ ...f, contactName: e.detail.value }))} />
            </View>
          </View>
          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>联系电话 <Text className={styles.req}>*</Text></Text>
            <Input className={styles.formInput} type='number' value={form.contactPhone} placeholder='手机号 / 座机'
              onInput={(e) => setForm((f) => ({ ...f, contactPhone: e.detail.value }))} />
          </View>
          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>店铺类型</Text>
            <Picker mode='selector' range={STORE_TYPES} value={STORE_TYPES.indexOf(form.storeType)}
              onChange={(e) => setForm((f) => ({ ...f, storeType: STORE_TYPES[Number(e.detail.value)] }))}>
              <View className={styles.formPicker}>{form.storeType} ›</View>
            </Picker>
          </View>
          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>主营品类</Text>
            <Picker mode='selector' range={MAIN_CATEGORIES} value={MAIN_CATEGORIES.indexOf(form.mainCategory)}
              onChange={(e) => setForm((f) => ({ ...f, mainCategory: MAIN_CATEGORIES[Number(e.detail.value)] }))}>
              <View className={styles.formPicker}>{form.mainCategory} ›</View>
            </Picker>
          </View>
          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>店铺简介</Text>
            <Textarea className={styles.formTextarea} value={form.introduction} placeholder='介绍你的店铺特色、主打药材、经营年限等，让平台更了解你'
              onInput={(e) => setForm((f) => ({ ...f, introduction: e.detail.value }))} />
          </View>
          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>资质说明（营业执照、产地证书等，可在后续商家后台补充）</Text>
            <Textarea className={styles.formTextarea} value={form.qualificationNote} placeholder='简要说明可提供的资质材料……'
              onInput={(e) => setForm((f) => ({ ...f, qualificationNote: e.detail.value }))} />
          </View>

          <View className={`${styles.submitBtn} ${submitting ? styles.submitBtnDisabled : ''}`} onClick={submit}>
            <Text className={styles.submitText}>{submitting ? '提交中…' : '提交入驻申请'}</Text>
          </View>
        </View>
      )}

      {loaded && !canApply && app && app.status !== 'approved' && (
        <View className={styles.card}>
          <Text className={styles.cardTitle}>商家工作台在哪里？</Text>
          <Text className={styles.subText}>审核通过后，重新登录即可在「我的」页面看到「商家工作台」入口。</Text>
        </View>
      )}
    </View>
  )
}

export default JoinPage

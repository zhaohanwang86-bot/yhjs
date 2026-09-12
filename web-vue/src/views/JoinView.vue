<script setup>
// 商家入驻（由旧 join.html 1:1 移植）
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiPost } from '../api'
import { isLoggedIn } from '../store/auth'
import { showToast } from '../ui'

const router = useRouter()
const showModal = ref(false)
const form = reactive({
  storeName: '', city: '', contactName: '', contactPhone: '',
  storeType: '中医药店 / 老字号', mainCategory: '参茸滋补', introduction: '', qualificationNote: ''
})

const STEPS = [
  { n: '1', t: '提交入驻申请', d: '填写店铺信息与基础资质，提交后进入审核流程' },
  { n: '2', t: '资质审核', d: '平台审核营业执照、产地资质等材料（1-3 个工作日）' },
  { n: '3', t: '签订协议', d: '线上签署入驻协议，开通商家后台' },
  { n: '4', t: '上架经营', d: '上架药材，并在店铺评分和社区内容中获得展示机会' }
]
const BENEFITS = [
  { ico: '📊', t: '双维评分体系', d: '店铺与每味药材均可被用户评分，优质商家可通过口碑积累获得更多展示机会，用户也能更直观地了解店铺质量。' },
  { ico: '📣', t: '社区种草引流', d: '入驻商家可在养生社区发起话题、发布科普，社区内容有机会为店铺带来更多关注与访问。' },
  { ico: '🔍', t: '道地溯源背书', d: '平台协助上传产地证书和质检报告，帮助用户了解商品信息，提升下单意愿。' }
]
const TYPES = ['中医药店 / 老字号', '药材批发商', '滋补品品牌商', '农户 / 合作社', '其他']
const CATS = ['参茸滋补', '花茶养生', '药食同源', '精品饮片', '中成药', '滋补膏方', '艾灸理疗', '药膳汤料']

async function submitJoin() {
  if (!isLoggedIn()) {
    router.push({ name: 'auth', query: { redirect: '/join' } })
    return
  }
  const body = {
    storeName: form.storeName.trim(),
    city: form.city.trim(),
    contactName: form.contactName.trim(),
    contactPhone: form.contactPhone.trim(),
    storeType: form.storeType,
    mainCategory: form.mainCategory,
    introduction: form.introduction.trim(),
    qualificationNote: form.qualificationNote.trim()
  }
  try {
    await apiPost('/merchant-applications', body)
    showModal.value = true
    Object.assign(form, { storeName: '', city: '', contactName: '', contactPhone: '', introduction: '', qualificationNote: '' })
  } catch (e) {
    showToast('提交失败：' + (e.message || '未知错误'))
  }
}
</script>

<template>
  <div class="container">
    <div class="breadcrumb">
      <router-link to="/">首页</router-link><span class="sep">/</span><span>商家入驻</span>
    </div>

    <div class="join-hero">
      <h1 class="serif">诚邀入驻 · 让好药材被看见</h1>
      <p>炎黄济世面向全国中医药店、药材商、滋补品牌开放入驻，共建覆盖店铺与药材评价的中医药选购平台。</p>
    </div>

    <div class="join-steps">
      <div v-for="x in STEPS" :key="x.n" class="join-step">
        <div class="num">{{ x.n }}</div><h3>{{ x.t }}</h3><p>{{ x.d }}</p>
      </div>
    </div>

    <div class="join-benefits">
      <div v-for="x in BENEFITS" :key="x.t" class="join-benefit">
        <div class="ico">{{ x.ico }}</div><h3>{{ x.t }}</h3><p>{{ x.d }}</p>
      </div>
    </div>

    <div class="join-form-wrap">
      <h2 class="serif">入驻申请表</h2>
      <div class="sub-tip">标注 <span style="color:var(--red)">*</span> 为必填项</div>
      <form @submit.prevent="submitJoin()">
        <div class="form-grid">
          <div class="form-group"><label>店铺名称 <span class="req">*</span></label><input v-model="form.storeName" required placeholder="如：华夏本草旗舰店"></div>
          <div class="form-group"><label>所在城市 <span class="req">*</span></label><input v-model="form.city" required placeholder="如：北京"></div>
          <div class="form-group"><label>联系人 <span class="req">*</span></label><input v-model="form.contactName" required placeholder="负责人姓名"></div>
          <div class="form-group"><label>联系电话 <span class="req">*</span></label><input v-model="form.contactPhone" required type="tel" placeholder="手机号 / 座机"></div>
          <div class="form-group">
            <label>店铺类型</label>
            <select v-model="form.storeType"><option v-for="t in TYPES" :key="t">{{ t }}</option></select>
          </div>
          <div class="form-group">
            <label>主营品类</label>
            <select v-model="form.mainCategory"><option v-for="c in CATS" :key="c">{{ c }}</option></select>
          </div>
          <div class="form-group full"><label>店铺简介</label><textarea v-model="form.introduction" placeholder="介绍你的店铺特色、主打药材、经营年限等，让平台更了解你"></textarea></div>
          <div class="form-group full"><label>资质说明（营业执照、产地证书等，可在后续商家后台补充）</label><textarea v-model="form.qualificationNote" placeholder="简要说明可提供的资质材料……"></textarea></div>
        </div>
        <div class="form-submit"><button class="btn btn-primary" type="submit">提交入驻申请</button></div>
      </form>
    </div>

    <!-- 提交成功弹窗 -->
    <div v-if="showModal" class="modal-mask show" @click.self="showModal = false">
      <div class="modal">
        <div class="check">✓</div>
        <h3 class="serif">申请已提交</h3>
        <p>感谢对「炎黄济世」的信任！<br>招商专员将在 3 个工作日内与你联系。<br><br>（当前为体验版本，提交信息仅用于本地演示）</p>
        <button class="btn btn-primary" @click="showModal = false">好的</button>
      </div>
    </div>
  </div>
</template>

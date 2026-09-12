// 全局轻提示 / 帮助中心（由旧 js/main.js 1:1 移植）
import { reactive } from 'vue'

export const ui = reactive({ toast: '', helpOpen: false, helpTab: 'faq' })

let toastTimer = null
export function showToast(msg) {
  ui.toast = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { ui.toast = '' }, 2200)
}

export function openHelp(k) {
  ui.helpTab = k || 'faq'
  ui.helpOpen = true
}
export function closeHelp() {
  ui.helpOpen = false
}
export function switchHelp(k) {
  ui.helpTab = k
}

export const HELP_SECTIONS = {
  faq: {
    title: '常见问题',
    body: '<div class="faq-item"><b>Q1 如何辨别道地药材的真假？</b><p>平台要求每家入驻店铺上传产地证书与质检报告，商品页可查看「全程可溯」。日常可参考芦、艼、体、须等外观鉴别要点。</p></div>' +
      '<div class="faq-item"><b>Q2 评分是如何计算的？</b><p>店铺评分与每味药材评分相互独立，由「历史买家评分 + 平台质检」加权得出。你的每一条真实评价都会实时计入对应总分。</p></div>' +
      '<div class="faq-item"><b>Q3 购买后不满意怎么办？</b><p>平台承诺「先行赔付」：药材与描述不符、破损、质量问题，均可在线申请退款，平台先行垫付。</p></div>' +
      '<div class="faq-item"><b>Q4 商家如何入驻？</b><p>前往「商家入驻」页面填写申请，平台 1-3 个工作日完成资质审核，通过后即可上架经营。</p></div>'
  },
  service: {
    title: '售后保障',
    body: '<div class="faq-item"><b>🛡 平台先行赔付</b><p>凡在平台购买的道地药材，出现以次充好、缺斤少两、品质不符等问题，平台将先行赔付，再对商家追责。</p></div>' +
      '<div class="faq-item"><b>📦 产地直发 · 全程可溯</b><p>入驻商家必须上传产地证书，商品支持溯源查询，确保从产地到餐桌透明可查。</p></div>' +
      '<div class="faq-item"><b>⏰ 退换政策</b><p>签收后 7 天内，未拆封商品支持无理由退换；已拆封但存在品质问题的，同样支持售后处理。</p></div>'
  },
  contact: {
    title: '联系招商 / 客服',
    body: '<div class="faq-item"><b>📞 招商热线</b><p>400-000-8888（工作日 9:00-18:00，正式上线后开通）</p></div>' +
      '<div class="faq-item"><b>📧 商家入驻邮箱</b><p>merchant@yanhuang-jishi.com</p></div>' +
      '<div class="faq-item"><b>💬 社区反馈</b><p>欢迎在「养生社区」发帖交流，运营团队会定期回复平台建设意见。</p></div>'
  },
  about: {
    title: '平台愿景',
    body: '<div class="faq-item"><b>承炎黄之法</b><p>传承《黄帝内经》以来的中医药智慧，让千年本草走向数字化时代。</p></div>' +
      '<div class="faq-item"><b>济世人之需</b><p>聚合全国道地药铺与百年老字号，以「店铺 · 药材」双评分体系，帮助用户更高效地筛选可靠药材。</p></div>' +
      '<div class="faq-item"><b>让好药材被看见</b><p>扶持农户与老字号，社区种草 + 产地溯源，让每一味好药都值得被信任。</p></div>'
  },
  join: {
    title: '商务合作',
    body: '<div class="faq-item"><b>📧 商务合作邮箱</b><p>business@yanhuang-jishi.com</p></div>' +
      '<div class="faq-item"><b>🤝 合作方向</b><p>品牌联名、产地直采、药材供应链、物流合作、广告投放等，欢迎来信洽谈。</p></div>' +
      '<div class="faq-item"><b>🚀 快速入驻</b><p><a href="javascript:void(0)" style="color:var(--red)">点击前往商家入驻页面 →（Vue 版待接入）</a></p></div>'
  }
}

/* 由旧网页 js/data.js 1:1 转出（ES Module） */
/* ==========================================
   炎黄济世 · 页面展示数据
   页面数据由接口接入后可替换为实时商户信息
   ========================================== */

/**
 * 生成商品展示图片地址
 * @param {string} prompt 图片描述提示词
 * @param {string} size 图片尺寸
 * @returns {string} 图片url
 */
export function imgUrl(prompt, size) {
  return "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=" +
    encodeURIComponent(prompt) + "&image_size=" + (size || "square_hd");
}

// 店铺品牌色盘
export const BRAND_COLORS = [
  "#8c1f28",
  "#4c7a5c",
  "#a87f3f",
  "#3f5f8c",
  "#6b4a8c",
  "#8c5a3f",
  "#2e6e5e",
  "#a8323c"
];

// 商品分类
export const CATEGORIES = [
  { id: "c1", name: "参茸滋补", icon: "🌿", count: 128 },
  { id: "c2", name: "花茶养生", icon: "🍵", count: 96 },
  { id: "c3", name: "药食同源", icon: "🥣", count: 152 },
  { id: "c4", name: "精品饮片", icon: "🌾", count: 203 },
  { id: "c5", name: "中成药", icon: "💊", count: 87 },
  { id: "c6", name: "滋补膏方", icon: "🍯", count: 64 },
  { id: "c7", name: "艾灸理疗", icon: "🕯️", count: 45 },
  { id: "c8", name: "药膳汤料", icon: "🥘", count: 71 }
];

// ===================== 店铺模拟数据 =====================
export const STORES = [
  {
    id: "s1",
    name: "华夏本草旗舰店",
    city: "北京",
    years: 18,
    rating: 4.9,
    ratingCount: 186200,
    productsCount: 86,
    followers: 96200,
    badge: "品质甄选",
    badgeType: "gold",
    intro: "精选全国道地药材，建立从产地筛选到仓储发货的品质管理流程，专注安心购药体验。",
    colors: ["#8c1f28", "#6e161d"]
  },
  {
    id: "s2",
    name: "云岭道地药材馆",
    city: "昆明",
    years: 12,
    rating: 4.8,
    ratingCount: 92400,
    productsCount: 54,
    followers: 58800,
    badge: "产地直供",
    badgeType: "red",
    intro: "扎根西南药材产区，主打三七、菌类与高原特色食材，坚持产地直采与批次验收。",
    colors: ["#4c7a5c", "#2e5a3c"]
  },
  {
    id: "s3",
    name: "江南本草滋补馆",
    city: "杭州",
    years: 15,
    rating: 4.9,
    ratingCount: 76300,
    productsCount: 63,
    followers: 41200,
    badge: "江南甄选",
    badgeType: "gold",
    intro: "专注阿胶、膏方与药膳汤料，精选江南特色滋补食材，为家庭日常养生提供安心选择。",
    colors: ["#a87f3f", "#7c5a24"]
  },
  {
    id: "s4",
    name: "湖湘养生堂",
    city: "长沙",
    years: 11,
    rating: 4.7,
    ratingCount: 51200,
    productsCount: 78,
    followers: 33600,
    badge: "湖湘风味",
    badgeType: "red",
    intro: "主做平价养生茶饮、代用茶与药食同源食材，精选湖湘特色风味，适合日常饮食调养。",
    colors: ["#3f5f8c", "#29436b"]
  },
  {
    id: "s5",
    name: "闽南国药馆",
    city: "漳州",
    years: 9,
    rating: 4.8,
    ratingCount: 38900,
    productsCount: 32,
    followers: 21400,
    badge: "闽南甄选",
    badgeType: "red",
    intro: "精选闽南特色药材与滋补食材，重视批次管理和产地信息展示，提供清晰安心的选购体验。",
    colors: ["#6b4a8c", "#4a2f66"]
  },
  {
    id: "s6",
    name: "胶东滋补直营店",
    city: "聊城",
    years: 8,
    rating: 4.9,
    ratingCount: 67100,
    productsCount: 41,
    followers: 42900,
    badge: "原产甄选",
    badgeType: "gold",
    intro: "专注胶类滋补品与山东特色食材，精选原产地批次，工厂直发并提供完整质检信息。",
    colors: ["#8c5a3f", "#6b3f28"]
  },
  {
    id: "s7",
    name: "仲景本草馆",
    city: "南阳",
    years: 7,
    rating: 4.6,
    ratingCount: 35800,
    productsCount: 112,
    followers: 27800,
    badge: "本草优选",
    badgeType: "red",
    intro: "立足南阳本草资源，覆盖参茸、饮片与汤料，提供品类齐全的家庭养生选购方案。",
    colors: ["#2e6e5e", "#1e5044"]
  },
  {
    id: "s8",
    name: "岭南本草馆",
    city: "广州",
    years: 6,
    rating: 4.7,
    ratingCount: 44600,
    productsCount: 69,
    followers: 31500,
    badge: "岭南甄选",
    badgeType: "red",
    intro: "精选岭南特色药材、凉茶与煲汤料，结合本地饮食习惯，为日常调养提供丰富选择。",
    colors: ["#a8323c", "#7a1f27"]
  }
];

// ===================== 药材商品模拟数据 =====================
export const PRODUCTS = [
  {
    id: "p1",
    storeId: "s1",
    cat: "c1",
    name: "长白山野山参 · 15年足龄",
    price: 268,
    originalPrice: 328,
    sales: 8600,
    rating: 4.9,
    ratingCount: 2300,
    tag: "镇店之宝",
    img: imgUrl("顶级长白山野山参完整展示，根须完整形态优美，参体黄褐色，放置在木盒中，传统中药材摄影，专业灯光，深色背景"),
    desc: "产自长白山原始林下，15 年足龄林下参，须长根密、皂苷含量高。每支附产地溯源证书，支持复检。"
  },
  {
    id: "p2",
    storeId: "s1",
    cat: "c3",
    name: "宁夏头茬枸杞 · 500g 免洗",
    price: 39.9,
    originalPrice: 59.9,
    sales: 32600,
    rating: 4.8,
    ratingCount: 8900,
    tag: "热卖",
    img: imgUrl("新鲜宁夏头茬枸杞红果特写，颗粒饱满色泽红润，放在竹编盘中，中药材摄影，暖色灯光，浅色背景"),
    desc: "宁夏中宁头茬枸杞，皮薄肉厚籽少，含糖适中。免洗即食，泡水煲汤两相宜。"
  },
  {
    id: "p3",
    storeId: "s2",
    cat: "c4",
    name: "云南文山三七粉 · 40头精磨",
    price: 128,
    originalPrice: 158,
    sales: 15200,
    rating: 4.8,
    ratingCount: 5600,
    tag: "地道",
    img: imgUrl("云南文山三七根茎特写，黄褐色干燥药材，旁边是一小堆三七细粉，传统中药材摄影，浅色背景"),
    desc: "文山道地三七，40 头精磨 300 目细粉，活血化瘀首选。产地直供，附检测报告。"
  },
  {
    id: "p4",
    storeId: "s2",
    cat: "c1",
    name: "云南野生黑玛咖",
    price: 88,
    originalPrice: 118,
    sales: 6400,
    rating: 4.7,
    ratingCount: 1800,
    tag: "新品",
    img: imgUrl("云南野生黑玛咖干燥根茎特写，深褐色，放在木质托盘中，传统中药材摄影，暖色调"),
    desc: "海拔 3500 米以上野生黑玛咖，肉质厚实、味道微辛，煲汤泡酒皆宜。"
  },
  {
    id: "p5",
    storeId: "s3",
    cat: "c6",
    name: "东阿阿胶糕 · 即食装 250g",
    price: 199,
    originalPrice: 259,
    sales: 22100,
    rating: 4.9,
    ratingCount: 9700,
    tag: "滋补佳品",
    img: imgUrl("即食阿胶糕切片特写，深棕色方块上嵌着核桃芝麻，摆放在精致瓷盘，传统滋补食品摄影，暖色调"),
    desc: "古法熬制阿胶配核桃、黑芝麻，独立小包装即食阿胶糕，女士滋补常见之选。"
  },
  {
    id: "p6",
    storeId: "s3",
    cat: "c2",
    name: "杭州白菊 · 胎菊王 250g",
    price: 45,
    originalPrice: 65,
    sales: 18800,
    rating: 4.7,
    ratingCount: 7200,
    tag: "热卖",
    img: imgUrl("杭白菊胎菊干花特写，米白色小菊花朵饱满，散落在竹筛上，传统花茶摄影，浅色背景"),
    desc: "杭白菊胎菊王，未完全绽放的嫩菊花蕾，热水一冲清香四溢，清肝明目。"
  },
  {
    id: "p7",
    storeId: "s4",
    cat: "c1",
    name: "湖南平江野生灵芝",
    price: 158,
    originalPrice: 198,
    sales: 4300,
    rating: 4.6,
    ratingCount: 1500,
    tag: "养生",
    img: imgUrl("野生灵芝完整展示，深红褐色菌盖有光泽，灵芝形态优雅，放在木桌上，传统中药材摄影，深色背景"),
    desc: "平江深山野生灵芝，菌盖完整、边缘有亮光，煮水煲汤皆宜，增强体质。"
  },
  {
    id: "p8",
    storeId: "s4",
    cat: "c3",
    name: "河南焦作铁棍山药",
    price: 29.9,
    originalPrice: 42,
    sales: 28700,
    rating: 4.7,
    ratingCount: 8100,
    tag: "药食同源",
    img: imgUrl("长条形铁棍山药整齐摆放特写，表面有锈斑，土褐色，传统食材摄影，浅色背景"),
    desc: "焦作温县垆土铁棍山药，粉糯香甜、断面色白，蒸煮煲汤皆佳。"
  },
  {
    id: "p9",
    storeId: "s5",
    cat: "c5",
    name: "漳州片仔癀胶囊",
    price: 880,
    originalPrice: 960,
    sales: 2100,
    rating: 4.8,
    ratingCount: 1100,
    tag: "传奇名方",
    img: imgUrl("经典中成药胶囊药瓶特写，红金色包装高端大气，旁边散落几粒胶囊，医药摄影，深色背景"),
    desc: "源于明代宫廷秘方，精选名贵药材，清热解毒、凉血化瘀。一物一码，全程可溯源。"
  },
  {
    id: "p10",
    storeId: "s5",
    cat: "c3",
    name: "福建建宁莲子 · 去芯 500g",
    price: 38,
    originalPrice: 52,
    sales: 9600,
    rating: 4.7,
    ratingCount: 3400,
    tag: "干货",
    img: imgUrl("去芯莲子干白果特写，米白色莲子颗粒饱满，装在麻布口袋中，传统干货摄影，暖色调"),
    desc: "建宁通心白莲，颗颗饱满圆润，煮粥煲汤皆清香甘甜，养心安神。"
  },
  {
    id: "p11",
    storeId: "s6",
    cat: "c6",
    name: "东阿阿胶块 · 250g 整块",
    price: 549,
    originalPrice: 699,
    sales: 7800,
    rating: 4.9,
    ratingCount: 4600,
    tag: "原产直发",
    img: imgUrl("传统阿胶块特写，深棕黑色半透明长方形胶块，放在红木盒中，传统滋补品摄影，暖色调"),
    desc: "东阿县原产地直发，古法九提九滤，胶质黑亮、断面光滑。附质检报告与食用说明。"
  },
  {
    id: "p12",
    storeId: "s6",
    cat: "c2",
    name: "山东平阴重瓣玫瑰花茶",
    price: 36,
    originalPrice: 49,
    sales: 13400,
    rating: 4.8,
    ratingCount: 5200,
    tag: "花茶",
    img: imgUrl("平阴重瓣玫瑰花茶干花特写，紫红色玫瑰花蕾饱满，散落在淡色桌面，传统花茶摄影，暖色调"),
    desc: "平阴重瓣玫瑰头期花，低温烘干锁香，泡水花香浓郁，美容养颜。"
  },
  {
    id: "p13",
    storeId: "s7",
    cat: "c7",
    name: "南阳艾叶艾灸条 · 10支装",
    price: 32,
    originalPrice: 45,
    sales: 16800,
    rating: 4.6,
    ratingCount: 6800,
    tag: "理疗",
    img: imgUrl("艾灸条特写，棕色艾绒包裹的灸条整齐排列，旁边有燃烧的艾绒烟雾缭绕，传统理疗摄影，淡雅背景"),
    desc: "南阳三年陈艾，艾绒细腻、火力温和，祛湿散寒，家用艾灸必备。"
  },
  {
    id: "p14",
    storeId: "s7",
    cat: "c1",
    name: "神农架党参 · 500g",
    price: 59,
    originalPrice: 78,
    sales: 5200,
    rating: 4.6,
    ratingCount: 1900,
    tag: "补气",
    img: imgUrl("党参干燥根茎束特写，淡黄色长条状药材捆绑成束，传统中药材摄影，浅色背景"),
    desc: "神农架高山党参，条粗皮细、嚼之味甜，补中益气，煲汤泡水皆宜。"
  },
  {
    id: "p15",
    storeId: "s8",
    cat: "c8",
    name: "新会陈皮 · 十年陈 250g",
    price: 128,
    originalPrice: 168,
    sales: 9100,
    rating: 4.8,
    ratingCount: 4100,
    tag: "越陈越香",
    img: imgUrl("新会陈皮干皮特写，深褐色卷曲橙皮，纹理清晰，放在竹盘中，传统药材摄影，暖色调"),
    desc: "新会茶枝柑十年陈，油室密集、香气醇厚，年份真实可查，泡茶煲汤回味悠长。"
  },
  {
    id: "p16",
    storeId: "s8",
    cat: "c4",
    name: "广东化州橘红片 · 100g",
    price: 68,
    originalPrice: 89,
    sales: 6200,
    rating: 4.7,
    ratingCount: 2300,
    tag: "岭南特产",
    img: imgUrl("化州橘红切片特写，深棕色薄切片纹理清晰，散落在木质桌面上，传统药材摄影，暖色调"),
    desc: "化州正毛橘红，绒毛明显、味苦回甘，理气化痰，日常泡水佳品。"
  }
];

/**
 * 根据店铺ID获取该店铺全部商品
 * @param {string} storeId 店铺id
 * @returns {Array} 商品数组
 */
export function productsOf(storeId) {
  return PRODUCTS.filter(function (p) {
    return p.storeId === storeId;
  });
}

/**
 * 根据id查找店铺对象
 * @param {string} id 店铺id
 * @returns {Object|null}
 */
export function storeOf(id) {
  for (var i = 0; i < STORES.length; i++) {
    if (STORES[i].id === id) {
      return STORES[i];
    }
  }
  return null;
}

/**
 * 根据id查找商品对象
 * @param {string} id 商品id
 * @returns {Object|null}
 */
export function productOf(id) {
  for (var i = 0; i < PRODUCTS.length; i++) {
    if (PRODUCTS[i].id === id) {
      return PRODUCTS[i];
    }
  }
  return null;
}

/**
 * 根据id查找分类对象
 * @param {string} id 分类id
 * @returns {Object|null}
 */
export function categoryOf(id) {
  for (var i = 0; i < CATEGORIES.length; i++) {
    if (CATEGORIES[i].id === id) {
      return CATEGORIES[i];
    }
  }
  return null;
}

// ===================== 社区帖子（种子数据） =====================
export const SEED_POSTS = [
  {
    id: "post1",
    title: "第一次在平台上买参，如何辨别野山参和园参？",
    tag: "选购求助",
    content: "看中一家店的『长白山野山参』，价格不便宜。想知道怎么从芦、艼、体、须几个方面辨别真伪？求老药工指点！",
    author: "识药小草",
    time: "10分钟前",
    likes: 42,
    comments: [
      { author: "老药工阿福", time: "8分钟前", text: "记住口诀：芦碗清晰、艼须下垂、体态灵巧、须长有珍珠点。芦碗越多年份越足。" },
      { author: "参界老饕", time: "5分钟前", text: "一定要看溯源证书，野山参必须有国家参茸质检中心的编号，别信口头承诺。" },
      { author: "识药小草", time: "3分钟前", text: "多谢两位指教！那家店给了产地证书编号，我可以放心下单了。" }
    ]
  },
  {
    id: "post2",
    title: "东阿阿胶糕怎么选？即食装和传统胶块哪个更适合日常保养？",
    tag: "养生讨论",
    content: "准备给家里长辈买阿胶，看平台上有好几家卖东阿的。即食糕方便但是怕糖分高，传统胶块要自己熬制有点麻烦，大家怎么选？",
    author: "春日暖阳",
    time: "2小时前",
    likes: 28,
    comments: [
      { author: "岐黄小筑", time: "1小时前", text: "日常保养选即食糕更省心，注意看配料表第一位要是阿胶，别买成阿胶糕味的零食。" },
      { author: "南方有嘉木", time: "40分钟前", text: "长辈脾胃弱，熬制的传统胶块更纯粹但伤脾胃。建议先少量尝试即食装，看体质反应。" }
    ]
  },
  {
    id: "post3",
    title: "新会陈皮的『年份』到底怎么看？十年陈和五年陈差别大不大？",
    tag: "药材知识",
    content: "最近迷上陈皮水，但发现同一产区不同店卖的五年陈、十年陈价格差一倍。年份这个东西是不是智商税？有没有行家来说说。",
    author: "茶余饭后",
    time: "5小时前",
    likes: 51,
    comments: [
      { author: "陈皮收藏家", time: "4小时前", text: "年份差在香气的醇厚度和油室的转化，10年陈更温润、5年陈还有青涩感。看断面油室密度比看颜色靠谱。" },
      { author: "老广味道", time: "2小时前", text: "买陈皮认准新会茶枝柑，外地果皮怎么存都不正宗。平台那家新会店的十年陈我回购三次了。" }
    ]
  },
  {
    id: "post4",
    title: "征集：大家所在城市有哪些值得入驻炎黄济世的本土药铺？",
    tag: "平台共建",
    content: "炎黄济世正在邀请各大药铺入驻。我家乡有一家做了40年的药膳汤料铺，味道一绝但没有线上渠道。大家也来推荐推荐身边的宝藏店铺，让平台把更多好药材带给全国！",
    author: "平台运营小助手",
    time: "昨天",
    likes: 96,
    comments: [
      { author: "蜀地本草", time: "23小时前", text: "成都彭州有家熬膏方的老师傅，祖传香油膏工艺，强烈推荐邀请入驻！" },
      { author: "秦岭采药人", time: "20小时前", text: "商洛山区的野生连翘籽油品质很好，可惜农户还不熟悉线上经营，希望平台能多提供一些帮助。" },
      { author: "姑苏半夏", time: "12小时前", text: "苏州有家老字号香囊铺子，端午系列年年断货，希望他们开网店。" }
    ]
  },
  {
    id: "post5",
    title: "药食同源科普：枸杞每天吃多少合适？误区避坑指南",
    tag: "科普分享",
    content: "看不少帖子说枸杞泡水很养生，但枸杞性温，每天 20g 以内为宜，且感冒发烧、腹泻期间不宜食用。另外杞菊搭配是清肝明目的经典组合，分享给大家。",
    author: "草木医话",
    time: "3天前",
    likes: 132,
    comments: [
      { author: "养生长跑者", time: "2天前", text: "涨知识了！之前一直当零食狂炫，原来还有这么多讲究。" },
      { author: "临床营养师", time: "1天前", text: "补充一点：糖尿病患者注意枸杞含糖高，需计入每日糖摄入。" }
    ]
  }
];

// 本地存储键常量
export const LS_REVIEWS = "yjjs_reviews";   // 用户新增评价
export const LS_POSTS = "yjjs_posts";       // 社区帖子（含用户新增）
export const LS_LIKES = "yjjs_likes";       // 已点赞帖子 id

/**
 * 读取localStorage，异常时返回默认值
 * @param {string} key 存储键名
 * @param {*} fallback 读取失败返回的默认值
 * @returns {*}
 */
export function loadLS(key, fallback) {
  try {
    var raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // parse出错直接返回fallback
  }
  return fallback;
}

/**
 * 写入localStorage
 * @param {string} key 存储键名
 * @param {*} val 要保存的数据
 */
export function saveLS(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    // 存储异常忽略
  }
}

/**
 * 加载用户评价列表
 * @returns {Array}
 */
export function loadReviews() {
  return loadLS(LS_REVIEWS, []);
}

/**
 * 保存用户评价列表
 * @param {Array} list
 */
export function saveReviews(list) {
  saveLS(LS_REVIEWS, list);
}

/**
 * 加载社区帖子，优先读取本地新增，没有则返回种子帖子
 * @returns {Array}
 */
export function loadPosts() {
  var saved = loadLS(LS_POSTS, null);
  if (saved && saved.length) {
    return saved;
  }
  return SEED_POSTS;
}

/**
 * 保存社区帖子到本地存储
 * @param {Array} list
 */
export function savePosts(list) {
  saveLS(LS_POSTS, list);
}

// ==== 旧 js/main.js 中的通用工具（1:1） ====
export function starsHTML(score) {
  var html = '<span class="stars">';
  for (var i = 1; i <= 5; i++) {
    var cls = i <= Math.round(score) ? '' : 'dim';
    html += '<span class="' + cls + '">★</span>';
  }
  html += '</span>';
  return html;
}
export function fmt(n) {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  return String(n);
}
export function ratingDistribution(key, baseCount) {
  var dist = [0, 0, 0, 0, 0];
  var per = [0.88, 0.08, 0.028, 0.007, 0.005];
  var total = baseCount || 1000;
  for (var i = 0; i < 5; i++) dist[i] = Math.round(total * per[i]);
  var rvs = loadReviews().filter(function (r) { return r.key === key; });
  rvs.forEach(function (r) { dist[5 - Math.round(r.score)]++; });
  return dist;
}
export function effectiveRating(key, baseRating, baseCount) {
  var rvs = loadReviews().filter(function (r) { return r.key === key; });
  if (!rvs.length) return { rating: baseRating, count: baseCount };
  var sum = baseCount * baseRating;
  rvs.forEach(function (r) { sum += r.score; });
  return { rating: Math.round((sum / (baseCount + rvs.length)) * 10) / 10, count: baseCount + rvs.length };
}
export function emptyReviewsHTML() {
  return '<div class="review-item" style="text-align:center;color:var(--ink-light)">还没有评价，来抢首评吧～</div>';
}
export function loadFavs() { return loadLS('yjjs_favs', []); }
export function saveFavs(list) { saveLS('yjjs_favs', list); }
export function isFav(key) { return loadFavs().indexOf(key) >= 0; }

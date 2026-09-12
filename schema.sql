-- 炎黄济世 · 中医药中转站数据库
-- MySQL 8.0+
-- 说明：当前为平台壳子，密码、支付、资质文件等生产字段需接入真实服务后完善。

CREATE DATABASE IF NOT EXISTS yhjs
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
USE yhjs;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS post_comments;
DROP TABLE IF EXISTS post_likes;
DROP TABLE IF EXISTS community_posts;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS stores;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS merchant_applications;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- 用户：正式环境请改为接入微信/手机号认证，不保存明文密码
CREATE TABLE users (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nickname VARCHAR(80) NOT NULL,
  phone VARCHAR(20) UNIQUE NULL,
  password_hash VARCHAR(255) NULL,
  avatar_url VARCHAR(500) NULL,
  bio VARCHAR(300) NULL,
  gender ENUM('unknown', 'male', 'female') NOT NULL DEFAULT 'unknown',
  birthday DATE NULL,
  role ENUM('user', 'merchant', 'admin') NOT NULL DEFAULT 'user',
  status ENUM('active', 'disabled') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login_at DATETIME NULL,
  INDEX idx_users_role (role),
  INDEX idx_users_status (status)
) ENGINE=InnoDB COMMENT='平台用户';

-- 商家入驻申请
CREATE TABLE merchant_applications (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  store_name VARCHAR(160) NOT NULL,
  city VARCHAR(80) NOT NULL,
  contact_name VARCHAR(80) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  store_type VARCHAR(80) NOT NULL,
  main_category VARCHAR(80) NULL,
  introduction TEXT NULL,
  qualification_note TEXT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  review_note VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME NULL,
  CONSTRAINT fk_application_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_applications_status_created (status, created_at)
) ENGINE=InnoDB COMMENT='商家入驻申请';

-- 店铺
CREATE TABLE stores (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  application_id BIGINT UNSIGNED NULL,
  owner_id BIGINT UNSIGNED NULL,
  name VARCHAR(160) NOT NULL,
  city VARCHAR(80) NOT NULL,
  years_in_business INT UNSIGNED NOT NULL DEFAULT 0,
  introduction TEXT NULL,
  logo_url VARCHAR(500) NULL,
  cover_url VARCHAR(500) NULL,
  brand_color VARCHAR(20) NULL,
  badge VARCHAR(80) NULL,
  badge_type ENUM('red', 'gold') NOT NULL DEFAULT 'red',
  rating DECIMAL(2,1) NOT NULL DEFAULT 0.0,
  rating_count INT UNSIGNED NOT NULL DEFAULT 0,
  follower_count INT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('pending', 'active', 'offline') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_store_application FOREIGN KEY (application_id) REFERENCES merchant_applications(id) ON DELETE SET NULL,
  CONSTRAINT fk_store_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_store_rating CHECK (rating >= 0 AND rating <= 5),
  INDEX idx_stores_status_rating (status, rating DESC),
  INDEX idx_stores_city (city)
) ENGINE=InnoDB COMMENT='入驻药店';

-- 药材分类
CREATE TABLE categories (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL UNIQUE,
  icon VARCHAR(20) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status ENUM('active', 'hidden') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='药材分类';

-- 药材商品
CREATE TABLE products (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  store_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT NULL,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2) NULL,
  stock INT UNSIGNED NOT NULL DEFAULT 0,
  sales_count INT UNSIGNED NOT NULL DEFAULT 0,
  rating DECIMAL(2,1) NOT NULL DEFAULT 0.0,
  rating_count INT UNSIGNED NOT NULL DEFAULT 0,
  tag VARCHAR(40) NULL,
  image_url VARCHAR(500) NULL,
  origin VARCHAR(120) NULL,
  trace_code VARCHAR(120) NULL,
  status ENUM('draft', 'on_sale', 'off_shelf') NOT NULL DEFAULT 'draft',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE RESTRICT,
  CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  CONSTRAINT chk_product_price CHECK (price >= 0),
  CONSTRAINT chk_product_rating CHECK (rating >= 0 AND rating <= 5),
  INDEX idx_products_store_status (store_id, status),
  INDEX idx_products_category_status (category_id, status),
  INDEX idx_products_sales (sales_count DESC),
  FULLTEXT INDEX ft_products_search (name, description, origin)
) ENGINE=InnoDB COMMENT='药材商品';

-- 店铺/药材评分。target_type + target_id 统一承载两类评分
CREATE TABLE reviews (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  target_type ENUM('store', 'product') NOT NULL,
  target_id BIGINT UNSIGNED NOT NULL,
  score TINYINT UNSIGNED NOT NULL,
  content VARCHAR(2000) NOT NULL,
  quality_score TINYINT UNSIGNED NULL,
  service_score TINYINT UNSIGNED NULL,
  logistics_score TINYINT UNSIGNED NULL,
  status ENUM('visible', 'hidden', 'pending') NOT NULL DEFAULT 'visible',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_review_score CHECK (score BETWEEN 1 AND 5),
  CONSTRAINT chk_review_quality CHECK (quality_score IS NULL OR quality_score BETWEEN 1 AND 5),
  CONSTRAINT chk_review_service CHECK (service_score IS NULL OR service_score BETWEEN 1 AND 5),
  CONSTRAINT chk_review_logistics CHECK (logistics_score IS NULL OR logistics_score BETWEEN 1 AND 5),
  INDEX idx_reviews_target (target_type, target_id, status, created_at),
  INDEX idx_reviews_user (user_id, created_at)
) ENGINE=InnoDB COMMENT='店铺与药材评分';

-- 社区帖子
CREATE TABLE community_posts (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  tag VARCHAR(40) NOT NULL DEFAULT '养生讨论',
  like_count INT UNSIGNED NOT NULL DEFAULT 0,
  comment_count INT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('visible', 'hidden', 'pending') NOT NULL DEFAULT 'visible',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_post_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_posts_status_created (status, created_at DESC),
  INDEX idx_posts_tag_created (tag, created_at DESC)
) ENGINE=InnoDB COMMENT='社区帖子';

CREATE TABLE post_comments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  post_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  content VARCHAR(2000) NOT NULL,
  status ENUM('visible', 'hidden', 'pending') NOT NULL DEFAULT 'visible',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comment_post FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_comment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_comments_post_created (post_id, status, created_at)
) ENGINE=InnoDB COMMENT='帖子评论';

CREATE TABLE post_likes (
  post_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, user_id),
  CONSTRAINT fk_like_post FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_like_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='帖子点赞';

-- 用户收藏店铺或药材
CREATE TABLE favorites (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  target_type ENUM('store', 'product') NOT NULL,
  target_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_favorite (user_id, target_type, target_id),
  CONSTRAINT fk_favorite_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_favorites_user (user_id, created_at DESC)
) ENGINE=InnoDB COMMENT='用户收藏';

-- 订单主表
CREATE TABLE orders (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  order_no VARCHAR(40) NOT NULL UNIQUE,
  user_id BIGINT UNSIGNED NULL,
  store_id BIGINT UNSIGNED NOT NULL,
  receiver_name VARCHAR(80) NOT NULL,
  receiver_phone VARCHAR(20) NOT NULL,
  receiver_address VARCHAR(500) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending_payment', 'paid', 'shipped', 'completed', 'cancelled', 'refunding', 'refunded') NOT NULL DEFAULT 'pending_payment',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at DATETIME NULL,
  completed_at DATETIME NULL,
  CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_order_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE RESTRICT,
  CONSTRAINT chk_order_amount CHECK (total_amount >= 0),
  INDEX idx_orders_user_created (user_id, created_at DESC),
  INDEX idx_orders_store_status (store_id, status, created_at DESC)
) ENGINE=InnoDB COMMENT='订单主表';

CREATE TABLE order_items (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_item_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_item_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  CONSTRAINT chk_item_quantity CHECK (quantity > 0),
  CONSTRAINT chk_item_amount CHECK (unit_price >= 0 AND subtotal >= 0),
  INDEX idx_order_items_order (order_id)
) ENGINE=InnoDB COMMENT='订单明细';

-- ===================== 软著 / 演示版初始数据 =====================
-- 如需正式生产环境初始化，请改用 schema_production.sql，避免导入示例评价、帖子和其他伪用户行为数据。

INSERT INTO users (id, nickname, phone, role) VALUES
(1, '平台运营小助手', '13800000001', 'admin'),
(2, '识药小草', '13800000002', 'user'),
(3, '老药工阿福', '13800000003', 'user'),
(4, '演示商家甲', '13800000004', 'merchant'),
(5, '演示商家乙', '13800000005', 'merchant');

INSERT INTO categories (id, name, icon, sort_order) VALUES
(1, '参茸滋补', '🌿', 10),
(2, '花茶养生', '🍵', 20),
(3, '药食同源', '🥣', 30),
(4, '精品饮片', '🌾', 40),
(5, '中成药', '💊', 50),
(6, '滋补膏方', '🍯', 60),
(7, '艾灸理疗', '🕯️', 70),
(8, '药膳汤料', '🥘', 80);

INSERT INTO stores
(id, owner_id, name, city, years_in_business, introduction, brand_color, badge, badge_type, rating, rating_count, follower_count, status)
VALUES
(1, 4, '华夏本草旗舰店', '北京', 18, '精选全国道地药材，建立从产地筛选到仓储发货的品质管理流程。', '#8c1f28', '品质甄选', 'gold', 4.9, 186200, 96200, 'active'),
(2, 5, '云岭道地药材馆', '昆明', 12, '扎根西南药材产区，主打三七、菌类与高原特色食材，坚持产地直采。', '#4c7a5c', '产地直供', 'red', 4.8, 92400, 58800, 'active'),
(3, NULL, '江南本草滋补馆', '杭州', 15, '专注阿胶、膏方与药膳汤料，精选江南特色滋补食材。', '#a87f3f', '江南甄选', 'gold', 4.9, 76300, 41200, 'active'),
(4, NULL, '湖湘养生堂', '长沙', 11, '主做平价养生茶饮、代用茶与药食同源食材，精选湖湘特色风味。', '#3f5f8c', '湖湘风味', 'red', 4.7, 51200, 33600, 'active'),
(5, NULL, '闽南国药馆', '漳州', 9, '精选闽南特色药材与滋补食材，重视批次管理和产地信息展示。', '#6b4a8c', '闽南甄选', 'red', 4.8, 38900, 21400, 'active'),
(6, NULL, '胶东滋补直营店', '聊城', 8, '专注胶类滋补品与山东特色食材，精选原产地批次并提供质检信息。', '#8c5a3f', '原产甄选', 'gold', 4.9, 67100, 42900, 'active'),
(7, NULL, '仲景本草馆', '南阳', 7, '立足南阳本草资源，覆盖参茸、饮片与汤料，品类齐全。', '#2e6e5e', '本草优选', 'red', 4.6, 35800, 27800, 'active'),
(8, NULL, '岭南本草馆', '广州', 6, '精选岭南特色药材、凉茶与煲汤料，结合本地饮食习惯提供丰富选择。', '#a8323c', '岭南甄选', 'red', 4.7, 44600, 31500, 'active');

INSERT INTO products
(id, store_id, category_id, name, description, price, original_price, stock, sales_count, rating, rating_count, tag, origin, trace_code, status)
VALUES
(1, 1, 1, '长白山野山参 · 15年足龄', '产自长白山原始林下，15年足龄林下参，附产地溯源证书。', 268.00, 328.00, 500, 8600, 4.9, 2300, '镇店之宝', '吉林长白山', 'JL-YRS-0001', 'on_sale'),
(2, 1, 3, '宁夏头茬枸杞 · 500g 免洗', '宁夏中宁头茬枸杞，皮薄肉厚籽少，免洗即食。', 39.90, 59.90, 3000, 32600, 4.8, 8900, '热卖', '宁夏中宁', 'NX-GQ-0002', 'on_sale'),
(3, 2, 4, '云南文山三七粉 · 40头精磨', '文山道地三七，40头精磨300目细粉，附检测报告。', 128.00, 158.00, 1200, 15200, 4.8, 5600, '地道', '云南文山', 'YN-SQ-0003', 'on_sale'),
(4, 2, 1, '云南野生黑玛咖', '海拔3500米以上野生黑玛咖，煲汤泡酒皆宜。', 88.00, 118.00, 900, 6400, 4.7, 1800, '新品', '云南丽江', 'YN-MK-0004', 'on_sale'),
(5, 3, 6, '东阿阿胶糕 · 即食装 250g', '古法熬制阿胶配核桃、黑芝麻，独立小包装。', 199.00, 259.00, 800, 22100, 4.9, 9700, '滋补佳品', '山东东阿', 'SD-AJ-0005', 'on_sale'),
(6, 3, 2, '杭州白菊 · 胎菊王 250g', '杭白菊胎菊王，清香四溢，日常泡水佳品。', 45.00, 65.00, 1600, 18800, 4.7, 7200, '热卖', '浙江桐乡', 'ZJ-JH-0006', 'on_sale'),
(7, 4, 1, '湖南平江野生灵芝', '平江深山野生灵芝，煮水煲汤皆宜。', 158.00, 198.00, 400, 4300, 4.6, 1500, '养生', '湖南平江', 'HN-LZ-0007', 'on_sale'),
(8, 4, 3, '河南焦作铁棍山药', '焦作温县垆土铁棍山药，粉糯香甜。', 29.90, 42.00, 2400, 28700, 4.7, 8100, '药食同源', '河南焦作', 'HN-SY-0008', 'on_sale'),
(9, 5, 5, '漳州片仔癀胶囊', '源于明代宫廷秘方，一物一码，全程可溯源。', 880.00, 960.00, 200, 2100, 4.8, 1100, '传奇名方', '福建漳州', 'FJ-PZH-0009', 'on_sale'),
(10, 5, 3, '福建建宁莲子 · 去芯 500g', '建宁通心白莲，煮粥煲汤清香甘甜。', 38.00, 52.00, 1800, 9600, 4.7, 3400, '干货', '福建建宁', 'FJ-LZ-0010', 'on_sale'),
(11, 6, 6, '东阿阿胶块 · 250g 整块', '东阿县原产地直发，古法九提九滤。', 549.00, 699.00, 300, 7800, 4.9, 4600, '原产直发', '山东东阿', 'SD-AJ-0011', 'on_sale'),
(12, 6, 2, '山东平阴重瓣玫瑰花茶', '平阴重瓣玫瑰头期花，低温烘干锁香。', 36.00, 49.00, 1400, 13400, 4.8, 5200, '花茶', '山东平阴', 'SD-MG-0012', 'on_sale'),
(13, 7, 7, '南阳艾叶艾灸条 · 10支装', '南阳三年陈艾，艾绒细腻、火力温和。', 32.00, 45.00, 2200, 16800, 4.6, 6800, '理疗', '河南南阳', 'HN-AI-0013', 'on_sale'),
(14, 7, 1, '神农架党参 · 500g', '神农架高山党参，条粗皮细，煲汤泡水皆宜。', 59.00, 78.00, 1000, 5200, 4.6, 1900, '补气', '湖北神农架', 'HB-DZ-0014', 'on_sale'),
(15, 8, 8, '新会陈皮 · 十年陈 250g', '新会茶枝柑十年陈，香气醇厚，年份可查。', 128.00, 168.00, 700, 9100, 4.8, 4100, '越陈越香', '广东新会', 'GD-CP-0015', 'on_sale'),
(16, 8, 4, '广东化州橘红片 · 100g', '化州正毛橘红，绒毛明显，味苦回甘。', 68.00, 89.00, 900, 6200, 4.7, 2300, '岭南特产', '广东化州', 'GD-JH-0016', 'on_sale');

INSERT INTO reviews (user_id, target_type, target_id, score, content, quality_score, service_score, logistics_score) VALUES
(3, 'store', 1, 5, '包装非常扎实，人参带溯源证书，跟描述一致。', 5, 5, 5),
(2, 'store', 1, 5, '客服很专业，介绍了不同参龄的区别。', 5, 5, 4),
(2, 'product', 1, 5, '成色很正，跟描述一致，泡出来香气足。', 5, 5, 5),
(3, 'product', 1, 4, '干净无异味，份量足，产地证书齐全。', 4, 5, 4),
(2, 'product', 15, 5, '陈皮香气醇厚，年份信息清楚。', 5, 5, 5);

INSERT INTO community_posts (id, user_id, title, content, tag, like_count, comment_count) VALUES
(1, 2, '第一次在平台上买参，如何辨别野山参和园参？', '看中一家店的长白山野山参，价格不便宜。想知道怎么从芦、艼、体、须几个方面辨别真伪？', '选购求助', 42, 2),
(2, 3, '东阿阿胶糕怎么选？即食装和传统胶块哪个更适合日常保养？', '准备给家里长辈买阿胶，即食糕方便但是怕糖分高，大家怎么选？', '养生讨论', 28, 2),
(3, 2, '新会陈皮的年份到底怎么看？', '同一产区不同店卖的五年陈、十年陈价格差一倍，年份这个东西是不是智商税？', '药材知识', 51, 2),
(4, 1, '征集：大家所在城市有哪些值得入驻炎黄济世的本土药铺？', '炎黄济世正在邀请各大药铺入驻，欢迎推荐身边的宝藏店铺。', '平台共建', 96, 3),
(5, 3, '药食同源科普：枸杞每天吃多少合适？', '枸杞性温，每天20g以内为宜，感冒发烧、腹泻期间不宜食用。', '科普分享', 132, 2);

INSERT INTO post_comments (post_id, user_id, content) VALUES
(1, 3, '记住口诀：芦碗清晰、艼须下垂、体态灵巧、须长有珍珠点。'),
(1, 2, '多谢指教！那家店给了产地证书编号，我可以放心下单了。'),
(2, 2, '日常保养选即食糕更省心，注意看配料表。'),
(3, 3, '年份差在香气醇厚度和油室转化，十年陈更温润。');

-- 常用查询视图：供商城接口直接读取
CREATE OR REPLACE VIEW v_active_products AS
SELECT
  p.id, p.store_id, s.name AS store_name, s.city,
  p.category_id, c.name AS category_name, c.icon AS category_icon,
  p.name, p.description, p.price, p.original_price, p.stock,
  p.sales_count, p.rating, p.rating_count, p.tag, p.image_url,
  p.origin, p.trace_code
FROM products p
JOIN stores s ON s.id = p.store_id AND s.status = 'active'
JOIN categories c ON c.id = p.category_id AND c.status = 'active'
WHERE p.status = 'on_sale';

CREATE OR REPLACE VIEW v_store_product_counts AS
SELECT
  s.id AS store_id, s.name, s.city, s.rating, s.rating_count,
  s.follower_count, COUNT(p.id) AS product_count
FROM stores s
LEFT JOIN products p ON p.store_id = s.id AND p.status = 'on_sale'
WHERE s.status = 'active'
GROUP BY s.id, s.name, s.city, s.rating, s.rating_count, s.follower_count;

-- 初始化完成后可执行：
-- SELECT * FROM v_active_products ORDER BY sales_count DESC;
-- SELECT * FROM v_store_product_counts ORDER BY rating DESC;

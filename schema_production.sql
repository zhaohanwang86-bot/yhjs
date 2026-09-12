-- 炎黄济世 · 正式生产环境初始化脚本
-- MySQL 8.0+
-- 说明：本文件仅创建表结构、基础分类和查询视图，不包含示例评价、帖子、评论、订单等演示数据。

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

CREATE TABLE categories (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL UNIQUE,
  icon VARCHAR(20) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status ENUM('active', 'hidden') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='药材分类';

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

-- 正式生产环境仅保留基础分类数据，用户、店铺、商品和行为数据由真实运营过程产生。
INSERT INTO categories (id, name, icon, sort_order) VALUES
(1, '参茸滋补', '🌿', 10),
(2, '花茶养生', '🍵', 20),
(3, '药食同源', '🥣', 30),
(4, '精品饮片', '🌾', 40),
(5, '中成药', '💊', 50),
(6, '滋补膏方', '🍯', 60),
(7, '艾灸理疗', '🕯️', 70),
(8, '药膳汤料', '🥘', 80);

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

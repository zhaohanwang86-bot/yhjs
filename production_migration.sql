-- 炎黄济世 V1.0 生产交付版数据库增量迁移
-- 适用于已执行 schema.sql、auth_migration.sql、profile_migration.sql 的 yhjs 数据库。
-- 本脚本只新增字段/表/索引，不删除现有业务数据。
USE yhjs;

-- 1. 迁移版本记录
CREATE TABLE IF NOT EXISTS schema_migrations (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  version VARCHAR(80) NOT NULL UNIQUE,
  description VARCHAR(255) NOT NULL,
  executed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='数据库迁移记录';

-- 2. 商家主体与审核状态
CREATE TABLE IF NOT EXISTS merchant_profiles (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  legal_name VARCHAR(160) NOT NULL,
  license_no VARCHAR(120) NULL,
  license_image_url VARCHAR(500) NULL,
  legal_representative VARCHAR(80) NULL,
  contact_phone VARCHAR(20) NULL,
  settlement_account_name VARCHAR(160) NULL,
  settlement_bank VARCHAR(160) NULL,
  settlement_account_no VARCHAR(120) NULL,
  status ENUM('pending', 'approved', 'rejected', 'suspended') NOT NULL DEFAULT 'pending',
  reject_reason VARCHAR(500) NULL,
  approved_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_merchant_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_merchant_profiles_status (status)
) ENGINE=InnoDB COMMENT='商家主体';

ALTER TABLE merchant_applications
  ADD COLUMN merchant_profile_id BIGINT UNSIGNED NULL,
  ADD COLUMN license_no VARCHAR(120) NULL,
  ADD COLUMN license_image_url VARCHAR(500) NULL,
  ADD COLUMN reviewed_by BIGINT UNSIGNED NULL,
  ADD CONSTRAINT fk_application_merchant_profile FOREIGN KEY (merchant_profile_id) REFERENCES merchant_profiles(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_application_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;

-- 3. 商家与店铺一对多关系扩展
ALTER TABLE stores
  ADD COLUMN merchant_profile_id BIGINT UNSIGNED NULL,
  ADD COLUMN business_status ENUM('open', 'closed', 'paused') NOT NULL DEFAULT 'open',
  ADD COLUMN service_phone VARCHAR(20) NULL,
  ADD COLUMN address VARCHAR(300) NULL,
  ADD COLUMN province VARCHAR(40) NULL,
  ADD COLUMN district VARCHAR(80) NULL,
  ADD CONSTRAINT fk_store_merchant_profile FOREIGN KEY (merchant_profile_id) REFERENCES merchant_profiles(id) ON DELETE SET NULL,
  ADD INDEX idx_stores_merchant_status (merchant_profile_id, status, business_status);

-- 4. 商品生产字段：上下架审核、规格、资质、批次
ALTER TABLE products
  ADD COLUMN sku VARCHAR(80) NULL,
  ADD COLUMN unit VARCHAR(30) NOT NULL DEFAULT '件',
  ADD COLUMN specifications VARCHAR(200) NULL,
  ADD COLUMN production_date DATE NULL,
  ADD COLUMN expiry_date DATE NULL,
  ADD COLUMN approval_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved',
  ADD COLUMN approval_note VARCHAR(500) NULL,
  ADD COLUMN approved_by BIGINT UNSIGNED NULL,
  ADD COLUMN approved_at DATETIME NULL,
  ADD UNIQUE KEY uk_product_store_sku (store_id, sku),
  ADD CONSTRAINT fk_product_approver FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  ADD INDEX idx_products_approval_status (approval_status, status);

CREATE TABLE IF NOT EXISTS product_batches (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  batch_no VARCHAR(100) NOT NULL,
  origin VARCHAR(120) NULL,
  production_date DATE NULL,
  expiry_date DATE NULL,
  stock INT UNSIGNED NOT NULL DEFAULT 0,
  quality_report_url VARCHAR(500) NULL,
  trace_code VARCHAR(120) NULL,
  status ENUM('active', 'expired', 'recalled') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_batch_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uk_product_batch (product_id, batch_no),
  INDEX idx_batches_status_expiry (status, expiry_date)
) ENGINE=InnoDB COMMENT='商品批次与溯源';

-- 5. 通用资质材料
CREATE TABLE IF NOT EXISTS compliance_documents (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  owner_type ENUM('merchant', 'store', 'product', 'batch') NOT NULL,
  owner_id BIGINT UNSIGNED NOT NULL,
  document_type VARCHAR(80) NOT NULL,
  document_name VARCHAR(160) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_hash CHAR(64) NULL,
  status ENUM('pending', 'approved', 'rejected', 'expired') NOT NULL DEFAULT 'pending',
  expires_at DATE NULL,
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_document_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_documents_owner (owner_type, owner_id),
  INDEX idx_documents_status_expiry (status, expires_at)
) ENGINE=InnoDB COMMENT='资质与检测报告';

-- 6. 收货地址
CREATE TABLE IF NOT EXISTS user_addresses (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  receiver_name VARCHAR(80) NOT NULL,
  receiver_phone VARCHAR(20) NOT NULL,
  province VARCHAR(40) NOT NULL,
  city VARCHAR(40) NOT NULL,
  district VARCHAR(80) NOT NULL,
  detail_address VARCHAR(300) NOT NULL,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_address_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_addresses_user_default (user_id, is_default)
) ENGINE=InnoDB COMMENT='用户收货地址';

-- 7. 购物车
CREATE TABLE IF NOT EXISTS carts (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  selected TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uk_cart_user_product (user_id, product_id),
  INDEX idx_carts_user_selected (user_id, selected)
) ENGINE=InnoDB COMMENT='购物车';

-- 8. 支付与退款
CREATE TABLE IF NOT EXISTS payments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  payment_no VARCHAR(80) NOT NULL UNIQUE,
  provider ENUM('wechat', 'alipay', 'manual', 'mock') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('created', 'paid', 'failed', 'closed', 'refunded') NOT NULL DEFAULT 'created',
  provider_transaction_no VARCHAR(120) NULL,
  paid_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT,
  CONSTRAINT chk_payment_amount CHECK (amount >= 0),
  INDEX idx_payments_order_status (order_id, status)
) ENGINE=InnoDB COMMENT='支付记录';

CREATE TABLE IF NOT EXISTS refunds (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  payment_id BIGINT UNSIGNED NULL,
  refund_no VARCHAR(80) NOT NULL UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  reason VARCHAR(500) NOT NULL,
  status ENUM('pending', 'approved', 'processing', 'completed', 'rejected') NOT NULL DEFAULT 'pending',
  reviewed_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  CONSTRAINT fk_refund_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT,
  CONSTRAINT fk_refund_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
  CONSTRAINT fk_refund_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_refund_amount CHECK (amount >= 0),
  INDEX idx_refunds_order_status (order_id, status)
) ENGINE=InnoDB COMMENT='退款售后';

-- 9. 物流
CREATE TABLE IF NOT EXISTS shipments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  carrier VARCHAR(80) NULL,
  tracking_no VARCHAR(120) NULL,
  status ENUM('pending', 'shipped', 'in_transit', 'delivered', 'exception') NOT NULL DEFAULT 'pending',
  shipped_at DATETIME NULL,
  delivered_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_shipment_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT,
  UNIQUE KEY uk_shipment_order (order_id),
  INDEX idx_shipments_tracking (tracking_no)
) ENGINE=InnoDB COMMENT='物流记录';

CREATE TABLE IF NOT EXISTS shipment_events (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  shipment_id BIGINT UNSIGNED NOT NULL,
  event_time DATETIME NOT NULL,
  location VARCHAR(160) NULL,
  description VARCHAR(500) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_shipment_event_shipment FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
  INDEX idx_shipment_events_time (shipment_id, event_time)
) ENGINE=InnoDB COMMENT='物流轨迹';

-- 10. 订单状态、操作日志、平台通知
CREATE TABLE IF NOT EXISTS order_status_logs (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  from_status VARCHAR(40) NULL,
  to_status VARCHAR(40) NOT NULL,
  operator_id BIGINT UNSIGNED NULL,
  note VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_log_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_log_operator FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_order_status_logs (order_id, created_at)
) ENGINE=InnoDB COMMENT='订单状态日志';

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  actor_id BIGINT UNSIGNED NULL,
  action VARCHAR(80) NOT NULL,
  resource_type VARCHAR(80) NOT NULL,
  resource_id BIGINT UNSIGNED NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(500) NULL,
  details JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_audit_resource (resource_type, resource_id, created_at),
  INDEX idx_audit_actor (actor_id, created_at)
) ENGINE=InnoDB COMMENT='平台审计日志';

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  type VARCHAR(60) NOT NULL,
  title VARCHAR(160) NOT NULL,
  content VARCHAR(1000) NOT NULL,
  read_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user_read (user_id, read_at, created_at)
) ENGINE=InnoDB COMMENT='用户通知';

-- 11. 结算与平台佣金
CREATE TABLE IF NOT EXISTS merchant_settlements (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  merchant_profile_id BIGINT UNSIGNED NOT NULL,
  settlement_period CHAR(7) NOT NULL,
  gross_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  commission_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  refund_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  net_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  status ENUM('pending', 'confirmed', 'paid', 'closed') NOT NULL DEFAULT 'pending',
  paid_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_settlement_merchant FOREIGN KEY (merchant_profile_id) REFERENCES merchant_profiles(id) ON DELETE RESTRICT,
  UNIQUE KEY uk_settlement_period (merchant_profile_id, settlement_period),
  INDEX idx_settlements_status (status, settlement_period)
) ENGINE=InnoDB COMMENT='商家结算';

-- 12. 迁移记录
INSERT IGNORE INTO schema_migrations (version, description)
VALUES ('2026_01_production_delivery', '生产交付版：商家、资质、购物车、地址、支付、退款、物流、审计、通知、结算');

-- 13. 生产查询视图：仅放行已审核商品
CREATE OR REPLACE VIEW v_store_product_counts AS
SELECT
  s.id AS store_id, s.name, s.city, s.rating, s.rating_count,
  s.follower_count, COUNT(p.id) AS product_count
FROM stores s
LEFT JOIN products p
  ON p.store_id = s.id
  AND p.status = 'on_sale'
  AND p.approval_status = 'approved'
WHERE s.status = 'active' AND s.business_status = 'open'
GROUP BY s.id, s.name, s.city, s.rating, s.rating_count, s.follower_count;

CREATE OR REPLACE VIEW v_active_products AS
SELECT
  p.id, p.store_id, s.name AS store_name, s.city,
  p.category_id, c.name AS category_name, c.icon AS category_icon,
  p.name, p.description, p.price, p.original_price, p.stock,
  p.sales_count, p.rating, p.rating_count, p.tag, p.image_url,
  p.origin, p.trace_code, p.sku, p.unit, p.specifications,
  p.production_date, p.expiry_date
FROM products p
JOIN stores s ON s.id = p.store_id AND s.status = 'active' AND s.business_status = 'open'
JOIN categories c ON c.id = p.category_id AND c.status = 'active'
WHERE p.status = 'on_sale' AND p.approval_status = 'approved';

-- 迁移后检查
-- SHOW TABLES;
-- SELECT * FROM schema_migrations ORDER BY id DESC;
-- SELECT COUNT(*) FROM products WHERE status = 'on_sale' AND approval_status = 'approved';

-- 炎黄济世 · 多商户公域集市 P0 增量迁移
-- 新增：佣金、订单来源、商品公域开关、专属店铺链接码、资质到期日。
-- 适用于已执行 schema.sql / production_migration.sql / chat_traffic_migration.sql 的 yhjs 数据库。
USE yhjs;

-- 1. 店铺：佣金比例 + 专属店铺链接短码
ALTER TABLE stores
  ADD COLUMN commission_rate DECIMAL(5,2) NOT NULL DEFAULT 1.50 COMMENT '交易佣金比例(%)',
  ADD COLUMN shop_link_code VARCHAR(40) NULL COMMENT '专属店铺短码',
  ADD UNIQUE KEY uk_store_link_code (shop_link_code);

-- 2. 订单：来源标记 + 佣金
ALTER TABLE orders
  ADD COLUMN source ENUM('market','private') NOT NULL DEFAULT 'market' COMMENT '订单来源：market公域 / private私域',
  ADD COLUMN commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT '下单时佣金比例(%)',
  ADD COLUMN commission_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '佣金金额(元)',
  ADD INDEX idx_orders_source (source);

-- 3. 商品：公域集市展示开关（默认公开）
ALTER TABLE products
  ADD COLUMN is_public TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否公域展示：1公开 / 0仅私域可见',
  ADD INDEX idx_products_public_status (is_public, status, approval_status);

-- 4. 资质到期日（商家主体 + 入驻申请）
ALTER TABLE merchant_profiles
  ADD COLUMN license_expiry_date DATE NULL COMMENT '经营许可到期日';
ALTER TABLE merchant_applications
  ADD COLUMN license_expiry_date DATE NULL COMMENT '经营许可到期日';

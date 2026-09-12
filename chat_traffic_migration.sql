-- 炎黄济世 · 三端能力增量迁移（聊天 + 店铺流量）
-- 适用于已执行 schema.sql / production_migration.sql 的 yhjs 数据库。
-- 本脚本只新增表，不删除现有数据，可重复执行（使用 IF NOT EXISTS）。
USE yhjs;

-- 1. 用户-商家会话
CREATE TABLE IF NOT EXISTS conversations (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  store_id BIGINT UNSIGNED NOT NULL,
  last_message VARCHAR(500) NULL,
  last_message_at DATETIME NULL,
  unread_user INT UNSIGNED NOT NULL DEFAULT 0,
  unread_merchant INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_conversation_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_conversation_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  UNIQUE KEY uk_conversation_user_store (user_id, store_id),
  INDEX idx_conversation_store (store_id, last_message_at DESC),
  INDEX idx_conversation_user (user_id, last_message_at DESC)
) ENGINE=InnoDB COMMENT='用户与商家会话';

-- 2. 会话消息
CREATE TABLE IF NOT EXISTS messages (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  conversation_id BIGINT UNSIGNED NOT NULL,
  sender_id BIGINT UNSIGNED NOT NULL,
  content VARCHAR(2000) NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_message_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_message_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_messages_conversation_time (conversation_id, created_at)
) ENGINE=InnoDB COMMENT='会话消息';

-- 3. 店铺访问流量（商家端流量统计）
CREATE TABLE IF NOT EXISTS store_visits (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  store_id BIGINT UNSIGNED NOT NULL,
  visitor_user_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_visit_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  CONSTRAINT fk_visit_user FOREIGN KEY (visitor_user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_visits_store_time (store_id, created_at)
) ENGINE=InnoDB COMMENT='店铺访问流量';

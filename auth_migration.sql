-- 炎黄济世 · 注册登录增量迁移
-- 在已导入 yhjs 数据库后，在 Navicat 中执行一次。
USE yhjs;

ALTER TABLE users
  ADD COLUMN password_hash VARCHAR(255) NULL AFTER phone,
  ADD COLUMN last_login_at DATETIME NULL AFTER updated_at;

CREATE TABLE IF NOT EXISTS user_sessions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sessions_user_expires (user_id, expires_at),
  INDEX idx_sessions_expires (expires_at)
) ENGINE=InnoDB COMMENT='登录会话';

-- 迁移后检查
-- DESCRIBE users;
-- DESCRIBE user_sessions;

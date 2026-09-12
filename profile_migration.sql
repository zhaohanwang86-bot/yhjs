-- 炎黄济世 · 个人资料增量迁移
-- 在已执行 auth_migration.sql 的前提下执行。
USE yhjs;

ALTER TABLE users
  ADD COLUMN bio VARCHAR(300) NULL AFTER avatar_url,
  ADD COLUMN gender ENUM('unknown', 'male', 'female') NOT NULL DEFAULT 'unknown' AFTER bio,
  ADD COLUMN birthday DATE NULL AFTER gender;

-- 检查
-- DESCRIBE users;

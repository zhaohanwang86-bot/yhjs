/*
 Navicat Premium Dump SQL

 Source Server         : yhjs
 Source Server Type    : MySQL
 Source Server Version : 80021 (8.0.21)
 Source Host           : localhost:3306
 Source Schema         : yhjs

 Target Server Type    : MySQL
 Target Server Version : 80021 (8.0.21)
 File Encoding         : 65001

 Date: 09/09/2026 15:45:15
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for audit_logs
-- ----------------------------
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `actor_id` bigint UNSIGNED NULL DEFAULT NULL,
  `action` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `resource_type` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `resource_id` bigint UNSIGNED NULL DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `user_agent` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `details` json NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_audit_resource`(`resource_type` ASC, `resource_id` ASC, `created_at` ASC) USING BTREE,
  INDEX `idx_audit_actor`(`actor_id` ASC, `created_at` ASC) USING BTREE,
  CONSTRAINT `fk_audit_actor` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '平台审计日志' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of audit_logs
-- ----------------------------

-- ----------------------------
-- Table structure for carts
-- ----------------------------
DROP TABLE IF EXISTS `carts`;
CREATE TABLE `carts`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint UNSIGNED NOT NULL,
  `product_id` bigint UNSIGNED NOT NULL,
  `quantity` int UNSIGNED NOT NULL DEFAULT 1,
  `selected` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_cart_user_product`(`user_id` ASC, `product_id` ASC) USING BTREE,
  INDEX `fk_cart_product`(`product_id` ASC) USING BTREE,
  INDEX `idx_carts_user_selected`(`user_id` ASC, `selected` ASC) USING BTREE,
  CONSTRAINT `fk_cart_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_cart_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '购物车' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of carts
-- ----------------------------

-- ----------------------------
-- Table structure for categories
-- ----------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `icon` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT 0,
  `status` enum('active','hidden') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `name`(`name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '药材分类' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of categories
-- ----------------------------
INSERT INTO `categories` VALUES (1, '参茸滋补', '🌿', 10, 'active', '2026-08-30 09:17:08');
INSERT INTO `categories` VALUES (2, '花茶养生', '🍵', 20, 'active', '2026-08-30 09:17:08');
INSERT INTO `categories` VALUES (3, '药食同源', '🥣', 30, 'active', '2026-08-30 09:17:08');
INSERT INTO `categories` VALUES (4, '精品饮片', '🌾', 40, 'active', '2026-08-30 09:17:08');
INSERT INTO `categories` VALUES (5, '中成药', '💊', 50, 'active', '2026-08-30 09:17:08');
INSERT INTO `categories` VALUES (6, '滋补膏方', '🍯', 60, 'active', '2026-08-30 09:17:08');
INSERT INTO `categories` VALUES (7, '艾灸理疗', '🕯️', 70, 'active', '2026-08-30 09:17:08');
INSERT INTO `categories` VALUES (8, '药膳汤料', '🥘', 80, 'active', '2026-08-30 09:17:08');

-- ----------------------------
-- Table structure for community_posts
-- ----------------------------
DROP TABLE IF EXISTS `community_posts`;
CREATE TABLE `community_posts`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint UNSIGNED NULL DEFAULT NULL,
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `tag` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '养生讨论',
  `like_count` int UNSIGNED NOT NULL DEFAULT 0,
  `comment_count` int UNSIGNED NOT NULL DEFAULT 0,
  `status` enum('visible','hidden','pending') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'visible',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `fk_post_user`(`user_id` ASC) USING BTREE,
  INDEX `idx_posts_status_created`(`status` ASC, `created_at` DESC) USING BTREE,
  INDEX `idx_posts_tag_created`(`tag` ASC, `created_at` DESC) USING BTREE,
  CONSTRAINT `fk_post_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '社区帖子' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of community_posts
-- ----------------------------
INSERT INTO `community_posts` VALUES (1, 2, '第一次在平台上买参，如何辨别野山参和园参？', '看中一家店的长白山野山参，价格不便宜。想知道怎么从芦、艼、体、须几个方面辨别真伪？', '选购求助', 42, 2, 'visible', '2026-08-30 09:17:08', '2026-08-30 09:17:08');
INSERT INTO `community_posts` VALUES (2, 3, '东阿阿胶糕怎么选？即食装和传统胶块哪个更适合日常保养？', '准备给家里长辈买阿胶，即食糕方便但是怕糖分高，大家怎么选？', '养生讨论', 28, 2, 'visible', '2026-08-30 09:17:08', '2026-08-30 09:17:08');
INSERT INTO `community_posts` VALUES (3, 2, '新会陈皮的年份到底怎么看？', '同一产区不同店卖的五年陈、十年陈价格差一倍，年份这个东西是不是智商税？', '药材知识', 51, 2, 'visible', '2026-08-30 09:17:08', '2026-08-30 09:17:08');
INSERT INTO `community_posts` VALUES (4, 1, '征集：大家所在城市有哪些值得入驻炎黄济世的本土药铺？', '炎黄济世正在邀请各大药铺入驻，欢迎推荐身边的宝藏店铺。', '平台共建', 96, 3, 'visible', '2026-08-30 09:17:08', '2026-08-30 09:17:08');
INSERT INTO `community_posts` VALUES (5, 3, '药食同源科普：枸杞每天吃多少合适？', '枸杞性温，每天20g以内为宜，感冒发烧、腹泻期间不宜食用。', '科普分享', 132, 2, 'visible', '2026-08-30 09:17:08', '2026-08-30 09:17:08');

-- ----------------------------
-- Table structure for compliance_documents
-- ----------------------------
DROP TABLE IF EXISTS `compliance_documents`;
CREATE TABLE `compliance_documents`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `owner_type` enum('merchant','store','product','batch') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `owner_id` bigint UNSIGNED NOT NULL,
  `document_type` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `document_name` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `file_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `file_hash` char(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `status` enum('pending','approved','rejected','expired') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'pending',
  `expires_at` date NULL DEFAULT NULL,
  `reviewed_by` bigint UNSIGNED NULL DEFAULT NULL,
  `reviewed_at` datetime NULL DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `fk_document_reviewer`(`reviewed_by` ASC) USING BTREE,
  INDEX `idx_documents_owner`(`owner_type` ASC, `owner_id` ASC) USING BTREE,
  INDEX `idx_documents_status_expiry`(`status` ASC, `expires_at` ASC) USING BTREE,
  CONSTRAINT `fk_document_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '资质与检测报告' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of compliance_documents
-- ----------------------------

-- ----------------------------
-- Table structure for conversations
-- ----------------------------
DROP TABLE IF EXISTS `conversations`;
CREATE TABLE `conversations`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint UNSIGNED NOT NULL,
  `store_id` bigint UNSIGNED NOT NULL,
  `last_message` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `last_message_at` datetime NULL DEFAULT NULL,
  `unread_user` int UNSIGNED NOT NULL DEFAULT 0,
  `unread_merchant` int UNSIGNED NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_conversation_user_store`(`user_id` ASC, `store_id` ASC) USING BTREE,
  INDEX `idx_conversation_store`(`store_id` ASC, `last_message_at` DESC) USING BTREE,
  INDEX `idx_conversation_user`(`user_id` ASC, `last_message_at` DESC) USING BTREE,
  CONSTRAINT `fk_conversation_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_conversation_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户与商家会话' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of conversations
-- ----------------------------

-- ----------------------------
-- Table structure for favorites
-- ----------------------------
DROP TABLE IF EXISTS `favorites`;
CREATE TABLE `favorites`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint UNSIGNED NOT NULL,
  `target_type` enum('store','product') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `target_id` bigint UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_favorite`(`user_id` ASC, `target_type` ASC, `target_id` ASC) USING BTREE,
  INDEX `idx_favorites_user`(`user_id` ASC, `created_at` DESC) USING BTREE,
  CONSTRAINT `fk_favorite_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户收藏' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of favorites
-- ----------------------------
INSERT INTO `favorites` VALUES (1, 6, 'product', 1, '2026-09-09 11:39:38');

-- ----------------------------
-- Table structure for merchant_applications
-- ----------------------------
DROP TABLE IF EXISTS `merchant_applications`;
CREATE TABLE `merchant_applications`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint UNSIGNED NULL DEFAULT NULL,
  `store_name` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `city` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `contact_name` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `contact_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `store_type` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `main_category` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `introduction` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `qualification_note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `status` enum('pending','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'pending',
  `review_note` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reviewed_at` datetime NULL DEFAULT NULL,
  `merchant_profile_id` bigint UNSIGNED NULL DEFAULT NULL,
  `license_no` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `license_image_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `reviewed_by` bigint UNSIGNED NULL DEFAULT NULL,
  `license_expiry_date` date NULL DEFAULT NULL COMMENT '经营许可到期日',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `fk_application_user`(`user_id` ASC) USING BTREE,
  INDEX `idx_applications_status_created`(`status` ASC, `created_at` ASC) USING BTREE,
  INDEX `fk_application_merchant_profile`(`merchant_profile_id` ASC) USING BTREE,
  INDEX `fk_application_reviewer`(`reviewed_by` ASC) USING BTREE,
  CONSTRAINT `fk_application_merchant_profile` FOREIGN KEY (`merchant_profile_id`) REFERENCES `merchant_profiles` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `fk_application_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `fk_application_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '商家入驻申请' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of merchant_applications
-- ----------------------------

-- ----------------------------
-- Table structure for merchant_profiles
-- ----------------------------
DROP TABLE IF EXISTS `merchant_profiles`;
CREATE TABLE `merchant_profiles`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint UNSIGNED NOT NULL,
  `legal_name` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `license_no` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `license_image_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `legal_representative` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `contact_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `settlement_account_name` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `settlement_bank` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `settlement_account_no` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `status` enum('pending','approved','rejected','suspended') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'pending',
  `reject_reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `approved_at` datetime NULL DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `license_expiry_date` date NULL DEFAULT NULL COMMENT '经营许可到期日',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_merchant_profiles_status`(`status` ASC) USING BTREE,
  CONSTRAINT `fk_merchant_profile_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '商家主体' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of merchant_profiles
-- ----------------------------
INSERT INTO `merchant_profiles` VALUES (1, 7, '华夏本草贸易有限公司', 'HB-2026-0001', NULL, NULL, '13643396844', NULL, NULL, NULL, 'approved', NULL, '2026-08-30 09:17:10', '2026-08-30 09:17:10', '2026-08-30 09:17:10', NULL);

-- ----------------------------
-- Table structure for merchant_settlements
-- ----------------------------
DROP TABLE IF EXISTS `merchant_settlements`;
CREATE TABLE `merchant_settlements`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `merchant_profile_id` bigint UNSIGNED NOT NULL,
  `settlement_period` char(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `gross_amount` decimal(12, 2) NOT NULL DEFAULT 0.00,
  `commission_amount` decimal(12, 2) NOT NULL DEFAULT 0.00,
  `refund_amount` decimal(12, 2) NOT NULL DEFAULT 0.00,
  `net_amount` decimal(12, 2) NOT NULL DEFAULT 0.00,
  `status` enum('pending','confirmed','paid','closed') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'pending',
  `paid_at` datetime NULL DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_settlement_period`(`merchant_profile_id` ASC, `settlement_period` ASC) USING BTREE,
  INDEX `idx_settlements_status`(`status` ASC, `settlement_period` ASC) USING BTREE,
  CONSTRAINT `fk_settlement_merchant` FOREIGN KEY (`merchant_profile_id`) REFERENCES `merchant_profiles` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '商家结算' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of merchant_settlements
-- ----------------------------

-- ----------------------------
-- Table structure for messages
-- ----------------------------
DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `conversation_id` bigint UNSIGNED NOT NULL,
  `sender_id` bigint UNSIGNED NOT NULL,
  `content` varchar(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `fk_message_sender`(`sender_id` ASC) USING BTREE,
  INDEX `idx_messages_conversation_time`(`conversation_id` ASC, `created_at` ASC) USING BTREE,
  CONSTRAINT `fk_message_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_message_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '会话消息' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of messages
-- ----------------------------

-- ----------------------------
-- Table structure for notifications
-- ----------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint UNSIGNED NOT NULL,
  `type` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `title` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `content` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `read_at` datetime NULL DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_notifications_user_read`(`user_id` ASC, `read_at` ASC, `created_at` ASC) USING BTREE,
  CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户通知' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of notifications
-- ----------------------------

-- ----------------------------
-- Table structure for order_items
-- ----------------------------
DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` bigint UNSIGNED NOT NULL,
  `product_id` bigint UNSIGNED NOT NULL,
  `product_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `unit_price` decimal(10, 2) NOT NULL,
  `quantity` int UNSIGNED NOT NULL,
  `subtotal` decimal(10, 2) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `fk_item_product`(`product_id` ASC) USING BTREE,
  INDEX `idx_order_items_order`(`order_id` ASC) USING BTREE,
  CONSTRAINT `fk_item_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_item_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `chk_item_amount` CHECK ((`unit_price` >= 0) and (`subtotal` >= 0)),
  CONSTRAINT `chk_item_quantity` CHECK (`quantity` > 0)
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '订单明细' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of order_items
-- ----------------------------

-- ----------------------------
-- Table structure for order_status_logs
-- ----------------------------
DROP TABLE IF EXISTS `order_status_logs`;
CREATE TABLE `order_status_logs`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` bigint UNSIGNED NOT NULL,
  `from_status` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `to_status` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `operator_id` bigint UNSIGNED NULL DEFAULT NULL,
  `note` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `fk_order_log_operator`(`operator_id` ASC) USING BTREE,
  INDEX `idx_order_status_logs`(`order_id` ASC, `created_at` ASC) USING BTREE,
  CONSTRAINT `fk_order_log_operator` FOREIGN KEY (`operator_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `fk_order_log_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '订单状态日志' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of order_status_logs
-- ----------------------------

-- ----------------------------
-- Table structure for orders
-- ----------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_no` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `user_id` bigint UNSIGNED NULL DEFAULT NULL,
  `store_id` bigint UNSIGNED NOT NULL,
  `receiver_name` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `receiver_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `receiver_address` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `total_amount` decimal(10, 2) NOT NULL,
  `status` enum('pending_payment','paid','shipped','completed','cancelled','refunding','refunded') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'pending_payment',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `paid_at` datetime NULL DEFAULT NULL,
  `completed_at` datetime NULL DEFAULT NULL,
  `source` enum('market','private') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'market' COMMENT '订单来源：market公域 / private私域',
  `commission_rate` decimal(5, 2) NOT NULL DEFAULT 0.00 COMMENT '下单时佣金比例(%)',
  `commission_amount` decimal(10, 2) NOT NULL DEFAULT 0.00 COMMENT '佣金金额(元)',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `order_no`(`order_no` ASC) USING BTREE,
  INDEX `idx_orders_user_created`(`user_id` ASC, `created_at` DESC) USING BTREE,
  INDEX `idx_orders_store_status`(`store_id` ASC, `status` ASC, `created_at` DESC) USING BTREE,
  INDEX `idx_orders_source`(`source` ASC) USING BTREE,
  CONSTRAINT `fk_order_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_order_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `chk_order_amount` CHECK (`total_amount` >= 0)
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '订单主表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of orders
-- ----------------------------

-- ----------------------------
-- Table structure for payments
-- ----------------------------
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` bigint UNSIGNED NOT NULL,
  `payment_no` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `provider` enum('wechat','alipay','manual','mock') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `amount` decimal(10, 2) NOT NULL,
  `status` enum('created','paid','failed','closed','refunded') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'created',
  `provider_transaction_no` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `paid_at` datetime NULL DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `payment_no`(`payment_no` ASC) USING BTREE,
  INDEX `idx_payments_order_status`(`order_id` ASC, `status` ASC) USING BTREE,
  CONSTRAINT `fk_payment_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `chk_payment_amount` CHECK (`amount` >= 0)
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '支付记录' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of payments
-- ----------------------------

-- ----------------------------
-- Table structure for post_comments
-- ----------------------------
DROP TABLE IF EXISTS `post_comments`;
CREATE TABLE `post_comments`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `post_id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NULL DEFAULT NULL,
  `content` varchar(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `status` enum('visible','hidden','pending') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'visible',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `fk_comment_user`(`user_id` ASC) USING BTREE,
  INDEX `idx_comments_post_created`(`post_id` ASC, `status` ASC, `created_at` ASC) USING BTREE,
  CONSTRAINT `fk_comment_post` FOREIGN KEY (`post_id`) REFERENCES `community_posts` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_comment_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '帖子评论' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of post_comments
-- ----------------------------
INSERT INTO `post_comments` VALUES (1, 1, 3, '记住口诀：芦碗清晰、艼须下垂、体态灵巧、须长有珍珠点。', 'visible', '2026-08-30 09:17:08');
INSERT INTO `post_comments` VALUES (2, 1, 2, '多谢指教！那家店给了产地证书编号，我可以放心下单了。', 'visible', '2026-08-30 09:17:08');
INSERT INTO `post_comments` VALUES (3, 2, 2, '日常保养选即食糕更省心，注意看配料表。', 'visible', '2026-08-30 09:17:08');
INSERT INTO `post_comments` VALUES (4, 3, 3, '年份差在香气醇厚度和油室转化，十年陈更温润。', 'visible', '2026-08-30 09:17:08');

-- ----------------------------
-- Table structure for post_likes
-- ----------------------------
DROP TABLE IF EXISTS `post_likes`;
CREATE TABLE `post_likes`  (
  `post_id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`post_id`, `user_id`) USING BTREE,
  INDEX `fk_like_user`(`user_id` ASC) USING BTREE,
  CONSTRAINT `fk_like_post` FOREIGN KEY (`post_id`) REFERENCES `community_posts` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_like_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '帖子点赞' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of post_likes
-- ----------------------------

-- ----------------------------
-- Table structure for product_batches
-- ----------------------------
DROP TABLE IF EXISTS `product_batches`;
CREATE TABLE `product_batches`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` bigint UNSIGNED NOT NULL,
  `batch_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `origin` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `production_date` date NULL DEFAULT NULL,
  `expiry_date` date NULL DEFAULT NULL,
  `stock` int UNSIGNED NOT NULL DEFAULT 0,
  `quality_report_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `trace_code` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `status` enum('active','expired','recalled') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_product_batch`(`product_id` ASC, `batch_no` ASC) USING BTREE,
  INDEX `idx_batches_status_expiry`(`status` ASC, `expiry_date` ASC) USING BTREE,
  CONSTRAINT `fk_batch_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '商品批次与溯源' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of product_batches
-- ----------------------------

-- ----------------------------
-- Table structure for products
-- ----------------------------
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `store_id` bigint UNSIGNED NOT NULL,
  `category_id` bigint UNSIGNED NOT NULL,
  `name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `price` decimal(10, 2) NOT NULL,
  `original_price` decimal(10, 2) NULL DEFAULT NULL,
  `stock` int UNSIGNED NOT NULL DEFAULT 0,
  `sales_count` int UNSIGNED NOT NULL DEFAULT 0,
  `rating` decimal(2, 1) NOT NULL DEFAULT 0.0,
  `rating_count` int UNSIGNED NOT NULL DEFAULT 0,
  `tag` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `image_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `origin` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `trace_code` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `status` enum('draft','on_sale','off_shelf') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'draft',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `sku` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `unit` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '件',
  `specifications` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `production_date` date NULL DEFAULT NULL,
  `expiry_date` date NULL DEFAULT NULL,
  `approval_status` enum('pending','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'approved',
  `approval_note` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `approved_by` bigint UNSIGNED NULL DEFAULT NULL,
  `approved_at` datetime NULL DEFAULT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否公域展示：1公开 / 0仅私域可见',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_product_store_sku`(`store_id` ASC, `sku` ASC) USING BTREE,
  INDEX `idx_products_store_status`(`store_id` ASC, `status` ASC) USING BTREE,
  INDEX `idx_products_category_status`(`category_id` ASC, `status` ASC) USING BTREE,
  INDEX `idx_products_sales`(`sales_count` DESC) USING BTREE,
  INDEX `fk_product_approver`(`approved_by` ASC) USING BTREE,
  INDEX `idx_products_approval_status`(`approval_status` ASC, `status` ASC) USING BTREE,
  INDEX `idx_products_public_status`(`is_public` ASC, `status` ASC, `approval_status` ASC) USING BTREE,
  FULLTEXT INDEX `ft_products_search`(`name`, `description`, `origin`),
  CONSTRAINT `fk_product_approver` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `fk_product_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_product_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `chk_product_price` CHECK (`price` >= 0),
  CONSTRAINT `chk_product_rating` CHECK ((`rating` >= 0) and (`rating` <= 5))
) ENGINE = InnoDB AUTO_INCREMENT = 17 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '药材商品' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of products
-- ----------------------------
INSERT INTO `products` VALUES (1, 1, 1, '长白山野山参 · 15年足龄', '产自长白山原始林下，15年足龄林下参，附产地溯源证书。', 268.00, 328.00, 500, 8600, 4.9, 2300, '镇店之宝', NULL, '吉林长白山', 'JL-YRS-0001', 'on_sale', '2026-08-30 09:17:08', '2026-08-30 09:17:08', NULL, '件', NULL, NULL, NULL, 'approved', NULL, NULL, NULL, 1);
INSERT INTO `products` VALUES (2, 1, 3, '宁夏头茬枸杞 · 500g 免洗', '宁夏中宁头茬枸杞，皮薄肉厚籽少，免洗即食。', 39.90, 59.90, 3000, 32600, 4.8, 8900, '热卖', NULL, '宁夏中宁', 'NX-GQ-0002', 'on_sale', '2026-08-30 09:17:08', '2026-08-30 09:17:08', NULL, '件', NULL, NULL, NULL, 'approved', NULL, NULL, NULL, 1);
INSERT INTO `products` VALUES (3, 2, 4, '云南文山三七粉 · 40头精磨', '文山道地三七，40头精磨300目细粉，附检测报告。', 128.00, 158.00, 1200, 15200, 4.8, 5600, '地道', NULL, '云南文山', 'YN-SQ-0003', 'on_sale', '2026-08-30 09:17:08', '2026-08-30 09:17:08', NULL, '件', NULL, NULL, NULL, 'approved', NULL, NULL, NULL, 1);
INSERT INTO `products` VALUES (4, 2, 1, '云南野生黑玛咖', '海拔3500米以上野生黑玛咖，煲汤泡酒皆宜。', 88.00, 118.00, 900, 6400, 4.7, 1800, '新品', NULL, '云南丽江', 'YN-MK-0004', 'on_sale', '2026-08-30 09:17:08', '2026-08-30 09:17:08', NULL, '件', NULL, NULL, NULL, 'approved', NULL, NULL, NULL, 1);
INSERT INTO `products` VALUES (5, 3, 6, '东阿阿胶糕 · 即食装 250g', '古法熬制阿胶配核桃、黑芝麻，独立小包装。', 199.00, 259.00, 800, 22100, 4.9, 9700, '滋补佳品', NULL, '山东东阿', 'SD-AJ-0005', 'on_sale', '2026-08-30 09:17:08', '2026-08-30 09:17:08', NULL, '件', NULL, NULL, NULL, 'approved', NULL, NULL, NULL, 1);
INSERT INTO `products` VALUES (6, 3, 2, '杭州白菊 · 胎菊王 250g', '杭白菊胎菊王，清香四溢，日常泡水佳品。', 45.00, 65.00, 1600, 18800, 4.7, 7200, '热卖', NULL, '浙江桐乡', 'ZJ-JH-0006', 'on_sale', '2026-08-30 09:17:08', '2026-08-30 09:17:08', NULL, '件', NULL, NULL, NULL, 'approved', NULL, NULL, NULL, 1);
INSERT INTO `products` VALUES (7, 4, 1, '湖南平江野生灵芝', '平江深山野生灵芝，煮水煲汤皆宜。', 158.00, 198.00, 400, 4300, 4.6, 1500, '养生', NULL, '湖南平江', 'HN-LZ-0007', 'on_sale', '2026-08-30 09:17:08', '2026-08-30 09:17:08', NULL, '件', NULL, NULL, NULL, 'approved', NULL, NULL, NULL, 1);
INSERT INTO `products` VALUES (8, 4, 3, '河南焦作铁棍山药', '焦作温县垆土铁棍山药，粉糯香甜。', 29.90, 42.00, 2400, 28700, 4.7, 8100, '药食同源', NULL, '河南焦作', 'HN-SY-0008', 'on_sale', '2026-08-30 09:17:08', '2026-08-30 09:17:08', NULL, '件', NULL, NULL, NULL, 'approved', NULL, NULL, NULL, 1);
INSERT INTO `products` VALUES (9, 5, 5, '漳州片仔癀胶囊', '源于明代宫廷秘方，一物一码，全程可溯源。', 880.00, 960.00, 200, 2100, 4.8, 1100, '传奇名方', NULL, '福建漳州', 'FJ-PZH-0009', 'on_sale', '2026-08-30 09:17:08', '2026-08-30 09:17:08', NULL, '件', NULL, NULL, NULL, 'approved', NULL, NULL, NULL, 1);
INSERT INTO `products` VALUES (10, 5, 3, '福建建宁莲子 · 去芯 500g', '建宁通心白莲，煮粥煲汤清香甘甜。', 38.00, 52.00, 1800, 9600, 4.7, 3400, '干货', NULL, '福建建宁', 'FJ-LZ-0010', 'on_sale', '2026-08-30 09:17:08', '2026-08-30 09:17:08', NULL, '件', NULL, NULL, NULL, 'approved', NULL, NULL, NULL, 1);
INSERT INTO `products` VALUES (11, 6, 6, '东阿阿胶块 · 250g 整块', '东阿县原产地直发，古法九提九滤。', 549.00, 699.00, 300, 7800, 4.9, 4600, '原产直发', NULL, '山东东阿', 'SD-AJ-0011', 'on_sale', '2026-08-30 09:17:08', '2026-08-30 09:17:08', NULL, '件', NULL, NULL, NULL, 'approved', NULL, NULL, NULL, 1);
INSERT INTO `products` VALUES (12, 6, 2, '山东平阴重瓣玫瑰花茶', '平阴重瓣玫瑰头期花，低温烘干锁香。', 36.00, 49.00, 1400, 13400, 4.8, 5200, '花茶', NULL, '山东平阴', 'SD-MG-0012', 'on_sale', '2026-08-30 09:17:08', '2026-08-30 09:17:08', NULL, '件', NULL, NULL, NULL, 'approved', NULL, NULL, NULL, 1);
INSERT INTO `products` VALUES (13, 7, 7, '南阳艾叶艾灸条 · 10支装', '南阳三年陈艾，艾绒细腻、火力温和。', 32.00, 45.00, 2200, 16800, 4.6, 6800, '理疗', NULL, '河南南阳', 'HN-AI-0013', 'on_sale', '2026-08-30 09:17:08', '2026-08-30 09:17:08', NULL, '件', NULL, NULL, NULL, 'approved', NULL, NULL, NULL, 1);
INSERT INTO `products` VALUES (14, 7, 1, '神农架党参 · 500g', '神农架高山党参，条粗皮细，煲汤泡水皆宜。', 59.00, 78.00, 1000, 5200, 4.6, 1900, '补气', NULL, '湖北神农架', 'HB-DZ-0014', 'on_sale', '2026-08-30 09:17:08', '2026-08-30 09:17:08', NULL, '件', NULL, NULL, NULL, 'approved', NULL, NULL, NULL, 1);
INSERT INTO `products` VALUES (15, 8, 8, '新会陈皮 · 十年陈 250g', '新会茶枝柑十年陈，香气醇厚，年份可查。', 128.00, 168.00, 700, 9100, 4.8, 4100, '越陈越香', NULL, '广东新会', 'GD-CP-0015', 'on_sale', '2026-08-30 09:17:08', '2026-08-30 09:17:08', NULL, '件', NULL, NULL, NULL, 'approved', NULL, NULL, NULL, 1);
INSERT INTO `products` VALUES (16, 8, 4, '广东化州橘红片 · 100g', '化州正毛橘红，绒毛明显，味苦回甘。', 68.00, 89.00, 900, 6200, 4.7, 2300, '岭南特产', NULL, '广东化州', 'GD-JH-0016', 'on_sale', '2026-08-30 09:17:08', '2026-08-30 09:17:08', NULL, '件', NULL, NULL, NULL, 'approved', NULL, NULL, NULL, 1);

-- ----------------------------
-- Table structure for refunds
-- ----------------------------
DROP TABLE IF EXISTS `refunds`;
CREATE TABLE `refunds`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` bigint UNSIGNED NOT NULL,
  `payment_id` bigint UNSIGNED NULL DEFAULT NULL,
  `refund_no` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `amount` decimal(10, 2) NOT NULL,
  `reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `status` enum('pending','approved','processing','completed','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'pending',
  `reviewed_by` bigint UNSIGNED NULL DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `refund_no`(`refund_no` ASC) USING BTREE,
  INDEX `fk_refund_payment`(`payment_id` ASC) USING BTREE,
  INDEX `fk_refund_reviewer`(`reviewed_by` ASC) USING BTREE,
  INDEX `idx_refunds_order_status`(`order_id` ASC, `status` ASC) USING BTREE,
  CONSTRAINT `fk_refund_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_refund_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `fk_refund_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `chk_refund_amount` CHECK (`amount` >= 0)
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '退款售后' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of refunds
-- ----------------------------

-- ----------------------------
-- Table structure for reviews
-- ----------------------------
DROP TABLE IF EXISTS `reviews`;
CREATE TABLE `reviews`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint UNSIGNED NULL DEFAULT NULL,
  `target_type` enum('store','product') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `target_id` bigint UNSIGNED NOT NULL,
  `score` tinyint UNSIGNED NOT NULL,
  `content` varchar(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `quality_score` tinyint UNSIGNED NULL DEFAULT NULL,
  `service_score` tinyint UNSIGNED NULL DEFAULT NULL,
  `logistics_score` tinyint UNSIGNED NULL DEFAULT NULL,
  `status` enum('visible','hidden','pending') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'visible',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_reviews_target`(`target_type` ASC, `target_id` ASC, `status` ASC, `created_at` ASC) USING BTREE,
  INDEX `idx_reviews_user`(`user_id` ASC, `created_at` ASC) USING BTREE,
  CONSTRAINT `fk_review_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `chk_review_logistics` CHECK ((`logistics_score` is null) or (`logistics_score` between 1 and 5)),
  CONSTRAINT `chk_review_quality` CHECK ((`quality_score` is null) or (`quality_score` between 1 and 5)),
  CONSTRAINT `chk_review_score` CHECK (`score` between 1 and 5),
  CONSTRAINT `chk_review_service` CHECK ((`service_score` is null) or (`service_score` between 1 and 5))
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '店铺与药材评分' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of reviews
-- ----------------------------
INSERT INTO `reviews` VALUES (1, 3, 'store', 1, 5, '包装非常扎实，人参带溯源证书，跟描述一致。', 5, 5, 5, 'visible', '2026-08-30 09:17:08');
INSERT INTO `reviews` VALUES (2, 2, 'store', 1, 5, '客服很专业，介绍了不同参龄的区别。', 5, 5, 4, 'visible', '2026-08-30 09:17:08');
INSERT INTO `reviews` VALUES (3, 2, 'product', 1, 5, '成色很正，跟描述一致，泡出来香气足。', 5, 5, 5, 'visible', '2026-08-30 09:17:08');
INSERT INTO `reviews` VALUES (4, 3, 'product', 1, 4, '干净无异味，份量足，产地证书齐全。', 4, 5, 4, 'visible', '2026-08-30 09:17:08');
INSERT INTO `reviews` VALUES (5, 2, 'product', 15, 5, '陈皮香气醇厚，年份信息清楚。', 5, 5, 5, 'visible', '2026-08-30 09:17:08');

-- ----------------------------
-- Table structure for schema_migrations
-- ----------------------------
DROP TABLE IF EXISTS `schema_migrations`;
CREATE TABLE `schema_migrations`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `version` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `executed_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `version`(`version` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '数据库迁移记录' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of schema_migrations
-- ----------------------------
INSERT INTO `schema_migrations` VALUES (1, '2026_01_production_delivery', '生产交付版：商家、资质、购物车、地址、支付、退款、物流、审计、通知、结算', '2026-08-30 09:17:09');

-- ----------------------------
-- Table structure for shipment_events
-- ----------------------------
DROP TABLE IF EXISTS `shipment_events`;
CREATE TABLE `shipment_events`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `shipment_id` bigint UNSIGNED NOT NULL,
  `event_time` datetime NOT NULL,
  `location` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_shipment_events_time`(`shipment_id` ASC, `event_time` ASC) USING BTREE,
  CONSTRAINT `fk_shipment_event_shipment` FOREIGN KEY (`shipment_id`) REFERENCES `shipments` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '物流轨迹' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of shipment_events
-- ----------------------------

-- ----------------------------
-- Table structure for shipments
-- ----------------------------
DROP TABLE IF EXISTS `shipments`;
CREATE TABLE `shipments`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` bigint UNSIGNED NOT NULL,
  `carrier` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `tracking_no` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `status` enum('pending','shipped','in_transit','delivered','exception') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'pending',
  `shipped_at` datetime NULL DEFAULT NULL,
  `delivered_at` datetime NULL DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_shipment_order`(`order_id` ASC) USING BTREE,
  INDEX `idx_shipments_tracking`(`tracking_no` ASC) USING BTREE,
  CONSTRAINT `fk_shipment_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '物流记录' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of shipments
-- ----------------------------

-- ----------------------------
-- Table structure for store_visits
-- ----------------------------
DROP TABLE IF EXISTS `store_visits`;
CREATE TABLE `store_visits`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `store_id` bigint UNSIGNED NOT NULL,
  `visitor_user_id` bigint UNSIGNED NULL DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `fk_visit_user`(`visitor_user_id` ASC) USING BTREE,
  INDEX `idx_visits_store_time`(`store_id` ASC, `created_at` ASC) USING BTREE,
  CONSTRAINT `fk_visit_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_visit_user` FOREIGN KEY (`visitor_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '店铺访问流量' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of store_visits
-- ----------------------------
INSERT INTO `store_visits` VALUES (1, 3, NULL, '2026-08-30 10:26:46');

-- ----------------------------
-- Table structure for stores
-- ----------------------------
DROP TABLE IF EXISTS `stores`;
CREATE TABLE `stores`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `application_id` bigint UNSIGNED NULL DEFAULT NULL,
  `owner_id` bigint UNSIGNED NULL DEFAULT NULL,
  `name` varchar(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `city` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `years_in_business` int UNSIGNED NOT NULL DEFAULT 0,
  `introduction` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `logo_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `cover_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `brand_color` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `badge` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `badge_type` enum('red','gold') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'red',
  `rating` decimal(2, 1) NOT NULL DEFAULT 0.0,
  `rating_count` int UNSIGNED NOT NULL DEFAULT 0,
  `follower_count` int UNSIGNED NOT NULL DEFAULT 0,
  `status` enum('pending','active','offline') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `merchant_profile_id` bigint UNSIGNED NULL DEFAULT NULL,
  `business_status` enum('open','closed','paused') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'open',
  `service_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `address` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `province` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `district` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `commission_rate` decimal(5, 2) NOT NULL DEFAULT 1.50 COMMENT '交易佣金比例(%)',
  `shop_link_code` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '专属店铺短码',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_store_link_code`(`shop_link_code` ASC) USING BTREE,
  INDEX `fk_store_application`(`application_id` ASC) USING BTREE,
  INDEX `fk_store_owner`(`owner_id` ASC) USING BTREE,
  INDEX `idx_stores_status_rating`(`status` ASC, `rating` DESC) USING BTREE,
  INDEX `idx_stores_city`(`city` ASC) USING BTREE,
  INDEX `idx_stores_merchant_status`(`merchant_profile_id` ASC, `status` ASC, `business_status` ASC) USING BTREE,
  CONSTRAINT `fk_store_application` FOREIGN KEY (`application_id`) REFERENCES `merchant_applications` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `fk_store_merchant_profile` FOREIGN KEY (`merchant_profile_id`) REFERENCES `merchant_profiles` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `fk_store_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT,
  CONSTRAINT `chk_store_rating` CHECK ((`rating` >= 0) and (`rating` <= 5))
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '入驻药店' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of stores
-- ----------------------------
INSERT INTO `stores` VALUES (1, NULL, 7, '华夏本草旗舰店', '北京', 18, '精选全国道地药材，建立从产地筛选到仓储发货的品质管理流程。', NULL, NULL, '#8c1f28', '品质甄选', 'gold', 4.9, 186200, 96200, 'active', '2026-08-30 09:17:08', '2026-08-30 09:17:10', 1, 'open', NULL, NULL, NULL, NULL, 1.50, NULL);
INSERT INTO `stores` VALUES (2, NULL, 5, '云岭道地药材馆', '昆明', 12, '扎根西南药材产区，主打三七、菌类与高原特色食材，坚持产地直采。', NULL, NULL, '#4c7a5c', '产地直供', 'red', 4.8, 92400, 58800, 'active', '2026-08-30 09:17:08', '2026-08-30 09:17:08', NULL, 'open', NULL, NULL, NULL, NULL, 1.50, NULL);
INSERT INTO `stores` VALUES (3, NULL, NULL, '江南本草滋补馆', '杭州', 15, '专注阿胶、膏方与药膳汤料，精选江南特色滋补食材。', NULL, NULL, '#a87f3f', '江南甄选', 'gold', 4.9, 76300, 41200, 'active', '2026-08-30 09:17:08', '2026-08-30 09:17:08', NULL, 'open', NULL, NULL, NULL, NULL, 1.50, NULL);
INSERT INTO `stores` VALUES (4, NULL, NULL, '湖湘养生堂', '长沙', 11, '主做平价养生茶饮、代用茶与药食同源食材，精选湖湘特色风味。', NULL, NULL, '#3f5f8c', '湖湘风味', 'red', 4.7, 51200, 33600, 'active', '2026-08-30 09:17:08', '2026-08-30 09:17:08', NULL, 'open', NULL, NULL, NULL, NULL, 1.50, NULL);
INSERT INTO `stores` VALUES (5, NULL, NULL, '闽南国药馆', '漳州', 9, '精选闽南特色药材与滋补食材，重视批次管理和产地信息展示。', NULL, NULL, '#6b4a8c', '闽南甄选', 'red', 4.8, 38900, 21400, 'active', '2026-08-30 09:17:08', '2026-08-30 09:17:08', NULL, 'open', NULL, NULL, NULL, NULL, 1.50, NULL);
INSERT INTO `stores` VALUES (6, NULL, NULL, '胶东滋补直营店', '聊城', 8, '专注胶类滋补品与山东特色食材，精选原产地批次并提供质检信息。', NULL, NULL, '#8c5a3f', '原产甄选', 'gold', 4.9, 67100, 42900, 'active', '2026-08-30 09:17:08', '2026-08-30 09:17:08', NULL, 'open', NULL, NULL, NULL, NULL, 1.50, NULL);
INSERT INTO `stores` VALUES (7, NULL, NULL, '仲景本草馆', '南阳', 7, '立足南阳本草资源，覆盖参茸、饮片与汤料，品类齐全。', NULL, NULL, '#2e6e5e', '本草优选', 'red', 4.6, 35800, 27800, 'active', '2026-08-30 09:17:08', '2026-08-30 09:17:08', NULL, 'open', NULL, NULL, NULL, NULL, 1.50, NULL);
INSERT INTO `stores` VALUES (8, NULL, NULL, '岭南本草馆', '广州', 6, '精选岭南特色药材、凉茶与煲汤料，结合本地饮食习惯提供丰富选择。', NULL, NULL, '#a8323c', '岭南甄选', 'red', 4.7, 44600, 31500, 'active', '2026-08-30 09:17:08', '2026-08-30 09:17:08', NULL, 'open', NULL, NULL, NULL, NULL, 1.50, NULL);

-- ----------------------------
-- Table structure for user_addresses
-- ----------------------------
DROP TABLE IF EXISTS `user_addresses`;
CREATE TABLE `user_addresses`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint UNSIGNED NOT NULL,
  `receiver_name` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `receiver_phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `province` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `city` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `district` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `detail_address` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_addresses_user_default`(`user_id` ASC, `is_default` ASC) USING BTREE,
  CONSTRAINT `fk_address_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户收货地址' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user_addresses
-- ----------------------------

-- ----------------------------
-- Table structure for user_sessions
-- ----------------------------
DROP TABLE IF EXISTS `user_sessions`;
CREATE TABLE `user_sessions`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint UNSIGNED NOT NULL,
  `token_hash` char(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `token_hash`(`token_hash` ASC) USING BTREE,
  INDEX `idx_sessions_user_expires`(`user_id` ASC, `expires_at` ASC) USING BTREE,
  INDEX `idx_sessions_expires`(`expires_at` ASC) USING BTREE,
  CONSTRAINT `fk_session_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 13 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '登录会话' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user_sessions
-- ----------------------------
INSERT INTO `user_sessions` VALUES (1, 6, '193547bc9d631af3ed41fd9b4cb108afa1f69f39136cda60e0aaa7e727a8b78c', '2026-09-06 09:17:55', '2026-08-30 09:17:55');
INSERT INTO `user_sessions` VALUES (2, 7, '64d87b4b749b10f36410b3facb4c30cbafe5ad4ec0dcfb80a5ff19d99c0d21d1', '2026-09-06 09:17:55', '2026-08-30 09:17:55');
INSERT INTO `user_sessions` VALUES (3, 2, '8aaa424f7e8fdd76a8fd3cef03a134dfdc1645929af5e3d0a9ff50ab9c2d83f4', '2026-09-06 09:17:55', '2026-08-30 09:17:55');
INSERT INTO `user_sessions` VALUES (5, 8, '778f1f1bf94d059557a8fa05f4cccc0ac4b552b9879a0d451281caecf4f420e8', '2026-09-06 09:22:35', '2026-08-30 09:22:35');
INSERT INTO `user_sessions` VALUES (6, 8, '3d640debe7fb73729177c73e9125b29d932cc398dbdc51f090b8b315500f4239', '2026-09-14 09:40:57', '2026-09-07 09:40:57');
INSERT INTO `user_sessions` VALUES (7, 8, '645ce1023a54180dc44b104dece3769595446719f9cdb6b0cde2b8eece48c416', '2026-09-14 11:10:22', '2026-09-07 11:10:22');
INSERT INTO `user_sessions` VALUES (11, 7, '4d6674188e2cce0b7934bc714c027676275ee1f8221fd94550434604ec41bd72', '2026-09-16 11:40:11', '2026-09-09 11:40:11');
INSERT INTO `user_sessions` VALUES (12, 8, '016a39c02c236ab093543ca5b721b6806690af1e47d2dbf41df25bfefdf14c76', '2026-09-16 15:05:43', '2026-09-09 15:05:43');

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `nickname` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `avatar_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `bio` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `gender` enum('unknown','male','female') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'unknown',
  `birthday` date NULL DEFAULT NULL,
  `role` enum('user','merchant','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'user',
  `status` enum('active','disabled') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login_at` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `phone`(`phone` ASC) USING BTREE,
  INDEX `idx_users_role`(`role` ASC) USING BTREE,
  INDEX `idx_users_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '平台用户' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (1, '平台运营小助手', '13800000001', NULL, NULL, NULL, 'unknown', NULL, 'admin', 'active', '2026-08-30 09:17:08', '2026-08-30 09:17:08', NULL);
INSERT INTO `users` VALUES (2, '识药小草', '13800000002', '0cb61c46af884bd873a4ca7201fee653:d942f1acdce1a39ef8af76bc2f97defdc780722b13a656cce74da76d2eeaaabce91d243c05ef8b734290d319a521bfabf7adaccd06a59d2036483135db483b85', NULL, NULL, 'unknown', NULL, 'user', 'active', '2026-08-30 09:17:08', '2026-08-30 09:17:55', '2026-08-30 09:17:55');
INSERT INTO `users` VALUES (3, '老药工阿福', '13800000003', NULL, NULL, NULL, 'unknown', NULL, 'user', 'active', '2026-08-30 09:17:08', '2026-08-30 09:17:08', NULL);
INSERT INTO `users` VALUES (4, '演示商家甲', '13800000004', NULL, NULL, NULL, 'unknown', NULL, 'merchant', 'active', '2026-08-30 09:17:08', '2026-08-30 09:17:08', NULL);
INSERT INTO `users` VALUES (5, '演示商家乙', '13800000005', NULL, NULL, NULL, 'unknown', NULL, 'merchant', 'active', '2026-08-30 09:17:08', '2026-08-30 09:17:08', NULL);
INSERT INTO `users` VALUES (6, '平台管理员', '13730257606', '39a5bfb3fa835c520c413f50f30ce28a:8648e10c1e3668464946807f6530151f256fc721b66ee1d2acc5bc794d95d26b96aa1bfd77455c60c21b2c4b6a29093348d59c6bfb8223e48729d7cd30c03abe', NULL, NULL, 'unknown', NULL, 'admin', 'active', '2026-08-30 09:17:10', '2026-09-09 10:57:59', '2026-09-09 10:57:59');
INSERT INTO `users` VALUES (7, '华夏本草掌柜', '13643396844', 'b50883c7be3365b905e3d634ba171640:52e4db31d6ec60354daad614747fff2c72113c437ebcbe0457c4cb427a8738eb0d57c1ada026688f0bf299db7e0713c477277ae433dbdd9dcd6fe9f11820113f', NULL, NULL, 'unknown', NULL, 'merchant', 'active', '2026-08-30 09:17:10', '2026-09-09 11:40:11', '2026-09-09 11:40:11');
INSERT INTO `users` VALUES (8, 'ZHanRoyal', '19931278092', '8d152867a47e808a8f93018482b057a9:3b41329249d8c9f627ef76ce86d717f5fd7c1e159746929abbcddcee80b11fc7329964ec6c2467a0d754bdc2e6345c46a584a8e421b7e9d98b4cf554f768a637', NULL, NULL, 'unknown', NULL, 'user', 'active', '2026-08-30 09:22:35', '2026-09-09 15:05:43', '2026-09-09 15:05:43');

-- ----------------------------
-- View structure for v_active_products
-- ----------------------------
DROP VIEW IF EXISTS `v_active_products`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `v_active_products` AS select `p`.`id` AS `id`,`p`.`store_id` AS `store_id`,`s`.`name` AS `store_name`,`s`.`city` AS `city`,`p`.`category_id` AS `category_id`,`c`.`name` AS `category_name`,`c`.`icon` AS `category_icon`,`p`.`name` AS `name`,`p`.`description` AS `description`,`p`.`price` AS `price`,`p`.`original_price` AS `original_price`,`p`.`stock` AS `stock`,`p`.`sales_count` AS `sales_count`,`p`.`rating` AS `rating`,`p`.`rating_count` AS `rating_count`,`p`.`tag` AS `tag`,`p`.`image_url` AS `image_url`,`p`.`origin` AS `origin`,`p`.`trace_code` AS `trace_code`,`p`.`sku` AS `sku`,`p`.`unit` AS `unit`,`p`.`specifications` AS `specifications`,`p`.`production_date` AS `production_date`,`p`.`expiry_date` AS `expiry_date` from ((`products` `p` join `stores` `s` on(((`s`.`id` = `p`.`store_id`) and (`s`.`status` = 'active') and (`s`.`business_status` = 'open')))) join `categories` `c` on(((`c`.`id` = `p`.`category_id`) and (`c`.`status` = 'active')))) where ((`p`.`status` = 'on_sale') and (`p`.`approval_status` = 'approved'));

-- ----------------------------
-- View structure for v_store_product_counts
-- ----------------------------
DROP VIEW IF EXISTS `v_store_product_counts`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `v_store_product_counts` AS select `s`.`id` AS `store_id`,`s`.`name` AS `name`,`s`.`city` AS `city`,`s`.`rating` AS `rating`,`s`.`rating_count` AS `rating_count`,`s`.`follower_count` AS `follower_count`,count(`p`.`id`) AS `product_count` from (`stores` `s` left join `products` `p` on(((`p`.`store_id` = `s`.`id`) and (`p`.`status` = 'on_sale') and (`p`.`approval_status` = 'approved')))) where ((`s`.`status` = 'active') and (`s`.`business_status` = 'open')) group by `s`.`id`,`s`.`name`,`s`.`city`,`s`.`rating`,`s`.`rating_count`,`s`.`follower_count`;

SET FOREIGN_KEY_CHECKS = 1;

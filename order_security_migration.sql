/*
 订单安全与并发治理迁移（执行一次即可，重复执行会报「列已存在」）

 1) orders.client_token：下单幂等键，客户端生成（UUID），全局唯一
    - 唯一索引对 NULL 不生效，历史订单保持 NULL 不受影响
    - 作用：网络重试、用户连点、小程序重复提交时，最多只生成一笔订单
    - 并发下两个请求同时通过前置查询时，由唯一索引兜底只放行一个
*/

ALTER TABLE `orders`
  ADD COLUMN `client_token` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL
  COMMENT '下单幂等键：客户端生成，用于防止重复下单' AFTER `order_no`;

ALTER TABLE `orders`
  ADD UNIQUE INDEX `uk_orders_client_token`(`client_token` ASC) USING BTREE;

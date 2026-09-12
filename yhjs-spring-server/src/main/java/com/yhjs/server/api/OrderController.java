package com.yhjs.server.api;

import com.yhjs.server.auth.AuthContext;
import com.yhjs.server.auth.AuthUser;
import com.yhjs.server.db.SqlIds;
import com.yhjs.server.order.StockService;
import jakarta.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 用户端订单：下单（事务 + 幂等）、订单列表。
 *
 * <p>支付安全约定：订单金额一律由后端根据商品表价格计算，请求体不接受金额字段；
 * 状态流转只允许沿状态机前进（UPDATE 带 status 守卫），非法跃迁与重复提交都会被拒绝。
 */
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final JdbcTemplate jdbcTemplate;
    private final StockService stockService;
    private final Random random = new Random();

    public OrderController(JdbcTemplate jdbcTemplate, StockService stockService) {
        this.jdbcTemplate = jdbcTemplate;
        this.stockService = stockService;
    }

    public record OrderItemRequest(Long productId, Integer quantity) {
    }

    public record OrderRequest(Long storeId, String receiverName, String receiverPhone,
                               String receiverAddress, List<OrderItemRequest> items, String source,
                               String clientToken) {
    }

    // 下单：一个订单只允许来自一家店铺
    @PostMapping
    @Transactional
    public ResponseEntity<ApiResponse> createOrder(@RequestBody OrderRequest body, HttpServletRequest request) {
        AuthUser user = AuthContext.requireUser(request);
        if (body.storeId() == null || blank(body.receiverName()) || blank(body.receiverPhone())
            || blank(body.receiverAddress()) || body.items() == null || body.items().isEmpty()) {
            throw new AppException(400, "订单信息不完整");
        }

        // 幂等：同一个 clientToken 的重复提交（网络重试、用户连点）直接返回首次创建的订单
        String clientToken = blank(body.clientToken()) ? null : body.clientToken().trim();
        if (clientToken != null) {
            Map<String, Object> existed = findOrderByClientToken(clientToken, user.id());
            if (existed != null) {
                return ResponseEntity.ok(ApiResponse.ok(existed));
            }
        }

        List<Map<String, Object>> storeRows = jdbcTemplate.queryForList(
            "SELECT id, commission_rate FROM stores WHERE id = ? AND status = 'active'", body.storeId());
        if (storeRows.isEmpty()) {
            throw new AppException(400, "店铺不存在或已停用");
        }
        BigDecimal commissionRate = toDecimal(storeRows.get(0).get("commission_rate"), BigDecimal.ZERO);

        // 金额只由后端按商品表价格计算，请求体不接收任何金额字段；
        // 库存扣减走 StockService，策略由 stock.strategy 配置切换（悲观锁 / 乐观锁 / 无防护）
        List<StockService.ProductLine> lines = body.items().stream()
            .map(item -> new StockService.ProductLine(item.productId(),
                item.quantity() == null ? 0 : item.quantity()))
            .toList();
        List<StockService.StockLine> deducted = stockService.deduct(body.storeId(), lines);
        BigDecimal total = deducted.stream()
            .map(StockService.StockLine::subtotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        String orderNo = "YH" + System.currentTimeMillis()
            + String.format("%03d", random.nextInt(1000));
        String source = "market".equals(body.source()) || "private".equals(body.source())
            ? body.source() : "market";
        BigDecimal commissionAmount = total.multiply(commissionRate)
            .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        Long orderId;
        try {
            orderId = SqlIds.insert(jdbcTemplate,
                "INSERT INTO orders (order_no, client_token, user_id, store_id, receiver_name, receiver_phone, "
                    + "receiver_address, total_amount, source, commission_rate, commission_amount) "
                    + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                orderNo, clientToken, user.id(), body.storeId(), body.receiverName(), body.receiverPhone(),
                body.receiverAddress(), total, source, commissionRate, commissionAmount);
        } catch (DuplicateKeyException exception) {
            // 并发下两个相同 clientToken 的请求同时通过了前置查询，唯一索引只会放行一个
            Map<String, Object> existed = findOrderByClientToken(clientToken, user.id());
            if (existed == null) {
                throw exception;
            }
            return ResponseEntity.ok(ApiResponse.ok(existed));
        }

        for (StockService.StockLine line : deducted) {
            jdbcTemplate.update(
                "INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal) "
                    + "VALUES (?, ?, ?, ?, ?, ?)",
                orderId, line.productId(), line.name(), line.price(), line.quantity(), line.subtotal());
        }
        recordStatus(orderId, null, "pending_payment", user.id(), "创建订单");

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", orderId);
        data.put("orderNo", orderNo);
        data.put("totalAmount", total.doubleValue());
        data.put("source", source);
        data.put("commissionAmount", commissionAmount.doubleValue());
        data.put("status", "pending_payment");
        data.put("duplicated", false);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(data));
    }

    // 按幂等键回查订单：命中说明该请求是重复提交，直接返回首次结果
    private Map<String, Object> findOrderByClientToken(String clientToken, Long userId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT id, order_no, total_amount, source, commission_amount, status FROM orders "
                + "WHERE client_token = ? AND user_id = ?",
            clientToken, userId);
        if (rows.isEmpty()) {
            return null;
        }
        Map<String, Object> row = rows.get(0);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", row.get("id"));
        data.put("orderNo", row.get("order_no"));
        data.put("totalAmount", toDecimal(row.get("total_amount"), BigDecimal.ZERO).doubleValue());
        data.put("source", row.get("source"));
        data.put("commissionAmount", toDecimal(row.get("commission_amount"), BigDecimal.ZERO).doubleValue());
        data.put("status", row.get("status"));
        data.put("duplicated", true);
        return data;
    }

    // 状态机轨迹落库，便于对账与排查
    private void recordStatus(Long orderId, String from, String to, Long operatorId, String note) {
        jdbcTemplate.update(
            "INSERT INTO order_status_logs (order_id, from_status, to_status, operator_id, note) "
                + "VALUES (?, ?, ?, ?, ?)",
            orderId, from, to, operatorId, note);
    }

    // 我的订单列表
    @GetMapping
    public ApiResponse orders(HttpServletRequest request) {
        AuthUser user = AuthContext.requireUser(request);
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT o.id, o.order_no, o.store_id, s.name AS store_name, "
                + "o.receiver_name, o.receiver_phone, o.receiver_address, "
                + "o.total_amount, o.status, o.created_at, "
                + "JSON_ARRAYAGG(JSON_OBJECT('productId', oi.product_id, 'name', oi.product_name, "
                + "'price', oi.unit_price, 'quantity', oi.quantity, 'subtotal', oi.subtotal)) AS items "
                + "FROM orders o JOIN stores s ON s.id = o.store_id "
                + "JOIN order_items oi ON oi.order_id = o.id "
                + "WHERE o.user_id = ? "
                + "GROUP BY o.id, s.name "
                + "ORDER BY o.created_at DESC",
            user.id());
        return ApiResponse.ok(rows);
    }

    // 订单详情（含店铺城市，供物流页地图起止点使用）
    @GetMapping("/{id}")
    public ApiResponse orderDetail(@PathVariable Long id, HttpServletRequest request) {
        AuthUser user = AuthContext.requireUser(request);
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT o.id, o.order_no, o.store_id, s.name AS store_name, s.city AS store_city, "
                + "o.receiver_name, o.receiver_phone, o.receiver_address, o.total_amount, o.status, "
                + "DATE_FORMAT(o.created_at, '%Y-%m-%d %H:%i:%s') AS created_at "
                + "FROM orders o JOIN stores s ON s.id = o.store_id "
                + "WHERE o.id = ? AND o.user_id = ?",
            id, user.id());
        if (rows.isEmpty()) {
            throw new AppException(400, "订单不存在");
        }
        Map<String, Object> detail = new LinkedHashMap<>(rows.get(0));
        List<Map<String, Object>> items = jdbcTemplate.queryForList(
            "SELECT product_id AS productId, product_name AS name, unit_price AS price, quantity, subtotal "
                + "FROM order_items WHERE order_id = ?",
            id);
        detail.put("items", items);
        return ApiResponse.ok(detail);
    }

    // 模拟支付：待付款 → 已付款（带状态守卫，重复回调只会生效一次）
    @PostMapping("/{id}/pay")
    @Transactional
    public ApiResponse pay(@PathVariable Long id, HttpServletRequest request) {
        AuthUser user = AuthContext.requireUser(request);
        int affected = jdbcTemplate.update(
            "UPDATE orders SET status = 'paid', paid_at = NOW() "
                + "WHERE id = ? AND user_id = ? AND status = 'pending_payment'",
            id, user.id());
        if (affected == 0) {
            throw new AppException(400, "订单不存在或当前状态不可支付");
        }
        recordStatus(id, "pending_payment", "paid", user.id(), "支付成功");
        return ApiResponse.ok();
    }

    // 用户取消订单（仅待付款，佣金归零并释放库存）
    @PutMapping("/{id}/cancel")
    @Transactional
    public ApiResponse cancel(@PathVariable Long id, HttpServletRequest request) {
        AuthUser user = AuthContext.requireUser(request);
        int affected = jdbcTemplate.update(
            "UPDATE orders SET status = 'cancelled', commission_amount = 0 "
                + "WHERE id = ? AND user_id = ? AND status = 'pending_payment'",
            id, user.id());
        if (affected == 0) {
            throw new AppException(400, "订单不存在或当前状态不可取消");
        }
        // 取消即释放库存；sales_count 为无符号字段，用 IF 兜底避免减成负数
        jdbcTemplate.update(
            "UPDATE products p JOIN order_items oi ON oi.product_id = p.id "
                + "SET p.stock = p.stock + oi.quantity, "
                + "p.sales_count = IF(p.sales_count >= oi.quantity, p.sales_count - oi.quantity, 0) "
                + "WHERE oi.order_id = ?",
            id);
        recordStatus(id, "pending_payment", "cancelled", user.id(), "用户取消订单");
        return ApiResponse.ok();
    }

    // 用户确认收货：已发货 → 已完成
    @PutMapping("/{id}/confirm")
    @Transactional
    public ApiResponse confirm(@PathVariable Long id, HttpServletRequest request) {
        AuthUser user = AuthContext.requireUser(request);
        int affected = jdbcTemplate.update(
            "UPDATE orders SET status = 'completed', completed_at = NOW() "
                + "WHERE id = ? AND user_id = ? AND status = 'shipped'",
            id, user.id());
        if (affected == 0) {
            throw new AppException(400, "订单不存在或当前状态不可确认收货");
        }
        recordStatus(id, "shipped", "completed", user.id(), "用户确认收货");
        return ApiResponse.ok();
    }

    private static boolean blank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private static BigDecimal toDecimal(Object value, BigDecimal fallback) {
        if (value == null) {
            return fallback;
        }
        if (value instanceof BigDecimal bd) {
            return bd;
        }
        if (value instanceof Number n) {
            return BigDecimal.valueOf(n.doubleValue());
        }
        try {
            return new BigDecimal(value.toString());
        } catch (NumberFormatException e) {
            return fallback;
        }
    }
}

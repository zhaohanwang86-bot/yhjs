package com.yhjs.server.api;

import com.yhjs.server.auth.AuthContext;
import com.yhjs.server.auth.AuthUser;
import com.yhjs.server.db.SqlIds;
import jakarta.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * 用户端订单：下单（事务）、订单列表。
 */
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final JdbcTemplate jdbcTemplate;
    private final Random random = new Random();

    public OrderController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public record OrderItemRequest(Long productId, Integer quantity) {
    }

    public record OrderRequest(Long storeId, String receiverName, String receiverPhone,
                               String receiverAddress, List<OrderItemRequest> items, String source) {
    }

    // 下单：一个订单只允许来自一家店铺
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public ApiResponse createOrder(@RequestBody OrderRequest body, HttpServletRequest request) {
        AuthUser user = AuthContext.requireUser(request);
        if (body.storeId() == null || blank(body.receiverName()) || blank(body.receiverPhone())
            || blank(body.receiverAddress()) || body.items() == null || body.items().isEmpty()) {
            throw new AppException(400, "订单信息不完整");
        }
        List<Map<String, Object>> storeRows = jdbcTemplate.queryForList(
            "SELECT id, commission_rate FROM stores WHERE id = ? AND status = 'active'", body.storeId());
        if (storeRows.isEmpty()) {
            throw new AppException(400, "店铺不存在或已停用");
        }
        BigDecimal commissionRate = toDecimal(storeRows.get(0).get("commission_rate"), BigDecimal.ZERO);

        List<Map<String, Object>> normalized = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        for (OrderItemRequest item : body.items()) {
            if (item.quantity() == null || item.quantity() < 1) {
                throw new AppException(400, "商品数量不合法");
            }
            List<Map<String, Object>> productRows = jdbcTemplate.queryForList(
                "SELECT id, store_id, name, price, stock FROM products WHERE id = ? AND status = 'on_sale' FOR UPDATE",
                item.productId());
            if (productRows.isEmpty()) {
                throw new AppException(400, "商品不存在或已下架");
            }
            Map<String, Object> product = productRows.get(0);
            if (!String.valueOf(product.get("store_id")).equals(String.valueOf(body.storeId()))) {
                throw new AppException(400, "订单商品不属于当前店铺");
            }
            int stock = ((Number) product.get("stock")).intValue();
            if (stock < item.quantity()) {
                throw new AppException(400, product.get("name") + "库存不足");
            }
            BigDecimal price = toDecimal(product.get("price"), BigDecimal.ZERO);
            BigDecimal subtotal = price.multiply(BigDecimal.valueOf(item.quantity()));
            total = total.add(subtotal);

            Map<String, Object> entry = new HashMap<>();
            entry.put("id", product.get("id"));
            entry.put("name", product.get("name"));
            entry.put("price", price);
            entry.put("quantity", item.quantity());
            entry.put("subtotal", subtotal);
            normalized.add(entry);
        }

        String orderNo = "YH" + System.currentTimeMillis()
            + String.format("%03d", random.nextInt(1000));
        String source = "market".equals(body.source()) || "private".equals(body.source())
            ? body.source() : "market";
        BigDecimal commissionAmount = total.multiply(commissionRate)
            .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        Long orderId = SqlIds.insert(jdbcTemplate,
            "INSERT INTO orders (order_no, user_id, store_id, receiver_name, receiver_phone, "
                + "receiver_address, total_amount, source, commission_rate, commission_amount) "
                + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            orderNo, user.id(), body.storeId(), body.receiverName(), body.receiverPhone(),
            body.receiverAddress(), total, source, commissionRate, commissionAmount);

        for (Map<String, Object> entry : normalized) {
            jdbcTemplate.update(
                "INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal) "
                    + "VALUES (?, ?, ?, ?, ?, ?)",
                orderId, entry.get("id"), entry.get("name"), entry.get("price"),
                entry.get("quantity"), entry.get("subtotal"));
            jdbcTemplate.update(
                "UPDATE products SET stock = stock - ?, sales_count = sales_count + ? WHERE id = ?",
                entry.get("quantity"), entry.get("quantity"), entry.get("id"));
        }

        Map<String, Object> data = Map.of(
            "id", orderId,
            "orderNo", orderNo,
            "totalAmount", total.doubleValue(),
            "source", source,
            "commissionAmount", commissionAmount.doubleValue(),
            "status", "pending_payment");
        return ApiResponse.ok(data);
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

    // 模拟支付：待付款 → 已付款
    @PostMapping("/{id}/pay")
    public ApiResponse pay(@PathVariable Long id, HttpServletRequest request) {
        AuthUser user = AuthContext.requireUser(request);
        int affected = jdbcTemplate.update(
            "UPDATE orders SET status = 'paid' WHERE id = ? AND user_id = ? AND status = 'pending_payment'",
            id, user.id());
        if (affected == 0) {
            throw new AppException(400, "订单不存在或当前状态不可支付");
        }
        return ApiResponse.ok();
    }

    // 用户取消订单（仅待付款，佣金归零）
    @PutMapping("/{id}/cancel")
    public ApiResponse cancel(@PathVariable Long id, HttpServletRequest request) {
        AuthUser user = AuthContext.requireUser(request);
        int affected = jdbcTemplate.update(
            "UPDATE orders SET status = 'cancelled', commission_amount = 0 "
                + "WHERE id = ? AND user_id = ? AND status = 'pending_payment'",
            id, user.id());
        if (affected == 0) {
            throw new AppException(400, "订单不存在或当前状态不可取消");
        }
        return ApiResponse.ok();
    }

    // 用户确认收货：已发货 → 已完成
    @PutMapping("/{id}/confirm")
    public ApiResponse confirm(@PathVariable Long id, HttpServletRequest request) {
        AuthUser user = AuthContext.requireUser(request);
        int affected = jdbcTemplate.update(
            "UPDATE orders SET status = 'completed' WHERE id = ? AND user_id = ? AND status = 'shipped'",
            id, user.id());
        if (affected == 0) {
            throw new AppException(400, "订单不存在或当前状态不可确认收货");
        }
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

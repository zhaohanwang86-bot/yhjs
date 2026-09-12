package com.yhjs.server.api;

import com.yhjs.server.auth.AuthContext;
import com.yhjs.server.auth.AuthUser;
import com.yhjs.server.db.SqlIds;
import jakarta.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * 商家工作台接口，与 Node 版 routes.js 的商家端保持一致。
 */
@RestController
@RequestMapping("/api/merchant")
public class MerchantController {

    private static final String[] BANNED_WORDS = {
        "治疗", "治愈", "根治", "药到病除", "包治", "特效药", "抗癌", "降血压", "降血糖",
        "神药", "祖传秘方", "百分百有效", "无副作用", "替代处方", "替代治疗", "包好", "无效退款"
    };

    private final JdbcTemplate jdbcTemplate;

    public MerchantController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public record ProductCreateRequest(String name, Object categoryId, Object price, Object stock,
                                       String description, String origin, String imageUrl, Object isPublic) {
    }

    public record ProductUpdateRequest(String name, Object categoryId, Object price, Object stock,
                                       String description, String origin, String imageUrl, String status) {
    }

    // 当前商家店铺信息
    @GetMapping("/store")
    public ApiResponse store(HttpServletRequest request) {
        AuthContext.requireRole(request, "merchant");
        AuthUser user = AuthContext.requireUser(request);
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT s.*, COUNT(p.id) AS product_count FROM stores s "
                + "LEFT JOIN products p ON p.store_id = s.id WHERE s.owner_id = ? GROUP BY s.id LIMIT 1",
            user.id());
        if (rows.isEmpty()) {
            throw new AppException(404, "当前商家尚未关联店铺");
        }
        return ApiResponse.ok(rows.get(0));
    }

    // 商家店铺流量与经营统计
    @GetMapping("/store/stats")
    public ApiResponse storeStats(HttpServletRequest request) {
        AuthContext.requireRole(request, "merchant");
        Long storeId = requireStoreId(request, 404, "未关联店铺");
        Map<String, Object> summary = jdbcTemplate.queryForMap(
            "SELECT COUNT(*) AS total_visits, "
                + "SUM(CASE WHEN created_at >= CURDATE() THEN 1 ELSE 0 END) AS today_visits "
                + "FROM store_visits WHERE store_id = ?",
            storeId);
        List<Map<String, Object>> trend = jdbcTemplate.queryForList(
            "SELECT DATE_FORMAT(created_at, '%m-%d') AS d, COUNT(*) AS cnt FROM store_visits "
                + "WHERE store_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) "
                + "GROUP BY DATE_FORMAT(created_at, '%m-%d') ORDER BY MIN(created_at)",
            storeId);
        Map<String, Object> biz = jdbcTemplate.queryForMap(
            "SELECT COUNT(*) AS product_count FROM products WHERE store_id = ?", storeId);
        Map<String, Object> orders = jdbcTemplate.queryForMap(
            "SELECT COUNT(*) AS order_count, COALESCE(SUM(total_amount), 0) AS total_sales "
                + "FROM orders WHERE store_id = ? AND status IN ('paid','shipped','completed')",
            storeId);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("total_visits", nz(summary.get("total_visits")));
        data.put("today_visits", nz(summary.get("today_visits")));
        data.put("trend", trend);
        data.put("product_count", nz(biz.get("product_count")));
        data.put("order_count", nz(orders.get("order_count")));
        data.put("total_sales", nz(orders.get("total_sales")));
        return ApiResponse.ok(data);
    }

    // 商家商品列表（含全部状态）
    @GetMapping("/products")
    public ApiResponse products(HttpServletRequest request) {
        AuthContext.requireRole(request, "merchant");
        Long storeId = findStoreId(request);
        if (storeId == null) {
            return ApiResponse.ok(List.of());
        }
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT p.*, c.name AS category_name FROM products p "
                + "LEFT JOIN categories c ON c.id = p.category_id "
                + "WHERE p.store_id = ? ORDER BY p.id DESC",
            storeId);
        return ApiResponse.ok(rows);
    }

    // 商家上架商品
    @PostMapping("/products")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse createProduct(@RequestBody ProductCreateRequest body, HttpServletRequest request) {
        AuthContext.requireRole(request, "merchant");
        Long storeId = requireStoreId(request);

        // 资质门禁：未审核通过的商家不能上架商品
        List<Map<String, Object>> profiles = jdbcTemplate.queryForList(
            "SELECT id FROM merchant_profiles WHERE user_id = ? AND status = 'approved'",
            currentUser(request).id());
        if (profiles.isEmpty()) {
            throw new AppException(400, "商家资质尚未审核通过，暂不能上架商品");
        }

        String name = body.name() == null ? "" : body.name().trim();
        BigDecimal price = toDecimal(body.price());
        Integer stock = toInt(body.stock());
        if (name.isEmpty() || body.categoryId() == null || price == null || price.signum() < 0
            || stock == null || stock < 0) {
            throw new AppException(400, "商品名称、分类、价格和库存不能为空");
        }
        // 合规红线：拦截疗效/治病宣传
        String banned = containsBannedWords(name + " " + (body.description() == null ? "" : body.description()));
        if (banned != null) {
            throw new AppException(400, "商品信息含违规宣传词「" + banned + "」，请移除疗效/治病相关表述");
        }
        int isPublicFlag = body.isPublic() == null ? 1 : (isZero(body.isPublic()) ? 0 : 1);
        Long id = SqlIds.insert(jdbcTemplate,
            "INSERT INTO products (store_id, category_id, name, description, price, stock, origin, image_url, "
                + "status, approval_status, is_public) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'on_sale', 'approved', ?)",
            storeId, toLong(body.categoryId()), name, body.description(), price, stock,
            body.origin(), body.imageUrl(), isPublicFlag);
        return ApiResponse.ok(Map.of("id", id));
    }

    // 商家编辑商品（含上下架）
    @PutMapping("/products/{id}")
    public ApiResponse updateProduct(@PathVariable Long id, @RequestBody ProductUpdateRequest body,
                                             HttpServletRequest request) {
        AuthContext.requireRole(request, "merchant");
        Long storeId = requireStoreId(request);
        requireOwnedProduct(id, storeId);
        String status = body.status();
        if (!List.of("draft", "on_sale", "off_shelf").contains(status)) {
            status = "on_sale";
        }
        jdbcTemplate.update(
            "UPDATE products SET name = ?, category_id = ?, price = ?, stock = ?, description = ?, "
                + "origin = ?, image_url = ?, status = ? WHERE id = ?",
            body.name() == null ? null : body.name().trim(), toLong(body.categoryId()), toDecimal(body.price()),
            toInt(body.stock()), body.description(), body.origin(), body.imageUrl(), status, id);
        return ApiResponse.ok();
    }

    // 商家商品公域展示开关
    @PutMapping("/products/{id}/public")
    public ApiResponse setProductPublic(@PathVariable Long id, @RequestBody Map<String, Object> body,
                                                HttpServletRequest request) {
        AuthContext.requireRole(request, "merchant");
        Long storeId = requireStoreId(request);
        int flag = isZero(body.get("isPublic")) ? 0 : 1;
        int affected = jdbcTemplate.update(
            "UPDATE products SET is_public = ? WHERE id = ? AND store_id = ?", flag, id, storeId);
        if (affected == 0) {
            throw new AppException(400, "商品不存在或不属于当前店铺");
        }
        return ApiResponse.ok();
    }

    // 商家订单列表
    @GetMapping("/orders")
    public ApiResponse orders(HttpServletRequest request) {
        AuthContext.requireRole(request, "merchant");
        Long storeId = findStoreId(request);
        if (storeId == null) {
            return ApiResponse.ok(List.of());
        }
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT o.id, o.order_no, o.receiver_name, o.receiver_phone, o.receiver_address, "
                + "o.total_amount, o.status, o.created_at, COALESCE(u.nickname, '匿名用户') AS buyer_nickname "
                + "FROM orders o LEFT JOIN users u ON u.id = o.user_id "
                + "WHERE o.store_id = ? ORDER BY o.created_at DESC",
            storeId);
        return ApiResponse.ok(rows);
    }

    // 商家更新订单状态（发货/完成/取消）
    @PutMapping("/orders/{id}/status")
    public ApiResponse updateOrderStatus(@PathVariable Long id, @RequestBody Map<String, Object> body,
                                                 HttpServletRequest request) {
        AuthContext.requireRole(request, "merchant");
        Long storeId = requireStoreId(request);
        Object statusObj = body.get("status");
        String status = statusObj == null ? null : statusObj.toString();
        if (!List.of("shipped", "completed", "cancelled").contains(status)) {
            throw new AppException(400, "非法的订单状态");
        }
        int affected = jdbcTemplate.update(
            "UPDATE orders SET status = ?, commission_amount = CASE WHEN ? = 1 THEN 0 ELSE commission_amount END "
                + "WHERE id = ? AND store_id = ?",
            status, "cancelled".equals(status) ? 1 : 0, id, storeId);
        if (affected == 0) {
            throw new AppException(400, "订单不存在或不属于当前店铺");
        }
        return ApiResponse.ok();
    }

    // 商家对账：佣金汇总 + 订单明细
    @GetMapping("/settlement")
    public ApiResponse settlement(HttpServletRequest request) {
        AuthContext.requireRole(request, "merchant");
        Long storeId = requireStoreId(request, 404, "未关联店铺");
        Map<String, Object> summary = jdbcTemplate.queryForMap(
            "SELECT COUNT(*) AS order_count, COALESCE(SUM(total_amount), 0) AS total_sales, "
                + "COALESCE(SUM(commission_amount), 0) AS total_commission, "
                + "COALESCE(SUM(total_amount - commission_amount), 0) AS net_amount "
                + "FROM orders WHERE store_id = ? AND status IN ('paid','shipped','completed')",
            storeId);
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT id, order_no, source, total_amount, commission_rate, commission_amount, status, created_at "
                + "FROM orders WHERE store_id = ? ORDER BY created_at DESC LIMIT 200",
            storeId);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("order_count", nz(summary.get("order_count")));
        data.put("total_sales", nz(summary.get("total_sales")));
        data.put("total_commission", nz(summary.get("total_commission")));
        data.put("net_amount", nz(summary.get("net_amount")));
        data.put("orders", rows);
        return ApiResponse.ok(data);
    }

    // ---------- helpers ----------

    private AuthUser currentUser(HttpServletRequest request) {
        return AuthContext.requireUser(request);
    }

    private Long findStoreId(HttpServletRequest request) {
        AuthUser user = currentUser(request);
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT id FROM stores WHERE owner_id = ? LIMIT 1", user.id());
        return rows.isEmpty() ? null : ((Number) rows.get(0).get("id")).longValue();
    }

    private Long requireStoreId(HttpServletRequest request) {
        return requireStoreId(request, 400, "未关联店铺");
    }

    private Long requireStoreId(HttpServletRequest request, int status, String message) {
        Long storeId = findStoreId(request);
        if (storeId == null) {
            throw new AppException(status, message);
        }
        return storeId;
    }

    private void requireOwnedProduct(Long productId, Long storeId) {
        List<Map<String, Object>> owned = jdbcTemplate.queryForList(
            "SELECT id FROM products WHERE id = ? AND store_id = ?", productId, storeId);
        if (owned.isEmpty()) {
            throw new AppException(400, "商品不存在或不属于当前店铺");
        }
    }

    private static String containsBannedWords(String text) {
        if (text == null) {
            return null;
        }
        for (String word : BANNED_WORDS) {
            if (text.contains(word)) {
                return word;
            }
        }
        return null;
    }

    private static boolean isZero(Object value) {
        if (value == null) {
            return false;
        }
        if (value instanceof Number n) {
            return n.intValue() == 0;
        }
        return "0".equals(value.toString());
    }

    private static Long toLong(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number n) {
            return n.longValue();
        }
        String s = value.toString().trim();
        return s.isEmpty() ? null : Long.valueOf(s);
    }

    private static BigDecimal toDecimal(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof BigDecimal bd) {
            return bd;
        }
        if (value instanceof Number n) {
            return BigDecimal.valueOf(n.doubleValue());
        }
        String s = value.toString().trim();
        if (s.isEmpty()) {
            return null;
        }
        try {
            return new BigDecimal(s);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static Integer toInt(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number n) {
            return n.intValue();
        }
        String s = value.toString().trim();
        if (s.isEmpty()) {
            return null;
        }
        try {
            return Integer.valueOf(s);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static Object nz(Object value) {
        if (value == null) {
            return 0;
        }
        if (value instanceof BigDecimal bd) {
            return bd.doubleValue();
        }
        return value;
    }
}

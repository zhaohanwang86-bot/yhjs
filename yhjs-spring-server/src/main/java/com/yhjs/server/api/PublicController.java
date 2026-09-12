package com.yhjs.server.api;

import com.yhjs.server.auth.AuthContext;
import com.yhjs.server.auth.AuthUser;
import com.yhjs.server.db.SqlIds;
import jakarta.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * 公域商城：商品、店铺、评分。与 Node 版 routes.js 的商城部分保持一致。
 */
@RestController
@RequestMapping("/api")
public class PublicController {

    private final JdbcTemplate jdbcTemplate;

    public PublicController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public record ReviewRequest(String targetType, Object targetId, Object score, String content,
                                Object qualityScore, Object serviceScore, Object logisticsScore) {
    }

    // 药材列表：关键词、分类、店铺、排序、分页
    @GetMapping("/products")
    public ApiResponse products(@RequestParam(required = false) Long categoryId,
                                @RequestParam(required = false) Long storeId,
                                @RequestParam(required = false) String keyword,
                                @RequestParam(required = false) String sort,
                                @RequestParam(required = false) Integer page,
                                @RequestParam(required = false) Integer pageSize) {
        int p = page == null ? 1 : Math.min(Math.max(page, 1), 100000);
        int ps = pageSize == null ? 20 : Math.min(Math.max(pageSize, 1), 100);
        int offset = (p - 1) * ps;

        List<String> conditions = new ArrayList<>();
        List<Object> params = new ArrayList<>();
        conditions.add("p.status = 'on_sale'");
        conditions.add("p.approval_status = 'approved'");
        conditions.add("p.is_public = 1");
        conditions.add("s.status = 'active'");
        conditions.add("s.business_status = 'open'");
        conditions.add("c.status = 'active'");
        if (categoryId != null) {
            conditions.add("p.category_id = ?");
            params.add(categoryId);
        }
        if (storeId != null) {
            conditions.add("p.store_id = ?");
            params.add(storeId);
        }
        if (keyword != null && !keyword.isBlank()) {
            conditions.add("(p.name LIKE ? OR p.description LIKE ? OR p.origin LIKE ? OR s.name LIKE ?)");
            String kw = "%" + keyword.trim() + "%";
            params.add(kw);
            params.add(kw);
            params.add(kw);
            params.add(kw);
        }

        String sortSql = switch (sort == null ? "default" : sort) {
            case "sales" -> "p.sales_count DESC, p.id DESC";
            case "rating" -> "p.rating DESC, p.rating_count DESC, p.id DESC";
            case "priceAsc" -> "p.price ASC, p.id DESC";
            case "priceDesc" -> "p.price DESC, p.id DESC";
            default -> "p.id DESC";
        };
        String where = String.join(" AND ", conditions);
        String baseFrom = "FROM products p JOIN stores s ON s.id = p.store_id JOIN categories c ON c.id = p.category_id WHERE " + where;

        List<Object> listParams = new ArrayList<>(params);
        listParams.add(ps);
        listParams.add(offset);
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT p.id, p.store_id, s.name AS store_name, s.city, "
                + "p.category_id, c.name AS category_name, c.icon AS category_icon, "
                + "p.name, p.description, p.price, p.original_price, p.stock, "
                + "p.sales_count, p.rating, p.rating_count, p.tag, p.image_url, "
                + "p.origin, p.trace_code " + baseFrom + " ORDER BY " + sortSql + " LIMIT ? OFFSET ?",
            listParams.toArray());
        Long total = jdbcTemplate.queryForObject("SELECT COUNT(*) " + baseFrom, params.toArray(), Long.class);
        return ApiResponse.ok(rows, Map.of("page", p, "pageSize", ps, "total", total == null ? 0 : total));
    }

    // 药材详情
    @GetMapping("/products/{id}")
    public ApiResponse productDetail(@PathVariable Long id) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT * FROM v_active_products WHERE id = ?", id);
        if (rows.isEmpty()) {
            throw new AppException(404, "药材不存在");
        }
        return ApiResponse.ok(rows.get(0));
    }

    // 店铺列表
    @GetMapping("/stores")
    public ApiResponse stores(@RequestParam(required = false) String sort) {
        String sortSql = switch (sort == null ? "rating" : sort) {
            case "rating" -> "s.rating DESC, s.rating_count DESC";
            case "sales" -> "s.follower_count DESC";
            case "count" -> "product_count DESC";
            default -> "s.rating DESC, s.rating_count DESC";
        };
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT v.store_id AS id, v.name, v.city, s.years_in_business, "
                + "s.introduction, s.logo_url, s.cover_url, s.brand_color, "
                + "s.badge, s.badge_type, s.rating, s.rating_count, "
                + "s.follower_count, v.product_count "
                + "FROM v_store_product_counts v JOIN stores s ON s.id = v.store_id "
                + "ORDER BY " + sortSql);
        return ApiResponse.ok(rows);
    }

    // 店铺详情（记录访问流量 + 在售商品）
    @GetMapping("/stores/{id}")
    public ApiResponse storeDetail(@PathVariable Long id) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT s.*, COUNT(p.id) AS product_count FROM stores s "
                + "LEFT JOIN products p ON p.store_id = s.id "
                + "AND p.status = 'on_sale' AND p.approval_status = 'approved' "
                + "WHERE s.id = ? AND s.status = 'active' AND s.business_status = 'open' "
                + "GROUP BY s.id",
            id);
        if (rows.isEmpty()) {
            throw new AppException(404, "店铺不存在");
        }
        // 记录店铺访问流量（异步，不阻塞响应）
        try {
            jdbcTemplate.update("INSERT INTO store_visits (store_id, visitor_user_id) VALUES (?, NULL)", id);
        } catch (Exception ignored) {
            // 流量记录失败不影响主流程
        }
        List<Map<String, Object>> products = jdbcTemplate.queryForList(
            "SELECT * FROM v_active_products WHERE store_id = ? ORDER BY sales_count DESC", id);
        Map<String, Object> data = new LinkedHashMap<>(rows.get(0));
        data.put("products", products);
        return ApiResponse.ok(data);
    }

    // 评分列表
    @GetMapping("/reviews")
    public ApiResponse reviews(@RequestParam String targetType,
                               @RequestParam Long targetId,
                               @RequestParam(required = false) Integer page,
                               @RequestParam(required = false) Integer pageSize) {
        if (!List.of("store", "product").contains(targetType)) {
            throw new AppException(400, "targetType 必须是 store 或 product，且必须提供 targetId");
        }
        int p = page == null ? 1 : Math.min(Math.max(page, 1), 100000);
        int ps = pageSize == null ? 20 : Math.min(Math.max(pageSize, 1), 100);
        int offset = (p - 1) * ps;
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT r.id, r.target_type, r.target_id, r.score, r.content, "
                + "r.quality_score, r.service_score, r.logistics_score, "
                + "r.created_at, COALESCE(u.nickname, '匿名用户') AS nickname, u.avatar_url "
                + "FROM reviews r LEFT JOIN users u ON u.id = r.user_id "
                + "WHERE r.target_type = ? AND r.target_id = ? AND r.status = 'visible' "
                + "ORDER BY r.created_at DESC LIMIT ? OFFSET ?",
            targetType, targetId, ps, offset);
        return ApiResponse.ok(rows, Map.of("page", p, "pageSize", ps));
    }

    // 提交评分
    @PostMapping("/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse createReview(@RequestBody ReviewRequest body, HttpServletRequest request) {
        AuthUser user = AuthContext.requireUser(request);
        if (!List.of("store", "product").contains(body.targetType()) || body.targetId() == null) {
            throw new AppException(400, "评分参数不完整或不合法");
        }
        Integer score = toInt(body.score());
        String content = body.content() == null ? null : body.content().trim();
        if (score == null || score < 1 || score > 5 || content == null || content.isEmpty()) {
            throw new AppException(400, "评分参数不完整或不合法");
        }
        Long id = SqlIds.insert(jdbcTemplate,
            "INSERT INTO reviews (user_id, target_type, target_id, score, content, quality_score, service_score, logistics_score) "
                + "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            user.id(), body.targetType(), toLong(body.targetId()), score, content,
            toInt(body.qualityScore()), toInt(body.serviceScore()), toInt(body.logisticsScore()));
        return ApiResponse.ok(Map.of("id", id));
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

    private static BigDecimal toDecimal(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof BigDecimal bd) {
            return bd;
        }
        return BigDecimal.valueOf(((Number) value).doubleValue());
    }
}

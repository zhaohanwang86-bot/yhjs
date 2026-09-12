package com.yhjs.server.api;

import com.yhjs.server.auth.AuthContext;
import com.yhjs.server.auth.AuthUser;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 平台管理端。与 Node 版 routes.js 的管理端部分保持一致。
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final JdbcTemplate jdbcTemplate;

    public AdminController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public record ReviewRequest(String status, String note) {
    }

    public record StatusRequest(String status) {
    }

    // 平台统计概览
    @GetMapping("/stats")
    public ApiResponse stats(HttpServletRequest request) {
        AuthContext.requireRole(request, "admin");
        Map<String, Object> data = new java.util.LinkedHashMap<>();
        data.put("users", count("SELECT COUNT(*) FROM users WHERE role = 'user'"));
        data.put("merchants", count("SELECT COUNT(*) FROM users WHERE role = 'merchant'"));
        data.put("stores", count("SELECT COUNT(*) FROM stores"));
        data.put("products", count("SELECT COUNT(*) FROM products"));
        data.put("orders", count("SELECT COUNT(*) FROM orders"));
        data.put("posts", count("SELECT COUNT(*) FROM community_posts"));
        data.put("comments", count("SELECT COUNT(*) FROM post_comments"));
        data.put("reviews", count("SELECT COUNT(*) FROM reviews"));
        data.put("pendingApplications",
            count("SELECT COUNT(*) FROM merchant_applications WHERE status = 'pending'"));
        return ApiResponse.ok(data);
    }

    // 商家资质申请列表
    @GetMapping("/merchant-applications")
    public ApiResponse merchantApplications(HttpServletRequest request) {
        AuthContext.requireRole(request, "admin");
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT a.*, COALESCE(u.nickname, '') AS applicant_nickname, COALESCE(u.phone, '') AS applicant_phone "
                + "FROM merchant_applications a LEFT JOIN users u ON u.id = a.user_id "
                + "ORDER BY CASE a.status WHEN 'pending' THEN 0 ELSE 1 END, a.created_at DESC");
        return ApiResponse.ok(rows);
    }

    // 审核商家资质
    @PutMapping("/merchant-applications/{id}/review")
    @Transactional
    public ApiResponse reviewApplication(@PathVariable Long id, @RequestBody ReviewRequest body,
                                         HttpServletRequest request) {
        AuthContext.requireRole(request, "admin");
        if (!List.of("approved", "rejected").contains(body.status())) {
            throw new AppException(400, "审核状态不合法");
        }
        jdbcTemplate.update(
            "UPDATE merchant_applications SET status = ?, review_note = ?, reviewed_by = ?, reviewed_at = NOW() "
                + "WHERE id = ?",
            body.status(), body.note(), currentUser(request).id(), id);
        if ("approved".equals(body.status())) {
            List<Map<String, Object>> apps = jdbcTemplate.queryForList(
                "SELECT user_id FROM merchant_applications WHERE id = ?", id);
            if (!apps.isEmpty() && apps.get(0).get("user_id") != null) {
                jdbcTemplate.update("UPDATE users SET role = 'merchant' WHERE id = ?",
                    ((Number) apps.get(0).get("user_id")).longValue());
            }
        }
        return ApiResponse.ok();
    }

    // 内容审核列表（帖子/评论/评价）
    @GetMapping("/contents")
    public ApiResponse contents(@RequestParam(defaultValue = "post") String type,
                                HttpServletRequest request) {
        AuthContext.requireRole(request, "admin");
        switch (type) {
            case "post" -> {
                List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT p.id, p.title, p.content, p.status, p.created_at, "
                        + "COALESCE(u.nickname, '匿名用户') AS nickname "
                        + "FROM community_posts p LEFT JOIN users u ON u.id = p.user_id "
                        + "ORDER BY p.created_at DESC LIMIT 200");
                return ApiResponse.ok(rows);
            }
            case "comment" -> {
                List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT c.id, c.content, c.status, c.created_at, "
                        + "COALESCE(u.nickname, '匿名用户') AS nickname, p.title AS post_title "
                        + "FROM post_comments c "
                        + "LEFT JOIN users u ON u.id = c.user_id "
                        + "LEFT JOIN community_posts p ON p.id = c.post_id "
                        + "ORDER BY c.created_at DESC LIMIT 200");
                return ApiResponse.ok(rows);
            }
            case "review" -> {
                List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT r.id, r.content, r.status, r.score, r.created_at, "
                        + "COALESCE(u.nickname, '匿名用户') AS nickname "
                        + "FROM reviews r LEFT JOIN users u ON u.id = r.user_id "
                        + "ORDER BY r.created_at DESC LIMIT 200");
                return ApiResponse.ok(rows);
            }
            default -> throw new AppException(400, "不支持的内容类型");
        }
    }

    // 审核内容（显示/隐藏）
    @PutMapping("/contents/{type}/{id}/status")
    public ApiResponse updateContentStatus(@PathVariable String type, @PathVariable Long id,
                                           @RequestBody StatusRequest body, HttpServletRequest request) {
        AuthContext.requireRole(request, "admin");
        if (!List.of("visible", "hidden", "pending").contains(body.status())) {
            throw new AppException(400, "状态不合法");
        }
        String table = switch (type) {
            case "post" -> "community_posts";
            case "comment" -> "post_comments";
            case "review" -> "reviews";
            default -> null;
        };
        if (table == null) {
            throw new AppException(400, "不支持的内容类型");
        }
        jdbcTemplate.update("UPDATE " + table + " SET status = ? WHERE id = ?", body.status(), id);
        return ApiResponse.ok();
    }

    // 审计日志
    @GetMapping("/audit-logs")
    public ApiResponse auditLogs(HttpServletRequest request) {
        AuthContext.requireRole(request, "admin");
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT a.id, a.action, a.resource_type, a.resource_id, a.ip_address, a.created_at, "
                + "COALESCE(u.nickname, '') AS nickname "
                + "FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_id "
                + "ORDER BY a.created_at DESC LIMIT 200");
        return ApiResponse.ok(rows);
    }

    // 信息流动监测：用户-商家会话总览
    @GetMapping("/conversations")
    public ApiResponse conversations(HttpServletRequest request) {
        AuthContext.requireRole(request, "admin");
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT c.id, c.user_id, c.store_id, c.last_message, c.last_message_at, "
                + "c.unread_user, c.unread_merchant, c.created_at, "
                + "COALESCE(u.nickname, '匿名用户') AS user_nickname, s.name AS store_name "
                + "FROM conversations c "
                + "LEFT JOIN users u ON u.id = c.user_id "
                + "LEFT JOIN stores s ON s.id = c.store_id "
                + "ORDER BY c.last_message_at DESC LIMIT 200");
        return ApiResponse.ok(rows);
    }

    // 信息流动监测：查看某会话消息记录
    @GetMapping("/conversations/{id}/messages")
    public ApiResponse conversationMessages(@PathVariable Long id, HttpServletRequest request) {
        AuthContext.requireRole(request, "admin");
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT m.id, m.sender_id, m.content, m.is_read, m.created_at, "
                + "COALESCE(u.nickname, '匿名用户') AS sender_nickname "
                + "FROM messages m LEFT JOIN users u ON u.id = m.sender_id "
                + "WHERE m.conversation_id = ? ORDER BY m.created_at ASC",
            id);
        return ApiResponse.ok(rows);
    }

    private AuthUser currentUser(HttpServletRequest request) {
        return AuthContext.requireUser(request);
    }

    private long count(String sql) {
        Long value = jdbcTemplate.queryForObject(sql, Long.class);
        return value == null ? 0 : value;
    }
}

package com.yhjs.server.api;

import com.yhjs.server.auth.AuthContext;
import com.yhjs.server.auth.AuthUser;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 收藏店铺 / 药材。与 Node 版一致，但按当前登录用户取值（修复原版误用请求参数的隐患）。
 */
@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    private final JdbcTemplate jdbcTemplate;

    public FavoriteController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public record ToggleRequest(String targetType, Object targetId) {
    }

    // 我的收藏
    @GetMapping
    public ApiResponse favorites(HttpServletRequest request) {
        AuthUser user = AuthContext.requireUser(request);
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT f.id, f.target_type, f.target_id, f.created_at, "
                + "CASE WHEN f.target_type = 'product' THEN p.name ELSE s.name END AS target_name "
                + "FROM favorites f "
                + "LEFT JOIN products p ON f.target_type = 'product' AND p.id = f.target_id "
                + "LEFT JOIN stores s ON f.target_type = 'store' AND s.id = f.target_id "
                + "WHERE f.user_id = ? ORDER BY f.created_at DESC",
            user.id());
        return ApiResponse.ok(rows);
    }

    // 收藏 / 取消收藏
    @PostMapping("/toggle")
    public ApiResponse toggle(@RequestBody ToggleRequest body, HttpServletRequest request) {
        AuthUser user = AuthContext.requireUser(request);
        if (!List.of("store", "product").contains(body.targetType()) || body.targetId() == null) {
            throw new AppException(400, "收藏参数不完整");
        }
        Long targetId = body.targetId() instanceof Number n ? n.longValue() : Long.valueOf(body.targetId().toString());
        List<Map<String, Object>> existing = jdbcTemplate.queryForList(
            "SELECT id FROM favorites WHERE user_id = ? AND target_type = ? AND target_id = ?",
            user.id(), body.targetType(), targetId);
        if (!existing.isEmpty()) {
            jdbcTemplate.update("DELETE FROM favorites WHERE id = ?", existing.get(0).get("id"));
            return ApiResponse.ok(Map.of("favorited", false));
        }
        jdbcTemplate.update(
            "INSERT INTO favorites (user_id, target_type, target_id) VALUES (?, ?, ?)",
            user.id(), body.targetType(), targetId);
        return ApiResponse.ok(Map.of("favorited", true));
    }
}

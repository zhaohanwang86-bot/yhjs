package com.yhjs.server.api;

import com.yhjs.server.auth.AuthContext;
import com.yhjs.server.auth.AuthUser;
import com.yhjs.server.db.SqlIds;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * 用户-商家聊天，与 Node 版 routes.js 的聊天部分一致。
 */
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final JdbcTemplate jdbcTemplate;

    public ChatController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public record StartConversationRequest(Long storeId, String content) {
    }

    public record MessageRequest(String content) {
    }

    // 发起会话（用户给商家发第一条消息）
    @PostMapping("/conversations")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse startConversation(@RequestBody StartConversationRequest body,
                                                 HttpServletRequest request) {
        AuthUser user = AuthContext.requireUser(request);
        if (body.storeId() == null || body.content() == null || body.content().isBlank()) {
            throw new AppException(400, "店铺和消息内容不能为空");
        }
        List<Map<String, Object>> storeRows = jdbcTemplate.queryForList(
            "SELECT id FROM stores WHERE id = ? AND status = 'active'", body.storeId());
        if (storeRows.isEmpty()) {
            throw new AppException(400, "店铺不存在");
        }

        Long convId;
        List<Map<String, Object>> conv = jdbcTemplate.queryForList(
            "SELECT id FROM conversations WHERE user_id = ? AND store_id = ?", user.id(), body.storeId());
        if (conv.isEmpty()) {
            convId = SqlIds.insert(jdbcTemplate,
                "INSERT INTO conversations (user_id, store_id) VALUES (?, ?)",
                user.id(), body.storeId());
        } else {
            convId = ((Number) conv.get(0).get("id")).longValue();
        }
        String content = body.content().trim();
        jdbcTemplate.update("INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)",
            convId, user.id(), content);
        jdbcTemplate.update(
            "UPDATE conversations SET last_message = ?, last_message_at = NOW(), unread_merchant = unread_merchant + 1 WHERE id = ?",
            content, convId);
        return ApiResponse.ok(Map.of("conversationId", convId));
    }

    // 会话列表（用户端：自己的会话；商家端：自己店铺的会话）
    @GetMapping("/conversations")
    public ApiResponse conversations(HttpServletRequest request) {
        AuthUser user = AuthContext.requireUser(request);
        if ("merchant".equals(user.role())) {
            Long storeId = findStoreId(user.id());
            if (storeId == null) {
                return ApiResponse.ok(List.of());
            }
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT c.*, u.nickname AS other_nickname, s.name AS store_name "
                    + "FROM conversations c "
                    + "JOIN users u ON u.id = c.user_id "
                    + "JOIN stores s ON s.id = c.store_id "
                    + "WHERE c.store_id = ? ORDER BY c.last_message_at DESC",
                storeId);
            return ApiResponse.ok(rows);
        }
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT c.*, s.name AS store_name FROM conversations c JOIN stores s ON s.id = c.store_id "
                + "WHERE c.user_id = ? ORDER BY c.last_message_at DESC",
            user.id());
        return ApiResponse.ok(rows);
    }

    // 获取会话消息（校验归属，并标记已读）
    @GetMapping("/conversations/{id}/messages")
    public ApiResponse messages(@PathVariable Long id, HttpServletRequest request) {
        AuthUser user = AuthContext.requireUser(request);
        Map<String, Object> conv = requireConversation(id);
        boolean isMerchant = "merchant".equals(user.role());
        if (isMerchant) {
            requireOwnedConversation(id, conv, user.id());
        } else if (!String.valueOf(conv.get("user_id")).equals(String.valueOf(user.id()))) {
            throw new AppException(400, "无权访问该会话");
        }
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT m.id, m.sender_id, m.content, m.created_at, "
                + "COALESCE(u.nickname, '匿名用户') AS sender_nickname "
                + "FROM messages m LEFT JOIN users u ON u.id = m.sender_id "
                + "WHERE m.conversation_id = ? ORDER BY m.created_at ASC",
            id);
        jdbcTemplate.update("UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ?",
            id, user.id());
        if (isMerchant) {
            jdbcTemplate.update("UPDATE conversations SET unread_merchant = 0 WHERE id = ?", id);
        } else {
            jdbcTemplate.update("UPDATE conversations SET unread_user = 0 WHERE id = ?", id);
        }
        return ApiResponse.ok(rows);
    }

    // 发送消息
    @PostMapping("/conversations/{id}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse sendMessage(@PathVariable Long id, @RequestBody MessageRequest body,
                                           HttpServletRequest request) {
        AuthUser user = AuthContext.requireUser(request);
        if (body.content() == null || body.content().isBlank()) {
            throw new AppException(400, "消息内容不能为空");
        }
        Map<String, Object> conv = requireConversation(id);
        boolean isMerchant = "merchant".equals(user.role());
        if (isMerchant) {
            requireOwnedConversation(id, conv, user.id());
        } else if (!String.valueOf(conv.get("user_id")).equals(String.valueOf(user.id()))) {
            throw new AppException(400, "无权访问该会话");
        }
        String content = body.content().trim();
        jdbcTemplate.update("INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)",
            id, user.id(), content);
        if (isMerchant) {
            jdbcTemplate.update(
                "UPDATE conversations SET last_message = ?, last_message_at = NOW(), unread_user = unread_user + 1 WHERE id = ?",
                content, id);
        } else {
            jdbcTemplate.update(
                "UPDATE conversations SET last_message = ?, last_message_at = NOW(), unread_merchant = unread_merchant + 1 WHERE id = ?",
                content, id);
        }
        return ApiResponse.ok();
    }

    private Long findStoreId(Long userId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT id FROM stores WHERE owner_id = ? LIMIT 1", userId);
        return rows.isEmpty() ? null : ((Number) rows.get(0).get("id")).longValue();
    }

    private Map<String, Object> requireConversation(Long id) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT * FROM conversations WHERE id = ?", id);
        if (rows.isEmpty()) {
            throw new AppException(400, "会话不存在");
        }
        return rows.get(0);
    }

    private void requireOwnedConversation(Long convId, Map<String, Object> conv, Long ownerId) {
        List<Map<String, Object>> owned = jdbcTemplate.queryForList(
            "SELECT id FROM stores WHERE owner_id = ? AND id = ?", ownerId, conv.get("store_id"));
        if (owned.isEmpty()) {
            throw new AppException(400, "无权访问该会话");
        }
    }
}

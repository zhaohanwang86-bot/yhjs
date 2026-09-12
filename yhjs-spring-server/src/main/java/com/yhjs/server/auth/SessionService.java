package com.yhjs.server.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/**
 * 会话管理，与 Node 版 auth.js 一致：
 * 登录/注册时生成 32 字节随机 token，SHA-256 哈希后存入 user_sessions 表；
 * 每次请求携带 Bearer token，按 token_hash 反查用户。
 */
@Service
public class SessionService {

    private static final int SESSION_DAYS = 7;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final JdbcTemplate jdbcTemplate;

    public SessionService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public String createSession(Long userId) {
        String token = randomToken();
        String tokenHash = sha256Hex(token);
        jdbcTemplate.update(
            "INSERT INTO user_sessions (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))",
            userId, tokenHash, SESSION_DAYS);
        return token;
    }

    public AuthUser findUserByToken(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }
        String tokenHash = sha256Hex(token.trim());
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT u.id, u.nickname, u.phone, u.avatar_url, u.bio, u.gender, u.birthday, u.role, u.status "
                + "FROM user_sessions s JOIN users u ON u.id = s.user_id "
                + "WHERE s.token_hash = ? AND s.expires_at > NOW() AND u.status = 'active'",
            tokenHash);
        if (rows.isEmpty()) {
            return null;
        }
        Map<String, Object> row = rows.get(0);
        return new AuthUser(
            toLong(row.get("id")),
            (String) row.get("nickname"),
            (String) row.get("phone"),
            (String) row.get("avatar_url"),
            (String) row.get("bio"),
            (String) row.get("gender"),
            toLocalDate(row.get("birthday")),
            (String) row.get("role"),
            (String) row.get("status"));
    }

    public void deleteSession(String token) {
        if (token == null || token.isBlank()) {
            return;
        }
        jdbcTemplate.update("DELETE FROM user_sessions WHERE token_hash = ?", sha256Hex(token.trim()));
    }

    private static String randomToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return toHex(bytes);
    }

    static String sha256Hex(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return toHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private static String toHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private static Long toLong(Object value) {
        return value == null ? null : ((Number) value).longValue();
    }

    private static LocalDate toLocalDate(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof java.sql.Date sqlDate) {
            return sqlDate.toLocalDate();
        }
        return LocalDate.parse(value.toString());
    }
}

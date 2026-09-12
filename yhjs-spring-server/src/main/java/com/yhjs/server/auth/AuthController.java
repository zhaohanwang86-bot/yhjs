package com.yhjs.server.auth;

import com.yhjs.server.api.ApiResponse;
import com.yhjs.server.api.AppException;
import com.yhjs.server.db.SqlIds;
import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final JdbcTemplate jdbcTemplate;
    private final SessionService sessionService;

    public AuthController(JdbcTemplate jdbcTemplate, SessionService sessionService) {
        this.jdbcTemplate = jdbcTemplate;
        this.sessionService = sessionService;
    }

    public record RegisterRequest(String nickname, String phone, String password) {
    }

    public record LoginRequest(String phone, String password) {
    }

    public record ProfileRequest(String nickname, String avatarUrl, String bio, String gender, String birthday) {
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse register(@RequestBody RegisterRequest body) {
        String nickname = body.nickname() == null ? "" : body.nickname().trim();
        String phone = body.phone() == null ? "" : body.phone().trim();
        if (nickname.isEmpty() || !phone.matches("^1\\d{10}$")
            || body.password() == null || body.password().length() < 6) {
            throw new AppException(400, "昵称、11位手机号和至少6位密码不能为空");
        }
        List<Map<String, Object>> existing = jdbcTemplate.queryForList("SELECT id FROM users WHERE phone = ?", phone);
        if (!existing.isEmpty()) {
            throw new AppException(409, "该手机号已注册");
        }
        Long userId = SqlIds.insert(jdbcTemplate,
            "INSERT INTO users (nickname, phone, password_hash, role) VALUES (?, ?, ?, 'user')",
            nickname, phone, PasswordHasher.hash(body.password()));
        String token = sessionService.createSession(userId);

        Map<String, Object> user = new HashMap<>();
        user.put("id", userId);
        user.put("nickname", nickname);
        user.put("phone", phone);
        user.put("role", "user");
        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("user", user);
        return ApiResponse.ok(data);
    }

    @PostMapping("/login")
    public ApiResponse login(@RequestBody LoginRequest body) {
        if (body.phone() == null || body.password() == null) {
            throw new AppException(400, "手机号和密码不能为空");
        }
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT id, nickname, phone, avatar_url, bio, gender, birthday, role, status, password_hash "
                + "FROM users WHERE phone = ?",
            body.phone());
        if (rows.isEmpty()) {
            throw new AppException(401, "手机号或密码错误");
        }
        Map<String, Object> user = rows.get(0);
        if (!"active".equals(user.get("status"))) {
            throw new AppException(401, "手机号或密码错误");
        }
        String passwordHash = (String) user.get("password_hash");
        if (passwordHash == null || !PasswordHasher.verify(body.password(), passwordHash)) {
            throw new AppException(401, "手机号或密码错误");
        }
        Long userId = ((Number) user.get("id")).longValue();
        jdbcTemplate.update("UPDATE users SET last_login_at = NOW() WHERE id = ?", userId);
        String token = sessionService.createSession(userId);
        user.remove("password_hash");

        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("user", user);
        return ApiResponse.ok(data);
    }

    @GetMapping("/me")
    public ApiResponse me(HttpServletRequest request) {
        return ApiResponse.ok(AuthContext.requireUser(request));
    }

    @PutMapping("/profile")
    public ApiResponse updateProfile(@RequestBody ProfileRequest body, HttpServletRequest request) {
        AuthUser current = AuthContext.requireUser(request);
        String nickname = body.nickname() == null ? "" : body.nickname().trim();
        if (nickname.isEmpty()) {
            throw new AppException(400, "用户名不能为空");
        }
        if (nickname.length() > 40) {
            throw new AppException(400, "用户名不能超过40个字符");
        }
        String gender = body.gender() == null || body.gender().isBlank() ? "unknown" : body.gender();
        if (!List.of("unknown", "male", "female").contains(gender)) {
            throw new AppException(400, "性别参数不合法");
        }
        String birthday = body.birthday() == null || body.birthday().isBlank() ? null : body.birthday();
        jdbcTemplate.update(
            "UPDATE users SET nickname = ?, avatar_url = ?, bio = ?, gender = ?, birthday = ? WHERE id = ?",
            nickname, body.avatarUrl(), body.bio(), gender, birthday, current.id());
        Map<String, Object> row = jdbcTemplate.queryForMap(
            "SELECT id, nickname, phone, avatar_url, bio, gender, birthday, role, status FROM users WHERE id = ?",
            current.id());
        return ApiResponse.ok(row);
    }

    @PostMapping("/logout")
    public ApiResponse logout(HttpServletRequest request) {
        AuthContext.requireUser(request);
        String header = request.getHeader("Authorization");
        String token = header == null ? "" : header.substring(7).trim();
        sessionService.deleteSession(token);
        return ApiResponse.ok();
    }
}

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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/merchant-applications")
public class MerchantApplicationController {

    private final JdbcTemplate jdbcTemplate;

    public MerchantApplicationController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public record CreateRequest(String storeName, String city, String contactName, String contactPhone,
                                String storeType, String mainCategory, String introduction, String qualificationNote) {
    }

    @GetMapping("/mine")
    public ApiResponse mine(HttpServletRequest request) {
        AuthUser user = AuthContext.requireUser(request);
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT id, store_name, city, store_type, main_category, status, review_note, created_at, reviewed_at "
                + "FROM merchant_applications WHERE user_id = ? ORDER BY created_at DESC",
            user.id());
        return ApiResponse.ok(rows);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse create(@RequestBody CreateRequest body, HttpServletRequest request) {
        AuthUser user = AuthContext.requireUser(request);
        if (blank(body.storeName()) || blank(body.city()) || blank(body.contactName())
            || blank(body.contactPhone()) || blank(body.storeType())) {
            throw new AppException(400, "店铺名称、城市、联系人、电话和店铺类型不能为空");
        }
        Long id = SqlIds.insert(jdbcTemplate,
            "INSERT INTO merchant_applications "
                + "(user_id, store_name, city, contact_name, contact_phone, store_type, main_category, introduction, qualification_note) "
                + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            user.id(), body.storeName().trim(), body.city().trim(), body.contactName().trim(),
            body.contactPhone().trim(), body.storeType().trim(), body.mainCategory(),
            body.introduction(), body.qualificationNote());
        return ApiResponse.ok(Map.of("id", id, "status", "pending"));
    }

    private static boolean blank(String value) {
        return value == null || value.trim().isEmpty();
    }
}

package com.yhjs.server.api;

import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final JdbcTemplate jdbcTemplate;

    public CategoryController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ApiResponse list() {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT c.id, c.name, c.icon, c.sort_order, COUNT(p.id) AS product_count "
                + "FROM categories c "
                + "LEFT JOIN products p ON p.category_id = c.id AND p.status = 'on_sale' "
                + "WHERE c.status = 'active' "
                + "GROUP BY c.id, c.name, c.icon, c.sort_order "
                + "ORDER BY c.sort_order, c.id");
        return ApiResponse.ok(rows);
    }
}

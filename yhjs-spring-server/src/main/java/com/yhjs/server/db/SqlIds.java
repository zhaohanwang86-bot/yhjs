package com.yhjs.server.db;

import java.sql.PreparedStatement;
import java.sql.Statement;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;

/**
 * 在同一连接上执行 INSERT 并取回自增主键。
 * 避免「INSERT 用连接 A、LAST_INSERT_ID() 用连接 B」导致取到 0 的并发问题。
 */
public final class SqlIds {

    private SqlIds() {
    }

    public static Long insert(JdbcTemplate jdbcTemplate, String sql, Object... params) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            for (int i = 0; i < params.length; i++) {
                ps.setObject(i + 1, params[i]);
            }
            return ps;
        }, keyHolder);
        Number key = keyHolder.getKey();
        return key == null ? null : key.longValue();
    }
}

package com.yhjs.server.db;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class DatabaseHealthService {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseHealthService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public boolean isConnected() {
        Integer value = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
        return value != null && value == 1;
    }
}

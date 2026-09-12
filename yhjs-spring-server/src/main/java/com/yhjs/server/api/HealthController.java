package com.yhjs.server.api;

import com.yhjs.server.db.DatabaseHealthService;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HealthController {

    private final DatabaseHealthService databaseHealthService;

    public HealthController(DatabaseHealthService databaseHealthService) {
        this.databaseHealthService = databaseHealthService;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        try {
            databaseHealthService.isConnected();
            return ResponseEntity.ok(Map.of("ok", true, "database", "connected"));
        } catch (Exception exception) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("ok", false, "database", "disconnected", "message", exception.getMessage()));
        }
    }
}

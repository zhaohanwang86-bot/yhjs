package com.yhjs.server.api;

import java.util.Map;

public class ApiResponse {

    private final boolean ok;
    private final Object data;
    private final String message;
    private final Object pagination;

    private ApiResponse(boolean ok, Object data, String message, Object pagination) {
        this.ok = ok;
        this.data = data;
        this.message = message;
        this.pagination = pagination;
    }

    public static ApiResponse ok() {
        return new ApiResponse(true, null, null, null);
    }

    public static ApiResponse ok(Object data) {
        return new ApiResponse(true, data, null, null);
    }

    public static ApiResponse ok(Object data, Object pagination) {
        return new ApiResponse(true, data, null, pagination);
    }

    public static ApiResponse error(String message) {
        return new ApiResponse(false, null, message, null);
    }

    public static ApiResponse health(boolean databaseConnected) {
        return new ApiResponse(true, Map.of("ok", true, "database", databaseConnected ? "connected" : "disconnected"), null, null);
    }

    public boolean isOk() {
        return ok;
    }

    public Object getData() {
        return data;
    }

    public String getMessage() {
        return message;
    }

    public Object getPagination() {
        return pagination;
    }
}

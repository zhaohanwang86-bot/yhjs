package com.yhjs.server.auth;

import com.yhjs.server.api.AppException;
import jakarta.servlet.http.HttpServletRequest;

public final class AuthContext {

    public static final String ATTR_USER = "yhjs.auth.user";

    private AuthContext() {
    }

    public static AuthUser requireUser(HttpServletRequest request) {
        AuthUser user = (AuthUser) request.getAttribute(ATTR_USER);
        if (user == null) {
            throw new AppException(401, "请先登录");
        }
        return user;
    }

    public static void requireRole(HttpServletRequest request, String... roles) {
        AuthUser user = requireUser(request);
        for (String role : roles) {
            if (role.equals(user.role())) {
                return;
            }
        }
        throw new AppException(403, "没有权限执行此操作");
    }
}

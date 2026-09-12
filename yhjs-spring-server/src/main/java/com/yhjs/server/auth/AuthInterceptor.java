package com.yhjs.server.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 解析 Authorization: Bearer <token>，将登录用户放入请求属性。
 * 仅做解析，不强制登录；需要登录/角色的接口由 AuthContext 校验。
 */
public class AuthInterceptor implements HandlerInterceptor {

    private final SessionService sessionService;

    public AuthInterceptor(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7).trim();
            AuthUser user = sessionService.findUserByToken(token);
            if (user != null) {
                request.setAttribute(AuthContext.ATTR_USER, user);
            }
        }
        return true;
    }
}

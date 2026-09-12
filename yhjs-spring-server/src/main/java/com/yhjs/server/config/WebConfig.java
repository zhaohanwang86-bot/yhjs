package com.yhjs.server.config;

import com.yhjs.server.auth.ApiSignatureInterceptor;
import com.yhjs.server.auth.AuthInterceptor;
import com.yhjs.server.auth.SessionService;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final SessionService sessionService;
    private final ApiSignatureInterceptor apiSignatureInterceptor;

    public WebConfig(SessionService sessionService, ApiSignatureInterceptor apiSignatureInterceptor) {
        this.sessionService = sessionService;
        this.apiSignatureInterceptor = apiSignatureInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new AuthInterceptor(sessionService)).addPathPatterns("/api/**");
        // 顺序在登录态解析之后：签名校验以登录 token 作为密钥
        registry.addInterceptor(apiSignatureInterceptor)
            .addPathPatterns("/api/**")
            .excludePathPatterns("/api/auth/login", "/api/auth/register");
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOriginPatterns("*")
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("Content-Type", "Authorization", "X-Timestamp", "X-Nonce", "X-Sign");
    }
}

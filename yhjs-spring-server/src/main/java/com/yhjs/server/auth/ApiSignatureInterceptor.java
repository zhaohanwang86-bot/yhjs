package com.yhjs.server.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yhjs.server.api.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 接口签名防重放：写接口（POST/PUT/DELETE/PATCH）必须携带 X-Timestamp / X-Nonce / X-Sign 三个请求头。
 *
 * <p>签名原文 = METHOD + "\n" + PATH + "\n" + TIMESTAMP + "\n" + NONCE + "\n" + TOKEN
 * <br>签名值 = SHA-256(签名原文) 的十六进制小写串
 *
 * <p>密钥直接使用登录 token：只有持有该会话的客户端才能算出正确签名，服务端无需额外下发密钥。
 * 由于原文含 METHOD 与 PATH，签名无法被挪用到其他接口；含 NONCE 与 TIMESTAMP，无法被重复使用。
 *
 * <p>防重放靠两件事：
 * <ol>
 *   <li>时间戳与服务器时间偏差超过容差（默认 300 秒）的请求直接拒绝；</li>
 *   <li>nonce 在容差窗口内只能出现一次，重复出现即判定为重放。</li>
 * </ol>
 *
 * <p>注意：nonce 记录保存在单实例内存中，多实例部署时应替换为 Redis 等共享存储。
 * 默认关闭，需设置 API_SIGN_ENABLED=true 开启；开启前客户端必须已实现同样的签名逻辑。
 */
@Component
public class ApiSignatureInterceptor implements HandlerInterceptor {

    private static final String HEADER_TIMESTAMP = "X-Timestamp";
    private static final String HEADER_NONCE = "X-Nonce";
    private static final String HEADER_SIGN = "X-Sign";
    private static final int NONCE_CLEAN_THRESHOLD = 10000;

    private final ObjectMapper objectMapper;
    private final boolean enabled;
    private final long toleranceMillis;
    private final Map<String, Long> usedNonces = new ConcurrentHashMap<>();

    public ApiSignatureInterceptor(
        ObjectMapper objectMapper,
        @Value("${security.signature.enabled:false}") boolean enabled,
        @Value("${security.signature.tolerance-seconds:300}") long toleranceSeconds) {
        this.objectMapper = objectMapper;
        this.enabled = enabled;
        this.toleranceMillis = toleranceSeconds * 1000L;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
        throws IOException {
        if (!enabled || !isWriteMethod(request.getMethod())) {
            return true;
        }
        String token = bearerToken(request);
        if (token == null) {
            return reject(response, 401, "缺少登录凭证");
        }
        String timestamp = request.getHeader(HEADER_TIMESTAMP);
        String nonce = request.getHeader(HEADER_NONCE);
        String clientSign = request.getHeader(HEADER_SIGN);
        if (timestamp == null || nonce == null || clientSign == null) {
            return reject(response, 401, "缺少签名请求头");
        }
        long clientTime;
        try {
            clientTime = Long.parseLong(timestamp);
        } catch (NumberFormatException e) {
            return reject(response, 401, "时间戳格式不正确");
        }
        if (Math.abs(System.currentTimeMillis() - clientTime) > toleranceMillis) {
            return reject(response, 401, "请求已过期，请校准客户端时间");
        }
        if (isReplayed(nonce, clientTime)) {
            return reject(response, 401, "重复请求已被拒绝");
        }
        String expected = sign(token, request.getMethod(), request.getRequestURI(), timestamp, nonce);
        if (!constantTimeEquals(expected, clientSign)) {
            return reject(response, 401, "签名校验失败");
        }
        return true;
    }

    /** 客户端与服务端共用的签名算法，小程序 / Web 端按同样规则拼接原文即可 */
    public static String sign(String token, String method, String path, String timestamp, String nonce) {
        String payload = method.toUpperCase() + "\n" + path + "\n" + timestamp + "\n" + nonce + "\n" + token;
        try {
            byte[] bytes = MessageDigest.getInstance("SHA-256")
                .digest(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(bytes.length * 2);
            for (byte b : bytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private boolean isReplayed(String nonce, long clientTime) {
        if (usedNonces.size() > NONCE_CLEAN_THRESHOLD) {
            long now = System.currentTimeMillis();
            usedNonces.entrySet().removeIf(entry -> entry.getValue() < now);
        }
        Long previous = usedNonces.put(nonce, clientTime + toleranceMillis);
        return previous != null && previous >= System.currentTimeMillis();
    }

    private boolean reject(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(objectMapper.writeValueAsString(ApiResponse.error(message)));
        return false;
    }

    private static boolean isWriteMethod(String method) {
        return "POST".equals(method) || "PUT".equals(method) || "DELETE".equals(method) || "PATCH".equals(method);
    }

    private static String bearerToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            return null;
        }
        String token = header.substring(7).trim();
        return token.isEmpty() ? null : token;
    }

    private static boolean constantTimeEquals(String expected, String actual) {
        return MessageDigest.isEqual(
            expected.getBytes(StandardCharsets.UTF_8),
            actual.getBytes(StandardCharsets.UTF_8));
    }
}

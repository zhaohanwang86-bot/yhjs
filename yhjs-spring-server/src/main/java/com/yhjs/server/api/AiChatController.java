package com.yhjs.server.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yhjs.server.auth.AuthContext;
import com.yhjs.server.auth.AuthUser;
import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Semaphore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * AI 智能客服：代理调用 DeepSeek 官方接口（OpenAI 兼容）。
 * 密钥从环境变量注入，前端不接触 key。
 */
@RestController
@RequestMapping("/api/ai")
public class AiChatController {

    private static final String DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";

    // AI 是慢请求（单次数秒），限制同时进行的调用数，避免占满 Tomcat 线程拖垮其它接口
    private static final int AI_MAX_CONCURRENCY = 20;
    private final Semaphore aiSlots = new Semaphore(AI_MAX_CONCURRENCY);

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient;

    @Value("${ai.api-key:}")
    private String apiKey;

    @Value("${ai.model:deepseek-v4-flash}")
    private String model;

    public AiChatController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();
    }

    public record ChatMessage(String role, String content) {
    }

    public record ChatRequest(List<ChatMessage> messages) {
    }

    @PostMapping("/chat")
    public ApiResponse chat(@RequestBody ChatRequest req, HttpServletRequest request) throws Exception {
        AuthUser user = AuthContext.requireUser(request);
        if (apiKey == null || apiKey.isBlank()) {
            throw new AppException(500, "AI 客服尚未配置，请联系平台管理员");
        }
        if (req.messages() == null || req.messages().isEmpty()) {
            throw new AppException(400, "消息不能为空");
        }

        // 并发限流：拿不到名额立即返回，防止慢请求堆积（前端会提示稍后再试）
        if (!aiSlots.tryAcquire()) {
            throw new AppException(429, "AI 助手当前咨询较多，请稍后再试");
        }
        try {
            String system = buildSystemPrompt();

            // 保留最近 12 条对话，避免超出上下文
            List<ChatMessage> history = req.messages().size() > 12
                ? req.messages().subList(req.messages().size() - 12, req.messages().size())
                : req.messages();
            List<Map<String, String>> payload = new ArrayList<>();
            payload.add(Map.of("role", "system", "content", system));
            for (ChatMessage m : history) {
                String role = m.role();
                if (m.content() == null || m.content().isBlank()) {
                    continue;
                }
                if (!"user".equals(role) && !"assistant".equals(role)) {
                    role = "user";
                }
                payload.add(Map.of("role", role, "content", m.content()));
            }

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("model", model);
            body.put("messages", payload);
            body.put("stream", false);
            body.put("max_tokens", 1000);
            body.put("temperature", 0.7);

            // 读超时 30s：AI 无响应时尽快释放线程，不拖住其它接口
            HttpRequest deepReq = HttpRequest.newBuilder(URI.create(DEEPSEEK_URL))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(30))
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();

            HttpResponse<String> resp = httpClient.send(deepReq, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() != 200) {
                throw new AppException(502, "AI 服务暂不可用（" + resp.statusCode() + "）");
            }
            JsonNode root = objectMapper.readTree(resp.body());
            String reply = root.path("choices").path(0).path("message").path("content").asText("");
            if (reply.isBlank()) {
                throw new AppException(502, "AI 未返回内容，请重试");
            }
            return ApiResponse.ok(Map.of("reply", reply.trim(), "userId", user.id()));
        } finally {
            aiSlots.release();
        }
    }

    private String buildSystemPrompt() {
        List<String> cats = jdbcTemplate.queryForList(
            "SELECT name FROM categories ORDER BY sort_order", String.class);
        List<String> prods = jdbcTemplate.queryForList(
            "SELECT name FROM products WHERE status = 'on_sale' ORDER BY sales_count DESC LIMIT 20",
            String.class);

        String catText = cats.isEmpty() ? "（暂无）" : String.join("、", cats);
        String prodText = prods.isEmpty() ? "（暂无）" : String.join("；", prods);

        return "你是「炎黄济世」中医药电商平台的 AI 养生顾问「济世小郎中」。"
            + "请用专业、温和、通俗的中文回答用户关于中医药养生、食疗药膳、中药材辨识与用法的问题，"
            + "同时帮助用户了解平台内容：入驻商家、浏览/搜索商品、下单支付、售后等流程。"
            + "\n回答要求："
            + "1) 涉及疾病请强调不能代替执业医师诊断与治疗，必要时建议线下就医；"
            + "2) 药材食用建议给出禁忌与用量提醒，注意语气负责；"
            + "3) 回答平台操作问题要简洁清楚，可引导用户到对应页面；"
            + "4) 若被问到平台无法确认的时效性信息（如具体库存/价格/活动），请说明以平台页面为准。"
            + "\n\n平台目前包含以下内容供你参考："
            + "\n- 平台类目：" + catText
            + "\n- 在售代表商品（部分）：" + prodText
            + "\n- 用户可在「分类」页按类目选购，在商品详情页收藏或下单；订单可在「我的-我的订单」查看与支付。"
            + "\n- 养生社区提供中医药知识分享与问答；平台严格禁止疗效类违规宣传。"
            + "\n请保持单次回答简洁（一般不超过 300 字）。";
    }
}

package com.yhjs.server.api;

import com.yhjs.server.auth.AuthContext;
import com.yhjs.server.auth.AuthUser;
import com.yhjs.server.db.SqlIds;
import jakarta.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * 社区帖子、评论、点赞。与 Node 版 routes.js 的社区部分保持一致。
 */
@RestController
@RequestMapping("/api/posts")
public class CommunityController {

    private final JdbcTemplate jdbcTemplate;

    public CommunityController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public record PostRequest(String title, String content, String tag) {
    }

    public record CommentRequest(String content) {
    }

    // 帖子列表
    @GetMapping
    public ApiResponse posts(@RequestParam(required = false) String tag,
                             @RequestParam(required = false) Integer page,
                             @RequestParam(required = false) Integer pageSize) {
        int p = page == null ? 1 : Math.min(Math.max(page, 1), 100000);
        int ps = pageSize == null ? 20 : Math.min(Math.max(pageSize, 1), 100);
        int offset = (p - 1) * ps;
        List<Object> params = new ArrayList<>();
        String where = "p.status = 'visible'";
        if (tag != null && !tag.isBlank()) {
            where += " AND p.tag = ?";
            params.add(tag);
        }
        params.add(ps);
        params.add(offset);
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT p.id, p.title, p.content, p.tag, p.like_count, p.comment_count, "
                + "p.created_at, COALESCE(u.nickname, '匿名用户') AS nickname, u.avatar_url "
                + "FROM community_posts p LEFT JOIN users u ON u.id = p.user_id "
                + "WHERE " + where + " ORDER BY p.created_at DESC LIMIT ? OFFSET ?",
            params.toArray());
        return ApiResponse.ok(rows, Map.of("page", p, "pageSize", ps));
    }

    // 发帖
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse createPost(@RequestBody PostRequest body, HttpServletRequest request) {
        AuthUser user = AuthContext.requireUser(request);
        String title = body.title() == null ? null : body.title().trim();
        String content = body.content() == null ? null : body.content().trim();
        if (title == null || title.isEmpty() || content == null || content.isEmpty()) {
            throw new AppException(400, "标题和内容不能为空");
        }
        String tag = body.tag() == null || body.tag().isBlank() ? "养生讨论" : body.tag();
        Long id = SqlIds.insert(jdbcTemplate,
            "INSERT INTO community_posts (user_id, title, content, tag) VALUES (?, ?, ?, ?)",
            user.id(), title, content, tag);
        return ApiResponse.ok(Map.of("id", id));
    }

    // 帖子详情
    @GetMapping("/{id}")
    public ApiResponse postDetail(@PathVariable Long id) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT p.id, p.title, p.content, p.tag, p.like_count, p.comment_count, "
                + "p.created_at, COALESCE(u.nickname, '匿名用户') AS nickname, u.avatar_url "
                + "FROM community_posts p LEFT JOIN users u ON u.id = p.user_id "
                + "WHERE p.id = ? AND p.status = 'visible'",
            id);
        if (rows.isEmpty()) {
            throw new AppException(404, "帖子不存在");
        }
        return ApiResponse.ok(rows.get(0));
    }

    // 帖子评论列表
    @GetMapping("/{id}/comments")
    public ApiResponse comments(@PathVariable Long id) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT c.id, c.content, c.created_at, "
                + "COALESCE(u.nickname, '匿名用户') AS nickname, u.avatar_url "
                + "FROM post_comments c LEFT JOIN users u ON u.id = c.user_id "
                + "WHERE c.post_id = ? AND c.status = 'visible' ORDER BY c.created_at ASC",
            id);
        return ApiResponse.ok(rows);
    }

    // 发表评论（评论数 +1）
    @PostMapping("/{id}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public ApiResponse createComment(@PathVariable Long id, @RequestBody CommentRequest body,
                                     HttpServletRequest request) {
        AuthUser user = AuthContext.requireUser(request);
        String content = body.content() == null ? null : body.content().trim();
        if (content == null || content.isEmpty()) {
            throw new AppException(400, "评论内容不能为空");
        }
        Long commentId = SqlIds.insert(jdbcTemplate,
            "INSERT INTO post_comments (post_id, user_id, content) VALUES (?, ?, ?)",
            id, user.id(), content);
        jdbcTemplate.update("UPDATE community_posts SET comment_count = comment_count + 1 WHERE id = ?", id);
        return ApiResponse.ok(Map.of("id", commentId));
    }

    // 点赞 / 取消点赞
    @PostMapping("/{id}/like")
    @Transactional
    public ApiResponse like(@PathVariable Long id, HttpServletRequest request) {
        AuthUser user = AuthContext.requireUser(request);
        List<Map<String, Object>> existing = jdbcTemplate.queryForList(
            "SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?", id, user.id());
        boolean liked;
        if (!existing.isEmpty()) {
            jdbcTemplate.update("DELETE FROM post_likes WHERE post_id = ? AND user_id = ?", id, user.id());
            jdbcTemplate.update(
                "UPDATE community_posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = ?", id);
            liked = false;
        } else {
            jdbcTemplate.update("INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)", id, user.id());
            jdbcTemplate.update("UPDATE community_posts SET like_count = like_count + 1 WHERE id = ?", id);
            liked = true;
        }
        return ApiResponse.ok(Map.of("liked", liked));
    }
}

package com.yhjs.server.auth;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDate;

public record AuthUser(
    @JsonProperty("id") Long id,
    @JsonProperty("nickname") String nickname,
    @JsonProperty("phone") String phone,
    @JsonProperty("avatar_url") String avatarUrl,
    @JsonProperty("bio") String bio,
    @JsonProperty("gender") String gender,
    @JsonProperty("birthday") LocalDate birthday,
    @JsonProperty("role") String role,
    @JsonProperty("status") String status
) {
}

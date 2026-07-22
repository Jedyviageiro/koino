package com.koino.backend.dto.auth;

import java.time.Instant;

public record ResetPasswordTokenResponse(String token, Instant expiresAt) {}

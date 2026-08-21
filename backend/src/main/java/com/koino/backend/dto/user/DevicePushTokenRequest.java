package com.koino.backend.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DevicePushTokenRequest(
    @NotBlank @Size(max = 220) String token,
    @Size(max = 16) String platform
) {}

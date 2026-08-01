package com.koino.backend.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record GoogleLoginRequest(
    @NotBlank String credential,
    @Pattern(regexp = "en|pt") String language
) {
}

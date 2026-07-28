package com.koino.backend.dto.auth;

import jakarta.validation.constraints.NotBlank;

public record EmailVerificationConfirmRequest(@NotBlank String token) {
}

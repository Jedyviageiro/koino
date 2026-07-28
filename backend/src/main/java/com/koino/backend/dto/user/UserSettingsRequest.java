package com.koino.backend.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserSettingsRequest(
    @NotBlank @Size(min = 2, max = 120) String fullname,
    @NotBlank @Email @Size(max = 254) String email,
    @NotBlank @Size(max = 64) String timeZone,
    @NotBlank @Size(max = 10) String language
) {}

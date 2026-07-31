package com.koino.backend.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UserSettingsRequest(
    @NotBlank @Size(min = 2, max = 120) String fullname,
    @NotBlank @Email @Size(max = 254) String email,
    @NotBlank
    @Size(min = 3, max = 32)
    @Pattern(
        regexp = "^[A-Za-z0-9](?:[A-Za-z0-9._]*[A-Za-z0-9])?$",
        message = "Username may only contain letters, numbers, dots, and underscores"
    )
    String username,
    @NotBlank @Size(max = 64) String timeZone,
    @NotBlank @Size(max = 10) String language,
    @Size(max = 280) String bio,
    @Size(max = 100) String location,
    @Pattern(regexp = "^$|^[A-Za-z]{2}$", message = "Country must be a two-letter code")
    String countryCode
) {}

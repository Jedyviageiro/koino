package com.koino.backend.dto.user;

public record UserSettingsResponse(
    Long id,
    String fullname,
    String email,
    String timeZone,
    String language,
    String profilePictureUrl,
    String username,
    String bio,
    String location,
    String countryCode
) {}

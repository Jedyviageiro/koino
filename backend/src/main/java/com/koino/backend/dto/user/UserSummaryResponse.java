package com.koino.backend.dto.user;

public record UserSummaryResponse(
    Long id,
    String email,
    String fullname,
    String profilePictureUrl
) {}

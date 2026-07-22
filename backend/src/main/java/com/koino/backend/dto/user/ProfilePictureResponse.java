package com.koino.backend.dto.user;

public record ProfilePictureResponse(
    String profilePictureUrl,
    String profilePicturePublicId
) {}

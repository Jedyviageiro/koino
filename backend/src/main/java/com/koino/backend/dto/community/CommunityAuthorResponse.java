package com.koino.backend.dto.community;

public record CommunityAuthorResponse(
    Long userId,
    String fullname,
    String profilePictureUrl,
    boolean active
) {
}

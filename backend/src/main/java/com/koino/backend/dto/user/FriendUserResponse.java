package com.koino.backend.dto.user;

public record FriendUserResponse(
    Long userId,
    String username,
    String fullname,
    String profilePictureUrl
) {}

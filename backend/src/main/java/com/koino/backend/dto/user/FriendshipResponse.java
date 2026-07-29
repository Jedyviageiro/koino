package com.koino.backend.dto.user;

import java.time.Instant;

public record FriendshipResponse(
    Long friendshipId,
    FriendUserResponse user,
    String status,
    String direction,
    Instant createdAt
) {}

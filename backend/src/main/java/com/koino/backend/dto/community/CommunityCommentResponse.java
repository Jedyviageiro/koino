package com.koino.backend.dto.community;

import java.time.Instant;

public record CommunityCommentResponse(
    Long commentId,
    CommunityAuthorResponse author,
    String content,
    Instant createdAt
) {
}

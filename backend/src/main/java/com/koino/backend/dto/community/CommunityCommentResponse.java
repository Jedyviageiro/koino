package com.koino.backend.dto.community;

import java.time.LocalDateTime;

public record CommunityCommentResponse(
    Long commentId,
    CommunityAuthorResponse author,
    String content,
    LocalDateTime createdAt
) {
}

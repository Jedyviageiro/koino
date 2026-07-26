package com.koino.backend.dto.community;

import java.time.Instant;
import java.util.List;

import com.koino.backend.model.CommunityPostType;

public record CommunityPostResponse(
    Long postId,
    CommunityAuthorResponse author,
    CommunityPostType postType,
    String content,
    CommunityVerseResponse verse,
    String photoUrl,
    Instant createdAt,
    List<CommunityCommentResponse> comments
) {
}

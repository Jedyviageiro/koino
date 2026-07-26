package com.koino.backend.dto.community;

import java.time.LocalDateTime;
import java.util.List;

import com.koino.backend.model.CommunityPostType;

public record CommunityPostResponse(
    Long postId,
    CommunityAuthorResponse author,
    CommunityPostType postType,
    String content,
    CommunityVerseResponse verse,
    String photoUrl,
    LocalDateTime createdAt,
    List<CommunityCommentResponse> comments
) {
}

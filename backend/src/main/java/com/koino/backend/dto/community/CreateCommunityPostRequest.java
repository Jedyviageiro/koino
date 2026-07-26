package com.koino.backend.dto.community;

import com.koino.backend.model.CommunityPostType;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateCommunityPostRequest(
    @NotNull CommunityPostType postType,
    Long verseId,
    @Size(max = 1200) String content
) {
}

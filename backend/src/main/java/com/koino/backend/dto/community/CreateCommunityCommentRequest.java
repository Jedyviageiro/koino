package com.koino.backend.dto.community;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCommunityCommentRequest(
    @NotBlank @Size(max = 600) String content
) {
}

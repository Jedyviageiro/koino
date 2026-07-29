package com.koino.backend.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ChatMessageRequest(
    @NotNull Long recipientId,
    @NotBlank @Size(max = 2000) String body
) {}

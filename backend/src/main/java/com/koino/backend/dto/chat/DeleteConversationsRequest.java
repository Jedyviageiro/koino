package com.koino.backend.dto.chat;

import java.util.List;

import jakarta.validation.constraints.NotEmpty;

public record DeleteConversationsRequest(@NotEmpty List<Long> friendIds) {}

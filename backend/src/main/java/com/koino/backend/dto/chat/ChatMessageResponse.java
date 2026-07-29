package com.koino.backend.dto.chat;

import java.time.Instant;

public record ChatMessageResponse(
    Long messageId,
    Long senderId,
    Long recipientId,
    String body,
    Instant sentAt,
    Instant readAt
) {}

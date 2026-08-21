package com.koino.backend.dto.user;

import java.time.Instant;

public record NotificationResponse(
    Long notificationId,
    String title,
    String message,
    String type,
    String referenceId,
    String actorName,
    String actorProfilePictureUrl,
    boolean read,
    Instant createdAt
) {}
